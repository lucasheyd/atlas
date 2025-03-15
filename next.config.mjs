import { fileURLToPath } from 'url';
import path from 'path';

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
    unoptimized: true,
  },
  // Existing webpack configuration
  webpack: (config, { isServer }) => {
    // Keep your existing webpack configuration here
    if (isServer) {
      config.externals = [...config.externals, 
        'ethers',
        'merkletreejs',
        'keccak256'
      ];
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    // Add explicit path aliases
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
  // Retain your existing configurations
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
