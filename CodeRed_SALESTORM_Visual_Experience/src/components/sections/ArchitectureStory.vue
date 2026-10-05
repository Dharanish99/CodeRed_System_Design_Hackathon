<script setup lang="ts">
import { ref } from 'vue'
import { services, criticalBoundaries, type ServiceNode } from '../../data/architecture'

const selectedService = ref<ServiceNode>(services.find(s => s.id === 'inventory') || services[0])

const activeStep = ref(0)
const flowSteps = [
  {
    step: 1,
    title: 'Admission & Catalogue',
    description: 'Clients enter through Gateway/CDN. Product browse hits Redis cache; admission counters filter excessive non-order traffic.',
    activeNodes: ['edge', 'catalogue', 'redis'],
    mode: 'Synchronous HTTP + Advisory Cache',
  },
  {
    step: 2,
    title: 'Guarded Inventory Hold',
    description: 'Checkout invokes Inventory service. A single ACID row lock decrements available_quantity and issues a durable hold.',
    activeNodes: ['checkout', 'inventory'],
    mode: 'Synchronous ACID DB Transaction',
  },
  {
    step: 3,
    title: 'Durable Payment Intent',
    description: 'Checkout initiates Payment with a unique idempotency key. A single provider intent is established. Network timeouts enter UNKNOWN.',
    activeNodes: ['checkout', 'payment', 'provider'],
    mode: 'Synchronous Outbound Gateway Call',
  },
  {
    step: 4,
    title: 'Kafka Outbox & State Convergence',
    description: 'Upon payment confirmation, PaymentSucceeded is published. Inventory transitions to SOLD and emits ReservationCommitted. Order service materializes durable order.',
    activeNodes: ['payment', 'kafka', 'inventory', 'order', 'fulfilment', 'notification'],
    mode: 'Asynchronous Event-Driven Log',
  },
]

function selectService(s: ServiceNode) {
  selectedService.value = s
}

function nextStep() {
  activeStep.value = (activeStep.value + 1) % flowSteps.length
}

function prevStep() {
  activeStep.value = (activeStep.value - 1 + flowSteps.length) % flowSteps.length
}
</script>

<template>
  <section id="architecture" class="section architecture-story">
    <div class="site-grid">
      <!-- Section Header -->
      <div class="section-title-wrap">
        <span class="section-number">02 // SYSTEM TOPOLOGY & LIFECYCLE</span>
        <h2>End-to-End Architectural Decomposition</h2>
        <p class="body-text">
          SALESTORM strictly delineates synchronous user-facing transactions from asynchronous eventual consistency.
          PostgreSQL Inventory is the sole stock writer; Kafka and transactional outboxes decouple downstream processing.
        </p>
      </div>

      <!-- Flow Stepper Controller -->
      <div class="stepper-panel">
        <div class="stepper-header">
          <div class="step-meta">
            <span class="label">PURCHASE LIFECYCLE STEP {{ flowSteps[activeStep].step }} OF 4</span>
            <h3 class="step-title">{{ flowSteps[activeStep].title }}</h3>
          </div>
          <div class="stepper-nav">
            <button class="btn" @click="prevStep" :disabled="activeStep === 0">← PREVIOUS</button>
            <button class="btn btn--active" @click="nextStep">NEXT STEP →</button>
          </div>
        </div>

        <div class="step-body">
          <p class="step-desc">{{ flowSteps[activeStep].description }}</p>
          <div class="step-tags">
            <span class="state-chip state-chip--available">Mode: {{ flowSteps[activeStep].mode }}</span>
            <span class="mono text-steel">Active Services: {{ flowSteps[activeStep].activeNodes.join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- Architecture Interactive Diagram -->
      <div class="diagram-col">
        <div class="diagram-card">
          <div class="diagram-header">
            <span class="label">SERVICE TOPOLOGY MAP (CLICK A NODE TO INSPECT)</span>
            <div class="legend">
              <div class="legend__item">
                <span class="legend__swatch legend__swatch--sync"></span>
                <span class="mono">Sync HTTP</span>
              </div>
              <div class="legend__item">
                <span class="legend__swatch legend__swatch--async"></span>
                <span class="mono">Async Kafka Event</span>
              </div>
              <div class="legend__item">
                <span class="legend__swatch legend__swatch--db"></span>
                <span class="mono">Local ACID DB</span>
              </div>
            </div>
          </div>

          <!-- Service Nodes Interactive Grid -->
          <div class="services-interactive-grid">
            <div
              v-for="s in services"
              :key="s.id"
              class="service-box"
              :class="{
                'service-box--selected': selectedService.id === s.id,
                'service-box--active-flow': flowSteps[activeStep].activeNodes.includes(s.id),
                'service-box--authority': s.id === 'inventory',
                'service-box--broker': s.id === 'kafka',
                'service-box--cache': s.id === 'redis',
              }"
              @click="selectService(s)"
            >
              <div class="service-box__top">
                <span class="mono s-type">{{ s.type.toUpperCase() }}</span>
                <span v-if="s.id === 'inventory'" class="badge-auth mono">AUTHORITY</span>
              </div>
              <h4 class="s-name">{{ s.name }}</h4>
              <p class="s-role mono">{{ s.responsibility }}</p>
            </div>
          </div>

          <div class="diagram-footer">
            <span class="mono text-steel">Source: ../SALESTORM_CodeRed/02_HLD/service_catalog.md & hld_architecture.md</span>
          </div>
        </div>
      </div>

      <!-- Node Inspector Details Column -->
      <div class="inspector-col">
        <div class="inspector-card">
          <div class="inspector-card__header">
            <span class="label">SERVICE SPECIFICATION</span>
            <span class="state-chip state-chip--reserved">{{ selectedService.type.toUpperCase() }}</span>
          </div>

          <div class="inspector-content">
            <h3 class="inspector-title">{{ selectedService.name }}</h3>
            
            <div class="inspector-prop">
              <span class="label">CORE RESPONSIBILITY</span>
              <p class="inspector-text">{{ selectedService.responsibility }}</p>
            </div>

            <div class="inspector-prop">
              <span class="label">PERSISTENCE & STORAGE GUARANTEE</span>
              <p class="inspector-text mono">{{ selectedService.persistence }}</p>
            </div>

            <div class="inspector-prop">
              <span class="label">HORIZONTAL SCALING PROFILE</span>
              <p class="inspector-text mono">{{ selectedService.scaling }}</p>
            </div>

            <div v-if="selectedService.id === 'inventory'" class="inspector-callout inspector-callout--danger">
              <span class="label text-codered">SYSTEM CRITICAL INVARIANT</span>
              <p class="mono text-codered">
                PostgreSQL Inventory is the SOLE stock authority in the entire cluster. No other service or cache has write permissions to stock quantities.
              </p>
            </div>

            <div v-if="selectedService.id === 'redis'" class="inspector-callout inspector-callout--warning">
              <span class="label text-warning">ADVISORY NON-AUTHORITATIVE</span>
              <p class="mono text-ink">
                Redis is strictly advisory. Stale cache hits are intercepted and rejected authoritatively at the database layer.
              </p>
            </div>

            <div v-if="selectedService.id === 'kafka'" class="inspector-callout inspector-callout--safe">
              <span class="label text-safe">TRANSACTIONAL OUTBOX DECOUPLING</span>
              <p class="mono text-ink">
                All messages originate from local PostgreSQL outbox tables, guaranteeing that database state changes and event dispatches never diverge.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Boundaries Cards -->
      <div class="boundaries-wrap">
        <h3 class="boundaries-heading">Three Immutable Architectural Boundaries</h3>
        <div class="boundaries-grid">
          <div v-for="b in criticalBoundaries" :key="b.id" class="boundary-card">
            <span class="mono boundary-id">{{ b.id.toUpperCase() }}</span>
            <h4 class="boundary-title">{{ b.title }}</h4>
            <p class="body-text boundary-desc">{{ b.description }}</p>
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

.stepper-panel {
  grid-column: span 12;
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 24px 28px;
  margin-bottom: 32px;
}

.stepper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.step-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-title {
  color: var(--ink);
}

.stepper-nav {
  display: flex;
  gap: 8px;
}

.step-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-desc {
  font-size: 0.9375rem;
  color: var(--ink-soft);
  max-width: 80ch;
}

.step-tags {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.diagram-col {
  grid-column: span 8;
}

.inspector-col {
  grid-column: span 4;
}

.diagram-card, .inspector-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.diagram-header, .inspector-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.services-interactive-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.service-box {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.service-box:hover {
  border-color: var(--ink);
  transform: translateY(-1px);
}

.service-box--selected {
  border-color: var(--ink);
  background: var(--white);
  box-shadow: 0 4px 12px rgba(16, 27, 39, 0.08);
}

.service-box--active-flow {
  border-color: var(--codered);
  background: #FFF8F7;
}

.service-box--authority {
  border-left: 3px solid var(--codered);
}

.service-box--broker {
  border-left: 3px solid var(--ink);
}

.service-box--cache {
  border-left: 3px dashed var(--warning);
}

.service-box__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.s-type {
  font-size: 0.625rem;
  color: var(--steel);
}

.badge-auth {
  font-size: 0.625rem;
  color: var(--codered);
  font-weight: 600;
}

.s-name {
  font-size: 0.875rem;
  color: var(--ink);
}

.s-role {
  font-size: 0.6875rem;
  color: var(--ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.diagram-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 0.6875rem;
}

.inspector-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.inspector-title {
  font-size: 1.25rem;
  color: var(--ink);
}

.inspector-prop {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inspector-text {
  font-size: 0.875rem;
  color: var(--ink-soft);
  line-height: 1.5;
}

.inspector-callout {
  padding: 12px 14px;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
}

.inspector-callout--danger {
  background: var(--codered-dim);
  border: 1px solid var(--codered);
}

.inspector-callout--warning {
  background: var(--warning-dim);
  border: 1px solid var(--warning);
}

.inspector-callout--safe {
  background: var(--safe-dim);
  border: 1px solid var(--safe);
}

.boundaries-wrap {
  grid-column: span 12;
  margin-top: 40px;
}

.boundaries-heading {
  font-size: 1.125rem;
  margin-bottom: 20px;
}

.boundaries-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.boundary-card {
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.boundary-id {
  font-size: 0.6875rem;
  color: var(--codered);
  font-weight: 600;
}

.boundary-title {
  font-size: 0.9375rem;
  color: var(--ink);
}

.boundary-desc {
  font-size: 0.8125rem;
  color: var(--ink-soft);
}

@media (max-width: 900px) {
  .diagram-col,
  .inspector-col {
    grid-column: span 12;
  }

  .services-interactive-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .boundaries-grid {
    grid-template-columns: 1fr;
  }
}
</style>
