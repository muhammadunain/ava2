import type { NextConfig } from "next";

const nextConfig: NextConfig = {
eslint:{
    ignoreDuringBuilds:true
  },
   experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  },
};

export default nextConfig;
