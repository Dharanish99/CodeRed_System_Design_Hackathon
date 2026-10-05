# Recorded validation run — CodeRed

Executed from `11_AI_Assisted_Validation` with the bundled workspace Python runtime:

```text
python simulate.py
Ran 12 tests in 20.306s
OK
```

The 12 passing model checks cover: the 10,000-customer/100-unit practical scenario with duplicate attempts, last-unit race, same-key mismatch, active-purchase uniqueness, expiry, checkout-versus-expiry interleavings, provider timeout reconciliation, duplicate events, lost consumer acknowledgement, database rollback/unavailability, cache non-authority, failed-payment recycling and randomized duplicate/expiry schedules.

Additional final-package checks:

```text
OpenAPI: valid OpenAPI 3.1.0
SQL parser: schema.sql 47 statements; reservation_transaction.sql 1 statement
Presentation: PPTX opened successfully in PowerPoint automation with 16 slides; matching PDF has 16 pages and contains `CONFIRMED → SOLD`
PlantUML: revised lifecycle and simplified jury class diagrams generated as PNG and SVG
SVG XML: 23 local SVG files parsed successfully
```

This is a deterministic architecture-model and artifact-validation run. It is not evidence of live PostgreSQL locking behavior, payment-provider semantics, Kafka durability, high availability, real charge handling, or production throughput.
