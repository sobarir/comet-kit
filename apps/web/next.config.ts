import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile workspace packages that ship TS-adjacent output.
  transpilePackages: ["@cometkit/shared"],
};

export default nextConfig;
