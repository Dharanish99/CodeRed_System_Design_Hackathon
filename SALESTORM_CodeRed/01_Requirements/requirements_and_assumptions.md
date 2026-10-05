# Requirements and assumptions
Source: supplied revised SALESTORM brief, all 19 pages read, 5 October 2026. Page numbers below refer to physical PDF pages. The pasted master prompt defines this authoring task; the PDF defines event requirements. Reference architecture and suggested tools are examples, not mandatory technology choices.

## Requirements register
| ID | Requirement | Source | Classification |
|---|---|---|---|
| R01 | Full discovery-to-delivery pipeline, customers/products/promotions/cart/fulfilment | pp1,5 | Functional |
| R02 | 10,000 concurrent customers for 100 units; never oversell or go negative | pp4,5,10 | Strict safety |
| R03 | Temporary holds; confirmation, expiry, release; duplicate Buy protection | pp4,7,10 | Safety + conditional liveness |
| R04 | Safe payments: success/failure/timeout/duplicates/lost responses | pp7,10 | Safety |
| R05 | Payment succeeds while Order unavailable; eventual correct order | pp10,11 | Conditional liveness |
| R06 | Normal 10,000 RPS; reason toward 500,000 RPS and 50x growth | pp11,13 | Design envelope, not measured throughput |
| R07 | Context, HLD, containers, components, deployment; sync/async and infrastructure | pp7,15 | Mandatory artifact |
| R08 | Database entities, PK/FK/indexes/constraints/transactions/audit | pp5,6 | Mandatory artifact |
| R09 | LLD for >=3 modules, classes, interfaces, purchase/payment/order sequences, states | pp8,12 | Mandatory artifact |
| R10 | Actual SOLID mapping; justified patterns; provider/pricing/carrier extension | pp8,12 | Mandatory artifact |
| R11 | API method/path/auth/request/response/errors; events and ownership | p8 | Mandatory artifact |
| R12 | Retry/timeouts/breakers/DLQ/idempotent events/reconciliation | p12 | Reliability |
| R13 | AuthN/AuthZ/TLS/abuse/input/payment security/secrets/audit | p13 | Security |
| R14 | Metrics/logs/traces/alerts for stock, payment, queue and conversion | p13 | Observability |
| R15 | Compare concurrency and architecture options; record ADRs | pp7,8,13 | Mandatory artifact |
| R16 | Practical case: 95% payment success, 5% failure, 2% duplicates, Order down 30s | p11 | Walkthrough; optional executable evidence |
| R17 | AI disclosure, review, team ownership; implementation optional | pp8,9,15 | Submission constraint |
| R18 | Required folder structure, final pitch and jury defense | pp15,18,19 | Submission constraint |

## Explicit assumptions, not brief facts
| ID | Assumption / target | Consequence |
|---|---|---|
| A01 | Single region; one fenced writable PostgreSQL primary per inventory shard | Partitioned writes fail closed; no active-active stock writers |
| A02 | Flash-sale Buy is one SKU and quantity=1; one open/sold purchase per customer per sale | Multi-SKU atomic checkout is outside this critical path; cart supports multiple items but checks out sale lines separately |
| A03 | RESERVED TTL=120s using DB clock; sweep every 1s, release target <5s after TTL | Sweeper lag reduces availability, never creates extra stock |
| A04 | PAYMENT_PENDING has no automatic stock TTL | Unknown charge outcome pins stock; reconcile and escalate after 15m; eventual terminal state assumes provider recovery or operator resolution |
| A05 | Provider offers durable payment-intent lookup, same-key deduplication and final non-chargeable failure/cancel status | Without these contracts no unconditional no-double-charge claim; do not switch providers after unknown result |
| A06 | Prices in integer minor units, currency fixed per purchase; server-signed quote valid 120s | Price snapshot immutable at reserve; no client-supplied payable amount |
| A07 | Initial sale allocation fixed at 100; returns/restocking are a separate audited adjustment | Proof applies to allocation; released holds may be reused, historical reservation count can exceed 100 |
| A08 | Traffic mix 95% cacheable browse / 4% cart-status / 1% purchase at peak; cache hit 99% on browse | Capacity illustration only; all-write sensitivity is explicitly analysed |
| A09 | Healthy admitted reserve p95 <300ms, API availability target 99.9% monthly; order convergence <60s after recovery | Targets to benchmark, not demonstrated SLOs; overload 429/503 is counted separately and reported |
| A10 | HA RPO=0 for acknowledged stock commits within region with synchronous replica + fencing; RTO<60s target | Availability sacrificed if safe failover not possible; regional disaster restore target RPO<=5m/RTO<=4h requires reconciliation before reopening sales |
| A11 | Keep purchase/payment idempotency tombstones for financial lifecycle; ordinary failed-request cache 24h | Do not silently re-execute old sale actions after dedup records disappear |
| A12 | Team roster not supplied | Final package is identified as CodeRed; no individual names or sign-offs are invented |

## Source ambiguities
Visual inspection of the revised page1 confirms a team of3 students. The extracted PDF text retains an older hidden3-4 value; the visible revision takes precedence. Page16 lists four suggested roles, so share reliability across the three owners. No names or sign-offs are invented.
Page 18 pitch slots total exactly300 seconds (30+30+60+60+45+45+30). Follow this five-minute schedule.
Page 9 says AI must not replace architecture judgement. This package is an AI-assisted proposal, NOT evidence of student-originated decisions or team understanding. Team review and personal defense remain outstanding.

## Evaluation
Design rubric (p17): business 10%; HLD 15%; concurrency/scale 15%; inventory 15%; payment/order 10%; LLD 10%; SOLID/patterns 5%; data/API/events 5%; reliability/security/observability 5%; tradeoffs 5%; validation 3%; pitch 2%. Practical rubric (p19): four equally weighted 25-mark walkthroughs: HLD, inventory, payment/order, stress/defense. These are separate rubrics.
External dependencies: payment provider, identity provider, carrier, notification provider; synchronous DB durability and broker availability are operational dependencies. No production application is required.
