# SALESTORM — CodeRed

Design-first final submission for the SYSCRAFTERS 2026 limited-stock flash-sale challenge.

## Problem

Ten thousand customers may try to buy 100 units at once. The system must preserve stock correctness through duplicate requests, payment uncertainty, retries, delayed events and a temporarily unavailable Order service.

## Core Architecture

PostgreSQL Inventory is the only stock authority. A guarded inventory update, reservation record, audit entry, idempotency result and transactional-outbox event commit together. Redis is advisory; Kafka delivery is at least once and consumers use an inbox plus business uniqueness. Payment retains one durable provider intent for a reservation and reconciles `UNKNOWN` instead of creating another charge. Order materializes from committed `SOLD` evidence.

## Critical Guarantee

For a fixed allocation of 100 units, live held units plus sold units never exceeds 100, provided every Inventory writer uses the guarded PostgreSQL transaction and the stated fencing/provider assumptions hold. See the [invariant proof](01_Requirements/system_invariants.md) and [concurrency walkthrough](02_HLD/inventory_concurrency.md).

The jury lifecycle is explicit: `AVAILABLE → RESERVED → PAYMENT_PENDING → CONFIRMED → SOLD`. `CONFIRMED` is the business confirmation from definitive payment success; the subsequent durable Inventory accounting is `SOLD` in the same local processing flow, with no externally observable half-committed window. Failed or timed-out payment paths release stock only after a definitive non-chargeable outcome. See the [lifecycle mapping](03_LLD/lifecycle_mapping.md).

## Submission Contents

| Folder | Review focus |
|---|---|
| `01_Requirements` | Requirement register, assumptions, invariants and traceability |
| `02_HLD` | Architecture, service boundaries, deployment and concurrency |
| `03_LLD` | Classes, sequences, lifecycle and local rendered diagrams |
| `04_Database` | PostgreSQL schema, ERD, indexes and transaction protocol |
| `05_API` | OpenAPI contract, events and idempotency rules |
| `06_SOLID`–`10_ADR` | Applied design principles, patterns, reliability, security and decisions |
| `11_AI_Assisted_Validation` | Simulator and recorded validation evidence |
| `12_Presentation` | Final PowerPoint, matching PDF, speaker material and jury view |

## How to Review

1. Read [requirements and assumptions](01_Requirements/requirements_and_assumptions.md), then the [invariant proof](01_Requirements/system_invariants.md).
2. Review the [HLD](02_HLD/hld_architecture.md), [database transaction protocol](04_Database/consistency_and_transactions.md) and [API/event contract](05_API/event_catalog.md).
3. Trace the [reservation state model](03_LLD/order_reservation_state.md), [payment sequence](03_LLD/payment_sequence.md) and [Order recovery sequence](03_LLD/order_sequence.md).
4. Use the [simplified jury class diagram](03_LLD/class_diagram_jury_view.md), [jury defense](jury_defense.md) and final [presentation](12_Presentation/SALESTORM_CodeRed_Final_Presentation.pdf).
5. Review actual checks and limits in [validation evidence](11_AI_Assisted_Validation/validation_run.md) and [final audit](FINAL_SUBMISSION_AUDIT.md).

All critical review artifacts are stored locally in this folder. External workspace links, when retained in [VISUAL_ASSETS.md](VISUAL_ASSETS.md), are supplementary only.

## Validation

The targeted model has 12 passing tests. It demonstrates 100 allocated units, idempotency, expiry, payment uncertainty, at-least-once event delivery and a 30-second Order outage scenario. This is architecture-model evidence, not a PostgreSQL benchmark, live payment-provider test, production failover test, or proof of 500,000 RPS. The hot Inventory row and durable commit remain the principal bottleneck. See [recorded results](11_AI_Assisted_Validation/validation_run.md).

## Team CodeRed

CodeRed prepared this final package. AI assistance, review boundaries and the work performed are disclosed in [AI_USAGE.md](AI_USAGE.md). The team should rehearse the state and failure explanations before submission; human understanding is not inferred from generated material.
