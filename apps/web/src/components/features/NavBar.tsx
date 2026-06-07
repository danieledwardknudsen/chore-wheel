import Link from 'next/link';

export const NavBar = ({ isAuthenticated }: { isAuthenticated: boolean }) => (
  <nav
    className="flex items-center justify-between px-4 py-2 text-sm"
    style={{ borderBottom: '1px solid var(--color-border)', fontFamily: 'inherit' }}
  >
    <Link
      href="/"
      style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 'bold' }}
    >
      ⚙ CHORE-WHEEL
    </Link>
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      {isAuthenticated ? (
        <>
          <Link href="/chores" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            chores
          </Link>
          <Link href="/rules" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            rules
          </Link>
          <Link
            href="/profile"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}
          >
            profile
          </Link>
        </>
      ) : (
        <>
          <Link href="/login" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            [ login ]
          </Link>
          <Link
            href="/register"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}
          >
            [ register ]
          </Link>
        </>
      )}
    </div>
  </nav>
);
