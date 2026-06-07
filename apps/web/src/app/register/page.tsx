'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';

type Step = 'details' | 'verify' | 'passkey';

export default function RegisterPage() {
  const router = useRouter();
  const {
    primitives: { Box, Button, Input },
  } = useTheme();

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Failed to send code');
        return;
      }
      setStep('verify');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Invalid code');
        return;
      }
      setStep('passkey');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const createPasskey = async () => {
    setError('');
    setLoading(true);
    try {
      const startRes = await fetch('/api/auth/registration/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });
      if (!startRes.ok) {
        const body = (await startRes.json()) as { error?: string };
        setError(body.error ?? 'Registration failed');
        return;
      }
      const options = (await startRes.json()) as PublicKeyCredentialCreationOptionsJSON;

      let credential;
      try {
        credential = await startRegistration({ optionsJSON: options });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Passkey creation failed');
        return;
      }

      const finishRes = await fetch('/api/auth/registration/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });
      if (!finishRes.ok) {
        const body = (await finishRes.json()) as { error?: string };
        setError(body.error ?? 'Registration failed');
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
        <Box title="REGISTER">
          {step === 'details' && (
            <div className="flex flex-col gap-4">
              <Input
                label="Name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Input
                label="Phone (E.164)"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+12065551234"
              />
              {error && (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  {error}
                </p>
              )}
              <Button variant="primary" size="md" loading={loading} onClick={sendCode}>
                Send Verification Code
              </Button>
            </div>
          )}
          {step === 'verify' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Enter the 6-digit code sent to {phone}
              </p>
              <Input
                label="Verification Code"
                name="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
              {error && (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="md" onClick={() => setStep('details')}>
                  Back
                </Button>
                <Button variant="primary" size="md" loading={loading} onClick={verifyCode}>
                  Verify
                </Button>
              </div>
            </div>
          )}
          {step === 'passkey' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Phone verified. Create your passkey to complete registration.
              </p>
              {error && (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  {error}
                </p>
              )}
              <Button variant="primary" size="md" loading={loading} onClick={createPasskey}>
                Create Passkey
              </Button>
            </div>
          )}
          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--color-accent)' }}>
              Sign in
            </Link>
          </p>
        </Box>
      </div>
    </div>
  );
}
