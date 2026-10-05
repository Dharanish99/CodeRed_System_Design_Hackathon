<script setup lang="ts">
import { ref } from 'vue'
import { criticalSQL, idempotencySQL } from '../../data/evidence'

// Interactive Race Simulator State
const raceRunning = ref(false)
const raceStep = ref(0)
const clientAResult = ref<{ status: string; code: number; rows: number; note: string } | null>(null)
const clientBResult = ref<{ status: string; code: number; rows: number; note: string } | null>(null)

function runRaceSimulation() {
  if (raceRunning.value) return
  raceRunning.value = true
  raceStep.value = 1
  clientAResult.value = null
  clientBResult.value = null

  // Step 1: Both fire concurrently
  setTimeout(() => {
    raceStep.value = 2 // Client A acquires row-lock

    setTimeout(() => {
      // Step 3: Client A commits UPDATE
      clientAResult.value = {
        status: '201 CREATED (RESERVED)',
        code: 201,
        rows: 1,
        note: 'Acquired row lock, predicate available_quantity >= 1 was TRUE. Available decremented to 0.',
      }
      raceStep.value = 3

      setTimeout(() => {
        // Step 4: Client B rechecks predicate
        clientBResult.value = {
          status: '409 CONFLICT (OUT_OF_STOCK)',
          code: 409,
          rows: 0,
          note: 'Lock released. Predicate evaluated against updated row (available = 0). 0 rows affected.',
        }
        raceStep.value = 4
        raceRunning.value = false
      }, 700)
    }, 700)
  }, 500)
}

function resetRace() {
  raceRunning.value = false
  raceStep.value = 0
  clientAResult.value = null
  clientBResult.value = null
}

// Idempotency Demo State
const idempotencyKey = ref('req_abc123_8940')
const payloadAmount = ref(1)
const idempotencyResult = ref<string | null>(null)
const idempotencyState = ref<'initial' | 'cached' | 'mismatch'>('initial')

function testIdempotency(action: 'first' | 'replay' | 'tamper') {
  if (action === 'first') {
    idempotencyState.value = 'initial'
    idempotencyResult.value = '201 CREATED: Reservation created. Key registered in inventory.request_dedup with payload hash SHA256(key+body).'
  } else if (action === 'replay') {
    idempotencyState.value = 'cached'
    idempotencyResult.value = '200 OK (REPLAYED): Key found with matching request_hash. Returning previously committed response without mutating database.'
  } else if (action === 'tamper') {
    idempotencyState.value = 'mismatch'
    idempotencyResult.value = '409 IDEMPOTENCY_MISMATCH: Key exists but request_hash differs! Mutation aborted to prevent payload tampering.'
  }
}
</script>

<template>
  <section id="critical-section" class="section critical-section">
    <div class="site-grid">
      <!-- Section Header -->
      <div class="section-title-wrap">
        <span class="section-number">03 // AUTHORITATIVE DATA STORE</span>
        <h2>The Atomic Critical Section</h2>
        <p class="body-text">
          Overselling is prevented entirely at the database layer using PostgreSQL's row-level locking and predicate evaluation.
          No distributed locks, no Redis authority, and no two-phase commit overhead.
        </p>
      </div>

      <!-- SQL Inspection Column -->
      <div class="sql-col">
        <div class="card sql-card">
          <div class="card-head">
            <span class="label">GUARDED INVENTORY DECREMENT</span>
            <span class="mono text-steel">ISOLATION: READ COMMITTED</span>
          </div>
          <pre class="code-block"><code><span class="keyword">UPDATE</span> inventory.inventory
  <span class="keyword">SET</span> available_quantity = available_quantity - <span class="number">1</span>,
      reserved_quantity = reserved_quantity + <span class="number">1</span>,
      version = version + <span class="number">1</span>,
      updated_at = <span class="keyword">clock_timestamp</span>()
  <span class="keyword">WHERE</span> inventory_id = :id
    <span class="keyword">AND</span> available_quantity &gt;= <span class="number">1</span>
  <span class="keyword">RETURNING</span> *;</code></pre>
          <div class="sql-notes">
            <p class="mono text-ink-soft">
              <strong>The Predicate Gate:</strong> If ten transactions execute concurrently for the final unit, exactly one transaction updates the row. The remaining nine observe <code>rows_affected == 0</code> and return 409 OUT_OF_STOCK.
            </p>
          </div>

          <div class="card-head" style="margin-top: 24px;">
            <span class="label">REQUEST DEDUPLICATION GATING</span>
            <span class="mono text-steel">ADR-008</span>
          </div>
          <pre class="code-block"><code><span class="keyword">INSERT INTO</span> inventory.request_dedup
  (customer_id, operation, idempotency_key, request_hash)
  <span class="keyword">VALUES</span> (p_customer, <span class="string">'reserve'</span>, p_key, p_hash)
  <span class="keyword">ON CONFLICT DO NOTHING</span>;</code></pre>
          <div class="sql-notes">
            <p class="mono text-ink-soft">
              Uniqueness constraint on <code>(customer_id, operation, idempotency_key)</code>. Duplicate network submissions return the original committed payload without touching inventory stock.
            </p>
          </div>

          <div class="card-footer">
            <span class="mono text-steel">Source: ../SALESTORM_CodeRed/04_Database/reservation_transaction.sql L11-26</span>
          </div>
        </div>
      </div>

      <!-- Interactive Race Simulator Column -->
      <div class="race-col">
        <div class="card race-card">
          <div class="card-head">
            <span class="label">RACE CONDITION SIMULATOR: LAST UNIT (A = 1)</span>
            <span class="state-chip state-chip--reserved" v-if="raceRunning">LOCKED (TX IN FLIGHT)</span>
            <span class="state-chip state-chip--available" v-else>IDLE</span>
          </div>

          <p class="race-desc">
            Simulate two concurrent clients (Client A and Client B) issuing Buy requests for the final remaining inventory unit at the exact same millisecond.
          </p>

          <div class="race-controls">
            <button class="btn btn--danger" :disabled="raceRunning" @click="runRaceSimulation">
              ⚡ TRIGGER CONCURRENT RACE
            </button>
            <button class="btn" @click="resetRace">RESET</button>
          </div>

          <!-- Timeline Steps -->
          <div class="race-timeline">
            <!-- Client A -->
            <div class="client-box" :class="{ 'client-box--winner': clientAResult?.code === 201 }">
              <div class="client-box__head">
                <span class="mono font-bold">CLIENT A (REQUEST #1)</span>
                <span v-if="raceStep >= 2" class="state-chip state-chip--sold">LOCK ACQUIRED</span>
              </div>
              <p class="mono client-status" v-if="clientAResult">
                {{ clientAResult.status }}<br />
                <span class="text-steel">{{ clientAResult.note }}</span>
              </p>
              <p class="mono text-steel" v-else-if="raceStep >= 1">Executing guarded UPDATE...</p>
              <p class="mono text-steel" v-else>Waiting for race trigger</p>
            </div>

            <!-- Client B -->
            <div class="client-box" :class="{ 'client-box--loser': clientBResult?.code === 409 }">
              <div class="client-box__head">
                <span class="mono font-bold">CLIENT B (REQUEST #2)</span>
                <span v-if="raceStep === 2" class="state-chip state-chip--payment-pending">BLOCKED ON ROW LOCK</span>
                <span v-else-if="raceStep >= 3" class="state-chip state-chip--released">LOCK RELEASED</span>
              </div>
              <p class="mono client-status" v-if="clientBResult">
                {{ clientBResult.status }}<br />
                <span class="text-steel">{{ clientBResult.note }}</span>
              </p>
              <p class="mono text-steel" v-else-if="raceStep >= 1">Waiting on PostgreSQL row lock...</p>
              <p class="mono text-steel" v-else>Waiting for race trigger</p>
            </div>
          </div>

          <!-- Idempotency Tester Sub-panel -->
          <div class="idempotency-box">
            <div class="card-head">
              <span class="label">IDEMPOTENCY KEY REPLAY LAB</span>
              <span class="mono text-steel">KEY: {{ idempotencyKey }}</span>
            </div>
            <div class="idempotency-actions">
              <button class="btn btn-sm" @click="testIdempotency('first')">1. Initial Request</button>
              <button class="btn btn-sm" @click="testIdempotency('replay')">2. Retry Same Key</button>
              <button class="btn btn-sm btn--danger" @click="testIdempotency('tamper')">3. Tampered Payload</button>
            </div>
            <div v-if="idempotencyResult" class="idempotency-output mono" :class="`output--${idempotencyState}`">
              {{ idempotencyResult }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-title-wrap {
  grid-column: span 12;
  margin-bottom: 32px;
}

.sql-col {
  grid-column: span 6;
}

.race-col {
  grid-column: span 6;
}

.card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 28px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sql-notes {
  margin-top: 12px;
  font-size: 0.8125rem;
  line-height: 1.5;
  background: var(--paper-deep);
  padding: 12px 14px;
  border-radius: 2px;
  border-left: 3px solid var(--ink);
}

.card-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 0.6875rem;
}

.race-desc {
  font-size: 0.875rem;
  color: var(--ink-soft);
  margin-bottom: 20px;
}

.race-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.race-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 28px;
}

.client-box {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s ease;
}

.client-box__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.client-status {
  font-size: 0.8125rem;
  line-height: 1.5;
}

.client-box--winner {
  border-color: var(--safe);
  background: #F2F8F4;
}

.client-box--loser {
  border-color: var(--codered);
  background: #FFF5F4;
}

.idempotency-box {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.idempotency-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-sm {
  font-size: 0.75rem;
  padding: 6px 12px;
}

.idempotency-output {
  padding: 12px 14px;
  border-radius: 2px;
  font-size: 0.75rem;
  line-height: 1.5;
}

.output--initial {
  background: var(--safe-dim);
  color: var(--safe);
  border: 1px solid var(--safe);
}

.output--cached {
  background: var(--paper-deep);
  color: var(--ink);
  border: 1px solid var(--line);
}

.output--mismatch {
  background: var(--codered-dim);
  color: var(--codered);
  border: 1px solid var(--codered);
}

@media (max-width: 900px) {
  .sql-col,
  .race-col {
    grid-column: span 12;
  }
}
</style>
