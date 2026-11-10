'use client';

import { useState } from 'react';
import { ChevronRight, Landmark } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { BankAccount } from '@/types/imps';

/** One saved bank account, drawn the same way everywhere it appears. */
export function BankAccountCard({ account, onClick, selected = false }: { account: BankAccount; onClick?: () => void; selected?: boolean }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition',
        selected ? 'border-brand-500 bg-brand-50/70 ring-4 ring-brand-500/10' : 'border-slate-200 bg-white',
        onClick && !selected && 'hover:border-brand-300 hover:shadow-card',
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white">
        {account.bankLogoUrl && !logoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote bank logos from the payments service
          <img src={account.bankLogoUrl} alt="" className="size-8 object-contain" onError={() => setLogoFailed(true)} />
        ) : (
          <Landmark className="size-5 text-brand-500" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-ink-900">{account.accountHolderName}</span>
        <span className="block truncate text-[12px] text-slate-500">{account.bankName || 'Bank account'}</span>
      </span>
      <span className="text-right">
        <span className="block font-mono text-[13px] font-semibold text-ink-900">{account.accountNumber}</span>
        <span className="block font-mono text-[11.5px] text-slate-500">{account.ifsc}</span>
      </span>
      {onClick && <ChevronRight className="size-4 shrink-0 text-slate-300" />}
    </Tag>
  );
}
