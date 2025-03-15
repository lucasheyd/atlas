/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Adicionado para melhor compatibilidade com Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
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
    
    // Adiciona aliases para resolver problemas de importação
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': './src/components',
      '@/app': './src/app',
      '@/services': './src/services',
      '@/hooks': './src/hooks',
      '@/lib': './src/lib',
      '@/utils': './src/utils'
    };
    
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig;