# SITE SOURCE MAP

Every factual claim displayed on the website is grounded in a local source artifact.

## Hero / Problem Statement

| Claim | Source |
|---|---|
| 10,000 concurrent customers for 100 units | `../SALESTORM_CodeRed/01_Requirements/requirements_and_assumptions.md` R02 |
| Never oversell or go negative | `../SALESTORM_CodeRed/01_Requirements/requirements_and_assumptions.md` R02 |
| Flash-sale Buy is one SKU, quantity=1 | `../SALESTORM_CodeRed/01_Requirements/requirements_and_assumptions.md` A02 |

## Invariant

| Claim | Source |
|---|---|
| A, H, S >= 0 and A + H + S = N (N=100) | `../SALESTORM_CodeRed/01_Requirements/system_invariants.md` INV-001 |
| H + S ≤ 100 at all times | `../SALESTORM_CodeRed/01_Requirements/system_invariants.md` inductive proof |
| Base state: (A,H,S) = (100,0,0) | `../SALESTORM_CodeRed/01_Requirements/system_invariants.md` inductive proof |

## Lifecycle States

| Claim | Source |
|---|---|
| AVAILABLE → RESERVED → PAYMENT_PENDING → CONFIRMED → SOLD | `../SALESTORM_CodeRed/03_LLD/lifecycle_mapping.md`, `../SALESTORM_CodeRed/03_LLD/order_reservation_state.md` |
| RELEASED state with reasons: EXPIRED, PAYMENT_FAILED, CANCELLED | `../SALESTORM_CodeRed/03_LLD/lifecycle_mapping.md` |
| CONFIRMED is business milestone, not separately queryable Inventory status | `../SALESTORM_CodeRed/03_LLD/lifecycle_mapping.md` |
| CONFIRMED → SOLD is not a distributed two-phase transaction | `../SALESTORM_CodeRed/03_LLD/lifecycle_mapping.md` |
| Inventory persists RESERVED, PAYMENT_PENDING, SOLD, RELEASED | `../SALESTORM_CodeRed/03_LLD/order_reservation_state.md` |

## Architecture / Services

| Claim | Source |
|---|---|
| Service list: Gateway/Edge, Catalogue+Sale, Cart, Checkout, Inventory/Reservation, Payment, Order, Fulfilment/Shipment, Notification, Kafka+relay, Observability | `../SALESTORM_CodeRed/02_HLD/service_catalog.md` |
| PostgreSQL Inventory is the only stock authority | `../SALESTORM_CodeRed/02_HLD/hld_architecture.md` |
| Redis caches catalogue and admission counters, never authorizes inventory | `../SALESTORM_CodeRed/02_HLD/hld_architecture.md` |
| Kafka is at-least-once transport with transactional outbox | `../SALESTORM_CodeRed/02_HLD/hld_architecture.md` |
| Each consumer commits inbox + business mutation + derived outbox before ACK | `../SALESTORM_CodeRed/02_HLD/hld_architecture.md` |
| No cross-service direct writes or foreign keys | `../SALESTORM_CodeRed/02_HLD/hld_architecture.md` |

## Critical Section / Guarded SQL

| Claim | Source |
|---|---|
| Guarded UPDATE with `available_quantity >= 1` | `../SALESTORM_CodeRed/04_Database/reservation_transaction.sql` L21-24 |
| Request dedup via INSERT ON CONFLICT DO NOTHING | `../SALESTORM_CodeRed/04_Database/reservation_transaction.sql` L11-12 |
| Hash mismatch returns 409 IDEMPOTENCY_MISMATCH | `../SALESTORM_CodeRed/04_Database/reservation_transaction.sql` L16-17 |
| Reservation, audit, outbox, stored response all commit atomically | `../SALESTORM_CodeRed/04_Database/reservation_transaction.sql` L29-39 |
| READ COMMITTED isolation level | `../SALESTORM_CodeRed/04_Database/consistency_and_transactions.md` |
| rows affected = 0 means OUT_OF_STOCK | `../SALESTORM_CodeRed/04_Database/reservation_transaction.sql` L25-26 |

## Payment Uncertainty

| Claim | Source |
|---|---|
| Timeout is UNKNOWN, not FAILED | `../SALESTORM_CodeRed/03_LLD/order_reservation_state.md`, `../SALESTORM_CodeRed/10_ADR/ADR-005.md` |
| One durable provider intent per reservation | `../SALESTORM_CodeRed/01_Requirements/system_invariants.md` INV-004, `../SALESTORM_CodeRed/10_ADR/ADR-005.md` |
| Reconcile against same provider intent | `../SALESTORM_CodeRed/10_ADR/ADR-005.md` |
| PAYMENT_PENDING retains stock; never released on timeout alone | `../SALESTORM_CodeRed/02_HLD/inventory_concurrency.md` |
| Only definitive non-chargeable failure releases stock | `../SALESTORM_CodeRed/03_LLD/order_reservation_state.md` |

## Order Recovery

| Claim | Source |
|---|---|
| Order created only from ReservationCommitted event | `../SALESTORM_CodeRed/10_ADR/ADR-007.md` |
| ReservationCommitted carries paid/sold evidence | `../SALESTORM_CodeRed/10_ADR/ADR-007.md` |
| Payment success survives Order outage | `../SALESTORM_CodeRed/01_Requirements/system_invariants.md` INV-006 |
| At most one order per reservation | `../SALESTORM_CodeRed/01_Requirements/system_invariants.md` INV-007 |
| Durable events permit replay/recovery | `../SALESTORM_CodeRed/02_HLD/hld_architecture.md` |
| Outbox relay publishes; inbox deduplicates | `../SALESTORM_CodeRed/04_Database/consistency_and_transactions.md` |

## Event Flow

| Claim | Source |
|---|---|
| InventoryReserved, CheckoutStarted, PaymentSucceeded, PaymentFailed, ReservationReleased, ReservationCommitted, OrderConfirmed events | `../SALESTORM_CodeRed/05_API/event_catalog.md` |
| PaymentSucceeded → Inventory SOLD → ReservationCommitted → Order | `../SALESTORM_CodeRed/05_API/event_catalog.md` |

## Validation / Evidence

| Claim | Source |
|---|---|
| 12/12 state-model scenarios passed | `../SALESTORM_CodeRed/11_AI_Assisted_Validation/validation_run.md`, `../SALESTORM_CodeRed/11_AI_Assisted_Validation/simulation_results.json` |
| 10,000 logical customers, 10,200 HTTP attempts, 200 duplicates | `../SALESTORM_CodeRed/11_AI_Assisted_Validation/simulation_results.json` |
| 100 initial holds, 95 paid, 5 failed, 95 unique orders | `../SALESTORM_CodeRed/11_AI_Assisted_Validation/simulation_results.json` |
| max_held_plus_sold = 100 (invariant held) | `../SALESTORM_CodeRed/11_AI_Assisted_Validation/simulation_results.json` |
| 30-second Order outage scenario | `../SALESTORM_CodeRed/11_AI_Assisted_Validation/simulation_results.json` |
| This is architecture-model evidence, NOT production load evidence | `../SALESTORM_CodeRed/11_AI_Assisted_Validation/validation_run.md` |
| Not proven: PostgreSQL performance, real network failover, provider contract, 500k RPS, broker durability | `../SALESTORM_CodeRed/11_AI_Assisted_Validation/simulation_results.json` |

## Trade-offs / ADRs

| Claim | Source |
|---|---|
| Guarded SQL decrement (ADR-001) | `../SALESTORM_CodeRed/10_ADR/ADR-001.md` |
| PostgreSQL, one fenced primary per shard (ADR-002) | `../SALESTORM_CodeRed/10_ADR/ADR-002.md` |
| Cache-aside catalogue, stock hints only (ADR-003) | `../SALESTORM_CodeRed/10_ADR/ADR-003.md` |
| Kafka at least once + local outbox/inbox (ADR-004) | `../SALESTORM_CodeRed/10_ADR/ADR-004.md` |
| Durable intent; pin pending stock; reconcile UNKNOWN (ADR-005) | `../SALESTORM_CodeRed/10_ADR/ADR-005.md` |
| Strong stock local ACID; eventual across domains (ADR-006) | `../SALESTORM_CodeRed/10_ADR/ADR-006.md` |
| Order only from ReservationCommitted (ADR-007) | `../SALESTORM_CodeRed/10_ADR/ADR-007.md` |
| Scoped request keys + immutable hash + durable identities (ADR-008) | `../SALESTORM_CodeRed/10_ADR/ADR-008.md` |
| Correctness preferred over availability when authority uncertain | `../SALESTORM_CodeRed/README.md` L11, `../SALESTORM_CodeRed/10_ADR/ADR-006.md` |
| Hot SKU serializes as known trade-off | `../SALESTORM_CodeRed/10_ADR/ADR-001.md` |
| 500k edge RPS is design/sizing scenario, NOT validated throughput | `../SALESTORM_CodeRed/01_Requirements/requirements_and_assumptions.md` R06, `../SALESTORM_CodeRed/README.md` L44 |

## Scaling

| Claim | Source |
|---|---|
| Stateless services scale horizontally | `../SALESTORM_CodeRed/02_HLD/service_catalog.md` (Gateway, Checkout are stateless replicas) |
| Inventory shards by inventory_id; hot SKU limited | `../SALESTORM_CodeRed/02_HLD/service_catalog.md` |
| 95% cacheable browse / 4% cart / 1% purchase at peak | `../SALESTORM_CodeRed/01_Requirements/requirements_and_assumptions.md` A08 |
