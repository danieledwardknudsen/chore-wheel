import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chore Wheel',
  description: 'Shared household chore management',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className="h-full">
    <body className="min-h-full flex flex-col">{children}</body>
  </html>
);

export default RootLayout;
