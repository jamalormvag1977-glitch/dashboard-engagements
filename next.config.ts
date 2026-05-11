import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    '.space.chatglm.site',
    '.space-z.ai',
    'preview-chat-9d9f03eb-ada4-452b-9f38-1f4bf90e452d.space-z.ai',
  ],
};

export default nextConfig;
