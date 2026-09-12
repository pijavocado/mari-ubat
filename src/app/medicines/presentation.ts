// Small presentation-only helpers for the marketplace-style catalogue UI.

const SWATCHES = ["bg-sky/70", "bg-blue/8", "bg-navy/6", "bg-sky/35"];

export function categorySwatch(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return SWATCHES[hash % SWATCHES.length];
}

/** Percentage off the individual price when buying at the group price. */
export function discountPercent(individualPrice: number, groupPrice: number): number {
  if (individualPrice <= 0) return 0;
  return Math.max(0, Math.round((1 - groupPrice / individualPrice) * 100));
}

/** Real product photos for the seeded catalogue — falls back to the icon placeholder for anything else. */
const PRODUCT_PHOTOS: Record<string, string> = {
  "product-amoxicillin-500": "/images/amoxicillin.png",
  "product-paracetamol-500": "/images/paracetamol.jpg",
  "product-omeprazole-20": "/images/omeprazole.jpg",
  "product-metformin-500": "/images/metformin.jpg",
};

export function productPhoto(productId: string): string | null {
  return PRODUCT_PHOTOS[productId] ?? null;
}
