import type { NextConfig } from "next";

const isCosExport = process.env.YUZU_STATIC_EXPORT === "1";

const nextConfig: NextConfig = isCosExport
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      typescript: { tsconfigPath: "tsconfig.cos.json" },
    }
  : {};

export default nextConfig;
