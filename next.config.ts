import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Simplified for stability in dev mode
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  serverExternalPackages: ['peerjs', 'debug'],
  async rewrites() {
    const isStaging = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'memory-weaver-dev';
    const authTarget = isStaging 
      ? 'https://memory-weaver-dev.firebaseapp.com' 
      : 'https://memory-weaver-8rk9t.firebaseapp.com';

    return [
      {
        source: '/__/auth/:path*',
        destination: `${authTarget}/__/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
