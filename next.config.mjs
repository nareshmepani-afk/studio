import { execSync } from 'child_process';

// START DIAGNOSTIC CODE
console.log('--- AVAILABLE ENVIRONMENT VARIABLES ---');
console.log(process.env);
console.log('--- END DIAGNOSTIC CODE ---');
// END DIAGNOSTIC CODE

function getCommitHash() {
  const commitHash = 
    process.env.COMMIT_SHA || // Google Cloud Build
    process.env.VERCEL_GIT_COMMIT_SHA || // Vercel
    process.env.GITHUB_SHA; // GitHub Actions

  if (commitHash) {
    return commitHash.trim();
  }

  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
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
