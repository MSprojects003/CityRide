import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',   // ← Added for Google profile pics
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',   // ← Safer way (covers all subdomains)
      },
    ],
  },
}

export default nextConfig