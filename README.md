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
    config.module.rules.push({
      test: /ffmpeg-core\.worker\.js$/,
      type: "asset/resource",
      generator: {
        filename: "static/ffmpeg/[name][ext]",
        importMeta: true, // Explicitly handle import.meta.url
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
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
