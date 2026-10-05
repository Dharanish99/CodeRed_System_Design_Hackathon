# Design patterns

| Pattern | Problem | Participants/application | Benefit | Cost/trade-off | Extension |
|---|---|---|---|---|---|
| Strategy | Vary price rules | PricingStrategy, SalePriceStrategy, CouponStrategy | Add discount rule through quote interface | Rule ordering and rounding need explicit policy | New percentage rule composes before immutable quote |
| Factory | Configure provider once | GatewayFactory, PaymentGateway | Central credential/capability selection | Must not fail over an UNKNOWN payment to another provider | Register a provider adapter selected before intent creation |
| State | Reject illegal lifecycle jumps | ReservationStatePolicy, OrderStatePolicy | Auditable guarded transitions | Transition table must stay aligned with schema/events | New return workflow uses explicit states |
| Observer | Independent order side effects | OrderConfirmed, NotificationConsumer, FulfilmentConsumer | No notification dependency on checkout | Durable messaging differs from in-memory callbacks; duplicate delivery | New email channel subscribes independently |
| Adapter | Normalize external semantics | ProviderAdapter, CarrierAdapter | Domain sees consistent outcomes | Provider differences cannot be hidden if safety contract fails | Map new carrier callbacks to shipment transitions |
| Repository | Encapsulate persistence | InventoryRepository, PaymentRepository, OrderRepository | Narrow testable domain access | Generic CRUD would hide concurrency; expose reserveIfAvailable | New storage adapter must pass transaction tests |
| Facade | Simplify checkout caller | CheckoutFacade | One customer-facing coordinator | Avoid giant transaction across services | Add quote validation without changing customer workflow |
| Circuit Breaker | Stop repeated failed provider calls | GatewayCircuitBreaker around PaymentGateway | Limits provider pressure and worker exhaustion | Open circuit is UNKNOWN/unavailable, never terminal decline | Tune separate circuit per provider |
