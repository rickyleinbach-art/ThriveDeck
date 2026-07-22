const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this project so serverless function bundles
  // are complete. Without this, a stray lockfile elsewhere on the machine can
  // make Next infer the wrong workspace root and ship an incomplete bundle.
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
