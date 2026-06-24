import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@chore-wheel/domain', '@chore-wheel/database'],
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
