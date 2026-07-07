/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@memestar/shared'],
  experimental: {
    esmExternals: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.memestar.xyz' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Sentry webpack 插件由 `@sentry/nextjs` 在 `sentry.client.config.ts` 中初始化
  // 详见 https://docs.sentry.io/platforms/javascript/guides/nextjs/
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
      },
    ];
  },
};

export default nextConfig;

// Sentry 集成占位：
// import { withSentryConfig } from '@sentry/nextjs';
// export default withSentryConfig(nextConfig, { org: 'memestar', project: 'web' });
