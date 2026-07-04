const { withSentryConfig } = require('@sentry/nextjs')
const path = require('node:path')

const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

if (isVercelProduction && !publicApiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is required for Vercel production builds. Refusing to deploy with localhost API fallback.')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
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
    NEXT_PUBLIC_API_URL: publicApiUrl || 'http://localhost:8000',
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'alquimia',
  project: process.env.SENTRY_PROJECT || 'web',
  silent: !isVercelProduction,
  widenClientFileUpload: true,
})
