'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import type { PaymentGateway, PgSettlement } from '@/types/pg';

type Form = {
  settlementName: string;
  settlementDays: string;
  pgKey: string;
  partnerChargeType: 'PERCENT' | 'VALUE';
  partnerChargeValue: string;
  partnerMinCharge: string;
  chargeType: 'PERCENT' | 'VALUE';
  chargeValue: string;
  minCharge: string;
  isActive: boolean;
};

const EMPTY: Form = { settlementName: '', settlementDays: '', pgKey: '', partnerChargeType: 'PERCENT', partnerChargeValue: '', partnerMinCharge: '', chargeType: 'PERCENT', chargeValue: '', minCharge: '', isActive: true };

const fromSettlement = (s: PgSettlement): Form => ({
  settlementName: s.settlementName,
  settlementDays: String(s.settlementDays),
  pgKey: s.pgKey ?? '',
  partnerChargeType: s.partnerChargeType === 'VALUE' ? 'VALUE' : 'PERCENT',
  partnerChargeValue: String(s.partnerChargeValue),
  partnerMinCharge: String(s.partnerMinCharge),
  chargeType: s.chargeType === 'VALUE' ? 'VALUE' : 'PERCENT',
  chargeValue: String(s.chargeValue),
  minCharge: String(s.minCharge),
  isActive: s.isActive,
});

/** Add or edit one settlement option on a gateway: the partner's charge, and the charge passed on to retailers. */
export function SettlementDialog({ target, onClose }: { target: { pg: PaymentGateway; settlement: PgSettlement | null } | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(() => (target?.settlement ? fromSettlement(target.settlement) : EMPTY));
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(target?.settlement);

  const save = useMutation({
    mutationFn: (body: unknown) => (editing ? api.put<PaymentGateway[]>(`/api/pg-settings/settlements/${target!.settlement!.settlementId}`, body) : api.post<PaymentGateway[]>('/api/pg-settings/settlements', body)),
    onSuccess: (list) => {
      qc.setQueryData(qk.pgGateways, list);
      toast.success('Settlement saved');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const money = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = sanitizeAmount(e.target.value, 4);
    if (v !== null) setForm((f) => ({ ...f, [key]: v }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const required: (keyof Form)[] = ['settlementName', 'settlementDays', 'partnerChargeValue', 'partnerMinCharge', 'chargeValue', 'minCharge'];
    if (required.some((k) => String(form[k]).trim() === '')) return setError('Fill in all required fields.');
    setError(null);
    save.mutate({
      pgId: target!.pg.id,
      settlementName: form.settlementName.trim(),
      settlementDays: Number(form.settlementDays),
      pgKey: form.pgKey.trim(),
      partnerChargeType: form.partnerChargeType,
      partnerChargeValue: Number(form.partnerChargeValue),
      partnerMinCharge: Number(form.partnerMinCharge),
      chargeType: form.chargeType,
      chargeValue: Number(form.chargeValue),
      minCharge: Number(form.minCharge),
      isActive: form.isActive,
    });
  };

  const chargeRow = (prefix: 'partner' | 'client') => {
    const typeKey = prefix === 'partner' ? 'partnerChargeType' : 'chargeType';
    const valueKey = prefix === 'partner' ? 'partnerChargeValue' : 'chargeValue';
    const minKey = prefix === 'partner' ? 'partnerMinCharge' : 'minCharge';
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Type">
          {(p) => (
            <Select {...p} value={form[typeKey]} onChange={(e) => setForm((f) => ({ ...f, [typeKey]: e.target.value as 'PERCENT' | 'VALUE' }))}>
              <option value="PERCENT">Percentage</option>
              <option value="VALUE">Flat value</option>
            </Select>
          )}
        </Field>
        <Field label="Value">{(p) => <Input {...p} inputMode="decimal" placeholder={form[typeKey] === 'PERCENT' ? '1.25' : '10'} value={form[valueKey]} onChange={money(valueKey)} />}</Field>
        <Field label="Min charge (₹)">{(p) => <Input {...p} inputMode="decimal" placeholder="0" value={form[minKey]} onChange={money(minKey)} />}</Field>
      </div>
    );
  };

  return (
    <Dialog open={Boolean(target)} onClose={() => !save.isPending && onClose()} dismissible={!save.isPending} title={editing ? 'Edit settlement' : 'Add settlement'} description={target?.pg.pgName} icon={<Layers />} size="xl">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Settlement name">{(p) => <Input {...p} autoFocus placeholder="e.g. T+0 Instant" value={form.settlementName} onChange={(e) => setForm((f) => ({ ...f, settlementName: e.target.value }))} />}</Field>
          <Field label="Settlement days">{(p) => <Input {...p} inputMode="numeric" placeholder="0" value={form.settlementDays} onChange={(e) => setForm((f) => ({ ...f, settlementDays: e.target.value.replace(/\D/g, '') }))} />}</Field>
          <Field label="PG key" hint="The gateway code used when generating links.">{(p) => <Input {...p} placeholder="pg0032" className="font-mono" value={form.pgKey} onChange={(e) => setForm((f) => ({ ...f, pgKey: e.target.value }))} />}</Field>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="mb-3 text-[12px] font-bold tracking-wider text-slate-500 uppercase">Partner charge — what the gateway charges us</p>
          {chargeRow('partner')}
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
          <p className="mb-3 text-[12px] font-bold tracking-wider text-brand-700 uppercase">Retailer charge — what retailers pay</p>
          {chargeRow('client')}
        </div>
        <Checkbox label="Active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {editing ? 'Save settlement' : 'Add settlement'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
