'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import type { UserJson } from '@/types/api';

type ProfileFormProps = { user: UserJson };

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();
  const {
    primitives: { Box, Button, Input, Toggle },
  } = useTheme();

  const [name, setName] = useState(user.name);
  const [optInTexts, setOptInTexts] = useState(user.optInTexts);
  const [optInEmails, setOptInEmails] = useState(user.optInEmails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, optInTexts, optInEmails }),
      });
      if (!res.ok) {
        setError('Failed to save profile. Please try again.');
        return;
      }
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    setLoading(true);
    try {
      await fetch('/api/users/me', { method: 'DELETE' });
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <Box title="PROFILE">
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Email: {user.email}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Phone: {user.phone}
          </p>
          <Toggle
            checked={optInTexts}
            onChange={() => setOptInTexts((v) => !v)}
            label="SMS reminders"
          />
          <Toggle
            checked={optInEmails}
            onChange={() => setOptInEmails((v) => !v)}
            label="Email reminders"
          />
          {error && (
            <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}
          {saved && (
            <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
              Saved.
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="primary" size="md" loading={loading} onClick={() => void handleSave()}>
              Save
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={loading}
              onClick={() => void handleDelete()}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Box>
    </div>
  );
};
