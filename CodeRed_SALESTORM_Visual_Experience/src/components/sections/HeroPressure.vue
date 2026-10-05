<script setup lang="ts">
import { ref, computed } from 'vue'

const requestCount = ref(10000)
const unitCount = 100
const isSimulating = ref(false)
const simulationProgress = ref(0)
const processedRequests = ref(0)
const successfulHolds = ref(0)
const rejectedRequests = ref(0)

// Grid units representation: 0 = available, 1 = held/reserved, 2 = sold
const units = ref<number[]>(Array(100).fill(0))

let timer: number | null = null

function runSimulation() {
  if (isSimulating.value) return
  resetSimulation()
  isSimulating.value = true

  let step = 0
  const totalSteps = 100
  const requestsPerStep = requestCount.value / totalSteps

  timer = window.setInterval(() => {
    step++
    simulationProgress.value = step
    processedRequests.value = Math.min(Math.round(step * requestsPerStep), requestCount.value)

    if (step <= unitCount) {
      units.value[step - 1] = 1 // Marked as held
      successfulHolds.value = step
    } else {
      rejectedRequests.value = processedRequests.value - unitCount
    }

    if (step >= totalSteps) {
      if (timer) clearInterval(timer)
      isSimulating.value = false
    }
  }, 25)
}

function resetSimulation() {
  if (timer) clearInterval(timer)
  isSimulating.value = false
  simulationProgress.value = 0
  processedRequests.value = 0
  successfulHolds.value = 0
  rejectedRequests.value = 0
  units.value = Array(100).fill(0)
}

const oversellCount = computed(() => {
  return Math.max(0, successfulHolds.value - unitCount)
})
</script>

<template>
  <section id="problem" class="section hero-pressure">
    <div class="site-grid">
      <!-- Top Header Row -->
      <div class="hero-header">
        <div class="hero-tag">
          <span class="pulse-dot"></span>
          <span class="mono">SALESTORM SYSTEM ARCHITECTURE // LOCAL VERIFIED SPECIFICATION</span>
        </div>
        <h1 class="hero-title">10,000 Customers.<br />100 Units.<br /><span class="text-codered">Zero Oversell.</span></h1>
        <p class="body-text hero-lead">
          Under peak flash-sale contention, ten thousand concurrent HTTP requests strike the edge within milliseconds for a single hot SKU.
          CodeRed's architecture guarantees that the database never executes an unreserved sale, never permits negative stock, and guarantees that every completed payment produces exactly one durable order.
        </p>
      </div>

      <!-- Left Column: Metrics & Challenge -->
      <div class="hero-metrics-col">
        <div class="metrics-card">
          <div class="metric-row">
            <span class="label">CONCURRENT TRAFFIC</span>
            <span class="counter counter--medium">{{ requestCount.toLocaleString() }}</span>
            <span class="metric-note">Requests at T=0 surge window</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-row">
            <span class="label">STOCK ALLOCATION (N)</span>
            <span class="counter counter--medium text-ink">{{ unitCount }}</span>
            <span class="metric-note">Single SKU available units</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-row">
            <span class="label">PERMISSIBLE OVERSELL</span>
            <span class="counter counter--medium" :class="oversellCount === 0 ? 'text-safe' : 'text-codered'">
              {{ oversellCount }}
            </span>
            <span class="metric-note">Strict invariant requirement</span>
          </div>
        </div>

        <div class="simulation-controls">
          <button
            class="btn btn--danger"
            :disabled="isSimulating"
            @click="runSimulation"
          >
            <span v-if="!isSimulating">⚡ SIMULATE FLASH SURGE</span>
            <span v-else>RUNNING SURGE SIMULATION... ({{ simulationProgress }}%)</span>
          </button>
          <button class="btn" @click="resetSimulation">RESET</button>
        </div>

        <div class="telemetry-bar">
          <div class="telemetry-item">
            <span class="label">PROCESSED</span>
            <span class="mono text-ink">{{ processedRequests.toLocaleString() }} / 10,000</span>
          </div>
          <div class="telemetry-item">
            <span class="label">RESERVED</span>
            <span class="mono text-codered">{{ successfulHolds }} / 100</span>
          </div>
          <div class="telemetry-item">
            <span class="label">REJECTED (409)</span>
            <span class="mono text-steel">{{ rejectedRequests.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Right Column: 100-Unit Grid Visualizer -->
      <div class="hero-grid-col">
        <div class="grid-card">
          <div class="grid-card__header">
            <span class="label">INVENTORY UNIT MATRIX (10 × 10)</span>
            <span class="mono text-steel">ID: SKU-FLASH-001</span>
          </div>

          <div class="inventory-grid-wrap">
            <div class="inventory-grid" role="region" aria-label="100 unit inventory visualization">
              <div
                v-for="(status, index) in units"
                :key="index"
                class="inventory-cell"
                :class="{
                  'inventory-cell--available': status === 0,
                  'inventory-cell--reserved': status === 1,
                  'inventory-cell--sold': status === 2,
                }"
                :title="`Unit ${index + 1}: ${status === 0 ? 'AVAILABLE' : status === 1 ? 'HELD' : 'SOLD'}`"
              ></div>
            </div>
          </div>

          <div class="grid-card__legend">
            <div class="legend__item">
              <span class="inventory-cell inventory-cell--available legend-box"></span>
              <span class="mono">Available ({{ 100 - successfulHolds }})</span>
            </div>
            <div class="legend__item">
              <span class="inventory-cell inventory-cell--reserved legend-box"></span>
              <span class="mono">Held ({{ successfulHolds }})</span>
            </div>
            <div class="legend__item">
              <span class="inventory-cell inventory-cell--sold legend-box"></span>
              <span class="mono">Sold (0)</span>
            </div>
          </div>

          <div class="grid-source-ref">
            <span class="mono">Source: 01_Requirements/requirements_and_assumptions.md R02, A02</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-pressure {
  padding-top: calc(var(--section-pad) * 0.75);
}

.hero-header {
  grid-column: span 12;
  margin-bottom: 40px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--paper-deep);
  border: 1px solid var(--line);
  padding: 6px 14px;
  border-radius: 2px;
  font-size: 0.75rem;
  margin-bottom: 24px;
  color: var(--ink-soft);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: var(--codered);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

.hero-title {
  margin-bottom: 20px;
  max-width: 900px;
}

.hero-lead {
  font-size: 1.125rem;
  max-width: 75ch;
  color: var(--ink-soft);
}

.hero-metrics-col {
  grid-column: span 6;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metrics-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 28px;
}

.metric-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-note {
  font-size: 0.8125rem;
  color: var(--steel);
}

.metric-divider {
  height: 1px;
  background: var(--line);
  margin: 16px 0;
}

.simulation-controls {
  display: flex;
  gap: 12px;
}

.telemetry-bar {
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-grid-col {
  grid-column: span 6;
}

.grid-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.grid-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.inventory-grid-wrap {
  display: flex;
  justify-content: center;
  padding: 12px 0 24px;
}

.grid-card__legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.legend-box {
  width: 14px;
  height: 14px;
  display: inline-block;
}

.grid-source-ref {
  margin-top: 16px;
  font-size: 0.6875rem;
  color: var(--steel);
  text-align: right;
}

@media (max-width: 900px) {
  .hero-metrics-col,
  .hero-grid-col {
    grid-column: span 12;
  }
}
</style>
