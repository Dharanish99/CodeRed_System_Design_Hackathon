<script setup lang="ts">
import { validationEvidence } from '../../data/evidence'
</script>

<template>
  <section id="evidence" class="section evidence-section">
    <div class="site-grid">
      <!-- Section Header -->
      <div class="section-title-wrap">
        <span class="section-number">07 // EMPIRICAL VALIDATION</span>
        <h2>Validation Results & System Verification</h2>
        <p class="body-text">
          SALESTORM was subjected to a comprehensive 12-suite automated transactional model simulation.
          Below are the empirical execution metrics alongside an honest engineering assessment of the model's boundary conditions.
        </p>
      </div>

      <!-- Execution Scorecard Banner -->
      <div class="scorecard-col">
        <div class="card scorecard-card">
          <div class="card-head">
            <span class="label">PRACTICAL SIMULATION EXECUTION AUDIT</span>
            <span class="state-chip state-chip--sold">12 / 12 SUITES PASSED (0 FAILURES)</span>
          </div>

          <div class="scorecard-metrics">
            <div class="metric-cell">
              <span class="label">SIMULATED CUSTOMERS</span>
              <span class="counter counter--medium text-ink">{{ validationEvidence.practical.logicalCustomers.toLocaleString() }}</span>
              <span class="mono m-sub">Unique client actors</span>
            </div>

            <div class="metric-cell">
              <span class="label">TOTAL HTTP ATTEMPTS</span>
              <span class="counter counter--medium text-ink">{{ validationEvidence.practical.httpAttempts.toLocaleString() }}</span>
              <span class="mono m-sub">Includes 200 duplicate retries</span>
            </div>

            <div class="metric-cell">
              <span class="label">INITIAL STOCK HOLDS</span>
              <span class="counter counter--medium text-codered">{{ validationEvidence.practical.initialHolds }}</span>
              <span class="mono m-sub">Capped at N=100</span>
            </div>

            <div class="metric-cell">
              <span class="label">CAPTURED PAYMENTS</span>
              <span class="counter counter--medium text-safe">{{ validationEvidence.practical.paid }}</span>
              <span class="mono m-sub">95 successful checkouts</span>
            </div>

            <div class="metric-cell">
              <span class="label">CONFIRMED UNIQUE ORDERS</span>
              <span class="counter counter--medium text-safe">{{ validationEvidence.practical.uniqueOrders }}</span>
              <span class="mono m-sub">Exactly matches paid count</span>
            </div>

            <div class="metric-cell">
              <span class="label">MAX (HELD + SOLD)</span>
              <span class="counter counter--medium text-ink">{{ validationEvidence.practical.maxHeldPlusSold }} / 100</span>
              <span class="mono m-sub text-safe">INV-001 strictly preserved</span>
            </div>
          </div>

          <div class="simulation-note">
            <span class="mono text-ink-soft">
              <strong>Order Service Outage Test:</strong> Order Service was held offline for 30 seconds during active payment commits. Upon resumption, all 95 orders were idempotently materialized without loss or duplicate assignment.
            </span>
          </div>
        </div>
      </div>

      <!-- Left Sub-column: 12 Scenarios Covered -->
      <div class="scenarios-covered-col">
        <div class="card covered-card">
          <div class="card-head">
            <span class="label">12 PASSING TRANSACTION MODEL CHECKS</span>
            <span class="mono text-steel">validation_run.md</span>
          </div>

          <ul class="checks-list">
            <li v-for="(check, idx) in validationEvidence.scenariosCovered" :key="idx" class="check-item">
              <span class="check-icon">✓</span>
              <span class="mono check-text">{{ check }}</span>
            </li>
          </ul>

          <div class="card-footer">
            <span class="mono text-steel">Model: {{ validationEvidence.modelDescription }}</span>
          </div>
        </div>
      </div>

      <!-- Right Sub-column: Intellectual Honesty / What is NOT proven -->
      <div class="honesty-col">
        <div class="card honesty-card">
          <div class="card-head">
            <span class="label text-warning">ENGINEERING INTEGRITY: WHAT IS NOT PROVEN</span>
            <span class="state-chip state-chip--payment-pending">HONEST BOUNDARY</span>
          </div>

          <p class="honesty-lead">
            {{ validationEvidence.disclaimer }}
            The model demonstrates correctness of the state machine and invariant logic, but does NOT assert the following physical real-world traits:
          </p>

          <div class="not-proven-list">
            <div v-for="(item, idx) in validationEvidence.notProven" :key="idx" class="not-proven-item">
              <span class="bullet-x">✕</span>
              <div>
                <span class="mono not-proven-title">{{ item }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <span class="mono text-steel">Source: simulation_results.json "not_proven" metadata</span>
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

.scorecard-col {
  grid-column: span 12;
  margin-bottom: 32px;
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
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.scorecard-metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 16px;
}

.m-sub {
  font-size: 0.6875rem;
  color: var(--steel);
}

.simulation-note {
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 16px 20px;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.scenarios-covered-col {
  grid-column: span 7;
}

.honesty-col {
  grid-column: span 5;
}

.checks-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ink);
}

.check-icon {
  color: var(--safe);
  font-weight: bold;
  font-family: var(--font-mono);
}

.check-text {
  font-size: 0.75rem;
}

.honesty-card {
  background: #FCF9F2;
  border-color: #E2D9C5;
}

.honesty-lead {
  font-size: 0.8125rem;
  color: var(--ink-soft);
  line-height: 1.6;
  margin-bottom: 20px;
}

.not-proven-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.not-proven-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border: 1px solid #E2D9C5;
  border-radius: 2px;
  padding: 10px 14px;
}

.bullet-x {
  color: var(--warning);
  font-weight: bold;
  font-family: var(--font-mono);
}

.not-proven-title {
  font-size: 0.75rem;
  color: var(--ink);
  font-weight: 500;
}

.card-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 0.6875rem;
}

@media (max-width: 1000px) {
  .scorecard-metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .scenarios-covered-col,
  .honesty-col {
    grid-column: span 12;
  }

  .scorecard-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
