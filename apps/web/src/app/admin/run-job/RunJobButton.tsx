'use client';

import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

type JobResult = { assigned: number; unassigned: number } | null;

export const RunJobButton = () => {
  const {
    primitives: { Button },
  } = useTheme();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobResult>(null);
  const [error, setError] = useState('');

  const runJob = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('/api/jobs/run?disableMessages=true', { method: 'POST' });
      if (!res.ok) {
        setError('Job failed. Check server logs.');
        return;
      }
      const data = (await res.json()) as JobResult;
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" size="md" loading={loading} onClick={() => void runJob()}>
        Run Job
      </Button>
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
      {result !== null && (
        <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
          Done — {result?.assigned ?? 0} assigned, {result?.unassigned ?? 0} unassigned.
        </p>
      )}
    </div>
  );
};
