/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || 'local-dev',
  },
  generateBuildId: async () => {
    return process.env.NEXT_PUBLIC_APP_VERSION || `local-${new Date().getTime()}`;
  },
};

export default nextConfig;
