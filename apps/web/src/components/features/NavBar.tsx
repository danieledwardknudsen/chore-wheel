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
    className="flex items-center justify-between px-2 py-2 text-sm sm:px-4"
    style={{ borderBottom: '1px solid var(--color-border)', fontFamily: 'inherit' }}
  >
    <Link
      href="/"
      className="whitespace-nowrap"
      style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 'bold' }}
    >
      ⚙<span className="hidden sm:inline"> CHORE-WHEEL</span>
    </Link>
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
      }}
      className="sm:gap-6"
    >
      {isAuthenticated ? (
        <>
          <NavLink href="/chores">chores</NavLink>
          <NavLink href="/rules">rules</NavLink>
          <NavLink href="/profile">profile</NavLink>
          {userEmail && (
            <span className="hidden sm:inline" style={{ color: 'var(--color-text-muted)' }}>
              {userEmail}
            </span>
          )}
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
