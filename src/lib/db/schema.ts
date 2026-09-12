import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "number" }).notNull(),
};

export const demoSessions = sqliteTable("demo_sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "number" }).notNull(),
  ...timestamps,
});

export const clinics = sqliteTable("clinics", {
  id: text("id").primaryKey(),
  demoSessionId: text("demo_session_id").notNull(),
  name: text("name").notNull(),
  registrationNumber: text("registration_number").notNull(),
  contactName: text("contact_name").notNull(),
  verificationStatus: text("verification_status").notNull().default("PENDING"),
  ...timestamps,
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  strength: text("strength").notNull(),
  packSize: text("pack_size").notNull(),
  manufacturer: text("manufacturer").notNull(),
  individualPrice: integer("individual_price").notNull(),
  groupPrice: integer("group_price").notNull(),
  category: text("category").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const groupBuys = sqliteTable("group_buys", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  demoSessionId: text("demo_session_id").notNull(),
  targetQuantity: integer("target_quantity").notNull(),
  currentQuantity: integer("current_quantity").notNull(),
  anonymousClinicCount: integer("anonymous_clinic_count").notNull(),
  deadlineAt: integer("deadline_at", { mode: "number" }).notNull(),
  status: text("status").notNull().default("OPEN"),
  ...timestamps,
  completedAt: integer("completed_at", { mode: "number" }),
});

export const commitments = sqliteTable("commitments", {
  id: text("id").primaryKey(),
  groupBuyId: text("group_buy_id").notNull(),
  clinicId: text("clinic_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  estimatedSavings: integer("estimated_savings").notNull(),
  status: text("status").notNull().default("PENDING"),
  ...timestamps,
});

export const purchaseHistory = sqliteTable("purchase_history", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull(),
  productId: text("product_id").notNull(),
  usualQuantity: integer("usual_quantity").notNull(),
  averageReorderIntervalDays: integer("average_reorder_interval_days").notNull(),
  daysSinceLastPurchase: integer("days_since_last_purchase").notNull(),
  ...timestamps,
});

export const recoveryRecommendations = sqliteTable("recovery_recommendations", {
  id: text("id").primaryKey(),
  groupBuyId: text("group_buy_id").notNull(),
  riskScore: integer("risk_score").notNull(),
  eligibleClinicCount: integer("eligible_clinic_count").notNull(),
  potentialRecoveredQuantity: integer("potential_recovered_quantity").notNull(),
  explanation: text("explanation").notNull(),
  ...timestamps,
});

export const recoveryEvents = sqliteTable("recovery_events", {
  id: text("id").primaryKey(),
  groupBuyId: text("group_buy_id").notNull(),
  recoveredQuantity: integer("recovered_quantity").notNull(),
  source: text("source").notNull(),
  ...timestamps,
});

/**
 * One simulated payment/fulfilment record per commitment. Card details are
 * never stored beyond the last 4 digits shown back to the clinic — this is
 * a simulated checkout, never a real payment (see docs/PLAN.md's "Out of
 * scope" list).
 */
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  commitmentId: text("commitment_id").notNull().unique(),
  cardLast4: text("card_last4").notNull(),
  billingName: text("billing_name").notNull(),
  billingAddress: text("billing_address").notNull(),
  mailingAddress: text("mailing_address").notNull(),
  status: text("status").notNull().default("READY_FOR_FULFILMENT"),
  estimatedDeliveryAt: integer("estimated_delivery_at", { mode: "number" }).notNull(),
  ...timestamps,
});

/**
 * A simulated reorder-reminder sent to one clinic for one group buy —
 * created in bulk by the AI Demand Recovery List, read by the recipient's
 * own dashboard. No real email/SMS is ever sent (simulated, like everything
 * else in this prototype).
 */
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  clinicId: text("clinic_id").notNull(),
  groupBuyId: text("group_buy_id").notNull(),
  message: text("message").notNull(),
  /** "LOW_STOCK" (haven't joined yet) or "MOQ_REACHED" (already joined, ready to pay) — decides where "Bring me there" leads. */
  type: text("type").notNull().default("LOW_STOCK"),
  status: text("status").notNull().default("PENDING"),
  ...timestamps,
});

export type DemoSession = typeof demoSessions.$inferSelect;
export type Clinic = typeof clinics.$inferSelect;
export type Product = typeof products.$inferSelect;
export type GroupBuy = typeof groupBuys.$inferSelect;
export type Commitment = typeof commitments.$inferSelect;
export type PurchaseHistory = typeof purchaseHistory.$inferSelect;
export type RecoveryRecommendation = typeof recoveryRecommendations.$inferSelect;
export type RecoveryEvent = typeof recoveryEvents.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
