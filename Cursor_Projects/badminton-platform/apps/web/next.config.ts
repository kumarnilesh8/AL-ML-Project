import type { NextConfig } from 'next';

const config: NextConfig = {
  // Shared engine packages are TypeScript source; let Next.js compile them.
  transpilePackages: ['@bp/domain', '@bp/rating', '@bp/matching'],
  // Allow opening the dev server from a phone on the same home Wi-Fi.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
};

export default config;
