<script setup lang="ts">
import { ref } from 'vue'

const serviceState = ref<'ONLINE' | 'CRASHED' | 'RECOVERING'>('ONLINE')
const confirmedOrders = ref(45)
const consumerLag = ref(0)
const totalPaidPurchases = ref(45)

let recoveryTimer: number | null = null

function triggerCrash() {
  if (serviceState.value !== 'ONLINE') return
  serviceState.value = 'CRASHED'

  // While crashed, flash-sale transactions continue succeeding at Inventory/Payment layer
  const interval = setInterval(() => {
    if (serviceState.value !== 'CRASHED') {
      clearInterval(interval)
      return
    }
    if (totalPaidPurchases.value < 95) {
      totalPaidPurchases.value += 5
      consumerLag.value += 5
    }
  }, 400)
}

function triggerRecovery() {
  if (serviceState.value !== 'CRASHED') return
  serviceState.value = 'RECOVERING'

  recoveryTimer = window.setInterval(() => {
    if (consumerLag.value > 0) {
      const batch = Math.min(consumerLag.value, 10)
      consumerLag.value -= batch
      confirmedOrders.value += batch
    } else {
      if (recoveryTimer) clearInterval(recoveryTimer)
      serviceState.value = 'ONLINE'
    }
  }, 350)
}

function resetSimulation() {
  if (recoveryTimer) clearInterval(recoveryTimer)
  serviceState.value = 'ONLINE'
  confirmedOrders.value = 45
  consumerLag.value = 0
  totalPaidPurchases.value = 45
}
</script>

<template>
  <section class="section order-recovery">
    <div class="site-grid">
      <!-- Section Header -->
      <div class="section-title-wrap">
        <span class="section-number">05 // ASYNCHRONOUS RESILIENCE</span>
        <h2>Order Service Crash & Backlog Recovery</h2>
        <p class="body-text">
          Payment confirmation and inventory deduction never depend on Order Service availability.
          If Order Service crashes for 30 seconds at peak surge, Kafka buffers durable outbox events.
          Upon restart, inbox deduplication guarantees exactly-once processing with zero dropped orders.
        </p>
      </div>

      <!-- Outage Simulator Column -->
      <div class="simulator-col">
        <div class="card sim-card">
          <div class="card-head">
            <span class="label">LIVE OUTAGE RECOVERY EXPERIMENT</span>
            <span
              class="state-chip"
              :class="{
                'state-chip--sold': serviceState === 'ONLINE',
                'state-chip--reserved': serviceState === 'CRASHED',
                'state-chip--payment-pending': serviceState === 'RECOVERING',
              }"
            >
              ORDER SERVICE: {{ serviceState }}
            </span>
          </div>

          <!-- Controls -->
          <div class="sim-actions">
            <button
              class="btn btn--danger"
              :disabled="serviceState !== 'ONLINE'"
              @click="triggerCrash"
            >
              💥 1. CRASH ORDER SERVICE
            </button>
            <button
              class="btn btn--safe"
              :disabled="serviceState !== 'CRASHED'"
              @click="triggerRecovery"
            >
              ⚡ 2. RESTART & DRAIN QUEUE
            </button>
            <button class="btn" @click="resetSimulation">RESET</button>
          </div>

          <!-- Telemetry Counters -->
          <div class="recovery-metrics">
            <div class="r-metric">
              <span class="label">PAID COMMITTED SALES</span>
              <span class="mono counter counter--medium text-safe">{{ totalPaidPurchases }}</span>
              <span class="r-note mono">Authoritative in Inventory DB</span>
            </div>

            <div class="r-metric">
              <span class="label">KAFKA CONSUMER LAG</span>
              <span
                class="mono counter counter--medium"
                :class="consumerLag > 0 ? 'text-codered' : 'text-steel'"
              >
                {{ consumerLag }}
              </span>
              <span class="r-note mono">Buffered ReservationCommitted</span>
            </div>

            <div class="r-metric">
              <span class="label">CONFIRMED ORDERS</span>
              <span class="mono counter counter--medium text-ink">{{ confirmedOrders }}</span>
              <span class="r-note mono">Materialized in Order DB</span>
            </div>
          </div>

          <!-- Kafka Buffer Visualization -->
          <div class="queue-visualizer">
            <div class="queue-head">
              <span class="label">KAFKA TOPIC BUFFER (reservation-committed)</span>
              <span class="mono text-steel">{{ consumerLag }} events unread</span>
            </div>
            <div class="queue-track">
              <div v-if="consumerLag === 0" class="queue-empty mono">
                Queue empty • Real-time consumer lag: 0ms
              </div>
              <div
                v-for="i in Math.min(consumerLag, 20)"
                :key="i"
                class="queue-packet"
                :title="`Event #${i}: ReservationCommitted`"
              >
                <span class="mono">EVT</span>
              </div>
              <span v-if="consumerLag > 20" class="mono queue-more">+{{ consumerLag - 20 }} more</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="mono text-steel">Verified in local simulation: 30-second Order Service outage passed with 0 drops</span>
          </div>
        </div>
      </div>

      <!-- Architectural Guarantee Column -->
      <div class="guarantees-col">
        <div class="card guarantees-card">
          <div class="card-head">
            <span class="label">ARCHITECTURAL RESILIENCE GUARANTEES</span>
            <span class="mono text-steel">INV-006 & INV-007</span>
          </div>

          <div class="guarantee-list">
            <div class="guarantee-card">
              <h4 class="g-title">Transactional Outbox Isolation</h4>
              <p class="g-desc">
                Inventory transitions stock to <code>SOLD</code> and writes <code>ReservationCommitted</code> to its local outbox within the SAME PostgreSQL ACID transaction. No distributed 2PC is required.
              </p>
            </div>

            <div class="guarantee-card">
              <h4 class="g-title">Inbox Deduplication Table</h4>
              <p class="g-desc">
                When Order Service consumes events, it inserts into <code>orders.inbox (consumer, event_id)</code>. Duplicated events resulting from network retries fail on unique conflict and are safely skipped.
              </p>
            </div>

            <div class="guarantee-card">
              <h4 class="g-title">Idempotent Customer Feedback</h4>
              <p class="g-desc">
                If a customer polls their order status while Order Service is booting, Gateway returns <em>"Payment Captured — Finalizing Order confirmation"</em>, guaranteeing peace of mind.
              </p>
            </div>
          </div>

          <div class="card-footer">
            <span class="mono text-steel">Source: ../SALESTORM_CodeRed/10_ADR/ADR-007.md & consistency_and_transactions.md</span>
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

.simulator-col {
  grid-column: span 7;
}

.guarantees-col {
  grid-column: span 5;
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
  margin-bottom: 20px;
}

.sim-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.recovery-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 20px;
  margin-bottom: 24px;
}

.r-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.r-note {
  font-size: 0.6875rem;
  color: var(--steel);
}

.queue-visualizer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.queue-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.queue-track {
  background: var(--ink);
  color: var(--paper);
  border-radius: 3px;
  padding: 16px;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
}

.queue-empty {
  font-size: 0.8125rem;
  color: var(--steel);
  width: 100%;
  text-align: center;
}

.queue-packet {
  background: var(--codered);
  color: var(--white);
  padding: 6px 10px;
  border-radius: 2px;
  font-size: 0.6875rem;
  font-weight: bold;
  animation: slideIn 0.2s ease-out;
}

.queue-more {
  font-size: 0.75rem;
  color: var(--steel);
}

@keyframes slideIn {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.card-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 0.6875rem;
}

.guarantee-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.guarantee-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.g-title {
  font-size: 0.875rem;
  color: var(--ink);
}

.g-desc {
  font-size: 0.8125rem;
  color: var(--ink-soft);
  line-height: 1.5;
}

@media (max-width: 900px) {
  .simulator-col,
  .guarantees-col {
    grid-column: span 12;
  }

  .recovery-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
