import { execSync } from 'child_process';

const commitHash = execSync('git rev-parse HEAD').toString().trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: commitHash,
  },
  generateBuildId: () => commitHash,
};

export default nextConfig;
