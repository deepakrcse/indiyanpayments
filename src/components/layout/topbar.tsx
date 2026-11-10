'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronDown, LogOut, Plus, Settings2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RefreshButton } from '@/components/ui/refresh-button';
import { rupees } from '@/lib/format';
import { routes } from '@/config/routes';
import { Avatar } from '@/components/ui/avatar';
import { BrandLogo, BrandMark } from '@/components/brand/brand-logo';
import { useSession } from '@/features/auth/session-context';
import { useAnnouncements } from '@/features/announcements/announcement-center';
import { AddCreditDialog } from '@/features/wallet/add-credit-dialog';
import { useWallet } from '@/features/wallet/use-wallet';
import { useNavigationHistory } from './navigation-history';

function AccountMenu() {
  const { user, signOut } = useSession();
  const { markTopLevel } = useNavigationHistory();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-2xl py-1 pr-2 pl-1 transition hover:bg-slate-100"
      >
        <Avatar name={user.fullName || user.username} size={36} />
        <span className="hidden min-w-0 text-left md:block">
          <span className="block max-w-40 truncate text-[13px] font-bold text-ink-900">{user.fullName || user.username}</span>
          <span className="block max-w-40 truncate text-[11.5px] text-slate-500">
            {user.storeName || user.username}
            {user.roleName ? ` · ${user.roleName}` : ''}
          </span>
        </span>
        <ChevronDown className={cn('size-4 text-slate-400 transition-transform max-sm:hidden', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="absolute top-[calc(100%+8px)] right-0 z-30 w-60 animate-pop rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift">
          <div className="border-b border-slate-100 px-3 pt-2 pb-3">
            <p className="truncate text-sm font-bold text-ink-900">{user.fullName}</p>
            <p className="truncate text-[12px] text-slate-500">Login ID {user.username}</p>
          </div>
          <Link
            href={routes.profile}
            role="menuitem"
            onClick={() => {
              markTopLevel();
              setOpen(false);
            }}
            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-800 hover:bg-brand-50"
          >
            <Settings2 className="size-4 text-slate-500" /> Profile & security
          </Link>
          <button type="button" role="menuitem" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-rose-600 hover:bg-rose-50">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Top bar: the logo (→ dashboard), live wallet balance, Add credit (admins), announcements and the
 * account menu — as on TamilPay's brand bar. Its content lines up with the page's own width.
 */
export function Topbar() {
  const { user, isAdmin } = useSession();
  const { items, openAll } = useAnnouncements();
  const { markTopLevel } = useNavigationHistory();
  const wallet = useWallet();
  const [crediting, setCrediting] = useState(false);
  const balance = wallet.data?.currentBalance ?? user.balanceAtLogin;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-400 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href={routes.home} onClick={markTopLevel} className="shrink-0" aria-label="Indiyan Payments — dashboard">
          <BrandMark size={36} className="sm:hidden" priority />
          <BrandLogo height={46} className="max-sm:hidden" priority />
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white py-1 pr-1 pl-3.5 shadow-card">
            <span className="hidden text-[11px] font-bold tracking-wider text-slate-400 uppercase sm:inline">Wallet</span>
            <span className="ml-1 text-[15px] font-extrabold tabular text-ink-900">{rupees(balance)}</span>
            <RefreshButton onRefresh={() => wallet.refetch()} title="Refresh balance" className="ml-0.5 size-7" iconClassName="[&_svg]:size-3.5" />
            {isAdmin && (
              <button
                type="button"
                onClick={() => setCrediting(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-2.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-brand-700"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Add credit</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openAll}
            disabled={items.length === 0}
            className="relative grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink-900 disabled:opacity-50"
            aria-label={items.length ? `${items.length} announcements` : 'No announcements'}
            title={items.length ? 'Announcements' : 'Nothing new'}
          >
            <Bell className="size-5" />
            {items.length > 0 && (
              <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{items.length}</span>
            )}
          </button>

          <AccountMenu />
        </div>
      </div>
      {isAdmin && <AddCreditDialog open={crediting} onClose={() => setCrediting(false)} />}
    </header>
  );
}
