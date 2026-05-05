import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    mdxRs: true,
  },
  eslint: { ignoreDuringBuilds: true },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
