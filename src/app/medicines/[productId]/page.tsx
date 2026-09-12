import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductDetail } from "@/lib/domain/product";
import { getCurrentSession } from "@/lib/domain/session";
import { getClinicForSession } from "@/lib/domain/clinic";
import { getCommitmentForClinic, MAX_COMMITMENT_QUANTITY } from "@/lib/domain/commitment";
import { isAcceptingCommitments } from "@/lib/domain/groupBuy";
import { formatCurrency } from "@/lib/format";
import { ChevronLeftIcon, CapsuleIcon, InfoIcon } from "@/components/icons";
import { Tooltip } from "@/components/Tooltip";
import { CountdownTimer } from "@/components/CountdownTimer";
import { NavMenu } from "@/components/NavMenu";
import { categorySwatch, discountPercent, productPhoto } from "../presentation";
import { JoinGroupBuyForm } from "./JoinGroupBuyForm";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const product = await getProductDetail(productId);
  if (!product) notFound();

  const { groupBuy } = product;
  const percentOff = discountPercent(product.individualPrice, product.groupPrice);
  const progressPercent = groupBuy
    ? Math.min(100, Math.round((groupBuy.currentQuantity / groupBuy.targetQuantity) * 100))
    : 0;
  const accepting = groupBuy ? isAcceptingCommitments(groupBuy.status) : false;
  const closedReason =
    groupBuy?.status === "EXPIRED"
      ? "This group buy has expired."
      : groupBuy && !accepting
        ? "This group has already reached its target quantity."
        : null;

  const session = await getCurrentSession();
  const clinic = session ? await getClinicForSession(session.id) : null;
  const commitment =
    groupBuy && clinic ? await getCommitmentForClinic(groupBuy.id, clinic.id) : null;
  const photo = productPhoto(product.id);

  return (
    <main className="min-h-screen bg-paper pb-10">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-navy px-4 py-3.5 text-white">
        <NavMenu variant="dark" groupBuyHref={`/medicines/${productId}/track`} orderHref={`/medicines/${productId}/order`} />
        <a
          href="/medicines"
          aria-label="Back to catalogue"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </a>
        <p className="display-font truncate text-sm">{product.name}</p>
      </div>

      <div className="mx-auto max-w-4xl md:flex md:gap-6 md:p-6">
        <div
          className={`relative flex aspect-square items-center justify-center md:w-80 md:shrink-0 md:rounded-xl ${
            photo ? "bg-white" : categorySwatch(product.category)
          }`}
        >
          {photo ? (
            <Image
              src={photo}
              alt={`${product.name} ${product.strength}`}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-contain p-6"
              priority
            />
          ) : (
            <CapsuleIcon className="h-16 w-16 text-navy/25" />
          )}
          {percentOff > 0 && (
            <span className="absolute left-0 top-0 rounded-br-lg bg-blue px-2 py-1 text-xs font-semibold text-white md:rounded-tl-xl">
              -{percentOff}%
            </span>
          )}
        </div>

        <div className="bg-white p-5 shadow-soft md:flex-1 md:rounded-xl md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue">{product.category}</p>
          <h1 className="display-font mt-1.5 text-xl leading-snug text-navy">
            {product.name} {product.strength}
          </h1>
          <p className="mt-1 text-xs text-slate">
            {product.manufacturer} · {product.packSize}
          </p>

          <div className="mt-5 flex items-baseline gap-2.5 rounded-lg bg-paper px-4 py-3.5">
            <span className="display-font text-2xl text-blue">{formatCurrency(product.groupPrice)}</span>
            {percentOff > 0 && (
              <>
                <span className="text-sm text-slate line-through">{formatCurrency(product.individualPrice)}</span>
                <span className="rounded-full bg-blue/10 px-1.5 py-0.5 text-[11px] font-semibold text-blue">
                  -{percentOff}%
                </span>
              </>
            )}
            <Tooltip label="Unlocks once the group reaches its required quantity (MOQ)">
              <span
                tabIndex={0}
                className="ml-auto inline-flex cursor-help items-center gap-1 text-[11px] font-medium text-slate"
              >
                Group price <InfoIcon className="h-3.5 w-3.5" />
              </span>
            </Tooltip>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate">You commit only to your own quantity.</p>

          {groupBuy ? (
            <div className="mt-5 rounded-lg border border-navy/10 p-4">
              <div className="flex items-baseline justify-between text-sm font-semibold text-navy">
                <span>
                  {groupBuy.currentQuantity}/{groupBuy.targetQuantity} boxes
                </span>
                <CountdownTimer deadlineAt={groupBuy.deadlineAt} className="text-xs font-medium text-slate" />
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-full animate-fill-bar rounded-full bg-blue"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-2.5 text-[11px] text-slate">
                {groupBuy.remainingQuantity} boxes to go · {groupBuy.anonymousClinicCount} clinics joined ·
                identities hidden
              </p>
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-navy/15 p-4 text-xs text-slate">
              No active group buy yet for this medicine.
            </p>
          )}

          {groupBuy && commitment ? (
            <div className="mt-5 rounded-lg bg-sky/40 p-4">
              <p className="text-sm font-semibold text-navy">You&apos;ve joined this group buy</p>
              <p className="mt-1 text-xs leading-5 text-slate">
                Your order: {commitment.quantity} boxes · Estimated savings {formatCurrency(commitment.estimatedSavings)}
              </p>
              <a
                href={`/medicines/${productId}/track`}
                className="display-font mt-3 inline-flex rounded-full bg-navy px-5 py-2.5 text-sm text-white transition hover:bg-navy-2"
              >
                View group progress
              </a>
            </div>
          ) : closedReason ? (
            <p className="mt-5 rounded-lg border border-navy/10 bg-paper p-4 text-center text-sm text-slate">
              {closedReason}
            </p>
          ) : groupBuy && clinic ? (
            <JoinGroupBuyForm
              productId={productId}
              groupPrice={product.groupPrice}
              individualPrice={product.individualPrice}
              maxQuantity={MAX_COMMITMENT_QUANTITY}
            />
          ) : groupBuy ? (
            <div className="mt-5 rounded-lg border border-navy/10 p-4 text-center">
              <p className="text-sm text-slate">Register your clinic to join this group buy.</p>
              <a
                href="/register"
                className="display-font mt-3 inline-flex rounded-full bg-navy px-5 py-2.5 text-sm text-white transition hover:bg-navy-2"
              >
                Register clinic
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
