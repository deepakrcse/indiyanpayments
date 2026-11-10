'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { QrCode, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { formatCharge, rupeesOrDash } from '@/lib/format';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert, Skeleton } from '@/components/ui/feedback';
import { Field, Input, Select } from '@/components/ui/field';
import type { StaticQr } from '@/types/qr';

/** The standard UPI deep link every UPI app reads. No amount: a static QR is reusable. */
const upiUri = (vpa: string, payee: string | null) => `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payee || 'Indiyana Payments')}&cu=INR`;

/**
 * Home › Static QR: pulls the next QR from the pool and draws it from its VPA. After the customer
 * pays, the retailer files a collect request with the amount and UTR for an admin to approve.
 * Every QR pulled while the dialog is open can be picked for the request.
 */
export function StaticQrDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [qr, setQr] = useState<StaticQr | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [pulled, setPulled] = useState<StaticQr[]>([]);
  const [form, setForm] = useState({ vpa: '', amount: '', utr: '', remarks: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const pull = useMutation({
    mutationFn: () => api.post<StaticQr>('/api/qr/next'),
    onSuccess: async (next) => {
      setQr(next);
      setPulled((list) => (list.some((q) => q.qrId === next.qrId) ? list : [...list, next]));
      setForm((f) => ({ ...f, vpa: next.vpa }));
      try {
        setImage(await QRCode.toDataURL(upiUri(next.vpa, next.qrName), { width: 260, margin: 1, color: { dark: '#022C71', light: '#FFFFFF' } }));
      } catch {
        setImage(null);
      }
    },
  });

  const submit = useMutation({
    mutationFn: (body: { qrId: number; vpa: string; amount: number; utr: string; remarks: string }) => api.post<{ message: string }>('/api/qr/requests', body),
    onSuccess: (res) => {
      toast.success(res.message || 'Request created', { description: 'An admin will approve it shortly.' });
      onClose();
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  // A fresh pull every time the dialog opens.
  const { mutate: pullNext, reset: resetPull } = pull;
  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- resetting the dialog each time it opens */
    setQr(null);
    setImage(null);
    setPulled([]);
    setForm({ vpa: '', amount: '', utr: '', remarks: '' });
    setFormError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    resetPull();
    pullNext();
  }, [open, pullNext, resetPull]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    const entry = pulled.find((q) => q.vpa === form.vpa);
    if (!entry) return setFormError('Select a VPA.');
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) return setFormError('Enter a valid amount.');
    if (!form.utr.trim()) return setFormError('Enter the UTR.');
    setFormError(null);
    submit.mutate({ qrId: entry.qrId, vpa: entry.vpa, amount, utr: form.utr.trim(), remarks: form.remarks.trim() });
  };

  return (
    <Dialog open={open} onClose={onClose} dismissible={!submit.isPending} title="Static QR" description="Show this code to the customer, then file the payment for approval." icon={<QrCode />} size="lg">
      <div className="grid gap-6 sm:grid-cols-[240px_1fr]">
        <div>
          <div className="grid aspect-square place-items-center rounded-3xl border border-slate-200 bg-white p-3 shadow-card">
            {pull.isPending && <Skeleton className="size-full rounded-2xl" />}
            {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, nothing to optimise */}
            {!pull.isPending && image && qr && <img src={image} alt={`UPI QR code for ${qr.vpa}`} className="size-full" />}
            {!pull.isPending && !image && <QrCode className="size-16 text-slate-200" />}
          </div>
          {qr && (
            <div className="mt-3 text-center">
              {qr.qrName && <p className="font-bold text-ink-900">{qr.qrName}</p>}
              <p className="text-[12.5px] break-all text-slate-500">{qr.vpa}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" block className="mt-2" onClick={() => pull.mutate()} loading={pull.isPending}>
            <RefreshCw className="size-3.5" /> Pull another QR
          </Button>
        </div>

        <div className="min-w-0">
          {pull.isError && <Alert tone="warning" className="mb-4">{pull.error.message}</Alert>}
          {qr && (
            <dl className="mb-5 grid grid-cols-2 gap-2">
              {[
                ['Charge', formatCharge(qr.chargeType, qr.chargeValue)],
                ['Min charge', rupeesOrDash(qr.minCharge)],
                ['Daily limit', rupeesOrDash(qr.dailyMaxLimit)],
                ['Remaining today', rupeesOrDash(qr.remainingToday)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-brand-50/60 px-3 py-2">
                  <dt className="text-[10.5px] font-bold tracking-wider text-slate-500 uppercase">{label}</dt>
                  <dd className="text-[13.5px] font-bold text-ink-900 tabular">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {pulled.length > 0 && (
            <form onSubmit={onSubmit} className="space-y-3.5">
              <p className="text-[13px] font-bold text-ink-900">File the collect request</p>
              <Field label="VPA">
                {(p) => (
                  <Select {...p} value={form.vpa} onChange={(e) => setForm((f) => ({ ...f, vpa: e.target.value }))}>
                    {pulled.map((q) => (
                      <option key={q.qrId} value={q.vpa}>
                        {q.vpa}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Amount">
                  {(p) => (
                    <Input
                      {...p}
                      inputMode="decimal"
                      placeholder="e.g. 500"
                      leading={<span className="text-sm font-bold">₹</span>}
                      value={form.amount}
                      onChange={(e) => {
                        const v = sanitizeAmount(e.target.value);
                        if (v !== null) setForm((f) => ({ ...f, amount: v }));
                      }}
                    />
                  )}
                </Field>
                <Field label="UTR">
                  {(p) => <Input {...p} placeholder="12-digit UTR" value={form.utr} onChange={(e) => setForm((f) => ({ ...f, utr: e.target.value }))} />}
                </Field>
              </div>
              <Field label="Remarks" hint="Optional — shown to the admin who approves it.">
                {(p) => <Input {...p} maxLength={200} placeholder="Optional note" value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />}
              </Field>
              {formError && <Alert tone="danger">{formError}</Alert>}
              <Button type="submit" block loading={submit.isPending}>
                Submit request
              </Button>
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
}
