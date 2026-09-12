import { randomUUID } from "node:crypto";
import { db } from "./client.ts";
import {
  clinics,
  commitments,
  demoSessions,
  groupBuys,
  notifications,
  orders,
  products,
  purchaseHistory,
  recoveryEvents,
  recoveryRecommendations,
} from "./schema.ts";
import { setupDatabase } from "./setup.ts";

async function seed() {
  await setupDatabase();
  const now = Date.now();
  const demoSessionId = "seed-demo-session";
  const amoxicillinId = "product-amoxicillin-500";

  // Commitments/recovery rows reference groupBuys.id, which is a fixed
  // constant re-inserted on every reseed — without clearing these first,
  // stale rows from earlier sessions silently pollute risk/momentum
  // calculations even though currentQuantity itself resets correctly.
  await db.delete(notifications);
  await db.delete(orders);
  await db.delete(recoveryEvents);
  await db.delete(recoveryRecommendations);
  await db.delete(commitments);
  await db.delete(purchaseHistory);
  await db.delete(groupBuys);
  await db.delete(clinics);
  await db.delete(demoSessions);
  await db.delete(products);

  await db.insert(demoSessions)
  .values({
    id: demoSessionId,
    sessionToken: "seed-demo-token",
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
  })
  .run();

  await db.insert(products)
  .values([
    {
      id: amoxicillinId,
      name: "Amoxicillin",
      strength: "500mg",
      packSize: "Box of 100 capsules",
      manufacturer: "Fictional Pharma Co.",
      individualPrice: 42,
      groupPrice: 36,
      category: "Antibiotics",
      isActive: true,
      createdAt: now,
    },
    {
      id: "product-paracetamol-500",
      name: "Paracetamol",
      strength: "500mg",
      packSize: "Box of 100 tablets",
      manufacturer: "Fictional Pharma Co.",
      individualPrice: 18,
      groupPrice: 15,
      category: "Pain relief",
      isActive: true,
      createdAt: now,
    },
    {
      id: "product-omeprazole-20",
      name: "Omeprazole",
      strength: "20mg",
      packSize: "Box of 30 capsules",
      manufacturer: "Fictional Pharma Co.",
      individualPrice: 24,
      groupPrice: 20,
      category: "Gastrointestinal",
      isActive: true,
      createdAt: now,
    },
    {
      id: "product-metformin-500",
      name: "Metformin",
      strength: "500mg",
      packSize: "Box of 100 tablets",
      manufacturer: "Fictional Pharma Co.",
      individualPrice: 21,
      groupPrice: 17,
      category: "Diabetes care",
      isActive: true,
      createdAt: now,
    },
  ])
  .run();

  await db.insert(groupBuys)
  .values({
    id: "group-amoxicillin-demo",
    productId: amoxicillinId,
    demoSessionId,
    targetQuantity: 100,
    currentQuantity: 82,
    anonymousClinicCount: 12,
    deadlineAt: now + 3.5 * 60 * 60 * 1000,
    status: "OPEN",
    createdAt: now,
  })
  .run();

const historicalClinics = [
  { id: randomUUID(), name: "Harbour Family Clinic", quantity: 8, interval: 30, since: 27 },
  { id: randomUUID(), name: "Northstar Medical", quantity: 10, interval: 30, since: 31 },
  { id: randomUUID(), name: "Greenway Care", quantity: 6, interval: 45, since: 40 },
];

for (const clinic of historicalClinics) {
  await db.insert(clinics)
    .values({
      id: clinic.id,
      demoSessionId,
      name: clinic.name,
      registrationNumber: `DEMO-${clinic.id.slice(0, 6).toUpperCase()}`,
      contactName: "Demo Contact",
      verificationStatus: "VERIFIED",
      createdAt: now,
    })
    .run();

  await db.insert(purchaseHistory)
    .values({
      id: randomUUID(),
      clinicId: clinic.id,
      productId: amoxicillinId,
      usualQuantity: clinic.quantity,
      averageReorderIntervalDays: clinic.interval,
      daysSinceLastPurchase: clinic.since,
      createdAt: now,
    })
    .run();
}

  console.log("Seeded Mari Ubat demo data.");
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
