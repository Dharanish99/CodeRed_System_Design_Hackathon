<script setup lang="ts">
import { ref, computed } from 'vue'
import { invariants } from '../../data/evidence'

// Interactive invariant state
const held = ref(25)
const sold = ref(35)

// Available is mathematically derived from A = N - (H + S)
const available = computed(() => {
  return Math.max(0, 100 - (held.value + sold.value))
})

// Validation check
const isValid = computed(() => {
  return available.value >= 0 && held.value >= 0 && sold.value >= 0 && (available.value + held.value + sold.value) === 100
})

function updateHeld(val: number) {
  const maxPossible = 100 - sold.value
  held.value = Math.min(Math.max(0, val), maxPossible)
}

function updateSold(val: number) {
  const maxPossible = 100 - held.value
  sold.value = Math.min(Math.max(0, val), maxPossible)
}

function setPreset(h: number, s: number) {
  held.value = h
  sold.value = s
}

// Generate the 100 cells array
const cells = computed(() => {
  const arr: string[] = []
  for (let i = 0; i < sold.value; i++) arr.push('sold')
  for (let i = 0; i < held.value; i++) arr.push('held')
  while (arr.length < 100) arr.push('available')
  return arr
})

const selectedInvariant = ref('INV-001')
</script>

<template>
  <section class="section invariant-section">
    <div class="site-grid">
      <!-- Section Header -->
      <div class="section-title-wrap">
        <span class="section-number">01 // MATHEMATICAL FOUNDATION</span>
        <h2>System Invariants & State Conservation</h2>
        <p class="body-text">
          Correctness in SALESTORM is defined as a closed conservation law.
          Stock is never created or destroyed; it transitions strictly between three mutually exclusive states:
          <strong>Available (A)</strong>, <strong>Held (H)</strong>, and <strong>Sold (S)</strong>.
        </p>
      </div>

      <!-- Invariant Formula Banner -->
      <div class="formula-banner">
        <div class="formula-block">
          <span class="label">PRIMARY CONSERVATION INVARIANT</span>
          <div class="formula-math">A + H + S = 100</div>
          <div class="formula-conditions mono">
            <span>A, H, S ≥ 0</span>
            <span class="dot-sep">•</span>
            <span>H + S ≤ 100</span>
            <span class="dot-sep">•</span>
            <span class="text-safe" v-if="isValid">CONSERVATION VERIFIED (SUM = 100)</span>
          </div>
        </div>

        <div class="preset-buttons">
          <span class="label">LIFECYCLE PRESETS</span>
          <div class="preset-row">
            <button class="btn btn--preset" :class="{ 'btn--active': held === 0 && sold === 0 }" @click="setPreset(0, 0)">
              T=0 Base (100, 0, 0)
            </button>
            <button class="btn btn--preset" :class="{ 'btn--active': held === 100 && sold === 0 }" @click="setPreset(100, 0)">
              Peak Hold (0, 100, 0)
            </button>
            <button class="btn btn--preset" :class="{ 'btn--active': held === 5 && sold === 95 }" @click="setPreset(5, 95)">
              Final Run (0, 5, 95)
            </button>
            <button class="btn btn--preset" :class="{ 'btn--active': held === 0 && sold === 100 }" @click="setPreset(0, 100)">
              Sold Out (0, 0, 100)
            </button>
          </div>
        </div>
      </div>

      <!-- Interactive Playground Column -->
      <div class="interactive-col">
        <div class="panel-card">
          <div class="panel-header">
            <span class="label">INTERACTIVE STATE CONSERVATION PLAYGROUND</span>
            <span class="mono text-steel">DRAG SLIDERS TO TEST INVARIANT</span>
          </div>

          <!-- Slider Controls -->
          <div class="slider-group">
            <div class="slider-item">
              <div class="slider-label-row">
                <span class="mono text-steel">AVAILABLE (A)</span>
                <span class="mono counter-sm">{{ available }}</span>
              </div>
              <div class="derived-bar">
                <div class="bar-fill bar-fill--available" :style="{ width: `${available}%` }"></div>
              </div>
              <span class="slider-caption mono">Derived automatically: 100 - (H + S)</span>
            </div>

            <div class="slider-item">
              <div class="slider-label-row">
                <span class="mono text-codered">HELD / RESERVED (H)</span>
                <span class="mono counter-sm text-codered">{{ held }}</span>
              </div>
              <input
                type="range"
                min="0"
                :max="100 - sold"
                :value="held"
                @input="e => updateHeld(Number((e.target as HTMLInputElement).value))"
                class="range-slider"
              />
              <span class="slider-caption mono">Active holds (RESERVED + PAYMENT_PENDING)</span>
            </div>

            <div class="slider-item">
              <div class="slider-label-row">
                <span class="mono text-safe">SOLD / COMMITTED (S)</span>
                <span class="mono counter-sm text-safe">{{ sold }}</span>
              </div>
              <input
                type="range"
                min="0"
                :max="100 - held"
                :value="sold"
                @input="e => updateSold(Number((e.target as HTMLInputElement).value))"
                class="range-slider"
              />
              <span class="slider-caption mono">Authoritatively committed purchases</span>
            </div>
          </div>

          <!-- 100-Cell State Grid -->
          <div class="grid-wrap">
            <div class="inventory-grid" role="region" aria-label="100 unit conservation grid">
              <div
                v-for="(st, idx) in cells"
                :key="idx"
                class="inventory-cell"
                :class="{
                  'inventory-cell--available': st === 'available',
                  'inventory-cell--reserved': st === 'held',
                  'inventory-cell--sold': st === 'sold',
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invariants Specification List -->
      <div class="invariants-list-col">
        <div class="panel-card">
          <div class="panel-header">
            <span class="label">FORMAL ARCHITECTURAL INVARIANTS</span>
            <span class="mono text-steel">SOURCE: system_invariants.md</span>
          </div>

          <div class="invariants-accordion">
            <div
              v-for="inv in invariants.ids"
              :key="inv.id"
              class="inv-item"
              :class="{ 'inv-item--active': selectedInvariant === inv.id }"
              @click="selectedInvariant = inv.id"
            >
              <div class="inv-item__head">
                <span class="mono inv-id">{{ inv.id }}</span>
                <span class="inv-text">{{ inv.text }}</span>
              </div>
            </div>
          </div>

          <div class="source-footnote">
            <span class="mono">Source: ../SALESTORM_CodeRed/01_Requirements/system_invariants.md INV-001..009</span>
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

.section-number {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--steel);
  display: block;
  margin-bottom: 8px;
}

.formula-banner {
  grid-column: span 12;
  background: var(--ink);
  color: var(--paper);
  border-radius: 4px;
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 32px;
}

.formula-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.formula-math {
  font-family: var(--font-mono);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--paper);
}

.formula-conditions {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8125rem;
  color: var(--steel);
}

.dot-sep {
  opacity: 0.4;
}

.preset-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn--preset {
  border-color: var(--steel);
  color: var(--paper);
  font-size: 0.75rem;
  padding: 6px 12px;
}

.btn--preset:hover {
  background: var(--paper-deep);
  color: var(--ink);
}

.btn--preset.btn--active {
  background: var(--white);
  color: var(--ink);
  border-color: var(--white);
}

.interactive-col {
  grid-column: span 6;
}

.invariants-list-col {
  grid-column: span 6;
}

.panel-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 28px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 28px;
}

.slider-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.counter-sm {
  font-weight: 600;
  font-size: 1.125rem;
}

.derived-bar {
  height: 8px;
  background: var(--paper-deep);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill--available {
  height: 100%;
  background: var(--steel);
  transition: width 0.15s ease-out;
}

.range-slider {
  width: 100%;
  accent-color: var(--ink);
  cursor: pointer;
}

.slider-caption {
  font-size: 0.6875rem;
  color: var(--steel);
}

.grid-wrap {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  margin-top: auto;
  border-top: 1px solid var(--line);
}

.invariants-accordion {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 480px;
  padding-right: 4px;
}

.inv-item {
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--paper);
}

.inv-item:hover {
  border-color: var(--ink-soft);
}

.inv-item--active {
  border-color: var(--ink);
  background: var(--paper-deep);
}

.inv-item__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.inv-id {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--codered);
  background: var(--white);
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 2px;
  white-space: nowrap;
}

.inv-text {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ink);
}

.source-footnote {
  margin-top: 16px;
  font-size: 0.6875rem;
  color: var(--steel);
  text-align: right;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

@media (max-width: 900px) {
  .interactive-col,
  .invariants-list-col {
    grid-column: span 12;
  }
}
</style>
