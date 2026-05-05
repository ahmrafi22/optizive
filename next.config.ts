import type { NextConfig } from "next";

const nextConfig: NextConfig & { serverActions?: { bodySizeLimit?: string } } = {
  serverActions: {
    bodySizeLimit: '5mb',
  },
};

export default nextConfig;
