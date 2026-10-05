# Architecture options, compared before selection
Scores are qualitative reasoning, not benchmarks. Correctness assumes each option is properly implemented.

| Option | Correctness/durability | Hot SKU, latency, contention | Horizontal scale | Complexity/operations/cost/effort | Recovery / explainability |
|---|---|---|---|---|---|
| A Conditional SQL UPDATE | Strong atomic decrement + ACID row | Short lock, single-row ceiling; bounded waiting | Across SKUs/shards, not one row | Low, SQL primary/HA still costs | WAL recovery; easiest explicit proof |
| B Optimistic version CAS | Strong if every conflict retries whole transaction | Retry storm on 10k contenders; variable latency | Good on independent keys | Moderate; retry budget tuning | Safe retries with same key; less predictable hot-key tail |
| C SELECT FOR UPDATE | Strong ACID | Lock held across application roundtrips; deadlock risk | Across keys; no hot-row gain | Low-medium; lock diagnostics | Simple but never call provider under lock |
| D Redis Lua authority | Atomic within one Redis primary | Low per-operation latency; still hot shard | Across keys, not unbounded same key | High with durable ledger/replication/fencing | Async failover may lose acknowledged reservations; SQL reconciliation complex |
| E Partitioned queue writer | Serial key processing; requires durable producer/consumer state | Buffer surge; potentially long wait and stale admission | Across partitions; one SKU stays serial | Medium-high, status APIs and lag operations | Replay/inbox; rebalance fencing needed |
| F Admission + SQL + outbox | SQL proof with bounded incoming work | Reject/backpressure before lock saturation | Stateless edge/services; shard by inventory owner | Moderate; three understandable mechanisms | Selected: safe DB transaction plus recoverable async effects |

Decision: F using A for reserve and C for reservation state transitions. Version is an audit/event ordering counter, not our reserve CAS. No Redis distributed lock: leases introduce expiry/fencing complexity without strengthening DB correctness. Queueing every Buy is rejected for initial design: accepted queue position is not a stock reservation and adds user waiting/state. A bounded admission waiting room is acceptable as explicit UX, not an unbounded broker backlog.

| Other choice | Selected | Rejected / sacrifice |
|---|---|---|
| SQL vs NoSQL | PostgreSQL per ownership boundary | Conditional NoSQL could work, but cross-record idempotency/hold/outbox complicates review; SQL hot-write ceiling accepted |
| Sync vs async | Synchronous reserve, async payment finalization/order/fulfilment | Async reservation would need 202 polling; sync Order couples sale to downtime |
| Direct vs events | Direct reads/reserve; durable events for recovery | Neither every call through broker nor long synchronous purchase chain |
| Orchestration vs choreography | Small Checkout facade; event-driven recovery with explicit owners | Fully centralized saga engine unnecessary at this scope; loose choreography needs catalog and reconciliation |
| Local transaction vs global | Local ACID + saga compensation | No cross-service 2PC; temporary pending views accepted |
| Cache | Cache-aside catalogue + versioned invalidation, availability hints only | No stock authorization from Redis/CDN |
| Single writer vs distributed | Fenced primary per inventory shard | Active-active inventory rejected; availability sacrificed during split |

Cost rationale: independent service boundaries are logical; low-load deployment can combine Catalogue+Sale and Fulfilment+Notification workers while keeping table ownership. Do not introduce service mesh/search engine/distributed lock manager merely to fill a diagram.
