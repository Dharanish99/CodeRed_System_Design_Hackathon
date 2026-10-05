# SALESTORM — CodeRed
> **SYSCRAFTERS 2026 System Design Hackathon — Final Submission**

---

## ⚡ Executive Summary

**SALESTORM** is a high-concurrency flash-sale architecture engineered to withstand extreme load (10,000 concurrent requests competing for 100 inventory units) without overselling, lost reservations, or race conditions.

### The Problem
During peak flash-sale moments, thousands of customers attempt to purchase an extremely limited quantity of stock simultaneously. The system must guarantee **zero stock drift**, strictly bounded reservations, graceful handling of payment uncertainties and third-party webhook delays, and consistent eventual order fulfillment even under service degradation.

### Core Architectural Guarantees
- **Zero Overselling Invariant**: PostgreSQL is the single stock authority. Guarded transactional updates enforce `held_units + sold_units <= total_capacity`.
- **Explicit Lifecycle**: `AVAILABLE` → `RESERVED` → `PAYMENT_PENDING` → `CONFIRMED` → `SOLD` (with strictly non-chargeable releases on failure/timeout).
- **Dual Verification & Idempotency**: Idempotent order processing across API, payment gateway intents, and Kafka event consumers via transactional outbox & inbox patterns.

---

## 📂 Repository Structure

```
├── SALESTORM_CodeRed/                   # Complete System Design Documentation & Specs
│   ├── 01_Requirements/                # Requirements register, assumptions, and invariant proof
│   ├── 02_HLD/                         # High-level architecture, deployment, and concurrency model
│   ├── 03_LLD/                         # Low-level class design, sequence diagrams, and lifecycle mapping
│   ├── 04_Database/                    # PostgreSQL schema, ERDs, transactional protocols, and indexing
│   ├── 05_API/                         # OpenAPI contracts, event catalog, and idempotency rules
│   ├── 06_SOLID/                       # SOLID design principles implementation review
│   ├── 07_Design_Patterns/             # Applied design patterns (Outbox, Inbox, Circuit Breaker, etc.)
│   ├── 08_Scalability_Reliability/     # Fault tolerance, rate limiting, and disaster recovery
│   ├── 09_Security_Observability/      # Auth, telemetry, distributed tracing, and metrics
│   ├── 10_ADR/                         # Architecture Decision Records
│   ├── 11_AI_Assisted_Validation/      # Concurrency validation model and test suite evidence
│   ├── 12_Presentation/                # Final Presentation (PDF & PPTX), pitch deck, and speaker notes
│   ├── AI_USAGE.md                     # Disclosure of AI-assisted engineering tools
│   ├── FINAL_SUBMISSION_AUDIT.md       # Compliance and invariant audit checklist
│   ├── jury_defense.md                 # Jury Q&A defense document
│   └── README.md                       # Comprehensive design documentation overview
│
└── CodeRed_SALESTORM_Visual_Experience/ # Interactive Visual Dashboard & Architecture Walkthrough
    ├── src/                            # Vue 3 + TypeScript + Pixi.js + GSAP interactive experience
    ├── public/                         # Public assets and diagrams
    ├── docs/                           # Architecture documentation and site source map
    ├── package.json                    # Frontend dependencies and scripts
    └── vite.config.ts                  # Vite build configuration
```

---

## 🚀 Quick Start: Visual Experience

To run the interactive visual experience application locally:

```bash
cd CodeRed_SALESTORM_Visual_Experience
npm install
npm run dev
```

Visit the local development server (typically `http://localhost:5173`) to view the interactive flash-sale simulation, state transitions, and architecture visualizer.

---

## 📖 Key Documentation Links

- **Architecture Walkthrough**: [`SALESTORM_CodeRed/02_HLD/hld_architecture.md`](SALESTORM_CodeRed/02_HLD/hld_architecture.md)
- **Invariant Proof & Safety Guarantees**: [`SALESTORM_CodeRed/01_Requirements/system_invariants.md`](SALESTORM_CodeRed/01_Requirements/system_invariants.md)
- **Database Schema & Transactions**: [`SALESTORM_CodeRed/04_Database/schema.sql`](SALESTORM_CodeRed/04_Database/schema.sql)
- **Event Catalog & Contracts**: [`SALESTORM_CodeRed/05_API/event_catalog.md`](SALESTORM_CodeRed/05_API/event_catalog.md)
- **Presentation Deck**: [`SALESTORM_CodeRed/12_Presentation/SALESTORM_CodeRed_Final_Presentation.pdf`](SALESTORM_CodeRed/12_Presentation/SALESTORM_CodeRed_Final_Presentation.pdf)
- **Jury Defense & Deep-Dive FAQ**: [`SALESTORM_CodeRed/jury_defense.md`](SALESTORM_CodeRed/jury_defense.md)

---

## 👥 Team CodeRed

Submitted for **SYSCRAFTERS 2026 System Design Hackathon**.
