# Jury cheatsheet
One sentence: bounded admission + atomic PostgreSQL reservation + one provider intent + outbox/inbox recovery.

- Stock proof: A+H+S=N; reserve A--/H++; release H--/A++; commit H--/S++.
- Last item: guarded UPDATE rechecks predicate after waiting for concurrent commit.
- Duplicate Buy: scoped unique key + hash; new-key abuse: unique active customer/sale.
- Duplicate charge: one intent per reservation, stable provider key, durable reference lookup.
- Timeout: UNKNOWN != FAILED. Retain PAYMENT_PENDING stock.
- Expiry: DB clock + same hold lock; only RESERVED expires.
- Order down30s: retain ReservationCommitted; replay -> unique order -> commit -> ACK.
- Delivery: at least once; inbox and effect share a local transaction; business key catches new event IDs.
- Scale:500k is edge demand; hot row/WAL commit is limit. Cache browse, bound writes, shard independent SKUs.
- Evidence:12 model tests;95 sold/5 released/95 orders. No live PostgreSQL/provider/failover capacity proof.
- Policy: AI-assisted proposed design; students must own final decisions and explanation.
