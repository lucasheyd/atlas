/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configuração específica para solucionar problemas de build com ethers.js
  webpack: (config, { isServer }) => {
    // Se estiver executando no servidor, ignoramos completamente os módulos que causam problemas
    if (isServer) {
      // Ignore pacotes que usam APIs específicas do navegador
      config.externals = [...config.externals, 
        'ethers',
        'merkletreejs',
        'keccak256'
      ];
    } else {
      // No cliente, fornecemos fallbacks 
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    return config;
  },
  // Configurações para ignorar erros no build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Completely removing experimental options to avoid the critters error
  // experimental: {
  //   optimizeCss: true
  // }
  
  // Add this to catch more detailed module resolution errors
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  }
}