/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  // output: 'export' eliminado (R3) — el proyecto usa middleware Edge y Route Handlers
  // Route handlers legacy (POST /api/acceso) + auth (POST /api/auth/login) requieren runtime Node/Edge en Vercel.
  // Para hosting estático puro sin auth, restaurar output: 'export' y usar
  // un gate de acceso alternativo (p. ej. Cloudflare Access o variable de entorno NEXT_PUBLIC).
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig
