'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IdCard, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiClientError, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { todayIso } from '@/lib/dates';
import { sanitizeMobile } from '@/lib/validation/patterns';
import { customerSchema } from '@/lib/validation/schemas';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { Alert } from '@/components/ui/feedback';
import { Field, Input, PrefixInput, Select } from '@/components/ui/field';
import { useBack } from '@/components/layout/navigation-history';
import type { Customer } from '@/types/customer';
import { useRoles } from './api';

interface FormValues {
  fullName: string;
  pan: string;
  aadhaar: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  gst: string;
  residentialAddress: string;
  storeName: string;
  storeAddress: string;
  roleId: string;
}

const EMPTY: FormValues = { fullName: '', pan: '', aadhaar: '', dateOfBirth: '', mobileNumber: '', email: '', gst: '', residentialAddress: '', storeName: '', storeAddress: '', roleId: '' };

const fromCustomer = (c: Customer): FormValues => ({
  fullName: c.fullName,
  pan: c.pan,
  aadhaar: c.aadhaar,
  dateOfBirth: c.dateOfBirth,
  mobileNumber: c.mobileNumber,
  email: c.email,
  gst: c.gst,
  residentialAddress: c.residentialAddress,
  storeName: c.storeName,
  storeAddress: c.storeAddress,
  roleId: c.roleId ? String(c.roleId) : '',
});

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} icon={icon} />
      <CardBody className="grid gap-4 sm:grid-cols-2">{children}</CardBody>
    </Card>
  );
}

/** Create or edit a customer. Validated in the browser with the same rules the API enforces. */
export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const goBack = useBack();
  const qc = useQueryClient();
  const roles = useRoles();
  const editing = Boolean(customer);
  const [form, setForm] = useState<FormValues>(customer ? fromCustomer(customer) : EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: (payload: unknown) => (editing ? api.put<Customer>(`/api/customers/${customer!.id}`, payload) : api.post<Customer>('/api/customers', payload)),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: qk.customers });
      toast.success(editing ? 'Customer updated' : 'Customer created');
      router.push(routes.customer(saved.id));
    },
    onError: (err) => {
      if (err instanceof ApiClientError && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = customerSchema.safeParse({ ...form, gst: form.gst || null, roleId: form.roleId ? Number(form.roleId) : null });
    if (!parsed.success) {
      const found: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '_');
        found[key] ??= issue.message;
      }
      setErrors(found);
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  const text = (key: keyof FormValues, label: string, extra: Record<string, unknown> = {}) => (
    <Field label={label} error={errors[key]}>
      {(p) => <Input {...p} {...extra} value={form[key]} onChange={(e) => set(key, e.target.value)} />}
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate className="max-w-4xl space-y-5">
      <Section title="Identity" icon={<IdCard />}>
        {text('fullName', 'Full name', { autoFocus: true, autoComplete: 'off' })}
        <Field label="Role">
          {(p) => (
            <Select {...p} value={form.roleId} onChange={(e) => set('roleId', e.target.value)}>
              <option value="">Select a role…</option>
              {(roles.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roleName}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="PAN" error={errors.pan}>
          {(p) => <Input {...p} maxLength={10} placeholder="AAAAA0000A" className="font-mono uppercase" value={form.pan} onChange={(e) => set('pan', e.target.value.toUpperCase())} />}
        </Field>
        <Field label="Aadhaar" error={errors.aadhaar}>
          {(p) => <Input {...p} inputMode="numeric" maxLength={12} placeholder="1234 1234 1234" className="font-mono" value={form.aadhaar} onChange={(e) => set('aadhaar', e.target.value.replace(/\D/g, '').slice(0, 12))} />}
        </Field>
        <Field label="Date of birth" error={errors.dateOfBirth}>
          {(p) => <DateField id={p.id} invalid={p['aria-invalid']} value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} max={todayIso()} minYear={1930} placeholder="Select date of birth" aria-label="Date of birth" />}
        </Field>
      </Section>

      <Section title="Contact" icon={<Phone />}>
        <Field label="Mobile number" error={errors.mobileNumber}>
          {(p) => <PrefixInput {...p} prefix="+91" type="tel" inputMode="numeric" placeholder="98765 43210" className="font-mono" value={form.mobileNumber} onChange={(e) => set('mobileNumber', sanitizeMobile(e.target.value))} />}
        </Field>
        {text('email', 'Email', { type: 'email', autoComplete: 'off' })}
      </Section>

      <Section title="Store & address" icon={<MapPin />}>
        {text('storeName', 'Store name')}
        <Field label="GST (optional)" error={errors.gst}>
          {(p) => <Input {...p} maxLength={15} placeholder="29AAAAA0000A1Z5" className="font-mono uppercase" value={form.gst} onChange={(e) => set('gst', e.target.value.toUpperCase())} />}
        </Field>
        {text('storeAddress', 'Store address')}
        {text('residentialAddress', 'Residential address')}
      </Section>

      {Object.keys(errors).length > 0 && <Alert tone="danger">Please fix the highlighted fields.</Alert>}
      {save.isError && !(save.error instanceof ApiClientError && Object.keys(save.error.fieldErrors).length) && <Alert tone="danger">{errorMessage(save.error)}</Alert>}

      <div className="flex gap-2.5">
        <Button type="submit" size="lg" loading={save.isPending}>
          {editing ? 'Update customer' : 'Save customer'}
        </Button>
        <Button variant="outline" size="lg" onClick={() => goBack(customer ? routes.customer(customer.id) : routes.customers)} disabled={save.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
