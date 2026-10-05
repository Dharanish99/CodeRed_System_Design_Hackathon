# Scalability and reliability
## Capacity arithmetic (assumptions, not benchmark results)
Baseline 10,000 edge RPS; peak 500,000=edge 50x. Under A08: 475,000 browse RPS; at 99% hit, 4,750 browse origin RPS. Other origin work=20,000 cart/status + 5,000 purchase RPS. Total origin ~29,750 RPS before retries. A 95% rather than 99% browse cache hit raises total to 48,750. If ALL 500k are purchase writes, the mix assumption fails: admit a bounded measured subset, respond 429/503 or explicit waiting-room status. Never claim 500k hot-row writes/s.
At an assumed measured 1,000 safe RPS/instance and 60% utilization, origin frontend needs ceil(29,750/600)=50 instances; 48,750 needs 82. These are planning examples pending benchmark. At 5k admitted purchase/s and 0.2s latency, Little's law gives 1,000 in-flight purchase requests, NOT 1,000 DB connections. Keep DB pools bounded (initial example 200 writer connections per shard shared across replicas, 20 operational reserve); use local concurrency semaphores and admission, not one full pool per autoscaled pod.

## Principal bottleneck
For one hot product the inventory-row lock and transaction/WAL commit is the single biggest bottleneck. If critical section duration is c seconds, serialized throughput ceiling is roughly 1/c (2ms example ->500/s, not measured). Adding Inventory pods does not remove it. Cap admission below experimentally measured saturation; store only 100 winning holds, cache sold-out hints briefly to reduce retries, and permit controlled rechecks when units release. Different SKUs can shard by inventory_id. A future escrow-bucket design partitions a fixed 100-unit allocation with fenced allocation transfers; it is an ADR revisit, not silently part of this proof.
Bound pending admission to 2s and reject beyond it. No promise of fair first-click order. Client exponential backoff and jitter prevents retry amplification. Cache stock is explicitly advisory, so stale-positive hints still reach the guarded DB update.

## Broker and scaling limits
Partition payment/order events by reservation_id, order lifecycle by order_id. A single partition only handles its serial key; more partitions improve independent purchases. Consumers scale up to partition count. Model events: 5k purchases/s x assumed 6 events x 1KB =30MB/s before replication and protocol; three replicas roughly90MB/s internal storage replication workload. Seven days at continuous peak is ~18TB raw (~54TB replicated), so retention/cost sizing must use realistic duty cycle. Alert on disk runway, oldest outbox, consumer lag and rebalance time. No business data is discarded to clear lag.

## Reliability policies (initial tunable targets)
| Dependency | Deadline / retry | Circuit or degradation |
|---|---|---|
| Inventory DB | lock 100ms, statement 250ms; at most 2 same-key whole-transaction retries | Fail closed 503; resolve unknown commit by key |
| Internal HTTP | 500ms budget, at most 1 retry on idempotent command | Bulkhead per dependency; return pending if outcome unknown |
| Gateway | connect 1s/response 3s; retry only same provider intent and only within provider key guarantee | 5 consecutive transport failures opens 30s, one half-open probe; do not retry declines |
| Broker consumer | 1,2,4,8,16s backoff + full jitter; up to 10 attempts, capped60s | Persistent outage pause partition; poison event DLQ with alert |
| Provider reconciliation | 5,15,30,60s then capped 60s with jitter | >15m unresolved triggers operator; retain hold |
| Outbox relay | 1s scan, capped30s retry, no silent discard | DB outbox retains events during broker outage |

Gateway timeout can be a succeeded charge. Persist UNKNOWN, poll provider reference/stable key; webhook and polling share idempotent transition. Never initiate a new provider or key while unknown. If provider keys expire (Stripe documents keys may be pruned after >=24h), lookup original intent; do not blindly recreate charge: https://docs.stripe.com/api/idempotent_requests .
Order outage30s: payment durable event remains; Inventory marks SOLD; Order backlog catches up after restart. Refund only for confirmed permanent inability to fulfil or authorized cancellation, using durable unique refund key. Order-down alone is not a refund trigger. A paid cancellation does not automatically recycle flash-sale allocation; returned stock follows separate adjustment approval.
DB outage: healthy cache browse allowed; writes stop. Broker outage: reserve/payment outboxes accumulate; throttle based on backlog age/capacity. Regional restore: freeze affected sales, compare provider ledger, rebuild terminal identities before any new charge or stock admission. Safety survives by refusing writes; availability and bounded liveness are not unconditional.
Kafka transactional semantics do not atomically cover our PostgreSQL effects; hence local inbox and outbox are required: https://kafka.apache.org/34/design/design/ .
