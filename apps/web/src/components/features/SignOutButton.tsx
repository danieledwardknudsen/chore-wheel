'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const SignOutButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={loading}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        padding: 0,
        color: 'var(--color-text-muted)',
      }}
    >
      [ sign out ]
    </button>
  );
};
