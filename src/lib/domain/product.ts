import { and, eq, inArray, like } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { groupBuys, products, type GroupBuy, type Product } from "@/lib/db/schema";
import type { GroupBuyStatus } from "@/lib/domain/types";
import { calculateGroupBuyStatus } from "@/lib/domain/groupBuy";

export interface CatalogueGroupBuy {
  id: string;
  targetQuantity: number;
  currentQuantity: number;
  remainingQuantity: number;
  anonymousClinicCount: number;
  deadlineAt: number;
  status: GroupBuyStatus;
}

export interface CatalogueProduct {
  id: string;
  name: string;
  strength: string;
  manufacturer: string;
  packSize: string;
  category: string;
  individualPrice: number;
  groupPrice: number;
  /** null when no group buy has been seeded for this product yet (v0.3: only Amoxicillin does). */
  groupBuy: CatalogueGroupBuy | null;
}

function toCatalogueProduct(product: Product, groupBuy: GroupBuy | null, now: number): CatalogueProduct {
  return {
    id: product.id,
    name: product.name,
    strength: product.strength,
    manufacturer: product.manufacturer,
    packSize: product.packSize,
    category: product.category,
    individualPrice: product.individualPrice,
    groupPrice: product.groupPrice,
    groupBuy: groupBuy
      ? {
          id: groupBuy.id,
          targetQuantity: groupBuy.targetQuantity,
          currentQuantity: groupBuy.currentQuantity,
          remainingQuantity: Math.max(0, groupBuy.targetQuantity - groupBuy.currentQuantity),
          anonymousClinicCount: groupBuy.anonymousClinicCount,
          deadlineAt: groupBuy.deadlineAt,
          status: calculateGroupBuyStatus(groupBuy, now),
        }
      : null,
  };
}

export interface ListProductsOptions {
  search?: string;
  /** Match any of these categories (OR). Empty/omitted = all categories. */
  categories?: string[];
  /** Only include products that already have a group buy open. */
  activeGroupBuyOnly?: boolean;
}

/**
 * Lists active catalogue products with their current group-buy progress.
 * Products without a seeded group buy still appear, with `groupBuy: null`,
 * so the catalogue never breaks on non-primary products (see docs/PLAN.md v0.3).
 */
export async function listProducts(options: ListProductsOptions = {}): Promise<CatalogueProduct[]> {
  const conditions = [eq(products.isActive, true)];

  const search = options.search?.trim();
  if (search) conditions.push(like(products.name, `%${search}%`));

  const categories = (options.categories ?? []).map((c) => c.trim()).filter(Boolean);
  if (categories.length > 0) conditions.push(inArray(products.category, categories));

  const rows = await db
    .select({ product: products, groupBuy: groupBuys })
    .from(products)
    .leftJoin(groupBuys, eq(groupBuys.productId, products.id))
    .where(and(...conditions))
    .orderBy(products.name);

  // A product could in principle join more than one group-buy row; keep the
  // first one found so the catalogue never renders duplicate cards.
  const now = Date.now();
  const byProductId = new Map<string, CatalogueProduct>();
  for (const row of rows) {
    if (!byProductId.has(row.product.id)) {
      byProductId.set(row.product.id, toCatalogueProduct(row.product, row.groupBuy, now));
    }
  }

  let list = [...byProductId.values()];
  if (options.activeGroupBuyOnly) list = list.filter((product) => product.groupBuy !== null);

  return list;
}

/** Distinct categories among active products, for the catalogue filter. */
export async function listCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.category);

  return rows.map((row) => row.category);
}

/** A single active product with its group-buy progress, for the detail page. */
export async function getProductDetail(productId: string): Promise<CatalogueProduct | null> {
  const [row] = await db
    .select({ product: products, groupBuy: groupBuys })
    .from(products)
    .leftJoin(groupBuys, eq(groupBuys.productId, products.id))
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  return row ? toCatalogueProduct(row.product, row.groupBuy, Date.now()) : null;
}
