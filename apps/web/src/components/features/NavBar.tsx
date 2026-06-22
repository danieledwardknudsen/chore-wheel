'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from './SignOutButton';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      style={{
        color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
        textDecoration: isActive ? 'underline' : 'none',
        fontWeight: isActive ? 'bold' : 'normal',
      }}
    >
      {children}
    </Link>
  );
};

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
          <NavLink href="/chores">chores</NavLink>
          <NavLink href="/rules">rules</NavLink>
          <NavLink href="/profile">profile</NavLink>
          {userEmail && <span style={{ color: 'var(--color-text-muted)' }}>{userEmail}</span>}
          <SignOutButton />
        </>
      ) : (
        <>
          <NavLink href="/login">[ login ]</NavLink>
          <NavLink href="/register">[ register ]</NavLink>
        </>
      )}
    </div>
  </nav>
);
