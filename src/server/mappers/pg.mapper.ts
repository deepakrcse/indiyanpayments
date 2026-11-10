import 'server-only';
import { fields } from '@/server/http/fields';
import type { PaymentGateway, PaymentLink, PgCategory, PgGroup, PgSettlement, PgTransfer, WalletGateway } from '@/types/pg';

export function toWalletGateway(raw: unknown): WalletGateway {
  const f = fields(raw);
  return {
    groupId: f.int('groupId'),
    groupName: f.text('groupName'),
    settlementId: f.int('settlementId'),
    settlementName: f.text('settlementName'),
    settlementDays: f.int('settlementDays'),
    pgKey: f.str('pgKey'),
    chargeType: f.str('chargeType'),
    chargeValue: f.num('chargeValue'),
    minCharge: f.num('minCharge'),
    // Genuinely optional upstream: null means no cap configured, not zero.
    maxLimit: f.num('maxLimit'),
    categoryId: f.int('categoryId'),
    categoryName: f.text('categoryName'),
    pgId: f.int('pgId'),
    pgName: f.text('pgName'),
    description: f.str('description'),
  };
}

export function toPaymentLink(raw: unknown): PaymentLink {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    pgLink: f.text('pgLink'),
    refNo: f.text('refNo'),
    amount: f.amount('amount'),
    charges: f.amount('charges'),
    status: f.text('status'),
  };
}

/**
 * pg/TransferReport names the wallet owner "customerName"; Admin/PgTransferReport calls the same
 * person "retailerName" and adds MOBILE_NUMBER. Both become one row shape here. Partner charges and
 * profit are the portal's own margin, so they are only kept when `withMargins` is set (admins).
 */
export function toPgTransfer(raw: unknown, withMargins: boolean): PgTransfer {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    createdTime: f.text('createdTime'),
    walletId: f.int('walletId'),
    username: f.str('username'),
    retailerName: f.text('retailerName', 'customerName'),
    retailerMobile: f.text('MOBILE_NUMBER', 'username'),
    payerName: f.text('payerName'),
    cardNumber: f.text('cardNumber'),
    pgCode: f.text('pgCode'),
    pgName: f.text('pgName'),
    settlementName: f.text('settlementName'),
    amount: f.amount('amount'),
    charges: f.amount('charges'),
    partnerCharges: withMargins ? f.amount('partnerCharges') : null,
    profit: withMargins ? f.amount('profit') : null,
    status: f.text('status'),
    pipeRefNumber: f.str('pipeRefNumber'),
    walletCreditedTime: f.str('walletCreditedTime'),
    walletClosingBalance: f.num('walletClosingBalance'),
  };
}

export function toPgGroup(raw: unknown): PgGroup {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    groupName: f.text('groupName'),
    logoUrl: f.str('logoUrl'),
    displayOrder: f.int('displayOrder'),
    isActive: f.bool('isActive') ?? false,
    createdTime: f.str('createdTime'),
  };
}

export function toPgCategory(raw: unknown): PgCategory {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    categoryName: f.text('categoryName'),
    displayOrder: f.int('displayOrder'),
    isActive: f.bool('isActive') ?? false,
    createdTime: f.str('createdTime'),
  };
}

function toSettlement(raw: unknown): PgSettlement {
  const f = fields(raw);
  return {
    settlementId: f.int('settlementId'),
    settlementName: f.text('settlementName'),
    settlementDays: f.int('settlementDays'),
    pgKey: f.str('pgKey'),
    partnerChargeType: f.str('partnerChargeType'),
    partnerChargeValue: f.amount('partnerChargeValue'),
    partnerMinCharge: f.amount('partnerMinCharge'),
    isActive: f.bool('isActive') ?? false,
    chargeId: f.int('chargeId'),
    chargeType: f.str('chargeType'),
    chargeValue: f.amount('chargeValue'),
    minCharge: f.amount('minCharge'),
    chargeIsActive: f.bool('chargeIsActive') ?? false,
  };
}

/** PgSettings/Pg/SelectAll names the gateway's id "PgId" (not "Id" like groups and categories). */
export function toPaymentGateway(raw: unknown): PaymentGateway {
  const f = fields(raw);
  return {
    id: f.int('PgId', 'Id'),
    groupId: f.int('groupId'),
    categoryId: f.int('categoryId'),
    pgName: f.text('pgName'),
    description: f.str('description'),
    displayOrder: f.int('displayOrder'),
    isActive: f.bool('isActive') ?? false,
    createdTime: f.str('createdTime'),
    settlements: f.list('settlements').map(toSettlement),
  };
}
