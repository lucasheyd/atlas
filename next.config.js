/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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
    // Configurações de resolução de módulos
    config.resolve.modules = [
      path.resolve('./src'),
      path.resolve('./public'),
      path.resolve('./node_modules')
    ];

    // Adiciona suporte para arquivos estáticos
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash].[ext]'
      }
    });

    // Aliases e configurações anteriores
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve('./src/components'),
      '@/app': path.resolve('./src/app'),
      '@/services': path.resolve('./src/services'),
      '@/hooks': path.resolve('./src/hooks'),
      '@/lib': path.resolve('./src/lib'),
      '@/utils': path.resolve('./src/utils'),
      '@/public': path.resolve('./public')
    };

    // Configurações de build anteriores
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