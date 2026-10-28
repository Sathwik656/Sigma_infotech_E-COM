/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from the local public folder (logo, laptops)
  images: {
    unoptimized: false,
  },
  output: 'standalone',
};

export default nextConfig;
