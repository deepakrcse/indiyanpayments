'use client';

import { useState, type ComponentType, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Checkbox, Field, Input } from '@/components/ui/field';
import { Table, TD, TH, THead, TR } from '@/components/ui/table';

interface CatalogItem {
  id: number;
  displayOrder: number;
  isActive: boolean;
  logoUrl?: string | null;
  [key: string]: unknown;
}

/**
 * List / add / edit / delete for a PG catalog resource. Groups and categories share the exact same
 * shape upstream, just under a different name field, so both render through this one section.
 */
export function CatalogSection({
  resource,
  queryKey,
  nameField,
  itemLabel,
  itemLabelPlural,
  icon: Icon,
  hasLogoUrl = false,
  example,
}: {
  resource: 'groups' | 'categories';
  queryKey: readonly unknown[];
  nameField: 'groupName' | 'categoryName';
  itemLabel: string;
  itemLabelPlural: string;
  icon: ComponentType<{ className?: string }>;
  hasLogoUrl?: boolean;
  example: string;
}) {
  const qc = useQueryClient();
  const items = useQuery({ queryKey, queryFn: () => api.get<CatalogItem[]>(`/api/pg-settings/${resource}`) });
  const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', displayOrder: '', isActive: true, logoUrl: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CatalogItem | null>(null);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => (editing && editing !== 'new' ? api.put<CatalogItem[]>(`/api/pg-settings/${resource}/${editing.id}`, body) : api.post<CatalogItem[]>(`/api/pg-settings/${resource}`, body)),
    onSuccess: (list) => {
      qc.setQueryData(queryKey, list);
      toast.success(`${itemLabel} saved`);
      setEditing(null);
    },
    onError: (err) => setFormError(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api/pg-settings/${resource}/${id}`),
    onSuccess: () => {
      toast.success(`${itemLabel} deleted`);
      setDeleting(null);
      qc.invalidateQueries({ queryKey });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const open = (item: CatalogItem | 'new') => {
    setForm(item === 'new' ? { name: '', displayOrder: '', isActive: true, logoUrl: '' } : { name: String(item[nameField] ?? ''), displayOrder: String(item.displayOrder), isActive: item.isActive, logoUrl: item.logoUrl ?? '' });
    setFormError(null);
    setEditing(item);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.displayOrder === '') return setFormError('Enter a name and display order.');
    save.mutate({ [nameField]: form.name.trim(), displayOrder: Number(form.displayOrder), isActive: form.isActive, ...(hasLogoUrl ? { logoUrl: form.logoUrl.trim() } : {}) });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={itemLabelPlural}
        icon={<Icon />}
        actions={
          <Button size="sm" onClick={() => open('new')}>
            <Plus className="size-4" /> Add {itemLabel.toLowerCase()}
          </Button>
        }
      />
      {items.isPending && <LoadingRows rows={3} />}
      {items.isError && <Alert tone="danger" className="m-5">Couldn&apos;t load {itemLabelPlural.toLowerCase()}: {items.error.message}</Alert>}
      {items.isSuccess && items.data.length === 0 && <EmptyState icon={<Icon />} title={`No ${itemLabelPlural.toLowerCase()} yet`} />}
      {items.data && items.data.length > 0 && (
        <Table>
          <THead>
            <tr>
              <TH>{itemLabel}</TH>
              <TH align="right">Display order</TH>
              <TH>Status</TH>
              <TH align="right">Actions</TH>
            </tr>
          </THead>
          <tbody>
            {[...items.data]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((item) => (
                <TR key={item.id}>
                  <TD>
                    <span className="flex items-center gap-2.5 font-bold text-ink-900">
                      <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon className="size-4" />
                      </span>
                      {String(item[nameField] ?? '')}
                    </span>
                  </TD>
                  <TD align="right">{item.displayOrder}</TD>
                  <TD>
                    <Badge tone={item.isActive ? 'success' : 'neutral'} dot>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TD>
                  <TD align="right">
                    <div className="inline-flex gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => open(item)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleting(item)} aria-label="Delete">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
          </tbody>
        </Table>
      )}

      <Dialog open={editing !== null} onClose={() => !save.isPending && setEditing(null)} dismissible={!save.isPending} title={editing && editing !== 'new' ? `Edit ${itemLabel.toLowerCase()}` : `Add ${itemLabel.toLowerCase()}`} icon={<Icon />} size="sm">
        <form onSubmit={submit} className="space-y-4">
          <Field label={`${itemLabel} name`}>{(p) => <Input {...p} autoFocus placeholder={`e.g. ${example}`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}</Field>
          {hasLogoUrl && <Field label="Logo URL (optional)">{(p) => <Input {...p} placeholder="https://…" value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} />}</Field>}
          <Field label="Display order">{(p) => <Input {...p} inputMode="numeric" placeholder="e.g. 1" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value.replace(/\D/g, '') }))} />}</Field>
          <Checkbox label="Active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          {formError && <Alert tone="danger">{formError}</Alert>}
          <div className="flex gap-2.5">
            <Button variant="outline" block onClick={() => setEditing(null)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" block loading={save.isPending}>
              {editing && editing !== 'new' ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting.id)} busy={remove.isPending} title={`Delete ${itemLabel.toLowerCase()}`} confirmLabel="Delete">
        Delete <strong className="text-ink-900">“{String(deleting?.[nameField] ?? '')}”</strong>?
      </ConfirmDialog>
    </Card>
  );
}
