# System invariants and proof obligations
Let A=available_quantity, H=reserved_quantity, S=sold_quantity, N=allocated_quantity. For the fixed allocation N=100:

| ID | Invariant | Enforcement |
|---|---|---|
| INV-001 | A,H,S >= 0 and A+H+S=N | SQL checks + one inventory transaction |
| INV-002 | Sum(quantity of RESERVED or PAYMENT_PENDING)=H; sum(SOLD)=S; H+S<=100 | Reserve/release/commit protocol; reconciliation detects bypasses |
| INV-003 | One (customer,operation,key) maps to one request hash and stored response | SQL unique request key, conflict checked before mutation |
| INV-004 | At most one payment intent per reservation and one local application of each provider transaction | UNIQUE(reservation_id), UNIQUE(provider,provider_ref), inbox + state guards |
| INV-005 | Holds eventually reach SOLD or RELEASED if dependencies recover and workers fairly retry | Sweeper for RESERVED; provider reconciliation for PAYMENT_PENDING; conditional liveness |
| INV-006 | A committed payment success survives Order outage | Payment outbox -> Inventory inbox/outbox -> Order inbox/order/outbox |
| INV-007 | At most one order per reservation; confirmation requires SOLD evidence | UNIQUE(reservation_id); only ReservationCommitted creates confirmed order |
| INV-008 | No timeout or duplicate event can release or consume stock twice | Reservation row lock + permitted source state + atomic stock delta |
| INV-009 | Shipment cannot start for unpaid/uncommitted inventory | OrderConfirmed event only after INV-007 |

## Inductive stock proof
Base: (A,H,S)=(100,0,0). Reserve(q) requires q=1 and A>=q; atomically maps to (A-q,H+q,S). Release from eligible live state maps to (A+q,H-q,S). Commit from PAYMENT_PENDING maps to (A,H-q,S+q). Every transition preserves nonnegativity and the conserved sum. Duplicates take no transition. All changes for a SKU serialize on the same inventory row. Therefore H+S<=N and S<=100 at all times.
This proves current legitimate holds plus sales, NOT cumulative successful reservation responses over the lifetime of recycled stock. With 5 failed payments, five new customers can later reserve released units while the sale total still cannot exceed 100.

## One unit, two requests
Both issue a guarded UPDATE against the same row. One acquires the row lock and commits A=0. The waiting UPDATE rechecks A>=1 on the changed row and affects zero rows. It commits a stored OUT_OF_STOCK response. If the first transaction rolls back, the second can win. No fairness/first-click guarantee is claimed.

## Assumptions behind proof
All inventory writers follow the protocol; direct DML is denied to service roles. One fenced leader; no loss of acknowledged commits on automatic failover. No stock derived from caches. Database/check constraints cannot alone enforce aggregate reservation sums; scoped writers plus audit are essential. Provider exactly-once business effect is a dependency contract, not something a broker can guarantee.
