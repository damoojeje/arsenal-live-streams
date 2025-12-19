/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'streamed.pk', 
      'sportsurge.bz', 
      'live.totalsportek007.com',
      'resources.premierleague.com',
      'upload.wikimedia.org'
    ],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
