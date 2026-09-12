import { listCategories, listProducts } from "@/lib/domain/product";
import { ChevronLeftIcon, FilterIcon, SearchIcon, XIcon } from "@/components/icons";
import { NavMenu } from "@/components/NavMenu";
import { ProductCard } from "./ProductCard";

interface MedicinesPageProps {
  searchParams: Promise<{ q?: string; category?: string | string[]; active?: string }>;
}

function buildHref(params: { q?: string; categories?: string[]; active?: boolean }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  for (const category of params.categories ?? []) query.append("category", category);
  if (params.active) query.set("active", "1");
  const qs = query.toString();
  return qs ? `/medicines?${qs}` : "/medicines";
}

export default async function MedicinesPage({ searchParams }: MedicinesPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const selectedCategories = (Array.isArray(params.category) ? params.category : params.category ? [params.category] : [])
    .map((c) => c.trim())
    .filter(Boolean);
  const activeOnly = params.active === "1";

  const [products, categories] = await Promise.all([
    listProducts({ search, categories: selectedCategories, activeGroupBuyOnly: activeOnly }),
    listCategories(),
  ]);

  const filterCount = selectedCategories.length + (activeOnly ? 1 : 0);
  const clearHref = buildHref({ q: search });

  return (
    <main className="min-h-screen bg-paper pb-10">
      <div className="sticky top-0 z-10 bg-navy px-4 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <NavMenu variant="dark" />
          <a
            href="/dashboard"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Back to dashboard"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </a>

          <form action="/medicines" method="get" className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search medicines"
                className="w-full rounded-full bg-white py-2.5 pl-10 pr-4 text-sm text-navy outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-blue/40"
              />
            </div>

            <details className="group relative shrink-0">
              <summary
                aria-label="Filter medicines"
                className={`grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full transition [&::-webkit-details-marker]:hidden ${
                  filterCount > 0 ? "bg-blue text-white hover:bg-blue-dark" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <FilterIcon className="h-4 w-4" />
              </summary>

              <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl bg-white p-4 text-navy shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate">Category</p>
                <div className="mt-2.5 space-y-2.5">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        name="category"
                        value={category}
                        defaultChecked={selectedCategories.includes(category)}
                        className="h-4 w-4 rounded border-navy/25 text-blue focus:ring-blue/30"
                      />
                      {category}
                    </label>
                  ))}
                </div>

                <div className="mt-3.5 border-t border-navy/10 pt-3.5">
                  <label className="flex items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      name="active"
                      value="1"
                      defaultChecked={activeOnly}
                      className="h-4 w-4 rounded border-navy/25 text-blue focus:ring-blue/30"
                    />
                    Active group buys only
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <a href={clearHref} className="text-xs font-semibold text-slate transition hover:text-navy">
                    Clear
                  </a>
                  <button
                    type="submit"
                    className="display-font rounded-full bg-navy px-4 py-2 text-xs text-white transition hover:bg-navy-2"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </details>

            <button
              type="submit"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue text-white transition hover:bg-blue-dark"
              aria-label="Search"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>
        </div>

        {filterCount > 0 && (
          <div className="mx-auto mt-3 flex max-w-6xl flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <a
                key={category}
                href={buildHref({ q: search, categories: selectedCategories.filter((c) => c !== category), active: activeOnly })}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-3 pr-2 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                {category} <XIcon className="h-3 w-3" />
              </a>
            ))}
            {activeOnly && (
              <a
                href={buildHref({ q: search, categories: selectedCategories, active: false })}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-3 pr-2 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                Active group buys only <XIcon className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {products.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-white p-6 text-center text-sm text-slate shadow-soft">
            No medicines found. Try a different search or clear your filters.
          </p>
        )}

        <p className="mt-8 text-center text-[11px] text-slate">
          Prototype catalogue · fictional medicines and pricing only
        </p>
      </div>
    </main>
  );
}
