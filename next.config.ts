
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@ffmpeg/ffmpeg'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      { // Added for Firebase Storage
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "https://6000-firebase-studio-1749052623784.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev",
    ],
  },
  webpack: (config, { isServer }) => {
    // Rule to handle ffmpeg-core files specifically.
    // This tells Webpack to treat them as assets and output them to a predictable location.
    config.module.rules.push({
      test: /ffmpeg-core\.(js|wasm|worker\.js)$/,
      type: "asset/resource",
      generator: {
        // Output these files to /_next/static/ffmpeg/ so we can have a predictable URL.
        filename: "static/ffmpeg/[name][ext]",
      },
    });

    // Fallbacks for node modules.
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
