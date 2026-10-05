// Source: ../SALESTORM_CodeRed/02_HLD/service_catalog.md
// Source: ../SALESTORM_CodeRed/02_HLD/hld_architecture.md

export interface ServiceNode {
  id: string
  name: string
  shortName: string
  responsibility: string
  persistence: string
  scaling: string
  type: 'edge' | 'service' | 'datastore' | 'broker' | 'external' | 'cache'
}

export interface Connection {
  from: string
  to: string
  type: 'sync' | 'async' | 'ownership'
  label?: string
}

// Source: ../SALESTORM_CodeRed/02_HLD/service_catalog.md
export const services: ServiceNode[] = [
  {
    id: 'edge',
    name: 'Gateway / Edge',
    shortName: 'Gateway',
    responsibility: 'Auth, abuse, admission, routing',
    persistence: 'Stateless replicas; Redis limits; CDN caches',
    scaling: 'Scale by requests',
    type: 'edge',
  },
  {
    id: 'catalogue',
    name: 'Catalogue + Sale',
    shortName: 'Catalogue',
    responsibility: 'Product, promotions, signed quotes',
    persistence: 'PostgreSQL catalogue; Redis/CDN',
    scaling: 'Read replicas, cache',
    type: 'service',
  },
  {
    id: 'cart',
    name: 'Cart',
    shortName: 'Cart',
    responsibility: 'Customer selections',
    persistence: 'PostgreSQL cart',
    scaling: 'Customer-key partitions',
    type: 'service',
  },
  {
    id: 'checkout',
    name: 'Checkout',
    shortName: 'Checkout',
    responsibility: 'Facade for quote, reserve, payment start',
    persistence: 'Durable intent stored by Inventory',
    scaling: 'Stateless replicas',
    type: 'service',
  },
  {
    id: 'inventory',
    name: 'Inventory / Reservation',
    shortName: 'Inventory',
    responsibility: 'Only stock writer, holds, expiry',
    persistence: 'PostgreSQL inventory + inbox/outbox',
    scaling: 'Shard by inventory_id; hot SKU limited',
    type: 'service',
  },
  {
    id: 'payment',
    name: 'Payment',
    shortName: 'Payment',
    responsibility: 'Provider adapter, intent, reconcile/refund',
    persistence: 'PostgreSQL payment + inbox/outbox',
    scaling: 'By reservation; bounded provider concurrency',
    type: 'service',
  },
  {
    id: 'order',
    name: 'Order',
    shortName: 'Order',
    responsibility: 'Unique order and lifecycle',
    persistence: 'PostgreSQL orders + inbox/outbox',
    scaling: 'Reservation/order partitions',
    type: 'service',
  },
  {
    id: 'fulfilment',
    name: 'Fulfilment / Shipment',
    shortName: 'Fulfilment',
    responsibility: 'Pick/pack, carrier and tracking',
    persistence: 'PostgreSQL shipment + inbox/outbox',
    scaling: 'Order partitions',
    type: 'service',
  },
  {
    id: 'notification',
    name: 'Notification',
    shortName: 'Notification',
    responsibility: 'Send communication',
    persistence: 'PostgreSQL notification + inbox',
    scaling: 'Independent workers',
    type: 'service',
  },
  {
    id: 'kafka',
    name: 'Kafka + Relay',
    shortName: 'Kafka',
    responsibility: 'Durable decoupling',
    persistence: 'Replicated logs; local outboxes',
    scaling: 'Partitions',
    type: 'broker',
  },
  {
    id: 'redis',
    name: 'Redis Cache',
    shortName: 'Redis',
    responsibility: 'Catalogue cache, admission counters, stock hints',
    persistence: 'Advisory only — never authorizes inventory',
    scaling: 'Read replicas',
    type: 'cache',
  },
  {
    id: 'provider',
    name: 'Payment Provider',
    shortName: 'Provider',
    responsibility: 'External payment processing',
    persistence: 'External',
    scaling: 'External',
    type: 'external',
  },
]

// Source: ../SALESTORM_CodeRed/02_HLD/hld_architecture.md (complete purchase flow)
export const purchaseFlowConnections: Connection[] = [
  { from: 'edge', to: 'catalogue', type: 'sync', label: 'Browse' },
  { from: 'edge', to: 'cart', type: 'sync', label: 'Add to cart' },
  { from: 'edge', to: 'checkout', type: 'sync', label: 'POST /reservations' },
  { from: 'checkout', to: 'inventory', type: 'sync', label: 'Reserve + Checkout' },
  { from: 'checkout', to: 'payment', type: 'sync', label: 'POST /payments' },
  { from: 'payment', to: 'provider', type: 'sync', label: 'Provider call' },
  { from: 'payment', to: 'kafka', type: 'async', label: 'PaymentSucceeded' },
  { from: 'kafka', to: 'inventory', type: 'async', label: 'PaymentSucceeded' },
  { from: 'inventory', to: 'kafka', type: 'async', label: 'ReservationCommitted' },
  { from: 'kafka', to: 'order', type: 'async', label: 'ReservationCommitted' },
  { from: 'order', to: 'kafka', type: 'async', label: 'OrderConfirmed' },
  { from: 'kafka', to: 'fulfilment', type: 'async', label: 'OrderConfirmed' },
  { from: 'kafka', to: 'notification', type: 'async', label: 'OrderConfirmed' },
]

// Source: ../SALESTORM_CodeRed/02_HLD/hld_architecture.md - critical boundaries
export const criticalBoundaries = [
  {
    id: 'inventory-consistency',
    title: 'INVENTORY CONSISTENCY',
    description: 'Request dedup + guarded stock delta + reservation + outbox in one local transaction.',
  },
  {
    id: 'payment-idempotency',
    title: 'PAYMENT IDEMPOTENCY',
    description: 'One reservation → one durable provider intent/key; repeated HTTP/webhook/polling converge on this intent.',
  },
  {
    id: 'order-recovery',
    title: 'ORDER RECOVERY',
    description: 'ReservationCommitted carries paid/sold evidence; inbox + unique order + audit + outbox commit locally.',
  },
]
