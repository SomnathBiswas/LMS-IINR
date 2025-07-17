// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     domains: ['img.freepik.com'],
//   },
// };

// module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig