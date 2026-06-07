'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChoreRuleForm } from '@/components/features/ChoreRuleForm';
import type { RuleFormData, UserJson } from '@/types/api';

type NewRuleFormProps = { users: UserJson[] };

export const NewRuleForm = ({ users }: NewRuleFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: RuleFormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chore-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setError('Failed to create rule. Please try again.');
        return;
      }
      router.push('/rules');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link href="/rules" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        ← back to rules
      </Link>
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
      <ChoreRuleForm users={users} onSubmit={(data) => void handleSubmit(data)} loading={loading} />
    </div>
  );
};
