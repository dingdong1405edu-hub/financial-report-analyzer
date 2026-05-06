/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'xlsx', 'sharp', '@react-pdf/renderer', '@react-pdf/font', '@react-pdf/layout', '@react-pdf/pdfkit', 'fontkit'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      }
    }
    return config
  },
}

export default nextConfig
