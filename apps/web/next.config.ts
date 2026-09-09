import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // This is needed due to false positives with react-hook-form Control types
    // See: https://github.com/react-hook-form/resolvers/issues/270
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
