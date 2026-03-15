import { execSync } from 'child_process';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config here
  
  // Generate a build ID from the latest git commit
  generateBuildId: async () => {
    try {
      const commitHash = execSync('git rev-parse HEAD').toString().trim();
      return commitHash;
    } catch (e) {
      // Fallback for environments where git is not available
      return `fallback-${new Date().getTime()}`;
    }
  },
};

export default nextConfig;
