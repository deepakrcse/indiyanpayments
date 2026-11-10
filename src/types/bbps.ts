export interface BillerParam {
  paramName: string;
  dataType: string;
  optional: boolean;
  values: string[] | null;
}

export interface Biller {
  category: string;
  billerId: string;
  billerName: string;
  customerParams: BillerParam[];
}

export interface FetchBillInput {
  billerId: string;
  values: Record<string, string>;
}

export interface BillSummary {
  reference: string;
  fetchId: string | null;
  billerId: string;
  billerName: string;
  customerName: string | null;
  totalDue: number | null;
  minimumDue: number | null;
  maxPayable: number | null;
  minPayable: number | null;
  dueDate: string | null;
  billDate: string | null;
  /** The card matched but has nothing to pay this cycle. */
  noBillDue: boolean;
  message: string | null;
}

export interface PayBillInput {
  reference: string;
  amount: number;
}

export interface BillPaymentResult {
  message: string;
  amount: number;
  reference: string;
}

/** One wallet entry of a card-bill payment: the DEBIT that paid it, or the CREDIT that refunded it. */
export interface CardBillPayment {
  id: number | null;
  createdTime: string | null;
  walletId: number | null;
  txnType: string | null;
  amount: number;
  charges: number;
  closingBalance: number | null;
  npciRef: string | null;
  status: string;
  consumerName: string | null;
  cardNumber: string | null;
  retailerName: string | null;
  retailerMobile: string | null;
  storeName: string | null;
}
