# High-level architecture
Clients reach CDN/WAF, load balancer and API Gateway. Authentication, per-customer/IP limits and per-sale admission run before expensive database work. Catalogue owns Product/Category/Sale/Deal/Coupon; Cart owns user intent. Checkout coordinates a signed, immutable price quote and Inventory reservation. Inventory owns authoritative quantities, reservations and checkout intent. Payment owns provider intents and charge reconciliation. Order is a durable downstream projection with business transitions. Fulfilment owns shipment/carrier integration; Notification consumes order/shipment events.

PostgreSQL ownership domains use separate logical databases or schemas and roles; no cross-service direct writes or foreign keys. They can share managed infrastructure initially. Redis caches catalogue and admission counters, never authorizes inventory. Kafka is at-least-once transport with partition keys, consumer groups, retry handling and DLQ. Each publisher writes a transactional outbox in its own database. Each consumer commits inbox + business mutation + derived outbox together before acknowledging.

## Critical boundaries
1. INVENTORY CONSISTENCY: request dedup + guarded stock delta + reservation + outbox in one local transaction.
2. PAYMENT IDEMPOTENCY: one reservation -> one durable provider intent/key; repeated HTTP/webhook/polling converge on this intent.
3. ORDER RECOVERY: ReservationCommitted carries paid/sold evidence; inbox + unique order + audit + outbox commit locally.

## Complete purchase
Browse cached catalogue -> add Cart -> quote -> POST /reservations -> POST /checkouts (locks reservation, verifies unexpired, creates immutable checkout intent, marks PAYMENT_PENDING) -> POST /payments (Payment validates intent from Inventory before any provider call). Payment work occurs outside DB locks. PaymentSucceeded -> Inventory converts H to S and emits ReservationCommitted -> Order records CREATED, PAYMENT_PENDING, CONFIRMED audit entries in one commit -> OrderConfirmed -> fulfilment/carrier + notifications -> tracking events update Order status.
Payment failure confirmed terminal -> PaymentFailed -> Inventory RELEASED. Timeout -> UNKNOWN at Payment, PAYMENT_PENDING still held at Inventory; reconciliation resolves. After payment starts, client cancellation requests provider cancellation, never directly frees stock.
Order is created after payment/stock commitment in this design; pre-payment customer status is Checkout, not a fake pending order. Conceptual pre-confirmation order states are audited during creation. This implements the brief's pipeline while preserving its lifecycle vocabulary.
