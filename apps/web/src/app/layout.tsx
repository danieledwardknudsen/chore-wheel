import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { NavBar } from '@/components/features/NavBar';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Chore Wheel',
  description: 'Shared household chore management',
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession(await cookies());
  const isAuthenticated = !!session.userId;

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <NavBar isAuthenticated={isAuthenticated} />
          <main className="flex-1 flex flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
