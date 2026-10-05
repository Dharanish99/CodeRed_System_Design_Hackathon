-- Design proof fragment; execute after schema.sql. Caller validates signed quote,
-- authentication and sale eligibility before this function. No external I/O here.
CREATE OR REPLACE FUNCTION inventory.reserve_one(
  p_customer uuid, p_key text, p_hash text, p_inventory uuid,
  p_reservation uuid, p_event uuid, p_quote jsonb
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE old_request inventory.request_dedup%ROWTYPE;
        stock inventory.inventory%ROWTYPE;
        body jsonb; code integer; hold_expiry timestamptz;
BEGIN
  INSERT INTO inventory.request_dedup(customer_id,operation,idempotency_key,request_hash)
  VALUES (p_customer,'reserve',p_key,p_hash) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    SELECT * INTO old_request FROM inventory.request_dedup
      WHERE customer_id=p_customer AND operation='reserve' AND idempotency_key=p_key;
    IF old_request.request_hash<>p_hash THEN
      RETURN jsonb_build_object('status',409,'error','IDEMPOTENCY_MISMATCH');
    END IF;
    RETURN old_request.response_body;
  END IF;
  UPDATE inventory.inventory
    SET available_quantity=available_quantity-1, reserved_quantity=reserved_quantity+1,
        version=version+1, updated_at=clock_timestamp()
    WHERE inventory_id=p_inventory AND available_quantity>=1 RETURNING * INTO stock;
  IF NOT FOUND THEN
    code:=409; body:=jsonb_build_object('status',code,'error','OUT_OF_STOCK');
  ELSE
    hold_expiry:=clock_timestamp()+interval '120 seconds';
    INSERT INTO inventory.inventory_reservation(
      reservation_id,inventory_id,sale_id,customer_id,idempotency_key,quantity,status,expires_at,quote)
    VALUES (p_reservation,p_inventory,stock.sale_id,p_customer,p_key,1,'RESERVED',hold_expiry,p_quote);
    INSERT INTO inventory.audit(aggregate_id,new_state,reason,actor,correlation_id)
      VALUES(p_reservation,'RESERVED','GUARDED_RESERVE',p_customer::text,p_event);
    INSERT INTO inventory.outbox(event_id,event_type,aggregate_id,aggregate_version,payload)
      VALUES(p_event,'InventoryReserved',p_reservation,1,jsonb_build_object('reservation_id',p_reservation,'inventory_id',p_inventory,'quantity',1));
    code:=201;body:=jsonb_build_object('status',code,'reservation_id',p_reservation,'state','RESERVED','quantity',1,'expires_at',hold_expiry);
  END IF;
  UPDATE inventory.request_dedup SET response_code=code,response_body=body
    WHERE customer_id=p_customer AND operation='reserve' AND idempotency_key=p_key;
  RETURN body;
END $$;
-- API must commit before returning this result. Uniqueness failure rolls back all
-- changes, including inventory delta. Resolve the existing active purchase afterward.
-- Use a fresh transaction with the same key after lock/deadlock timeout; never
-- expose a successful function return before the enclosing COMMIT succeeds.
-- The API adapter uses the internal status field as the HTTP status and removes
-- it from the JSON representation. Error responses are mapped to Error DTOs.
