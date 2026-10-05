# Consistency and transaction protocol
PostgreSQL READ COMMITTED is sufficient for a guarded mutation of one predetermined inventory row, combined with unique keys and explicit reservation row locks. It is not a claim that arbitrary multi-row business queries are serializable. PostgreSQL documents rechecking UPDATE predicates after concurrent writers: https://www.postgresql.org/docs/current/transaction-iso.html .

| Transaction | Atomic contents | Locks / recovery |
|---|---|---|
| Reserve | Claim request key, hash check, guarded A--/H++, hold, audit, outbox, stored response | New request key before stock; rollback all on conflict |
| Begin checkout | Lock hold; RESERVED + DB-time TTL guard; mark PAYMENT_PENDING, assign intent/token, checkout snapshot, CheckoutStarted outbox | Existing hold lock; no provider I/O |
| Expire / release | Lock hold; permitted source state; H--/A++, RELEASED + reason + audit + outbox | Reservation then inventory; expiration only RESERVED |
| Apply payment success | Inbox insert, lock hold, match payment intent/amount/currency, PAYMENT_PENDING->SOLD, H--/S++, audit and ReservationCommitted outbox | Reservation then inventory; duplicate terminal transition no-op |
| Payment outcome | Lock payment intent, validate monotonic provider outcome, outcome/ref + PaymentSucceeded/Failed outbox | Never hold lock during provider call |
| Create order | Inbox + UNIQUE reservation insert + line snapshot + lifecycle audit + OrderConfirmed outbox | Commit before ACK; conflict must match original immutable snapshot |

Lock order: new request key -> inventory on reserve (no existing reservation lock); existing-state transitions -> reservation -> inventory. No operation locks inventory then waits on an existing reservation. Multi-item locking would require sorted inventory IDs and a separate design. All commands have bounded lock/statement timeout, rollback and stable-key retries.

Outbox relay leases rows, publishes, waits for broker ack, then marks published. Crash before mark can duplicate; consumers accept this. Inbox unique (consumer,event_id) and business key both required: same effect may arrive with different event IDs. Publish per aggregate in version order or have consumers defer gaps and reconcile; no cross-topic global ordering assumption.
Each domain's inbox/outbox templates are instantiated locally; no global transaction across databases. Cross-domain IDs are references, not FK constraints. Only within-owner FKs are enforced. SQL is a design schema and reservation proof fragment; it is not the entire implementation.
