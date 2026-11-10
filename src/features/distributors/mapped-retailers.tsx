import type { ReactNode } from 'react';
import { Percent, Users, Wallet } from 'lucide-react';
import { rupees } from '@/lib/format';
import { Avatar } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/stat-card';
import { Stacked, Table, TD, TH, THead, TR } from '@/components/ui/table';
import type { MappedRetailer } from '@/types/customer';

/** The three figures over a distributor's mapping: how many, their combined balance, the average commission. */
export function MappingStats({ rows, loading }: { rows: MappedRetailer[] | undefined; loading: boolean }) {
  const list = rows ?? [];
  const total = list.reduce((s, r) => s + r.currentBalance, 0);
  const average = list.length ? list.reduce((s, r) => s + (r.pgCommissionPercent ?? 0), 0) / list.length : null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Mapped retailers" value={list.length} icon={<Users />} tone="brand" loading={loading} />
      <StatCard label="Combined balance" value={rupees(total)} icon={<Wallet />} tone="jade" loading={loading} />
      <StatCard label="Average commission" value={average == null ? '—' : `${Number(average.toFixed(4))}%`} icon={<Percent />} tone="gold" loading={loading} />
    </div>
  );
}

export function MappedRetailersTable({ rows, footer }: { rows: MappedRetailer[]; footer?: ReactNode }) {
  return (
    <>
      <Table maxHeight="60vh">
        <THead>
          <tr>
            <TH>Retailer</TH>
            <TH>Mobile</TH>
            <TH align="right">Balance</TH>
            <TH align="right">Card commission</TH>
          </tr>
        </THead>
        <tbody>
          {rows.map((r) => (
            <TR key={r.id || r.retailerWalletId}>
              <TD>
                <div className="flex items-center gap-3">
                  <Avatar name={r.fullName} size={36} />
                  <Stacked primary={r.fullName} secondary={r.storeName} />
                </div>
              </TD>
              <TD className="font-mono text-[12.5px]">{r.mobileNumber ? `+91 ${r.mobileNumber}` : '—'}</TD>
              <TD align="right" className="font-bold text-ink-900">{rupees(r.currentBalance)}</TD>
              <TD align="right">
                <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[12px] font-bold text-gold-600">{r.pgCommissionPercent != null ? `${Number(r.pgCommissionPercent)}%` : '—'}</span>
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
      {footer}
    </>
  );
}
