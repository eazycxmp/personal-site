import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    mdxRs: true,
  },
  eslint: { ignoreDuringBuilds: true },
  // the game was first published as River Feast
  async redirects() {
    return [
      { source: '/play/river-feast', destination: '/play/build-your-empire', permanent: true },
      { source: '/river-feast/:path*', destination: '/build-your-empire/:path*', permanent: true },
      // Wildmon was first published as Monster Trails
      { source: '/play/monster-trails', destination: '/play/wildmon', permanent: true },
      { source: '/monster-trails/:path*', destination: '/wildmon/:path*', permanent: true },
    ];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
