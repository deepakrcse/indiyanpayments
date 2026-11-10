'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, KeyRound, UserRound } from 'lucide-react';
import { api, errorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { Field, Input, SecretInput } from '@/components/ui/field';

/** Only same-site paths are followed after sign-in — never another host. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : '/';
}

export function LoginForm({ next }: { next: string | null }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const signIn = async (user: string, pass: string, which: string) => {
    setError(null);
    setLoading(which);
    try {
      await api.post('/api/auth/login', { username: user, password: pass });
      // A full navigation, so the server layout reads the new session cookie.
      window.location.assign(safeNext(next));
    } catch (err) {
      setError(errorMessage(err) || 'Invalid login ID or password.');
      setLoading(null);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return setError('Enter your login ID and password.');
    signIn(username.trim(), password, 'form');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Login ID">
          {(p) => (
            <Input
              {...p}
              autoFocus
              autoComplete="username"
              placeholder="Your registered mobile or login ID"
              leading={<UserRound className="size-4.5" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
        </Field>
        <Field label="Password">
          {(p) => (
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4.5 -translate-y-1/2 text-slate-400" />
              <SecretInput {...p} autoComplete="current-password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
        </Field>

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" size="lg" block loading={loading === 'form'} disabled={Boolean(loading)}>
          {loading === 'form' ? 'Signing in…' : 'Sign in'}
          {loading !== 'form' && <ArrowRight className="size-4.5" />}
        </Button>
      </form>
    </div>
  );
}
