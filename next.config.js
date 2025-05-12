/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is experimental but will become the default in the next Next.js version
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
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
    ],
  },
};

module.exports = nextConfig;
