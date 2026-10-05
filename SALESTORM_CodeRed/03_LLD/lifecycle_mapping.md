# Business lifecycle to durable implementation mapping

| Business lifecycle | Owner and durable representation | Trigger and atomicity |
|---|---|---|
| `AVAILABLE` | Inventory counters; no Reservation row exists | `available_quantity` is authoritative in PostgreSQL. |
| `RESERVED` | Inventory Reservation status `RESERVED` | Guarded quantity move, reservation row, audit, idempotency result and `InventoryReserved` outbox event commit together. |
| `PAYMENT_PENDING` | Inventory Reservation status `PAYMENT_PENDING` plus durable checkout intent | Checkout wins the same reservation lock before TTL. The hold remains while payment is unknown. |
| `CONFIRMED` | Business milestone established by definitive `PaymentSucceeded` | Payment's durable outcome is delivered to Inventory. It is not a separately queryable Inventory reservation status. |
| `SOLD` | Inventory Reservation status `SOLD`; inventory counters and `ReservationCommitted` event | Inventory processes definitive success in one local transaction: inbox deduplication, guarded stock move, audit and outbox commit. This is the durable accounting of the confirmed business purchase. |
| `RELEASED` | Inventory Reservation status `RELEASED` with reason | Only expiry while `RESERVED`, definitive payment failure, or confirmed cancellation returns a held unit. |

`CONFIRMED → SOLD` is intentionally not an external distributed two-phase transaction. The explicit business mapping makes the lifecycle legible while the implementation keeps one authoritative commit boundary. A client observing an uncertain payment sees `PAYMENT_PENDING`, never a fabricated failure or a released unit that might later be charged.
