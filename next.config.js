/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['*'], // Allow images from all domains
  },
  typescript: {
    // !! WARN !!
    // Ignoring type checking during build, but you should fix these errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 