'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, CreditCard, Pencil, Plus, Send, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/cn';
import { formatCharge, rupees } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { SearchSelect } from '@/components/ui/search-select';
import { Table, TD, TH, THead, TR } from '@/components/ui/table';
import { useRetailers } from '@/features/customers/api';
import type { PaymentGateway, PgCategory, PgGroup, PgSettlement } from '@/types/pg';
import { SettlementDialog } from './settlement-dialog';

const EMPTY = { groupId: '', categoryId: '', pgName: '', description: '', displayOrder: '', isActive: true };

/** "Apply to one retailer": pushes the current setup to a single wallet. */
function ApplyToOneDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const retailers = useRetailers(open);
  const [walletId, setWalletId] = useState('');
  const apply = useMutation({
    mutationFn: () => api.post<{ message: string }>('/api/pg-settings/apply-to-wallet', { walletId: Number(walletId) }),
    onSuccess: (res) => {
      toast.success(res.message || 'Applied to that retailer.');
      setWalletId('');
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <Dialog open={open} onClose={onClose} title="Apply to one retailer" description="Pushes the current gateway setup to this retailer's wallet." icon={<Send />} size="sm">
      <div className="space-y-4">
        <SearchSelect
          options={(retailers.data ?? []).map((r) => ({ value: String(r.walletId), label: r.fullName, hint: r.storeName }))}
          value={walletId}
          onChange={setWalletId}
          loading={retailers.isPending}
          placeholder="Type a retailer name or store"
          emptyText="No retailer matches."
        />
        <Button block disabled={!walletId} loading={apply.isPending} onClick={() => apply.mutate()}>
          Apply
        </Button>
      </div>
    </Dialog>
  );
}

export function GatewaysSection() {
  const qc = useQueryClient();
  const gateways = useQuery({ queryKey: qk.pgGateways, queryFn: () => api.get<PaymentGateway[]>('/api/pg-settings/gateways') });
  const groups = useQuery({ queryKey: qk.pgGroups, queryFn: () => api.get<PgGroup[]>('/api/pg-settings/groups') });
  const categories = useQuery({ queryKey: qk.pgCategories, queryFn: () => api.get<PgCategory[]>('/api/pg-settings/categories') });

  const [editing, setEditing] = useState<PaymentGateway | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PaymentGateway | null>(null);
  const [deletingSettlement, setDeletingSettlement] = useState<PgSettlement | null>(null);
  const [settlement, setSettlement] = useState<{ pg: PaymentGateway; settlement: PgSettlement | null } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirmSync, setConfirmSync] = useState(false);
  const [applyOne, setApplyOne] = useState(false);

  const groupName = (id: number) => groups.data?.find((g) => g.id === id)?.groupName ?? `#${id}`;
  const categoryName = (id: number) => categories.data?.find((c) => c.id === id)?.categoryName ?? `#${id}`;

  const save = useMutation({
    mutationFn: (body: unknown) => (editing && editing !== 'new' ? api.put<PaymentGateway[]>(`/api/pg-settings/gateways/${editing.id}`, body) : api.post<PaymentGateway[]>('/api/pg-settings/gateways', body)),
    onSuccess: (list) => {
      qc.setQueryData(qk.pgGateways, list);
      toast.success('Payment gateway saved');
      setEditing(null);
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api/pg-settings/gateways/${id}`),
    onSuccess: () => {
      toast.success('Payment gateway deleted');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: qk.pgGateways });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const removeSettlement = useMutation({
    mutationFn: (id: number) => api.del(`/api/pg-settings/settlements/${id}`),
    onSuccess: () => {
      toast.success('Settlement deleted');
      setDeletingSettlement(null);
      qc.invalidateQueries({ queryKey: qk.pgGateways });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const sync = useMutation({
    mutationFn: () => api.post<{ message: string }>('/api/pg-settings/sync'),
    onSuccess: (res) => {
      toast.success(res.message || 'Applied to every retailer.');
      setConfirmSync(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const open = (item: PaymentGateway | 'new') => {
    setForm(item === 'new' ? EMPTY : { groupId: String(item.groupId), categoryId: String(item.categoryId), pgName: item.pgName, description: item.description ?? '', displayOrder: String(item.displayOrder), isActive: item.isActive });
    setFormError(null);
    setEditing(item);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.pgName.trim() || !form.groupId || !form.categoryId || form.displayOrder === '') return setFormError('Enter a name, group, category and display order.');
    save.mutate({ groupId: Number(form.groupId), categoryId: Number(form.categoryId), pgName: form.pgName.trim(), description: form.description.trim(), displayOrder: Number(form.displayOrder), isActive: form.isActive });
  };

  const toggle = (id: number) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Payment gateways"
        description="Each gateway, its settlement options and their charges."
        icon={<CreditCard />}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setApplyOne(true)}>
              <Send className="size-4" /> Apply to one
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmSync(true)}>
              <UsersRound className="size-4" /> Apply to all
            </Button>
            <Button size="sm" onClick={() => open('new')}>
              <Plus className="size-4" /> Add gateway
            </Button>
          </>
        }
      />
      {gateways.isPending && <LoadingRows rows={4} />}
      {gateways.isError && <Alert tone="danger" className="m-5">Couldn&apos;t load payment gateways: {gateways.error.message}</Alert>}
      {gateways.isSuccess && gateways.data.length === 0 && <EmptyState icon={<CreditCard />} title="No payment gateways yet" />}

      <ul className="divide-y divide-slate-100">
        {[...(gateways.data ?? [])]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((pg) => {
            const isOpen = expanded.has(pg.id);
            return (
              <li key={pg.id}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <button type="button" onClick={() => toggle(pg.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={isOpen}>
                    <ChevronDown className={cn('size-4 shrink-0 text-slate-400 transition-transform', !isOpen && '-rotate-90')} />
                    <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <CreditCard className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-ink-900">{pg.pgName}</span>
                      <span className="block truncate text-[12px] text-slate-500">
                        {groupName(pg.groupId)} · {categoryName(pg.categoryId)} · order {pg.displayOrder}
                      </span>
                    </span>
                  </button>
                  <Badge tone="brand">{pg.settlements.length} settlement{pg.settlements.length === 1 ? '' : 's'}</Badge>
                  <Badge tone={pg.isActive ? 'success' : 'neutral'} dot>
                    {pg.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => open(pg)} aria-label={`Edit ${pg.pgName}`}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleting(pg)} aria-label={`Delete ${pg.pgName}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="animate-rise border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase">Settlements</p>
                      <Button size="xs" variant="secondary" onClick={() => setSettlement({ pg, settlement: null })}>
                        <Plus className="size-3.5" /> Add settlement
                      </Button>
                    </div>
                    {pg.settlements.length === 0 ? (
                      <p className="text-[13px] text-slate-500">No settlements on this gateway yet.</p>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <Table>
                          <THead>
                            <tr>
                              <TH>Settlement</TH>
                              <TH align="right">Days</TH>
                              <TH>PG key</TH>
                              <TH align="right">Partner charge</TH>
                              <TH align="right">Partner min</TH>
                              <TH align="right">Retailer charge</TH>
                              <TH align="right">Retailer min</TH>
                              <TH>Status</TH>
                              <TH align="right">Actions</TH>
                            </tr>
                          </THead>
                          <tbody>
                            {pg.settlements.map((s) => (
                              <TR key={s.settlementId}>
                                <TD className="font-semibold text-ink-900">{s.settlementName}</TD>
                                <TD align="right">{s.settlementDays}</TD>
                                <TD className="font-mono text-[12px]">{s.pgKey || '—'}</TD>
                                <TD align="right">{formatCharge(s.partnerChargeType, s.partnerChargeValue)}</TD>
                                <TD align="right">{rupees(s.partnerMinCharge)}</TD>
                                <TD align="right" className="font-bold text-brand-700">{formatCharge(s.chargeType, s.chargeValue)}</TD>
                                <TD align="right">{rupees(s.minCharge)}</TD>
                                <TD>
                                  <Badge tone={s.isActive ? 'success' : 'neutral'} dot>
                                    {s.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TD>
                                <TD align="right">
                                  <div className="inline-flex gap-1">
                                    <Button size="icon-sm" variant="ghost" onClick={() => setSettlement({ pg, settlement: s })} aria-label="Edit settlement">
                                      <Pencil className="size-4" />
                                    </Button>
                                    <Button size="icon-sm" variant="ghost" className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeletingSettlement(s)} aria-label="Delete settlement">
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                </TD>
                              </TR>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
      </ul>

      <Dialog open={editing !== null} onClose={() => !save.isPending && setEditing(null)} dismissible={!save.isPending} title={editing && editing !== 'new' ? 'Edit payment gateway' : 'Add payment gateway'} icon={<CreditCard />} size="md">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Gateway name">{(p) => <Input {...p} autoFocus value={form.pgName} onChange={(e) => setForm((f) => ({ ...f, pgName: e.target.value }))} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Group">
              {(p) => (
                <Select {...p} value={form.groupId} onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}>
                  <option value="">Select a group…</option>
                  {(groups.data ?? []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Category">
              {(p) => (
                <Select {...p} value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">Select a category…</option>
                  {(categories.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.categoryName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <Field label="Description (optional)">{(p) => <Textarea {...p} rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />}</Field>
          <Field label="Display order">{(p) => <Input {...p} inputMode="numeric" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value.replace(/\D/g, '') }))} />}</Field>
          <Checkbox label="Active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          {formError && <Alert tone="danger">{formError}</Alert>}
          <div className="flex gap-2.5">
            <Button variant="outline" block onClick={() => setEditing(null)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" block loading={save.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Dialog>

      {settlement && <SettlementDialog key={`${settlement.pg.id}-${settlement.settlement?.settlementId ?? 'new'}`} target={settlement} onClose={() => setSettlement(null)} />}

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)} busy={remove.isPending} title="Delete payment gateway" confirmLabel="Delete">
        Delete <strong className="text-ink-900">“{deleting?.pgName}”</strong> and its settlements?
      </ConfirmDialog>
      <ConfirmDialog open={Boolean(deletingSettlement)} onClose={() => setDeletingSettlement(null)} onConfirm={() => deletingSettlement && removeSettlement.mutate(deletingSettlement.settlementId)} busy={removeSettlement.isPending} title="Delete settlement" confirmLabel="Delete">
        Delete the settlement <strong className="text-ink-900">“{deletingSettlement?.settlementName}”</strong>?
      </ConfirmDialog>
      <ConfirmDialog open={confirmSync} onClose={() => setConfirmSync(false)} onConfirm={() => sync.mutate()} busy={sync.isPending} title="Apply to every retailer?" confirmLabel="Apply to all" tone="primary">
        This pushes the current gateway setup — groups, categories, gateways, settlements and charges — to every retailer&apos;s wallet.
      </ConfirmDialog>
      <ApplyToOneDialog open={applyOne} onClose={() => setApplyOne(false)} />
    </Card>
  );
}
