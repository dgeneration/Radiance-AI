/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is experimental but will become the default in the next Next.js version
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    domains: ['lvqnpykgqaoncbkuhedk.supabase.co', 'www.radiologyinfo.org', 'placehold.co', 'cdn.pixabay.com'],
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

module.exports = nextConfig;
