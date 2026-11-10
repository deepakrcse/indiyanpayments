'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { formatCharge, rupeesOrDash } from '@/lib/format';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { routes } from '@/config/routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TD, TH, THead, TR } from '@/components/ui/table';
import type { QrCode as QrCodeT } from '@/types/qr';

const EMPTY = { qrName: '', vpa: '', chargeType: 'PERCENT' as 'PERCENT' | 'VALUE', chargeValue: '', minCharge: '', dailyMaxLimit: '', displayOrder: '' };

/** Admin › QR codes: the static QR pool, and adding to it. */
export function QrCodesView() {
  const qc = useQueryClient();
  const codes = useQuery({ queryKey: qk.qrCodes, queryFn: () => api.get<QrCodeT[]>('/api/qr/codes') });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: () =>
      api.post('/api/qr/codes', {
        qrName: form.qrName.trim(),
        vpa: form.vpa.trim(),
        chargeType: form.chargeType,
        chargeValue: Number(form.chargeValue),
        minCharge: Number(form.minCharge),
        dailyMaxLimit: Number(form.dailyMaxLimit),
        displayOrder: Number(form.displayOrder),
      }),
    onSuccess: () => {
      toast.success('QR code added');
      setAdding(false);
      qc.invalidateQueries({ queryKey: qk.qrCodes });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.qrName.trim() || !form.vpa.trim() || !form.chargeValue || !form.minCharge || !form.dailyMaxLimit || !form.displayOrder) return setError('Fill in all fields.');
    setError(null);
    add.mutate();
  };

  const money = (key: 'chargeValue' | 'minCharge' | 'dailyMaxLimit') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = sanitizeAmount(e.target.value);
    if (v !== null) setForm((f) => ({ ...f, [key]: v }));
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="QR codes"
        description="The static QR pool retailers pull from, with each code's charge and daily limit."
        back={routes.admin}
        actions={
          <>
            <RefreshButton onRefresh={() => codes.refetch()} label="Refresh" title="Refresh QR codes" variant="outline" />
            <Button
              size="sm"
              onClick={() => {
                setForm(EMPTY);
                setError(null);
                setAdding(true);
              }}
            >
              <Plus className="size-4" /> Add QR code
            </Button>
          </>
        }
      />
      <Card className="overflow-hidden">
        {codes.isPending && <LoadingRows rows={4} />}
        {codes.isError && <Alert tone="danger" className="m-5">Couldn&apos;t load QR codes: {codes.error.message}</Alert>}
        {codes.isSuccess && codes.data.length === 0 && <EmptyState icon={<QrCode />} title="No QR codes yet">Add the first one to start taking static QR payments.</EmptyState>}
        {codes.data && codes.data.length > 0 && (
          <Table>
            <THead>
              <tr>
                <TH>ID</TH>
                <TH>Name</TH>
                <TH>VPA</TH>
                <TH align="right">Charge</TH>
                <TH align="right">Min charge</TH>
                <TH align="right">Daily limit</TH>
                <TH align="right">Order</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <tbody>
              {codes.data.map((q, i) => (
                <TR key={q.id ?? i}>
                  <TD className="tabular">#{q.id ?? '—'}</TD>
                  <TD className="font-bold text-ink-900">{q.qrName ?? '—'}</TD>
                  <TD className="font-mono text-[12.5px]">{q.vpa ?? '—'}</TD>
                  <TD align="right">{q.chargeType && q.chargeValue != null ? formatCharge(q.chargeType, q.chargeValue) : '—'}</TD>
                  <TD align="right">{rupeesOrDash(q.minCharge)}</TD>
                  <TD align="right">{rupeesOrDash(q.dailyMaxLimit)}</TD>
                  <TD align="right">{q.displayOrder ?? '—'}</TD>
                  <TD>{q.status ? <Badge tone={/active|true/i.test(q.status) ? 'success' : 'neutral'}>{q.status}</Badge> : '—'}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Dialog open={adding} onClose={() => !add.isPending && setAdding(false)} dismissible={!add.isPending} title="Add QR code" icon={<QrCode />} size="md">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">{(p) => <Input {...p} autoFocus placeholder="e.g. Counter QR 1" value={form.qrName} onChange={(e) => setForm((f) => ({ ...f, qrName: e.target.value }))} />}</Field>
            <Field label="VPA">{(p) => <Input {...p} placeholder="shop@upi" className="font-mono" value={form.vpa} onChange={(e) => setForm((f) => ({ ...f, vpa: e.target.value }))} />}</Field>
            <Field label="Charge type">
              {(p) => (
                <Select {...p} value={form.chargeType} onChange={(e) => setForm((f) => ({ ...f, chargeType: e.target.value as 'PERCENT' | 'VALUE' }))}>
                  <option value="PERCENT">Percentage</option>
                  <option value="VALUE">Flat value</option>
                </Select>
              )}
            </Field>
            <Field label="Charge value">{(p) => <Input {...p} inputMode="decimal" placeholder="1.5" value={form.chargeValue} onChange={money('chargeValue')} />}</Field>
            <Field label="Min charge (₹)">{(p) => <Input {...p} inputMode="decimal" placeholder="5" value={form.minCharge} onChange={money('minCharge')} />}</Field>
            <Field label="Daily max limit (₹)">{(p) => <Input {...p} inputMode="decimal" placeholder="50000" value={form.dailyMaxLimit} onChange={money('dailyMaxLimit')} />}</Field>
            <Field label="Display order">{(p) => <Input {...p} inputMode="numeric" placeholder="1" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value.replace(/\D/g, '') }))} />}</Field>
          </div>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex gap-2.5">
            <Button variant="outline" block onClick={() => setAdding(false)} disabled={add.isPending}>
              Cancel
            </Button>
            <Button type="submit" block loading={add.isPending}>
              Add QR code
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
