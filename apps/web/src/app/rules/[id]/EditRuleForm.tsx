'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChoreRuleForm } from '@/components/features/ChoreRuleForm';
import type { ChoreRuleJson, RuleFormData, UserJson } from '@/types/api';

type EditRuleFormProps = { rule: ChoreRuleJson; users: UserJson[] };

export const EditRuleForm = ({ rule, users }: EditRuleFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: RuleFormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chore-rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setError('Failed to save rule. Please try again.');
        return;
      }
      router.push('/rules');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chore-rules/${rule.id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Failed to delete rule. Please try again.');
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
      <ChoreRuleForm
        initialValues={rule}
        users={users}
        onSubmit={(data) => void handleSubmit(data)}
        onDelete={() => void handleDelete()}
        loading={loading}
      />
    </div>
  );
};
