import { cn } from '@/lib/cn';
import { dateTime, rupees } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';
import { Stacked, Table, TD, TH, THead, TR } from '@/components/ui/table';
import type { LedgerEntry } from '@/types/wallet';

/**
 * Every debit and credit on a wallet — TamilPay's eight columns: ID, Time, Type, Reason, Debit,
 * Credit, Balance, Status. (Charges and UTR live in the Wallet ledger report.)
 */
export function LedgerTable({ rows, maxHeight, className }: { rows: LedgerEntry[]; maxHeight?: string; className?: string }) {
  return (
    <Table maxHeight={maxHeight} className={className}>
      <THead>
        <tr>
          <TH>ID</TH>
          <TH>Time</TH>
          <TH>Type</TH>
          <TH>Reason</TH>
          <TH align="right">Debit</TH>
          <TH align="right">Credit</TH>
          <TH align="right">Balance</TH>
          <TH>Status</TH>
        </tr>
      </THead>
      <tbody>
        {rows.map((r) => (
          <TR key={r.id}>
            <TD className="font-semibold text-ink-900 tabular">{r.id}</TD>
            <TD className="whitespace-nowrap">{dateTime(r.createdTime)}</TD>
            <TD>
              <span className={cn('text-[12px] font-extrabold tracking-wide', r.txnType === 'CREDIT' ? 'text-jade-600' : 'text-rose-600')}>{r.txnType || '—'}</span>
            </TD>
            <TD className="max-w-72">
              {r.accountHolderName ? <Stacked primary={r.accountHolderName} secondary={`${r.accountNumber ?? ''} · ${r.ifsc ?? ''}`} /> : <span className="text-slate-600">{r.remarks || '—'}</span>}
            </TD>
            <TD align="right">{r.debit > 0 ? rupees(r.debit) : '—'}</TD>
            <TD align="right">{r.credit > 0 ? rupees(r.credit) : '—'}</TD>
            <TD align="right" className="font-bold text-ink-900">{rupees(r.balance)}</TD>
            <TD>
              <StatusBadge status={r.status} />
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
