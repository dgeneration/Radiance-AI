/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  fallbacks: {
    // Add offline fallbacks for specific routes
    document: '/offline', // fallback for document type requests
    image: '/icons/icon-512x512.png', // fallback for image type requests
    font: false, // disable font fallbacks
    audio: false, // disable audio fallbacks
    video: false // disable video fallbacks
  },
  swSrc: 'worker/index.js', // Use custom service worker
  buildExcludes: [/middleware-manifest\.json$/] // Exclude middleware manifest
});

const nextConfig = {
  experimental: {
    // This is experimental but will become the default in the next Next.js version
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // Disable ESLint during the build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lvqnpykgqaoncbkuhedk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lvqnpykgqaoncbkuhedk.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
      {
        protocol: 'https',
        hostname: 'www.radiologyinfo.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
