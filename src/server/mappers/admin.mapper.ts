import 'server-only';
import { fields } from '@/server/http/fields';
import type { Announcement, CustomerBusinessRow, DashboardExplain, DashboardLogRow, DashboardSummary } from '@/types/admin';

export function toDashboardSummary(raw: unknown): DashboardSummary {
  const f = fields(raw);
  return {
    pipeBalances: f.list('pipeBalances').map((p) => {
      const pf = fields(p);
      return { pipeName: pf.text('pipeName'), balance: pf.amount('balance'), status: pf.text('status'), message: pf.text('message') };
    }),
    totalPipeBalance: f.amount('totalPipeBalance'),
    totalWalletBalance: f.amount('totalWalletBalance'),
    walletCount: f.int('walletCount'),
    difference: f.amount('difference'),
  };
}

export function toDashboardLogRow(raw: unknown): DashboardLogRow {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    createdTime: f.text('createdTime'),
    pipeName: f.text('pipeName'),
    pipeBalance: f.amount('pipeBalance'),
    totalWalletBalance: f.amount('totalWalletBalance'),
    walletCount: f.int('walletCount'),
    difference: f.amount('difference'),
    pipeStatus: f.text('pipeStatus'),
    pipeMessage: f.text('pipeMessage'),
  };
}

export function toDashboardExplain(raw: unknown): DashboardExplain {
  const f = fields(raw);
  const t = fields(f.raw('today'));
  return {
    walletCount: f.int('walletCount'),
    walletBalance: f.amount('walletBalance'),
    pipeBalance: f.amount('pipeBalance'),
    difference: f.amount('difference'),
    today: {
      pgCredit: t.amount('pgCredit'),
      impsSuccess: t.amount('impsSuccess'),
      impsFailed: t.amount('impsFailed'),
      impsRefund: t.amount('impsRefund'),
      impsPending: t.amount('impsPending'),
      bbpsSuccess: t.amount('bbpsSuccess'),
      bbpsFailed: t.amount('bbpsFailed'),
      bbpsRefund: t.amount('bbpsRefund'),
      verifyDebit: t.amount('verifyDebit'),
    },
  };
}

export function toCustomerBusinessRow(raw: unknown): CustomerBusinessRow {
  const f = fields(raw);
  return {
    customerName: f.str('customerName'),
    storeName: f.str('storeName'),
    mobileNumber: f.str('MOBILE_NUMBER'),
    walletId: f.int('walletId'),
    businessDate: f.text('businessDate'),
    pgAmount: f.amount('pgAmount'),
    pgCount: f.int('pgCount'),
    impsAmount: f.amount('impsAmount'),
    impsCount: f.int('impsCount'),
    bbpsAmount: f.amount('bbpsAmount'),
    bbpsCount: f.int('bbpsCount'),
  };
}

export function toAnnouncement(raw: unknown): Announcement {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    title: f.text('title'),
    message: f.text('message'),
    // Only an explicit false switches one off.
    isActive: f.bool('isActive') !== false,
    createdTime: f.str('createdTime'),
    updatedTime: f.str('updatedTime'),
  };
}
