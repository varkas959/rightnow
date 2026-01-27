/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Enable compression
  compress: true,
  // Power by header removed for smaller response
  poweredByHeader: false,
  // Reduce JS bundle size
  reactStrictMode: true,
  // Faster builds
  swcMinify: true,
}

module.exports = nextConfig

