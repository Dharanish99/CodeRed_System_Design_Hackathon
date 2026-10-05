<script setup lang="ts">
import { ref } from 'vue'
import { scenarios, type Scenario } from '../../data/scenarios'

const activeScenarioId = ref<string>(scenarios[0].id)
const activeScenario = ref<Scenario>(scenarios[0])

function selectScenario(s: Scenario) {
  activeScenarioId.value = s.id
  activeScenario.value = s
}
</script>

<template>
  <section id="failure-lab" class="section jury-lab">
    <div class="site-grid">
      <!-- Section Header -->
      <div class="section-title-wrap">
        <span class="section-number">06 // CHAOS & EDGE CONDITIONS</span>
        <h2>The Jury Failure Mode Lab</h2>
        <p class="body-text">
          An architecture is defined by how it fails. This interactive lab documents the exact system response, telemetry alerts, and recovery procedures for eight critical failure and contention scenarios.
        </p>
      </div>

      <!-- Scenarios Nav Column -->
      <div class="lab-sidebar-col">
        <div class="sidebar-card">
          <div class="sidebar-head">
            <span class="label">8 HARDENED SCENARIOS</span>
            <span class="mono text-steel">SELECT TO INSPECT</span>
          </div>

          <div class="scenario-nav-list">
            <button
              v-for="(s, index) in scenarios"
              :key="s.id"
              class="scenario-nav-item"
              :class="{ 'scenario-nav-item--active': activeScenarioId === s.id }"
              @click="selectScenario(s)"
            >
              <span class="mono nav-index">0{{ index + 1 }}</span>
              <div class="nav-content">
                <span class="nav-title">{{ s.title }}</span>
                <span class="mono nav-ref">{{ s.id }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Active Scenario Inspector Column -->
      <div class="lab-main-col">
        <div class="card active-scenario-card">
          <div class="scenario-header">
            <div class="scenario-badge-row">
              <span class="state-chip state-chip--reserved">SCENARIO: {{ activeScenario.id.toUpperCase() }}</span>
              <span class="mono text-steel">VERIFIED DESIGN SPECIFICATION</span>
            </div>
            <h3 class="scenario-main-title">{{ activeScenario.title }}</h3>
          </div>

          <!-- Analysis Grid -->
          <div class="scenario-analysis-grid">
            <!-- Box 1: What Happens -->
            <div class="analysis-box">
              <div class="box-head">
                <span class="label text-codered">01 // WHAT HAPPENS (CHAOS EVENT)</span>
              </div>
              <p class="box-body">{{ activeScenario.whatHappens }}</p>
            </div>

            <!-- Box 2: What Protects -->
            <div class="analysis-box">
              <div class="box-head">
                <span class="label text-safe">02 // WHAT PROTECTS THE INVARIANT</span>
              </div>
              <p class="box-body">{{ activeScenario.whatProtects }}</p>
            </div>

            <!-- Box 3: What Customer Sees -->
            <div class="analysis-box">
              <div class="box-head">
                <span class="label text-ink">03 // USER EXPERIENCE & VISIBILITY</span>
              </div>
              <p class="box-body">{{ activeScenario.whatCustomerSees }}</p>
            </div>

            <!-- Box 4: How It Recovers -->
            <div class="analysis-box">
              <div class="box-head">
                <span class="label text-warning">04 // SELF-HEALING & RECOVERY</span>
              </div>
              <p class="box-body">{{ activeScenario.howItRecovers }}</p>
            </div>
          </div>

          <!-- Telemetry & Metrics -->
          <div class="telemetry-box">
            <div class="box-head">
              <span class="label">TELEMETRY & OBSERVABILITY SIGNALS</span>
            </div>
            <p class="mono telemetry-text">{{ activeScenario.telemetry }}</p>
          </div>

          <!-- Source Citation Footer -->
          <div class="card-footer">
            <span class="mono text-steel">Grounding Artifact: {{ activeScenario.sourceRef }}</span>
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

.lab-sidebar-col {
  grid-column: span 4;
}

.lab-main-col {
  grid-column: span 8;
}

.sidebar-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 12px;
}

.scenario-nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scenario-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: 1px solid transparent;
  padding: 12px 14px;
  border-radius: 2px;
  text-align: left;
  transition: all 0.15s ease;
  cursor: pointer;
}

.scenario-nav-item:hover {
  background: var(--paper);
  border-color: var(--line);
}

.scenario-nav-item--active {
  background: var(--paper-deep);
  border-color: var(--ink);
}

.nav-index {
  font-size: 0.75rem;
  color: var(--steel);
  font-weight: 600;
}

.nav-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink);
}

.nav-ref {
  font-size: 0.6875rem;
  color: var(--steel);
}

.active-scenario-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 28px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scenario-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.scenario-badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.scenario-main-title {
  font-size: 1.5rem;
  color: var(--ink);
}

.scenario-analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.analysis-box {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.box-head {
  display: flex;
  align-items: center;
}

.box-body {
  font-size: 0.8125rem;
  color: var(--ink-soft);
  line-height: 1.55;
}

.telemetry-box {
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.telemetry-text {
  font-size: 0.8125rem;
  color: var(--ink);
}

.card-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 0.6875rem;
}

@media (max-width: 900px) {
  .lab-sidebar-col,
  .lab-main-col {
    grid-column: span 12;
  }

  .scenario-analysis-grid {
    grid-template-columns: 1fr;
  }
}
</style>
