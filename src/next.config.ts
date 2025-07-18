
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

    // Rule for .js and .wasm ffmpeg files (excluding the worker).
    config.module.rules.push({
      test: /ffmpeg-core\.(js|wasm)$/,
      type: "asset/resource",
      generator: {
        filename: "static/ffmpeg/[name][ext]",
      },
    });

    // Rule for ffmpeg-core.worker.js using asset/resource with importMeta: true.
    // This is the critical fix for the `new URL(..., import.meta.url)` issue.
    config.module.rules.push({
      test: /ffmpeg-core\.worker\.js$/,
      type: "asset/resource",
      generator: {
        filename: "static/ffmpeg/[name][ext]",
        importMeta: true, // Explicitly handle import.meta.url
      },
    });

    // Rule for ffmpeg-core.worker.js using asset/resource with importMeta: true.
    // This is the critical fix for the `new URL(..., import.meta.url)` issue.
    config.module.rules.push({
      test: /ffmpeg-core\.worker\.js$/,
      type: "asset/resource",
      generator: {
        filename: "static/ffmpeg/[name][ext]",
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};
    // Fallbacks for node modules.
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
    }

export default nextConfig;
