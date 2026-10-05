# Requirements traceability

| Requirement IDs | Primary artifacts | Validation evidence |
|---|---|---|
| R01-R02 | `02_HLD/hld_architecture.md`, `01_Requirements/system_invariants.md` | Invariant proof; HLD flow |
| R03 | `02_HLD/inventory_concurrency.md`, `03_LLD/order_reservation_state.puml` | Expiry and race tests |
| R04-R05 | `02_HLD/payment_order_recovery.mmd`, `03_LLD/payment_sequence.puml`, `03_LLD/order_sequence.puml` | Lost response, duplicate event and Order outage tests |
| R06 | `08_Scalability_Reliability/scalability_reliability.md` | Capacity arithmetic and explicit non-proof limits |
| R07 | `02_HLD/*.mmd`, `02_HLD/*.puml` | Rendered Mermaid/PlantUML views and visual review |
| R08 | `04_Database/schema.sql`, `04_Database/consistency_and_transactions.md` | DDL parse check and cross-artifact audit |
| R09-R10 | `03_LLD`, `06_SOLID`, `07_Design_Patterns` | PlantUML sources and named class mappings |
| R11 | `05_API/openapi.yaml`, `05_API/event_catalog.md` | OpenAPI validator and event contract review |
| R12 | `08_Scalability_Reliability`, `jury_defense.md` | Retry, breaker, DLQ and reconciliation cases |
| R13-R14 | `09_Security_Observability/security_observability.md` | Control and signal inventory |
| R15 | `02_HLD/architecture_options.md`, `10_ADR` | Six-way comparison and eight ADRs |
| R16 | `11_AI_Assisted_Validation/simulation_results.json`, `12_Presentation` | 12 passing state-model tests; limits labelled |
| R17-R18 | `AI_USAGE.md`, `README.md`, `12_Presentation` | Disclosure, index and pitch |

Status is `DESIGN_COMPLETE_WITH_VALIDATION_LIMITATIONS`: all mandatory design artifacts are present; live provider, production capacity, regional failover, and student ratification remain outside this workspace evidence.
