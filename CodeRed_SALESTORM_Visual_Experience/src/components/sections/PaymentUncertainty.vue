<script setup lang="ts">
import { ref } from 'vue'

type PaymentState = 'IDLE' | 'IN_FLIGHT' | 'TIMEOUT_UNKNOWN' | 'RECONCILED_SUCCESS' | 'RECONCILED_FAILED'

const currentState = ref<PaymentState>('IDLE')
const intentKey = ref('pi_stripe_live_98a7f43')
const reconciliationLog = ref<string[]>([])

function simulatePaymentAttempt() {
  currentState.value = 'IN_FLIGHT'
  reconciliationLog.value = ['POST /v1/charges with idempotency key ' + intentKey.value]

  setTimeout(() => {
    // Force timeout to demonstrate the UNKNOWN condition
    currentState.value = 'TIMEOUT_UNKNOWN'
    reconciliationLog.value.push('HTTP 504 Gateway Timeout after 5000ms. External provider did not acknowledge in window.')
    reconciliationLog.value.push('CRITICAL: State marked as UNKNOWN. Stock retention preserved (PAYMENT_PENDING).')
    reconciliationLog.value.push('DO NOT release stock. DO NOT issue refund. Awaiting asynchronous reconciliation.')
  }, 1200)
}

function reconcileProvider(outcome: 'success' | 'declined') {
  if (currentState.value !== 'TIMEOUT_UNKNOWN') return

  reconciliationLog.value.push(`Reconciliation worker querying provider for intent ${intentKey.value}...`)

  setTimeout(() => {
    if (outcome === 'success') {
      currentState.value = 'RECONCILED_SUCCESS'
      reconciliationLog.value.push('Provider responded: status = CHARGE_CAPTURED ($499.00).')
      reconciliationLog.value.push('Transitioning reservation to SOLD. Publishing PaymentSucceeded to Kafka.')
    } else {
      currentState.value = 'RECONCILED_FAILED'
      reconciliationLog.value.push('Provider responded: status = FAILED_EXPIRED (No funds charged).')
      reconciliationLog.value.push('Definitive non-charge confirmed. Safely releasing hold back to AVAILABLE.')
    }
  }, 800)
}

function resetSimulator() {
  currentState.value = 'IDLE'
  reconciliationLog.value = []
}
</script>

<template>
  <section class="section payment-uncertainty">
    <div class="site-grid">
      <!-- Section Header -->
      <div class="section-title-wrap">
        <span class="section-number">04 // DISTRIBUTED UNCERTAINTY</span>
        <h2>Payment Timeout & The UNKNOWN State</h2>
        <p class="body-text">
          In distributed networks, a dropped connection or timeout is genuinely unknown.
          Treating a timeout as failure causes devastating phantom charges and lost inventory.
          CodeRed treats timeouts as UNKNOWN, preserving stock until authoritative provider reconciliation.
        </p>
      </div>

      <!-- Architectural Principles Column -->
      <div class="principles-col">
        <div class="card principles-card">
          <div class="card-head">
            <span class="label">THE FOUR COMMANDMENTS OF PAYMENT UNCERTAINTY</span>
            <span class="mono text-steel">ADR-005 & INV-004</span>
          </div>

          <div class="commandment-list">
            <div class="commandment-item">
              <span class="mono commandment-num">01</span>
              <div>
                <h4 class="commandment-title">One Reservation = Exactly One Provider Intent</h4>
                <p class="commandment-desc">
                  Every reservation generates a deterministic payment intent key. Retries, webhooks, and pollers all converge on this exact key.
                </p>
              </div>
            </div>

            <div class="commandment-item">
              <span class="mono commandment-num">02</span>
              <div>
                <h4 class="commandment-title">Stock Is Never Released on Timeout</h4>
                <p class="commandment-desc">
                  Inventory holds stay in <code>PAYMENT_PENDING</code>. Releasing inventory when money may have been captured violates system invariants.
                </p>
              </div>
            </div>

            <div class="commandment-item">
              <span class="mono commandment-num">03</span>
              <div>
                <h4 class="commandment-title">Definitive Evidence Required</h4>
                <p class="commandment-desc">
                  Only an authoritative receipt of charge success transitions stock to <code>SOLD</code>; only a verified non-charge transitions stock to <code>RELEASED</code>.
                </p>
              </div>
            </div>

            <div class="commandment-item">
              <span class="mono commandment-num">04</span>
              <div>
                <h4 class="commandment-title">Customer-Facing Transparency</h4>
                <p class="commandment-desc">
                  The client UI shows "Payment processing" instead of an erroneous failure message, preventing panicked duplicate checkout attempts.
                </p>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <span class="mono text-steel">Source: ../SALESTORM_CodeRed/10_ADR/ADR-005.md & order_reservation_state.md</span>
          </div>
        </div>
      </div>

      <!-- Interactive Reconciliation Simulator Column -->
      <div class="simulator-col">
        <div class="card simulator-card">
          <div class="card-head">
            <span class="label">INTERACTIVE RECONCILIATION LAB</span>
            <span
              class="state-chip"
              :class="{
                'state-chip--available': currentState === 'IDLE',
                'state-chip--payment-pending': currentState === 'IN_FLIGHT',
                'state-chip--reserved': currentState === 'TIMEOUT_UNKNOWN',
                'state-chip--sold': currentState === 'RECONCILED_SUCCESS',
                'state-chip--released': currentState === 'RECONCILED_FAILED',
              }"
            >
              STATE: {{ currentState }}
            </span>
          </div>

          <!-- Step 1 Controls -->
          <div class="sim-actions">
            <button
              class="btn btn--danger"
              :disabled="currentState !== 'IDLE'"
              @click="simulatePaymentAttempt"
            >
              1. DISPATCH PAYMENT (FORCE TIMEOUT)
            </button>
            <button class="btn" @click="resetSimulator">RESET</button>
          </div>

          <!-- Reconciliation Branch Controls -->
          <div class="reconciliation-branch" v-if="currentState === 'TIMEOUT_UNKNOWN'">
            <span class="label text-warning">RESOLVE RECONCILIATION VIA PROVIDER AUDIT:</span>
            <div class="branch-btns">
              <button class="btn btn--safe" @click="reconcileProvider('success')">
                ✓ Provider Confirms Success (→ SOLD)
              </button>
              <button class="btn" @click="reconcileProvider('declined')">
                ✕ Provider Confirms Declined (→ RELEASED)
              </button>
            </div>
          </div>

          <!-- Live Audit Log Stream -->
          <div class="audit-log-wrap">
            <div class="log-head">
              <span class="label">LIVE TRANSACTION AUDIT LOG</span>
              <span class="mono text-steel">INTENT: {{ intentKey }}</span>
            </div>
            <div class="audit-terminal">
              <div v-if="reconciliationLog.length === 0" class="mono text-steel">
                System ready. Click "Dispatch Payment" to trigger the network timeout scenario.
              </div>
              <div v-for="(entry, idx) in reconciliationLog" :key="idx" class="mono log-line">
                <span class="log-prefix">&gt;</span> {{ entry }}
              </div>
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

.principles-col {
  grid-column: span 6;
}

.simulator-col {
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
  margin-bottom: 20px;
}

.commandment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.commandment-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 14px 16px;
}

.commandment-num {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--codered);
  background: var(--white);
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 2px;
}

.commandment-title {
  font-size: 0.875rem;
  color: var(--ink);
  margin-bottom: 4px;
}

.commandment-desc {
  font-size: 0.8125rem;
  color: var(--ink-soft);
  line-height: 1.5;
}

.card-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 0.6875rem;
}

.sim-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.reconciliation-branch {
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.audit-log-wrap {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.audit-terminal {
  background: var(--ink);
  color: var(--paper);
  border-radius: 3px;
  padding: 18px 20px;
  font-size: 0.75rem;
  line-height: 1.6;
  min-height: 180px;
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-line {
  word-break: break-all;
}

.log-prefix {
  color: var(--codered);
  font-weight: bold;
}

@media (max-width: 900px) {
  .principles-col,
  .simulator-col {
    grid-column: span 12;
  }
}
</style>
