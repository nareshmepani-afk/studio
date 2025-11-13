
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: "node_modules/@ffmpeg/core/dist/ffmpeg-core.js",
              to: "static/chunks/pages/ffmpeg/ffmpeg-core.js",
            },
            {
              from: "node_modules/@ffmpeg/core/dist/ffmpeg-core.wasm",
              to: "static/chunks/pages/ffmpeg/ffmpeg-core.wasm",
            },
          ],
        })
      );
    }

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },

};
