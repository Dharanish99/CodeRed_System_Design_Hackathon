-- PostgreSQL reference schema. Logical ownership; no cross-domain FKs.
BEGIN;
CREATE SCHEMA identity;
CREATE SCHEMA catalog;
CREATE SCHEMA cart;
CREATE SCHEMA inventory;
CREATE SCHEMA payment;
CREATE SCHEMA orders;
CREATE SCHEMA fulfilment;
CREATE SCHEMA notification;
CREATE TABLE identity.customer (
  customer_id uuid PRIMARY KEY,
  subject text NOT NULL UNIQUE,
  email_ciphertext bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE catalog.category (
  category_id uuid PRIMARY KEY,
  name text NOT NULL
);
CREATE TABLE catalog.product (
  product_id uuid PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES catalog.category(category_id),
  name text NOT NULL,
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  currency char(3) NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE catalog.sale (
  sale_id uuid PRIMARY KEY,
  name text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('SCHEDULED','ACTIVE','ENDED')),
  CHECK (ends_at > starts_at)
);
CREATE TABLE catalog.deal (
  deal_id uuid PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES catalog.sale(sale_id),
  product_id uuid NOT NULL REFERENCES catalog.product(product_id),
  price_minor bigint NOT NULL CHECK (price_minor >= 0)
);
CREATE TABLE catalog.coupon (
  coupon_id uuid PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES catalog.sale(sale_id),
  code text NOT NULL UNIQUE,
  percent_off integer NOT NULL CHECK (percent_off BETWEEN 0 AND 100),
  expires_at timestamptz NOT NULL
);
CREATE TABLE cart.cart (
  cart_id uuid PRIMARY KEY,
  customer_id uuid NOT NULL UNIQUE,
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE cart.cart_item (
  cart_item_id uuid PRIMARY KEY,
  cart_id uuid NOT NULL REFERENCES cart.cart(cart_id),
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  UNIQUE(cart_id,product_id)
);
CREATE TABLE inventory.inventory (
  inventory_id uuid PRIMARY KEY,
  sale_id uuid NOT NULL,
  product_id uuid NOT NULL,
  allocated_quantity integer NOT NULL CHECK (allocated_quantity >= 0),
  available_quantity integer NOT NULL CHECK (available_quantity >= 0),
  reserved_quantity integer NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  sold_quantity integer NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sale_id, product_id),
  CHECK (available_quantity + reserved_quantity + sold_quantity = allocated_quantity)
);
CREATE TABLE inventory.inventory_reservation (
  reservation_id uuid PRIMARY KEY,
  inventory_id uuid NOT NULL REFERENCES inventory.inventory(inventory_id),
  sale_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  quantity integer NOT NULL CHECK (quantity = 1),
  status text NOT NULL CHECK (status IN ('RESERVED','PAYMENT_PENDING','SOLD','RELEASED')),
  release_reason text CHECK (release_reason IN ('EXPIRED','PAYMENT_FAILED','CANCELLED')),
  expires_at timestamptz NOT NULL,
  quote jsonb NOT NULL,
  checkout_id uuid UNIQUE,
  checkout_token_hash text,
  payment_id uuid UNIQUE,
  version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, idempotency_key),
  CHECK ((status = 'RELEASED') = (release_reason IS NOT NULL))
);
CREATE TABLE inventory.request_dedup (
  customer_id uuid NOT NULL,
  operation text NOT NULL,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 8 AND 128),
  request_hash text NOT NULL,
  response_code integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(customer_id, operation, idempotency_key)
);
CREATE TABLE payment.payment (
  payment_id uuid PRIMARY KEY,
  reservation_id uuid NOT NULL UNIQUE,
  checkout_id uuid NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  provider text NOT NULL,
  provider_key text NOT NULL UNIQUE,
  provider_ref text,
  request_hash text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING','UNKNOWN','SUCCEEDED','FAILED','REFUND_PENDING','REFUNDED')),
  refund_key text UNIQUE,
  version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_ref)
);
CREATE TABLE orders.customer_order (
  order_id uuid PRIMARY KEY,
  reservation_id uuid NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  payment_id uuid NOT NULL UNIQUE,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL,
  status text NOT NULL CHECK (status IN ('CREATED','PAYMENT_PENDING','CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUND_PENDING','REFUNDED')),
  version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE orders.order_item (
  order_item_id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders.customer_order(order_id),
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
  product_name text NOT NULL
);
CREATE TABLE fulfilment.shipment (
  shipment_id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE,
  carrier text NOT NULL,
  carrier_reference text,
  address_ciphertext bytea NOT NULL,
  status text NOT NULL CHECK (status IN ('CREATED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')),
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE notification.notification (
  notification_id uuid PRIMARY KEY,
  event_id uuid NOT NULL,
  order_id uuid NOT NULL,
  channel text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING','SENT','FAILED')),
  attempts integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id,channel)
);
CREATE TABLE inventory.outbox (
  event_id uuid PRIMARY KEY,
  event_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version bigint NOT NULL,
  payload jsonb NOT NULL,
  traceparent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE TABLE inventory.inbox (
  consumer text NOT NULL,
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(consumer,event_id)
);
CREATE TABLE inventory.audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_id uuid NOT NULL,
  old_state text,
  new_state text NOT NULL,
  reason text NOT NULL,
  actor text NOT NULL,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE payment.outbox (
  event_id uuid PRIMARY KEY,
  event_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version bigint NOT NULL,
  payload jsonb NOT NULL,
  traceparent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE TABLE payment.inbox (
  consumer text NOT NULL,
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(consumer,event_id)
);
CREATE TABLE payment.audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_id uuid NOT NULL,
  old_state text,
  new_state text NOT NULL,
  reason text NOT NULL,
  actor text NOT NULL,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE orders.outbox (
  event_id uuid PRIMARY KEY,
  event_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version bigint NOT NULL,
  payload jsonb NOT NULL,
  traceparent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE TABLE orders.inbox (
  consumer text NOT NULL,
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(consumer,event_id)
);
CREATE TABLE orders.audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_id uuid NOT NULL,
  old_state text,
  new_state text NOT NULL,
  reason text NOT NULL,
  actor text NOT NULL,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE fulfilment.outbox (
  event_id uuid PRIMARY KEY,
  event_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version bigint NOT NULL,
  payload jsonb NOT NULL,
  traceparent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE TABLE fulfilment.inbox (
  consumer text NOT NULL,
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(consumer,event_id)
);
CREATE TABLE fulfilment.audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_id uuid NOT NULL,
  old_state text,
  new_state text NOT NULL,
  reason text NOT NULL,
  actor text NOT NULL,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE notification.inbox (
  consumer text NOT NULL,
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(consumer,event_id)
);
CREATE UNIQUE INDEX one_active_purchase ON inventory.inventory_reservation(customer_id,sale_id) WHERE status IN ('RESERVED','PAYMENT_PENDING','SOLD');
CREATE INDEX reservation_expiry ON inventory.inventory_reservation(expires_at) WHERE status='RESERVED';
CREATE INDEX payment_unresolved ON payment.payment(updated_at) WHERE status IN ('PENDING','UNKNOWN','REFUND_PENDING');
CREATE INDEX order_customer_history ON orders.customer_order(customer_id,created_at DESC);
CREATE INDEX inventory_unpublished ON inventory.outbox(created_at) WHERE published_at IS NULL;
CREATE INDEX payment_unpublished ON payment.outbox(created_at) WHERE published_at IS NULL;
CREATE INDEX orders_unpublished ON orders.outbox(created_at) WHERE published_at IS NULL;
CREATE INDEX fulfilment_unpublished ON fulfilment.outbox(created_at) WHERE published_at IS NULL;
COMMIT;
