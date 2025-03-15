import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // This disables image optimization, allowing any source
  },
  // Configuration for resolving issues with ethers.js build
  webpack: (config, { isServer }) => {
    // If running on the server, completely ignore modules that cause problems
    if (isServer) {
      config.externals = [...config.externals, 
        'ethers',
        'merkletreejs',
        'keccak256'
      ];
    } else {
      // On the client, provide fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    // Add explicit path alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.join(__dirname, 'src/components'),
      '@/utils': path.join(__dirname, 'src/utils'),
      '@/app': path.join(__dirname, 'src/app'),
      '@/lib': path.join(__dirname, 'src/lib'),
      '@/hooks': path.join(__dirname, 'src/hooks'),
      '@/services': path.join(__dirname, 'src/services'),
    };
    
    return config;
  },
  // Settings to ignore errors in the build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;