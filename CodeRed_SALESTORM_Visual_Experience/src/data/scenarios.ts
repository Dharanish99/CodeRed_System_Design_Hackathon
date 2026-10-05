// Source: ../SALESTORM_CodeRed/02_HLD/inventory_concurrency.md
// Source: ../SALESTORM_CodeRed/03_LLD/order_reservation_state.md
// Source: ../SALESTORM_CodeRed/10_ADR/ADR-001..008
// Source: ../SALESTORM_CodeRed/04_Database/reservation_transaction.sql

export interface Scenario {
  id: string
  title: string
  whatHappens: string
  whatProtects: string
  whatCustomerSees: string
  howItRecovers: string
  telemetry: string
  sourceRef: string
}

// Each scenario verified against local architecture documentation
export const scenarios: Scenario[] = [
  {
    id: 'last-item-race',
    title: 'LAST ITEM RACE',
    // Source: ../SALESTORM_CodeRed/01_Requirements/system_invariants.md "One unit, two requests"
    whatHappens: 'Two requests compete for the last available unit. Both issue a guarded UPDATE against the same inventory row.',
    whatProtects: 'The guarded SQL UPDATE acquires the row lock. One commits available_quantity = 0. The other rechecks available_quantity >= 1, finds zero rows affected, and returns OUT_OF_STOCK.',
    whatCustomerSees: 'The winner receives 201 RESERVED. The loser receives 409 OUT_OF_STOCK. If the first transaction rolls back, the second can win.',
    howItRecovers: 'No recovery needed — the invariant is preserved by the database row lock and predicate.',
    telemetry: 'Inventory row contention metrics, reservation success/failure counters.',
    sourceRef: 'system_invariants.md "One unit, two requests"',
  },
  {
    id: 'duplicate-buy',
    title: 'DUPLICATE BUY',
    // Source: ../SALESTORM_CodeRed/04_Database/reservation_transaction.sql L11-19
    whatHappens: 'A client retries a Buy request with the same Idempotency-Key after a timeout or network error.',
    whatProtects: 'INSERT INTO request_dedup ON CONFLICT DO NOTHING. If not found, lookup existing record. Same key + same hash → return stored original response. Same key + different hash → 409 IDEMPOTENCY_MISMATCH.',
    whatCustomerSees: 'The original response is replayed exactly. No duplicate reservation is created. No extra stock is consumed.',
    howItRecovers: 'The stored response from the first successful commit is returned. The second request never mutates inventory.',
    telemetry: 'Idempotency replay counter, mismatch alert.',
    sourceRef: 'reservation_transaction.sql L11-19, ADR-008',
  },
  {
    id: 'payment-timeout',
    title: 'PAYMENT TIMEOUT',
    // Source: ../SALESTORM_CodeRed/10_ADR/ADR-005.md
    // Source: ../SALESTORM_CodeRed/03_LLD/order_reservation_state.md
    whatHappens: 'The payment provider does not respond within the timeout window. The outcome is genuinely unknown — the charge may or may not have succeeded.',
    whatProtects: 'Payment records UNKNOWN status. Stock remains PAYMENT_PENDING — never released on timeout alone. The same durable provider intent is used for reconciliation.',
    whatCustomerSees: 'Status shows "payment processing." No false failure message. No duplicate charge from a second provider intent.',
    howItRecovers: 'Reconciliation queries the provider using the same intent key. A definitive success → SOLD. A definitive non-chargeable failure → RELEASED. If unresolved after 15 minutes, escalate.',
    telemetry: 'Payment timeout counter, UNKNOWN duration histogram, reconciliation success/failure.',
    sourceRef: 'ADR-005, order_reservation_state.md',
  },
  {
    id: 'order-service-down',
    title: 'ORDER SERVICE DOWN',
    // Source: ../SALESTORM_CodeRed/10_ADR/ADR-007.md
    // Source: ../SALESTORM_CodeRed/01_Requirements/system_invariants.md INV-006
    whatHappens: 'Order Service is unavailable for 30 seconds after payments complete. ReservationCommitted events cannot be consumed.',
    whatProtects: 'Transactional outbox ensures events are durable in the Inventory database. Kafka retains unacknowledged messages. Payment and Inventory commits are independent of Order availability.',
    whatCustomerSees: 'Payment is confirmed. Order status shows "processing." After recovery, the confirmed order appears.',
    howItRecovers: 'When Order Service restarts, it consumes the backlog of ReservationCommitted events. Inbox deduplication prevents duplicate orders. Each event creates exactly one confirmed order.',
    telemetry: 'Consumer lag metric, Order creation latency, convergence time alert.',
    sourceRef: 'ADR-007, system_invariants.md INV-006',
  },
  {
    id: 'stale-cache',
    title: 'STALE CACHE',
    // Source: ../SALESTORM_CodeRed/10_ADR/ADR-003.md
    whatHappens: 'Redis shows "in stock" after the last unit has been reserved. A customer attempts to buy based on stale cache data.',
    whatProtects: 'Redis is advisory, never authoritative. The guarded PostgreSQL UPDATE is the real gate. Cache staleness cannot bypass the inventory authority.',
    whatCustomerSees: 'The product page may show "available" briefly, but the Buy request returns OUT_OF_STOCK from the authoritative check.',
    howItRecovers: 'Cache invalidation with TTL + jitter propagates the correct state. The mismatch is transient and harmless to correctness.',
    telemetry: 'Cache hit/miss ratio, stock hint freshness, post-reserve cache invalidation latency.',
    sourceRef: 'ADR-003, hld_architecture.md',
  },
  {
    id: 'duplicate-event',
    title: 'DUPLICATE EVENT',
    // Source: ../SALESTORM_CodeRed/04_Database/consistency_and_transactions.md
    // Source: ../SALESTORM_CodeRed/05_API/event_catalog.md
    whatHappens: 'Kafka delivers the same PaymentSucceeded or ReservationCommitted event twice — at-least-once delivery guarantees this can happen.',
    whatProtects: 'Local inbox table with UNIQUE(consumer, event_id). Business-key uniqueness (UNIQUE reservation_id on orders). State guards prevent re-applying a terminal transition.',
    whatCustomerSees: 'Nothing abnormal. The duplicate is silently absorbed.',
    howItRecovers: 'The inbox insert fails on conflict. The consumer returns success without re-executing the effect. Already-committed state is idempotent.',
    telemetry: 'Inbox duplicate counter, DLQ alerts for malformed events.',
    sourceRef: 'consistency_and_transactions.md, event_catalog.md',
  },
  {
    id: 'database-unavailable',
    title: 'DATABASE UNAVAILABLE',
    // Source: ../SALESTORM_CodeRed/02_HLD/inventory_concurrency.md "Transaction failures"
    whatHappens: 'The PostgreSQL primary becomes temporarily unreachable during a Buy request.',
    whatProtects: 'Fail closed — no inventory mutation can proceed without the authoritative writer. Transaction rollback leaves no half-committed state. The system returns 503.',
    whatCustomerSees: '503 / "temporarily unavailable." Retry with the same Idempotency-Key after Retry-After.',
    howItRecovers: 'Synchronous replication + fencing ensures the new primary has all acknowledged commits. After failover, retry the same key — the request dedup resolves the previous attempt if it committed.',
    telemetry: 'Database connection failure rate, failover duration, 503 response rate.',
    sourceRef: 'inventory_concurrency.md "Transaction failures"',
  },
  {
    id: 'traffic-surge',
    title: '50× EDGE TRAFFIC',
    // Source: ../SALESTORM_CodeRed/01_Requirements/requirements_and_assumptions.md R06, A08
    whatHappens: '500,000 requests per second hit the edge. The vast majority are browse traffic that never reaches the Inventory database.',
    whatProtects: 'CDN/WAF absorbs browse. Gateway rate limits (429 + Retry-After). Admission budgets bound database-bound requests. 95% cacheable browse, 4% cart, 1% purchase at peak.',
    whatCustomerSees: 'Browse works from cache. Excess Buy requests get 429 with Retry-After. Admitted requests proceed normally.',
    howItRecovers: 'Stateless edge and gateway replicas scale horizontally. The hot inventory row remains the bottleneck by design — a trade-off for correctness.',
    telemetry: 'Edge RPS, admission rate, 429 percentage, database connection pool utilization.',
    sourceRef: 'requirements_and_assumptions.md R06/A08. NOTE: 500k edge RPS is a design/sizing scenario, NOT validated database throughput.',
  },
]
