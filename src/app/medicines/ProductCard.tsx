import Image from "next/image";
import type { CatalogueProduct } from "@/lib/domain/product";
import { formatCurrency } from "@/lib/format";
import { CapsuleIcon } from "@/components/icons";
import { categorySwatch, discountPercent, productPhoto } from "./presentation";

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const { groupBuy } = product;
  const percentOff = discountPercent(product.individualPrice, product.groupPrice);
  const progressPercent = groupBuy
    ? Math.min(100, Math.round((groupBuy.currentQuantity / groupBuy.targetQuantity) * 100))
    : 0;
  const photo = productPhoto(product.id);

  return (
    <a
      href={`/medicines/${product.id}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-navy/5 transition hover:-translate-y-0.5 hover:ring-navy/10"
    >
      <div className={`relative flex aspect-square items-center justify-center ${photo ? "bg-white" : categorySwatch(product.category)}`}>
        {photo ? (
          <Image
            src={photo}
            alt={`${product.name} ${product.strength}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-3 transition group-hover:scale-105"
          />
        ) : (
          <CapsuleIcon className="h-9 w-9 text-navy/25 transition group-hover:text-navy/35" />
        )}
        {percentOff > 0 && (
          <span className="absolute left-0 top-0 rounded-br-lg bg-blue px-1.5 py-0.5 text-[10px] font-semibold text-white">
            -{percentOff}%
          </span>
        )}
        {!groupBuy ? (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-navy/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            Soon
          </span>
        ) : groupBuy.status === "MOQ_REACHED" || groupBuy.status === "READY_FOR_FULFILMENT" ? (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-blue px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            Reached
          </span>
        ) : groupBuy.status === "EXPIRED" ? (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-navy/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            Expired
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <p className="line-clamp-2 h-8 text-xs leading-snug text-navy">
          {product.name} {product.strength}
        </p>

        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="display-font text-base text-blue">{formatCurrency(product.groupPrice)}</span>
          {percentOff > 0 && (
            <span className="text-[11px] text-slate line-through">{formatCurrency(product.individualPrice)}</span>
          )}
        </div>

        {groupBuy ? (
          <>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-navy/10">
              <div className="h-full animate-fill-bar rounded-full bg-blue" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-1.5 text-[10px] text-slate">{groupBuy.anonymousClinicCount} clinics joined</p>
          </>
        ) : (
          <p className="mt-2 text-[10px] text-slate">No group buy yet</p>
        )}
      </div>
    </a>
  );
}
