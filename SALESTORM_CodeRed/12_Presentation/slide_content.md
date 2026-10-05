# Slide content

## 1. SALESTORM
- Reserve without overselling
- Pay without duplicate charges
- Recover without losing orders

## 2. Guarantees and design targets
- Guarantee: available + held + sold = allocated
- Guarantee: one logical action, one business effect
- Target: 10k normal / 500k peak edge requests per second
- Assumptions: one unit per Buy; one active region; provider intent lookup

## 3. Architecture and ownership
- Edge: CDN, WAF, load balancing, authenticated admission
- Sync: Catalogue / Cart -> Checkout -> Inventory + Payment
- Async: Payment success -> stock SOLD -> Order -> Fulfilment
- Each owner: PostgreSQL + outbox/inbox; Redis is advisory

## 4. 10,000 customers versus 100 units
- Claim scoped idempotency key and check request hash
- UPDATE stock ... WHERE available >= 1
- Commit stock delta + hold + outbox + original response
- At most100 live holds before releases; expired holds may be reused

## 5. Payment success, then Order failure
- Payment success + outbox commit
- Inventory consumes -> SOLD + ReservationCommitted
- Order down30s: retain the event; show processing
- Restart -> inbox + unique order + outbox -> ACK

## 6. LLD, SOLID and extension points
- ReservationService -> InventoryRepository + UnitOfWork
- PaymentService -> PaymentGateway + ReconciliationWorker
- OrderService -> OrderRepository + StatePolicy
- Adapters add providers; strategies add pricing; inbox/outbox isolate effects

## 7. Scale, evidence and the accepted trade-off
- 12 / 12 state-model tests passed
- 10,000 customers +200 retries ->95 sold,5 released,95 orders
- Hot-product limit: inventory row lock + durable commit
- 500k edge RPS is a sizing scenario; PostgreSQL / provider / HA need live validation