'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/cn';
import { dateTime } from '@/lib/format';
import { routes } from '@/config/routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import type { Announcement } from '@/types/admin';

const EMPTY = { id: null as number | null, title: '', message: '', isActive: true };

/**
 * Admin › Announcements: write, edit and switch announcements on or off. Customers see the active
 * ones — a popup once a day and the banner on the dashboard. There is no delete upstream, so
 * switching one off is how it is withdrawn.
 */
export function AnnouncementsManager() {
  const qc = useQueryClient();
  const items = useQuery({ queryKey: qk.announcements('all'), queryFn: () => api.get<Announcement[]>('/api/announcements', { scope: 'all' }) });
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ['announcements'] });

  const save = useMutation({
    mutationFn: (v: typeof EMPTY) => (v.id ? api.put<{ message: string }>(`/api/announcements/${v.id}`, { title: v.title, message: v.message, isActive: v.isActive }) : api.post<{ message: string }>('/api/announcements', { title: v.title, message: v.message, isActive: v.isActive })),
    onSuccess: (res, v) => {
      toast.success(res.message || 'Saved');
      if (v === form) setForm(EMPTY);
      refresh();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Enter a title.');
    if (!form.message.trim()) return setError('Enter the message.');
    setError(null);
    save.mutate(form);
  };

  const editing = form.id != null;

  return (
    <div className="flex flex-col xl:h-[calc(100dvh-var(--chrome-h))]">
      <PageHeader eyebrow="Admin" title="Announcements" description="Post updates every customer sees — once a day as a popup, and on their dashboard." back={routes.admin} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] xl:min-h-0 xl:flex-1 xl:grid-rows-[minmax(0,1fr)]">
        <Card className="scrollbar-thin lg:sticky lg:top-24 xl:static xl:max-h-full xl:overflow-y-auto">
          <CardHeader title={editing ? 'Edit announcement' : 'New announcement'} icon={editing ? <Pencil /> : <Plus />} />
          <CardBody>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field label="Title">{(p) => <Input {...p} maxLength={100} placeholder="e.g. Service update" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />}</Field>
              <Field label="Message" hint={`${form.message.length}/500`}>
                {(p) => <Textarea {...p} rows={5} maxLength={500} placeholder="What should everyone know?" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />}
              </Field>
              <Checkbox label="Show to customers (active)" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              {error && <Alert tone="danger">{error}</Alert>}
              <div className="flex gap-2.5">
                <Button type="submit" loading={save.isPending && save.variables === form}>
                  {editing ? 'Save changes' : 'Publish'}
                </Button>
                {editing && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setForm(EMPTY);
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="flex flex-col overflow-hidden xl:max-h-full">
          <CardHeader title="All announcements" icon={<Megaphone />} />
          {items.isPending && <LoadingRows rows={3} />}
          {items.isError && <Alert tone="danger" className="m-5">Couldn&apos;t load announcements: {items.error.message}</Alert>}
          {items.isSuccess && items.data.length === 0 && <EmptyState icon={<Megaphone />} title="No announcements yet">Publish the first one.</EmptyState>}
          <ul className="scrollbar-thin min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
            {items.data?.map((a, i) => (
              <li key={a.id} className={cn('flex animate-rise flex-wrap items-start gap-4 px-4 py-3', !a.isActive && 'opacity-60')} style={{ animationDelay: `${i * 30}ms` }}>
                <div className="min-w-0 flex-1">
                  <h3 className="flex flex-wrap items-center gap-2 font-bold text-ink-900">
                    {a.title}
                    <Badge tone={a.isActive ? 'success' : 'neutral'} dot>
                      {a.isActive ? 'Active' : 'Off'}
                    </Badge>
                  </h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed whitespace-pre-line text-slate-600">{a.message}</p>
                  {a.createdTime && <p className="mt-1.5 text-[11.5px] text-slate-400">{dateTime(a.createdTime)}</p>}
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setForm({ id: a.id, title: a.title, message: a.message, isActive: a.isActive });
                      setError(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="xs" variant="secondary" loading={save.isPending && save.variables?.id === a.id && save.variables !== form} onClick={() => save.mutate({ id: a.id, title: a.title, message: a.message, isActive: !a.isActive })}>
                    {a.isActive ? 'Turn off' : 'Turn on'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
