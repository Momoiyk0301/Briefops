import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "../..");
const { loadEnvConfig } = nextEnv;

loadEnvConfig(repoRoot);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repoRoot,
  transpilePackages: ["@briefops/shared"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(__dirname, "src"),
      "@shared": path.join(repoRoot, "packages/shared/src")
    };
    return config;
  }
};

export default nextConfig;
