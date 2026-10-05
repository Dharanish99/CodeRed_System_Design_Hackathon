# Payment Sequence

Payment sequence. BeginCheckout and expiry serialize on the hold lock. Persist intent before contacting provider. Lookup/webhook repair lost provider responses. PaymentSucceeded reaches Inventory first; Order does not consume it to confirm an order.

See matching .puml source; all asynchronous arrows use the at-least-once event contracts in 05_API/event_catalog.md.
