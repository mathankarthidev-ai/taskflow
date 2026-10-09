/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  experimental: {
    // serverActions is enabled by default in Next 15
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
};

module.exports = nextConfig;
