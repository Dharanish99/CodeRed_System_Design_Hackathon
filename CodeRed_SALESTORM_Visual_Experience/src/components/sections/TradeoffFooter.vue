<script setup lang="ts">
const adrs = [
  {
    id: 'ADR-001',
    title: 'Guarded SQL vs Distributed Locks',
    decision: 'Use single PostgreSQL row lock with available_quantity >= 1 check.',
    rationale: 'Eliminates Redis Redlock failure modes, split-brain, and lease expiry bugs.',
  },
  {
    id: 'ADR-002',
    title: 'Fenced PostgreSQL Primary',
    decision: 'One authoritative writer per inventory shard with synchronous replication.',
    rationale: 'Avoids multi-master conflict resolution on hot inventory counters.',
  },
  {
    id: 'ADR-003',
    title: 'Advisory-Only Cache',
    decision: 'Redis stores stock hints and catalogue cache; never authorizes inventory.',
    rationale: 'Cache evictions or stale read replicas never risk overselling real stock.',
  },
  {
    id: 'ADR-004',
    title: 'Transactional Outbox + Kafka',
    decision: 'Write events into local outbox table inside the same business transaction.',
    rationale: 'Guarantees at-least-once message delivery without distributed two-phase commit.',
  },
  {
    id: 'ADR-005',
    title: 'Reconcilable Provider Intent',
    decision: 'One deterministic provider intent key per reservation. Network timeout is UNKNOWN.',
    rationale: 'Prevents double-charging and eliminates stock loss during gateway timeouts.',
  },
  {
    id: 'ADR-006',
    title: 'Asynchronous Fulfillment',
    decision: 'Decouple shipment creation and notification dispatch from checkout path.',
    rationale: 'Protects checkout latency from third-party logistics and carrier outages.',
  },
  {
    id: 'ADR-007',
    title: 'Eventual Order Materialization',
    decision: 'Orders created strictly by consuming ReservationCommitted events with inbox dedup.',
    rationale: 'Payment and stock holds succeed even if Order Service is experiencing an outage.',
  },
  {
    id: 'ADR-008',
    title: 'Request Deduplication via SQL Key',
    decision: 'INSERT INTO request_dedup (key, hash) ON CONFLICT DO NOTHING.',
    rationale: 'Protects against client network retries and duplicate submission payloads.',
  },
]
</script>

<template>
  <footer class="tradeoff-footer">
    <div class="site-grid">
      <!-- Section Header -->
      <div class="section-title-wrap">
        <span class="section-number">08 // ARCHITECTURAL DECISIONS</span>
        <h2>Engineering Trade-Offs & Philosophy</h2>
        <p class="body-text">
          Every architecture is a compromise. We deliberately prioritized absolute data correctness over unbounded availability, choosing deterministic failure semantics over subtle distributed anomalies.
        </p>
      </div>

      <!-- ADR Grid -->
      <div class="adr-grid-wrap">
        <div class="adr-grid">
          <div v-for="adr in adrs" :key="adr.id" class="adr-card">
            <div class="adr-card__head">
              <span class="mono adr-badge">{{ adr.id }}</span>
              <h4 class="adr-title">{{ adr.title }}</h4>
            </div>
            <p class="adr-decision"><strong>Decision:</strong> {{ adr.decision }}</p>
            <p class="adr-rationale"><strong>Rationale:</strong> {{ adr.rationale }}</p>
          </div>
        </div>
      </div>

      <!-- Colophon & Engineering Manifesto -->
      <div class="colophon-col">
        <div class="colophon-card">
          <div class="manifesto-left">
            <span class="mono brand-logo">SALESTORM // CODERED</span>
            <p class="manifesto-text">
              Correctness over throughput.<br />
              Local ACID over distributed 2PC.<br />
              Definitive reconciliation over optimistic guesswork.
            </p>
          </div>

          <div class="colophon-right">
            <div class="colophon-meta">
              <span class="label">SYSTEM SPECIFICATION</span>
              <span class="mono text-ink">SYSCRAFTERS 2026 HACKATHON</span>
            </div>
            <div class="colophon-meta">
              <span class="label">ENGINEERING TEAM</span>
              <span class="mono text-ink">Team CodeRed</span>
            </div>
            <div class="colophon-meta">
              <span class="label">VISUAL ARCHITECTURE EXPERIENCE</span>
              <span class="mono text-steel">Vue 3 • TypeScript • Native CSS Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.tradeoff-footer {
  padding-top: var(--section-pad);
  padding-bottom: calc(var(--section-pad) * 0.8);
  background: var(--paper-deep);
  border-top: 1px solid var(--line);
}

.section-title-wrap {
  grid-column: span 12;
  margin-bottom: 32px;
}

.adr-grid-wrap {
  grid-column: span 12;
  margin-bottom: 48px;
}

.adr-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.adr-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.adr-card__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.adr-badge {
  font-size: 0.6875rem;
  color: var(--codered);
  font-weight: 700;
}

.adr-title {
  font-size: 0.875rem;
  color: var(--ink);
  line-height: 1.3;
}

.adr-decision {
  font-size: 0.75rem;
  color: var(--ink);
  line-height: 1.5;
}

.adr-rationale {
  font-size: 0.75rem;
  color: var(--ink-soft);
  line-height: 1.5;
}

.colophon-col {
  grid-column: span 12;
}

.colophon-card {
  background: var(--ink);
  color: var(--paper);
  border-radius: 4px;
  padding: 36px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 32px;
}

.manifesto-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.brand-logo {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--codered);
}

.manifesto-text {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.7;
  color: var(--paper-deep);
}

.colophon-right {
  display: flex;
  gap: 36px;
  flex-wrap: wrap;
}

.colophon-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.colophon-meta .label {
  color: var(--steel);
}

.colophon-meta .mono {
  font-size: 0.8125rem;
  color: var(--paper);
}

@media (max-width: 1000px) {
  .adr-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .adr-grid {
    grid-template-columns: 1fr;
  }

  .colophon-card {
    padding: 24px;
  }
}
</style>
