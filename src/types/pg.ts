/** One row of the gateways mapped to a wallet: one per Group × Settlement × PG. */
export interface WalletGateway {
  groupId: number;
  groupName: string;
  settlementId: number;
  settlementName: string;
  settlementDays: number;
  pgKey: string | null;
  chargeType: string | null;
  chargeValue: number | null;
  minCharge: number | null;
  /** null = no limit configured. */
  maxLimit: number | null;
  categoryId: number;
  categoryName: string;
  pgId: number;
  pgName: string;
  description: string | null;
}

export interface PaymentLinkInput {
  pgCode: string;
  customerName: string;
  cardLast4: string;
  amount: number;
}

export interface PaymentLink {
  id: number;
  pgLink: string;
  refNo: string;
  amount: number;
  charges: number;
  status: string;
}

export type PaymentOutcome = 'success' | 'failed' | 'pending';

/** What the public status page shows — never charges, GST or vendor keys. */
export interface PaymentStatus {
  referenceId: string;
  outcome: PaymentOutcome;
  message: string;
  amount: number | null;
  utr: string | null;
  cardNumber: string | null;
  /** Wallet balance right after this payment was credited; only sent to the signed-in owner. */
  closingBalance: number | null;
}

export interface PgTransfer {
  id: number;
  createdTime: string;
  walletId: number;
  username: string | null;
  /** The wallet owner (retailer). */
  retailerName: string;
  retailerMobile: string;
  /** Who the link was made for. */
  payerName: string;
  cardNumber: string;
  pgCode: string;
  pgName: string;
  settlementName: string;
  amount: number;
  charges: number;
  partnerCharges: number | null;
  profit: number | null;
  status: string;
  pipeRefNumber: string | null;
  walletCreditedTime: string | null;
  walletClosingBalance: number | null;
}

// ── PG settings (admin) ───────────────────────────────────────────────────

export interface PgGroup {
  id: number;
  groupName: string;
  logoUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdTime: string | null;
}

export interface PgCategory {
  id: number;
  categoryName: string;
  displayOrder: number;
  isActive: boolean;
  createdTime: string | null;
}

export interface PgSettlement {
  settlementId: number;
  settlementName: string;
  settlementDays: number;
  pgKey: string | null;
  partnerChargeType: string | null;
  partnerChargeValue: number;
  partnerMinCharge: number;
  isActive: boolean;
  chargeId: number;
  chargeType: string | null;
  chargeValue: number;
  minCharge: number;
  chargeIsActive: boolean;
}

export interface PaymentGateway {
  id: number;
  groupId: number;
  categoryId: number;
  pgName: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdTime: string | null;
  settlements: PgSettlement[];
}

export type ChargeType = 'PERCENT' | 'VALUE';

export interface PgGroupInput {
  groupName: string;
  logoUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface PgCategoryInput {
  categoryName: string;
  displayOrder: number;
  isActive: boolean;
}

export interface PaymentGatewayInput {
  groupId: number;
  categoryId: number;
  pgName: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface PgSettlementInput {
  pgId: number;
  settlementName: string;
  settlementDays: number;
  pgKey?: string | null;
  partnerChargeType: ChargeType;
  partnerChargeValue: number;
  partnerMinCharge: number;
  chargeType: ChargeType;
  chargeValue: number;
  minCharge: number;
  isActive: boolean;
}
