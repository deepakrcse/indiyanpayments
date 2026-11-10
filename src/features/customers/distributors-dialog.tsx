'use client';

import Link from 'next/link';
import { Network } from 'lucide-react';
import { routes } from '@/config/routes';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { roleOf, useCustomers } from './api';

/** Admin › Distributors: everyone with the Distributors role, each with a link to their mapping. */
export function DistributorsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const customers = useCustomers();
  const rows = (customers.data ?? []).filter((c) => roleOf(c) === 'distributor');

  return (
    <Dialog open={open} onClose={onClose} title={`Distributors${customers.data ? ` · ${rows.length}` : ''}`} description="Kept out of the Customers list; open one to see and map their retailers." icon={<Network />} size="lg">
      {customers.isPending && <LoadingRows rows={3} />}
      {customers.isError && <Alert tone="danger">{customers.error.message}</Alert>}
      {customers.isSuccess && rows.length === 0 && (
        <EmptyState icon={<Network />} title="No distributors yet">
          Anyone given the Distributors role will be listed here.
        </EmptyState>
      )}
      <div className="scrollbar-thin max-h-[55vh] space-y-2 overflow-y-auto">
        {rows.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-3">
            <Avatar name={c.fullName} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-ink-900">{c.fullName}</p>
              <p className="truncate text-[12.5px] text-slate-500">
                +91 {c.mobileNumber}
                {c.storeName ? ` · ${c.storeName}` : ''}
              </p>
            </div>
            {c.hasWallet ? (
              <Link href={`${routes.mapping(c.id)}?from=admin`} onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-[12.5px] font-bold text-brand-700 hover:bg-brand-100">
                <Network className="size-3.5" /> View mapping
              </Link>
            ) : (
              <span className="text-[12px] text-slate-400" title="A wallet has to be added first">
                No wallet yet
              </span>
            )}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
