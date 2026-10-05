# AI-assisted validation evidence

Run `simulate.py` with the bundled Python runtime. It models a serialized authoritative inventory transaction, idempotency records, reservation expiry, payment uncertainty, event redelivery, Order outage and business-key uniqueness.

The model passed 12 tests. It is intentionally small and does not implement the SALESTORM application. Its global lock stands in for the per-SKU database serialization boundary. The result therefore supports the state-transition and invariant argument only.

Not demonstrated: PostgreSQL query plans or throughput, real HTTP/process failures, Kafka replication and rebalance behaviour, a payment-provider contract, database failover fencing, 500,000 RPS, or completion during a permanent dependency outage. See `simulation_results.json` and `AI_USAGE.md`.
