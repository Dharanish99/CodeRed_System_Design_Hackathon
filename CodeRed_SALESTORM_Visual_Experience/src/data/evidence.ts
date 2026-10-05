// Source: ../SALESTORM_CodeRed/11_AI_Assisted_Validation/simulation_results.json
// Source: ../SALESTORM_CodeRed/11_AI_Assisted_Validation/validation_run.md

export const validationEvidence = {
  // Source: simulation_results.json
  testsRun: 12,
  failures: 0,
  errors: 0,

  practical: {
    logicalCustomers: 10_000,
    httpAttempts: 10_200,
    duplicateAttempts: 200,
    initialHolds: 100,
    paid: 95,
    failed: 5,
    available: 5,
    held: 0,
    sold: 95,
    uniqueOrders: 95,
    maxHeldPlusSold: 100,     // INV-001 invariant held
    orderOutageSeconds: 30,
  },

  // Source: simulation_results.json "not_proven"
  notProven: [
    'PostgreSQL execution/performance',
    'Real network/process failover',
    'Provider contract',
    '500,000 RPS',
    'Broker durability',
    'Bounded completion under permanent outage',
  ],

  // Source: validation_run.md
  modelDescription: 'Asyncio transactional state model; global lock abstracts SQL serialization',
  disclaimer: 'This is architecture-model evidence, not production load evidence.',

  // Source: validation_run.md "12 passing model checks cover:"
  scenariosCovered: [
    '10,000-customer/100-unit practical scenario with duplicate attempts',
    'Last-unit race',
    'Same-key mismatch',
    'Active-purchase uniqueness',
    'Expiry',
    'Checkout-versus-expiry interleavings',
    'Provider timeout reconciliation',
    'Duplicate events',
    'Lost consumer acknowledgement',
    'Database rollback/unavailability',
    'Cache non-authority',
    'Failed-payment recycling and randomized duplicate/expiry schedules',
  ],
}

// Source: ../SALESTORM_CodeRed/01_Requirements/system_invariants.md
export const invariants = {
  primary: 'A + H + S = N',
  constraint: 'H + S ≤ N',
  allocation: 100,
  baseState: { available: 100, held: 0, sold: 0 },
  // Source: system_invariants.md INV-001 through INV-009
  ids: [
    { id: 'INV-001', text: 'A, H, S ≥ 0 and A + H + S = N' },
    { id: 'INV-002', text: 'Sum(RESERVED or PAYMENT_PENDING) = H; sum(SOLD) = S; H + S ≤ 100' },
    { id: 'INV-003', text: 'One (customer, operation, key) maps to one request hash and stored response' },
    { id: 'INV-004', text: 'At most one payment intent per reservation' },
    { id: 'INV-005', text: 'Holds eventually reach SOLD or RELEASED if dependencies recover' },
    { id: 'INV-006', text: 'A committed payment success survives Order outage' },
    { id: 'INV-007', text: 'At most one order per reservation; confirmation requires SOLD evidence' },
    { id: 'INV-008', text: 'No timeout or duplicate event can release or consume stock twice' },
    { id: 'INV-009', text: 'Shipment cannot start for unpaid/uncommitted inventory' },
  ],
}

// Source: ../SALESTORM_CodeRed/03_LLD/lifecycle_mapping.md
export const lifecycleStates = [
  { state: 'AVAILABLE', color: 'steel', label: 'Available' },
  { state: 'RESERVED', color: 'codered', label: 'Reserved' },
  { state: 'PAYMENT_PENDING', color: 'warning', label: 'Payment Pending' },
  { state: 'CONFIRMED', color: 'safe', label: 'Confirmed' },
  { state: 'SOLD', color: 'safe', label: 'Sold' },
  { state: 'RELEASED', color: 'steel', label: 'Released' },
] as const

// Source: ../SALESTORM_CodeRed/04_Database/reservation_transaction.sql
export const criticalSQL = `UPDATE inventory.inventory
  SET available_quantity = available_quantity - 1,
      reserved_quantity = reserved_quantity + 1,
      version = version + 1,
      updated_at = clock_timestamp()
  WHERE inventory_id = :id
    AND available_quantity >= 1
  RETURNING *`

export const idempotencySQL = `INSERT INTO inventory.request_dedup
  (customer_id, operation, idempotency_key, request_hash)
  VALUES (p_customer, 'reserve', p_key, p_hash)
  ON CONFLICT DO NOTHING`
