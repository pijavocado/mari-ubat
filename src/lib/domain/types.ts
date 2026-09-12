export type VerificationStatus = "PENDING" | "VERIFIED";

export type GroupBuyStatus =
  | "OPEN"
  | "AT_RISK"
  | "MOQ_REACHED"
  | "READY_FOR_FULFILMENT"
  | "EXPIRED";

export type CommitmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type RiskLabel = "LOW" | "MEDIUM" | "AT_RISK";

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface DemoProduct {
  id: string;
  name: string;
  strength: string;
  groupPrice: number;
  individualPrice: number;
  category: string;
}
