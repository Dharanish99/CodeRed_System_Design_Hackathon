# Hostile jury defense

## Where exactly is overselling prevented?
The guarded inventory-row UPDATE inside a transaction with hold/idempotency/outbox. A cache, gateway or broker is not the stock authority.

## What if all10k reach Inventory?
A bounded service semaphore/pool sheds excess before DB saturation. Admitted writers serialize at the same row; rejected requests do not reserve.

## Why not Redis locks?
SQL already serializes the authoritative mutation. A lease can expire while a stale holder still runs; fencing/durable reconciliation would add complexity.

## Why not queue every Buy?
Queue admission is not stock ownership. We choose synchronous reserve with bounded admission and honest429 responses; a fair waiting room is a future UX decision.

## Can users get a second hold with a new key?
The partial unique active purchase(customer,sale) constraint closes that gap for A02. Hash mismatch also rejects same-key payload changes.

## Can payment be charged twice?
One local intent per reservation, stable provider key and lookup prevent our reissue. This depends on provider idempotency/finality contracts; never route UNKNOWN to another provider.

## What if expiry races charge completion?
Only RESERVED expires. Begin-checkout wins the same hold lock before TTL and pins PAYMENT_PENDING. A payment already in flight retains stock until definitive resolution.

## Payment success but event publishing fails?
Payment success and outbox insert commit together. Relay retries; duplicate delivery is safe. If local commit was lost after gateway success, reconciliation recovers from provider intent.

## Order is down30 seconds?
Inventory can mark SOLD and keep ReservationCommitted in outbox/broker. Order restarts, commits inbox+unique order+audit+outbox, then ACKs.

## Do sold units need to equal confirmed orders during outage?
No. SOLD means irrevocably allocated to paid purchase. Confirmed-order projection catches up; paid/SOLD-without-order age is monitored.

## Why show CONFIRMED before SOLD in the lifecycle?
CONFIRMED is the business milestone created by definitive payment success. Inventory then records the authoritative durable SOLD accounting in the same local event-processing flow: inbox, guarded counter mutation, audit and outbox commit. We do not expose a separate durable reservation CONFIRMED state because a reader could see it without the stock commitment. The mapping is explicit in the state diagram and lifecycle document.

## What if PostgreSQL fails over and loses a winner?
Automatic promotion requires durable synchronous replica and fencing. If acknowledged commits might be lost, stop the sale and reconcile before reopening.

## Can historical reservation successes exceed100?
Yes, if unpaid holds release and new holds reuse units. The correct invariant is live held plus sold <=100, and cumulative sold<=100 without stock adjustments.

## Does500k RPS mean500k SQL writes?
No. That is edge demand. Capacity arithmetic states cache mix; all-write demand is throttled. A hot-row commit is the principal bottleneck.

## Where is liveness not guaranteed?
An indefinitely unavailable gateway or DB prevents guaranteed bounded completion. Pending stock is retained, alerted and manually reconciled; safety is preferred.

## Could a duplicate event with a new ID create another order?
Business uniqueness on reservation_id and terminal-state guards protect beyond inbox event dedup.

## Why separate Payment and Order?
Provider uncertainty and financial reconciliation survive Order outages; unique order creation has a separate transaction and can catch up.

## What trade-off was accepted?
Reduced sale availability during partitions and UNKNOWN payment holds, plus eventual customer order views, in exchange for a clear correctness boundary.

## How can a team member prove they understand this?
Explain a last-unit race, expiry race and lost provider response without reading the diagram. Actual human understanding remains a team rehearsal gate.

## Weaknesses found and revisions
Initial timeout-release idea rejected: introduced pinned PAYMENT_PENDING. Direct PaymentSucceeded->Order rejected: inserted Inventory commitment evidence. Cumulative reservation<=100 wording corrected to live-held+sold. Added active-purchase uniqueness against new-key retries. Fenced failover and provider-key retention made explicit. Pitch arithmetic rechecked: the source schedule is exactly five minutes.
