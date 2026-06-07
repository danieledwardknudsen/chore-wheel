'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';

export default function LoginPage() {
  const router = useRouter();
  const {
    primitives: { Box, Button, Input },
  } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setError('');
    setLoading(true);
    try {
      const startRes = await fetch('/api/auth/login/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!startRes.ok) {
        const body = (await startRes.json()) as { error?: string };
        setError(body.error ?? 'Login failed');
        return;
      }
      const options = (await startRes.json()) as PublicKeyCredentialRequestOptionsJSON;

      let credential;
      try {
        credential = await startAuthentication({ optionsJSON: options });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Passkey authentication failed');
        return;
      }

      const finishRes = await fetch('/api/auth/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });
      if (!finishRes.ok) {
        const body = (await finishRes.json()) as { error?: string };
        setError(body.error ?? 'Authentication failed');
        return;
      }

      router.push('/');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Box title="SIGN IN">
          <div className="flex flex-col gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {error && (
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                {error}
              </p>
            )}
            <Button variant="primary" size="md" loading={loading} onClick={signIn}>
              Sign in with Passkey
            </Button>
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No account?{' '}
            <Link href="/register" style={{ color: 'var(--color-accent)' }}>
              Create one
            </Link>
          </p>
        </Box>
      </div>
    </div>
  );
}
