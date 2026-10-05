# Stress scenarios

These are design walkthroughs; executable subset evidence is recorded separately.

| Case | What happens | Corruption prevention | Customer sees | Recovery | Detection |
|---|---|---|---|---|---|
| 1. Successful purchase | Reserve -> checkout -> success -> SOLD -> order CONFIRMED | Guarded stock + unique intent/order | Processing then confirmed | Outbox relay + consumers | Trace and conversion lag |
| 2. Payment fails | Provider terminal decline emits PaymentFailed; H--/A++ | Only PAYMENT_PENDING can release for this matching intent | Payment failed; choose a new purchase after release | Inbox retries once logically | Decline rate; released quantities |
| 3. Duplicate Buy | Same key/hash returns stored response; changed hash409 | Request unique key; active-purchase unique constraint | Same reservation, no second hold | Resolve lost response via same key | Replay/conflict counters |
| 4. Payment succeeds; Order down30s | Payment outbox -> SOLD -> ReservationCommitted waits | No Order dependency in payment commit; unique reservation order | Payment received, order processing | Restart consumes backlog; source reconciliation repairs missing order | Oldest paid-without-order age |
| 5. Inventory zero | Guarded UPDATE affects0; stored409 | A>=1 predicate and CHECK | Out of stock | Release invalidates sold-out hint; new action can retry | Out-of-stock/admission metrics |
| 6. Traffic50x | CDN + scale stateless replicas; bound admitted writes | No bypass of stock authority | Cached browsing;429/503 on excess | Prewarm; scale shards for independent SKUs | Pool wait/lock time/cache hit/edge reject |
| 7. Inventory DB unavailable | Reject new holds; cannot resolve unknown commits yet | No cache fallback authority; fenced failover | Temporarily unavailable or status pending | Retry same key after recovery; audit quantities | DB quorum/failover/unknown commits |
| 8. Payment gateway unavailable | Breaker opens; persisted pending/UNKNOWN retains H | No fresh key/provider on uncertainty | Payment processing; do not pay again | Lookup/reconcile provider, terminal cancel then release | Transport timeout/breaker/unresolved age |
| 9. Consumer crash before ACK | If DB committed, replay sees inbox; otherwise rollback | Inbox + effect + outbox atomic | No duplicate visible order | At-least-once redelivery | Duplicate count and lag |
| 10. Duplicate PaymentSucceeded | Same event inbox dedup; new event ID still terminal-state no-op | State guard + unique provider ref/payment ID | One charge/order | Ignore duplicate after validating original details | Conflicting terminal event alert |
| 11. Expiry races payment start | Same hold lock: expiry wins or Checkout pins before TTL | TTL never releases PAYMENT_PENDING | Expired OR payment processing | Resolve pending with provider; manual escalation if prolonged | Sweeper lag and pending age |
| 12. Stale stock cache | Hint says available; DB guarded update says zero | Cache cannot reserve | Out of stock on Buy | Invalidate by version/short TTL | Cache-positive/DB-zero ratio |
