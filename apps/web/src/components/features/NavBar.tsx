import Link from 'next/link';
import { SignOutButton } from './SignOutButton';

const linkStyle = { color: 'var(--color-text-muted)', textDecoration: 'none' };

export const NavBar = ({
  isAuthenticated,
  userEmail,
}: {
  isAuthenticated: boolean;
  userEmail?: string;
}) => (
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
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      {isAuthenticated ? (
        <>
          <Link href="/chores" style={linkStyle}>
            chores
          </Link>
          <Link href="/rules" style={linkStyle}>
            rules
          </Link>
          <Link href="/profile" style={linkStyle}>
            profile
          </Link>
          {userEmail && <span style={{ color: 'var(--color-text)' }}>{userEmail}</span>}
          <SignOutButton />
        </>
      ) : (
        <>
          <Link href="/login" style={linkStyle}>
            [ login ]
          </Link>
          <Link href="/register" style={linkStyle}>
            [ register ]
          </Link>
        </>
      )}
    </div>
  </nav>
);
