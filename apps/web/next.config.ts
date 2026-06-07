import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@chore-wheel/domain', '@chore-wheel/database'],
};

export default nextConfig;
