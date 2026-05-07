/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export' eliminado (R3) — el proyecto usa middleware Edge y Route Handlers
  // (POST /api/acceso, middleware.ts) que requieren runtime Node/Edge en Vercel.
  // Para hosting estático puro sin auth, restaurar output: 'export' y usar
  // un gate de acceso alternativo (p. ej. Cloudflare Access o variable de entorno NEXT_PUBLIC).
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig
