import type { NextConfig } from "next";
import { execSync } from "child_process";

let commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '';
if (!commitSha) {
  try {
    commitSha = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    commitSha = 'dev';
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
  },
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
  async headers() {
    return [
      {
        source: '/studio/editor/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
