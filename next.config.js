/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [
      {
        // Apple Pay domain verification file
        source: '/.well-known/apple-developer-merchantid-domain-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
      },
      {
        // CRITICAL: Prevent ALL caching for ALL pages to fix Cloudflare session issues
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
