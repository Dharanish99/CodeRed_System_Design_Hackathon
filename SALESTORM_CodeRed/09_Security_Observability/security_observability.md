# Security and observability
OIDC access tokens validated for issuer/audience/signature/expiry at Gateway; service identity/mTLS internally. Customer identity comes from token, not body. Every reservation/checkout/payment/order read/write checks ownership. Operations requires role-based access, step-up auth, reason and audit; stock adjustments are separate restricted operations. Separate DB owner roles; services cannot update another schema. Deny raw table mutations for Inventory application role except approved procedures.
TLS externally/internally, encryption at rest/backups, managed key rotation. Hosted/tokenized provider payment UI; no PAN/CVV persisted/logged. Provider token is treated as sensitive, short-lived and scoped; access restricted. Webhook signature verification on raw bytes, timestamp tolerance, event-ID dedup and provider lookup for contradictory status. Never trust client success redirects or client price. Quote signature, expiry, customer, product and currency verified before persistence. Strict DTO limits, integer bounds, UUID parsing, SQL parameters, bounded idempotency keys, hash of canonical request. Rate-limit per account/IP/device/sale; bot challenge and fairness policy at admission. Network policy denies public DB/broker access and limits provider egress. Secret manager, no secrets in config files.
PII minimized: customer contact in identity domain, fulfilment address snapshot restricted/encrypted; order references elsewhere. Retention/legal policy needs business approval; no invented compliance certification. Audit append-only actor/action/reason/correlation; immutable archival and access monitoring. Protect logs/traces from tokens/addresses/card data. Backup restoration and dependency security scanning are release gates.

| Signal | Dashboard / initial alert |
|---|---|
| Request rate/p95/p99/5xx/429 per route | Track edge and admitted origin separately; reserve p95>300ms 5m |
| Reservation success/out-of-stock/replay/expiry | Conversion funnel; expiry lag>5s 2m |
| Inventory lock wait/pool wait | p95 lock wait>100ms; pool utilization>80% |
| A+H+S != N or aggregate mismatch | Page immediately; freeze affected sale and reconcile |
| Payment success/decline/UNKNOWN | Transport failures >5% 5m; unresolved >15m page |
| Paid/SOLD without order | Age>60s after healthy service; page >5m |
| Outbox age, broker lag, DLQ size | Outbox>10s, lag>30s, any new DLQ record alert |
| Refund/reconciliation failures | >3 attempts or provider contradiction page |
| Order conversion and duplicate rejection | Compare paid->SOLD->CONFIRMED funnel, never count replays as new sales |

Structured logs: timestamp, service, severity, trace_id, correlation_id, customer pseudonym, reservation_id, checkout_id, payment_id, order_id, event_id, aggregate_version, transition, reason, duration. Do not use IDs as metric labels (high cardinality).
Traceparent propagates Gateway -> Checkout/Inventory -> Payment, is stored in outbox event, then linked by Kafka consumers -> Inventory -> Order. Async consumers create spans with links to originating trace; provider reference permits reconciliation even if trace sampling dropped. Sample all failure traces; routine success sampling is configurable. Business audit is unsampled and durable separately from telemetry.
Runbooks: stock inconsistency freezes SKU; unknown charge queries provider before any retry; DLQ triage repairs cause and replays same event; stale pending Order compares ReservationCommitted source; database failover verifies fencing and durable LSN before reopening.
