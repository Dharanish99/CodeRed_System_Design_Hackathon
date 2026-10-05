# Service catalog

| Component | Responsibility | State / persistence | Scaling | Communication | Failure behaviour | Consistency |
|---|---|---|---|---|---|---|
| Gateway / edge | Auth, abuse, admission, routing | Stateless replicas; Redis limits; CDN caches | Scale by requests; bounded sale budgets | HTTPS sync | 429/503; cached browsing | No inventory authority |
| Catalogue + Sale | Product, promotions, signed quotes | PostgreSQL catalogue; Redis/CDN | Read replicas, cache; shard product reads | Sync reads/quote; cache invalidations | Browse stale within TTL; quote fail closed | Price snapshot authoritative on reserve |
| Cart | Customer selections | PostgreSQL cart | Customer-key partitions | Sync API | Cart unavailable does not corrupt Buy | Optimistic cart version |
| Checkout | Facade for quote, reserve, payment start | Durable intent stored by Inventory | Stateless replicas | Sync commands; CheckoutStarted recovery | Status polling; replay start | Intent/hold atomic |
| Inventory / Reservation | Only stock writer, holds, expiry | PostgreSQL inventory + inbox/outbox | Shard by inventory_id; hot SKU limited | Sync reserve; async payment outcomes | Fail closed; recover WAL; sweeper | Strong per SKU |
| Payment | Provider adapter, intent, reconcile/refund | PostgreSQL payment + inbox/outbox | By reservation; bounded provider concurrency | HTTPS provider; async outcomes | UNKNOWN retained; breaker; lookup | Unique intent and provider reference |
| Order | Unique order and lifecycle | PostgreSQL orders + inbox/outbox | Reservation/order partitions | Async commit input; sync reads | Replay backlog; unique order | Local ACID; eventual across domains |
| Fulfilment / Shipment | Pick/pack, carrier and tracking | PostgreSQL shipment + inbox/outbox | Order partitions; carrier quotas | Events; carrier HTTPS | Retry idempotent shipment key | One shipment key per order |
| Notification | Send communication | PostgreSQL notification + inbox | Independent workers | Events; provider API | Retry/DLQ; do not block order | Dedup by business event/channel |
| Kafka + relay | Durable decoupling | Replicated logs; local outboxes | Partitions; disk/lag/consumer limits | At least once | Pause consumers; retain outbox; DLQ | Per-key transport ordering only |
| Observability | Metrics, logs, tracing, audit search | Telemetry store; immutable audit archive | Sampling + retention tiers | Out-of-band export | Telemetry buffering; no business dependency | No secrets or payment credentials |
