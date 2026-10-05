# Event catalog

All events use envelope {event_id:UUID,event_type:string,schema_version:1,aggregate_id:UUID,aggregate_version:int,occurred_at:UTC,correlation_id:UUID,traceparent:string,data:object}. IDs are globally unique, data fields below required unless provider_ref is not yet known. Monetary values are integer minor units; quote/item_snapshot immutable. No raw PII/card tokens in broker payload; shipping_reference resolves in restricted owner service.

| Event | Producer/owner | Consumer | data fields | Partition key | Effect |
|---|---|---|---|---|---|
| InventoryReserved | Inventory | Telemetry / cache projector | reservation_id, inventory_id, customer_id, quantity, expires_at | reservation_id | Hold exists; not a sale |
| CheckoutStarted | Inventory | Payment intent worker | checkout_id, reservation_id, customer_id, amount_minor, currency, quote | reservation_id | Durable payment permission; ensure intent, never invent method |
| PaymentSucceeded | Payment | Inventory | payment_id, checkout_id, reservation_id, provider, provider_ref, amount_minor, currency | reservation_id | Establishes business CONFIRMED; Inventory atomically records durable SOLD (H->S) |
| PaymentFailed | Payment | Inventory | payment_id, checkout_id, reservation_id, reason, provider_ref | reservation_id | Only definitive non-chargeable terminal failure releases |
| ReservationReleased | Inventory | Cache projector / status projection | reservation_id, inventory_id, quantity, reason | reservation_id | Terminal hold release; reason EXPIRED/PAYMENT_FAILED/CANCELLED |
| ReservationCommitted | Inventory | Order | reservation_id, customer_id, payment_id, inventory_id, quantity, quote, committed_at | reservation_id | Durable SOLD and paid evidence; create one confirmed order |
| OrderConfirmed | Order | Fulfilment / Notification | order_id, reservation_id, customer_id, item_snapshot, shipping_reference | order_id | Create shipment and notify |
| ShipmentUpdated | Fulfilment | Order / Notification | order_id, shipment_id, carrier_reference, status, source_version | order_id | Monotonic processing/shipment/delivery transitions |
| OrderCancelled | Order | Payment / Fulfilment / Notification | order_id, payment_id, reason, refund_required | order_id | Durable unique refund; stop not-yet-shipped fulfilment |
| PaymentRefunded | Payment | Order | order_id, payment_id, refund_reference, amount_minor | order_id | REFUND_PENDING->REFUNDED |

Delivery: at least once for every event; producer-local transactional outbox. Relay must not skip unpublished lower aggregate versions when publishing later ones. Broker ordering is per partition, not across topics. Consumers enforce lifecycle/preconditions and defer missing prerequisites; a version gap triggers source lookup/replay, not discard. Inventory and Payment versions are separate streams and never compared as if global.

Lifecycle mapping: `PaymentSucceeded` establishes the business `CONFIRMED` milestone. Inventory then performs its one local durable transaction—deduplicate the event, guard the reservation, move held stock to sold, audit and enqueue `ReservationCommitted`—which records `SOLD`. There is no externally queryable intermediate Inventory `CONFIRMED` status. `UNKNOWN` is not `PaymentFailed`; it keeps `PAYMENT_PENDING` and triggers reconciliation against the same provider intent.
Dedup: local inbox(consumer,event_id) inside effect transaction; reservation/payment/order business keys catch semantically repeated events with new IDs. Consumer commits before ACK. Malformed or permanently invalid events go to DLQ after bounded retries; transient service outage pauses consumption instead of burning retries. DLQ retains original envelope, reason, attempts and first failure; authorized repair/replay preserves event_id. Reconciliation compares source terminal records against downstream effects, including recovery beyond broker retention.
Retries/backoff: 1/2/4/8/16 seconds then capped60 with full jitter, at most10 poison attempts; alert immediately on DLQ, never silently drop. Upcasters handle compatible version additions; breaking changes require new schema version and consumer rollout.
Cancellation: Order can cancel CONFIRMED before processing lock wins. Once PROCESSING, request fulfillment stop and cancel only after confirmed stop. Shipped orders reject this cancellation flow. Event reordering is guarded by terminal cancellation and shipment source version; no late shipment event can revive CANCELLED. Returned stock is a separate workflow.
