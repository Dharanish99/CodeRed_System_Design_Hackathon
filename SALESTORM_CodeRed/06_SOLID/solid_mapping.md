# SOLID applied to actual LLD participants
| Principle | Application | Benefit | Bad design avoided |
|---|---|---|---|
| SRP | ReservationService holds stock; PaymentService handles intents; OrderService lifecycle; NotificationConsumer delivery | Separate failure and change boundaries | Payment class that edits stock and sends SMS |
| OCP | PaymentGateway adapters and PricingStrategy.quote; ShippingGateway adapters | New provider/rule/carrier without editing core workflow | switch(provider) scattered through checkout |
| LSP | Every PaymentGateway implements createOrGet, lookup, cancel and refund with same key/outcome guarantees; unsupported cancellation returns PENDING, never fake FAILED | Substitution retains safety assumptions | Adapter returning failure for a timeout, causing stock release |
| ISP | PaymentGateway and ShippingGateway separate; InventoryRepository limited to guarded transitions; read API separate from adjustment administration | Callers need only relevant operations | Universal commerce interface with dozens of unused methods |
| DIP | ReservationService depends on InventoryRepository/UnitOfWork; PaymentService on PaymentGateway; OrderService on OrderRepository | Persistence/provider contracts testable with fault models | Core domain imports provider SDK and SQL connection directly |

UnitOfWork is essential: abstract repositories cannot independently commit stock and outbox. Fake implementations must honor the same transaction contract. Contract tests must check timeout->UNKNOWN, stable provider key and monotonic terminal outcomes before accepting a new adapter.
