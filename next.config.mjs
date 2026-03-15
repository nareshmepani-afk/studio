import { execSync } from 'child_process';

function getCommitHash() {
  // 1. Check for the production environment variable from Google Cloud Build
  if (process.env.COMMIT_SHA) {
    return process.env.COMMIT_SHA.trim();
  }

  // 2. Fallback to local git command for development
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    // 3. Final fallback for environments where git is not available
    return `local-build-${new Date().getTime()}`;
  }
}

const commitHash = getCommitHash();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: commitHash,
  },
  generateBuildId: () => commitHash,
};

export default nextConfig;
