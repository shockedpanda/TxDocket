import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'txdocket.vercel.app' }],
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex' },
      ],
    },
  ],
};

export default nextConfig;