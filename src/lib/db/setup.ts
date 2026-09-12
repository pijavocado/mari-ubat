import { client } from "./client.ts";

const statements = [
  `CREATE TABLE IF NOT EXISTS demo_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS clinics (
    id TEXT PRIMARY KEY NOT NULL,
    demo_session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    strength TEXT NOT NULL,
    pack_size TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    individual_price INTEGER NOT NULL,
    group_price INTEGER NOT NULL,
    category TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS group_buys (
    id TEXT PRIMARY KEY NOT NULL,
    product_id TEXT NOT NULL,
    demo_session_id TEXT NOT NULL,
    target_quantity INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL,
    anonymous_clinic_count INTEGER NOT NULL,
    deadline_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at INTEGER NOT NULL,
    completed_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS commitments (
    id TEXT PRIMARY KEY NOT NULL,
    group_buy_id TEXT NOT NULL,
    clinic_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    estimated_savings INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_history (
    id TEXT PRIMARY KEY NOT NULL,
    clinic_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    usual_quantity INTEGER NOT NULL,
    average_reorder_interval_days INTEGER NOT NULL,
    days_since_last_purchase INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS recovery_recommendations (
    id TEXT PRIMARY KEY NOT NULL,
    group_buy_id TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    eligible_clinic_count INTEGER NOT NULL,
    potential_recovered_quantity INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS recovery_events (
    id TEXT PRIMARY KEY NOT NULL,
    group_buy_id TEXT NOT NULL,
    recovered_quantity INTEGER NOT NULL,
    source TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY NOT NULL,
    commitment_id TEXT NOT NULL UNIQUE,
    card_last4 TEXT NOT NULL,
    billing_name TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    mailing_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'READY_FOR_FULFILMENT',
    estimated_delivery_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY NOT NULL,
    clinic_id TEXT NOT NULL,
    group_buy_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'LOW_STOCK',
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at INTEGER NOT NULL
  )`,
];

// CREATE TABLE IF NOT EXISTS won't add columns to a table that already
// exists from before this column was introduced — patch it in for anyone
// upgrading an existing local/dev database.
const migrations: { table: string; column: string; ddl: string }[] = [
  { table: "notifications", column: "type", ddl: "ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'LOW_STOCK'" },
];

export async function setupDatabase() {
  for (const statement of statements) {
    await client.execute(statement);
  }

  for (const migration of migrations) {
    const columns = await client.execute(`PRAGMA table_info(${migration.table})`);
    const hasColumn = columns.rows.some((row) => row.name === migration.column);
    if (!hasColumn) {
      await client.execute(migration.ddl);
    }
  }
}

if (process.argv[1]?.endsWith("setup.ts")) {
  setupDatabase()
    .then(() => console.log("Database schema is ready."))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
