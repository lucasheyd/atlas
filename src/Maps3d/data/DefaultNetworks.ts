// src/Maps3d/data/DefaultNetworks.ts
import { NetworkInfo, NetworkVisualData } from '../types/Network';
import { TerritoryType } from '../types/Territory';

// Dados básicos de redes
export const DEFAULT_NETWORKS: {[key: string]: NetworkInfo} = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum Mainland',
    type: TerritoryType.MAINLAND,
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="#8eb8e5" d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/></svg>',
    positionX: 0,
    positionY: 0,
    color: '#8eb8e5',
    borderColor: '#5c7da5',
    isActive: true,
    chainId: '0x1',
    rpcUrl: 'https://eth.llamarpc.com'
  },
  base: {
    id: 'base',
    name: 'Base Atoll',
    type: TerritoryType.ISLAND,
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#0052ff" d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12S6.2 22.5 12 22.5 22.5 17.8 22.5 12 17.8 1.5 12 1.5zM12 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/></svg>',
    positionX: 30,
    positionY: 0,
    color: '#0052ff',
    borderColor: '#003cb8',
    isActive: true,
    chainId: '0x2105',
    rpcUrl: 'https://mainnet.base.org'
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon Isle',
    type: TerritoryType.ISLAND,
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38.4 33.5"><path fill="#a993ff" d="M29,10.2c-0.7-0.4-1.6-0.4-2.4,0L21,13.5l-3.8,2.1l-5.5,3.3c-0.7,0.4-1.6,0.4-2.4,0L5,16.3c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8,0.4-1.6,1.2-2.1l4.3-2.5c0.7-0.4,1.6-0.4,2.4,0L16,7.2c0.7,0.4,1.2,1.2,1.2,2.1v3.3l3.8-2.2V7c0-0.8-0.4-1.6-1.2-2.1l-8-4.7c-0.7-0.4-1.6-0.4-2.4,0L1.2,5C0.4,5.4,0,6.2,0,7v9.4c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7c0.7,0.4,1.6,0.4,2.4,0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4,1.6-0.4,2.4,0l4.3,2.5c0.7,0.4,1.2,1.2,1.2,2.1v5c0,0.8-0.4,1.6-1.2,2.1L29,28.8c-0.7,0.4-1.6,0.4-2.4,0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V21l-3.8,2.2v3.3c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7c0.7,0.4,1.6,0.4,2.4,0l8.1-4.7c0.7-0.4,1.2-1.2,1.2-2.1V17c0-0.8-0.4-1.6-1.2-2.1L29,10.2z"/></svg>',
    positionX: -18,
    positionY: 0,
    color: '#a993ff',
    borderColor: '#7b5dbf',
    isActive: true,
    chainId: '0x89',
    rpcUrl: 'https://polygon-rpc.com'
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum Peninsula',
    type: TerritoryType.PENINSULA,
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2500 2500"><path fill="#28a0f0" d="M1250,0c690.2,0,1250,559.8,1250,1250s-559.8,1250-1250,1250S0,1940.2,0,1250,559.8,0,1250,0z"/><path fill="#FFF" d="m1372.7,649.5-437.3,709.4 152.4,256 283.9-456.8 397.8,456.8 129.4-114.4-526-851z"/><path opacity=".6" fill="#FFF" d="M601.9,1873.4h237.1l202.9-345.9-121.8-197.1-318.2,543z"/></svg>',
    positionX: 15,
    positionY: 0,
    color: '#28a0f0',
    borderColor: '#1a77b3',
    isActive: true,
    chainId: '0xa4b1',
    rpcUrl: 'https://arb1.arbitrum.io/rpc'
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche Isle',
    type: TerritoryType.ISLAND,
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1503 1504"><path fill="#e84142" d="M284 193a93 93 0 0 0-86 126l216 615a93 93 0 0 0 86 60h174a93 93 0 0 0 87-126L545 252a93 93 0 0 0-87-60H284ZM35 603a93 93 0 0 0-35 17V287c0-52 42-94 94-94h253a94 94 0 0 1 87 60l12 35a93 93 0 0 0-86-60H139a93 93 0 0 0-92 77L35 603Zm1205 508c-41 0-78-25-93-62l-129-325h-3l-57 325c-8 48-50 83-99 83H668c-55 0-96-51-85-105l149-621c10-41 46-70 88-70h180c40 0 77 25 92 62l213 539c11 28 42 41 69 28 27-12 39-44 27-71L1255 509c-1-4-3-8-5-12h-1v-1l-9-22-28-72c-10-25-34-41-61-41h-28c-35 0-66 22-77 55l-14 40-1 4-142 593c-5 22 12 44 35 44h137c10 0 18-6 20-16l77-443c2-14 19-21 30-13 9 6 12 17 10 27l-106 424c-3 17 10 33 28 33h90c13 0 25-9 29-22l80-282c3-11 16-15 25-10 11 7 14 22 10 33l-81 253c-5 21 11 42 33 42h121c15 0 29-10 34-24l20-56c4-11 17-15 26-9 12 7 14 22 10 34l-15 42c-9 26 10 53 37 53h164c21 0 33-23 21-41l-70-106-129-194-69-104c-11-16-3-38 16-43l13-3c18-5 37 4 45 21l240 518c6 13 19 21 33 21h136c21 0 34-23 22-41L1394 924c-71-107-53-80-82-124-7-11-5-25 6-32 10-8 25-5 32 5l302 455c12 18 33 29 55 29h159c37 0 60-40 42-72l-531-922c-9-16-26-25-44-25h-92c-36 0-67 22-80 54l-32 82c-5 13-3 27 5 38l17 25c16 24 0 57-30 57h-95c-25 0-44-22-42-47l25-163c4-24 25-42 50-42h339c25 0 48 14 60 36l241 417c11 20 38 20 50 0l42-67c20-32-3-74-42-74h-332c-38 0-74-22-90-57l-56-120c-14-30-43-50-77-50h-71c-36 0-68 23-80 56l-193 526a93 93 0 0 0 87 125h174c35 0 66-21 79-54l20-53c5-14 20-20 32-15 15 6 20 25 12 39l-16 41c-14 33-46 55-82 55h-56c-25 0-45 22-41 47l5 30c4 24 25 42 50 42h49c36 0 67-22 80-55l5-14c5-14 21-20 33-14 15 7 20 25 12 39l-4 11c-10 26 9 54 37 54h228Z"/></svg>',
    positionX: -22,
    positionY: 0,
    color: '#e84142',
    borderColor: '#b33334',
    isActive: true,
    chainId: '0xa86a',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism Island',
    type: TerritoryType.ISLAND,
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ff5a5a" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.54 13.85h-2.12c-.45 0-.71-.31-.71-.71V9.07c0-.38-.31-.69-.69-.69h-2.67c-.38 0-.69.31-.69.69v6.07c0 .4-.26.71-.71.71H7.46c-.45 0-.71-.31-.71-.71V7.92c0-.4.26-.71.71-.71h9.09c.45 0 .71.31.71.71v7.22c-.01.4-.27.71-.72.71z"/></svg>',
    positionX: 25,
    positionY: 0,
    color: '#ff5a5a',
    borderColor: '#cc4848',
    isActive: true,
    chainId: '0xa',
    rpcUrl: 'https://mainnet.optimism.io'
  },
  zksync: {
    id: 'zksync',
    name: 'zkSync Isle',
    type: TerritoryType.ISLAND,
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#8e44ad" d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm3,14.59H9a.5.5,0,0,1-.5-.5v-1a.5.5,0,0,1,.15-.36l3.22-3.4H9a.5.5,0,0,1-.5-.5V9.91a.5.5,0,0,1,.5-.5h6a.5.5,0,0,1,.5.5v1a.5.5,0,0,1-.15.36L12.12,14.7H15a.5.5,0,0,1,.5.5v.89A.5.5,0,0,1,15,16.59Z"/></svg>',
    positionX: -5,
    positionY: 0,
    color: '#8e44ad',
    borderColor: '#6c3483',
    isActive: true,
    chainId: '0x144',
    rpcUrl: 'https://mainnet.era.zksync.io'
  }
};

// Dados visuais 3D para redes
export const DEFAULT_NETWORK_VISUAL_DATA: {[key: string]: NetworkVisualData} = {
  ethereum: {
    positionZ: 0,
    size: 100,
    scale: 10,
    baseHeight: 15,
    modelType: 'hexagon',
    specialEffects: '{"glow":true,"particleEffect":"ethereumParticles"}'
  },
  base: {
    positionZ: -18,
    size: 40,
    scale: 4,
    baseHeight: 10,
    modelType: 'circle',
    specialEffects: '{"glow":true,"particleEffect":"baseParticles"}'
  },
  polygon: {
    positionZ: -16,
    size: 60,
    scale: 7,
    baseHeight: 12,
    modelType: 'circle',
    specialEffects: '{"glow":true,"particleEffect":"polygonParticles"}'
  },
  arbitrum: {
    positionZ: -5,
    size: 70,
    scale: 8,
    baseHeight: 11,
    modelType: 'peninsula',
    specialEffects: '{"glow":true,"particleEffect":"arbitrumParticles"}'
  },
  avalanche: {
    positionZ: 10,
    size: 55,
    scale: 6,
    baseHeight: 9,
    modelType: 'circle',
    specialEffects: '{"glow":true,"particleEffect":"avalancheParticles"}'
  },
  optimism: {
    positionZ: 12,
    size: 50,
    scale: 5,
    baseHeight: 8,
    modelType: 'circle',
    specialEffects: '{"glow":true,"particleEffect":"optimismParticles"}'
  },
  zksync: {
    positionZ: 25,
    size: 45,
    scale: 4.5,
    baseHeight: 7,
    modelType: 'circle',
    specialEffects: '{"glow":true,"particleEffect":"zksyncParticles"}'
  }
};

// Conexões padrão entre redes
export const DEFAULT_NETWORK_CONNECTIONS: NetworkConnection[] = [
  { source: 'ethereum', target: 'base' },
  { source: 'ethereum', target: 'polygon' },
  { source: 'ethereum', target: 'arbitrum' },
  { source: 'ethereum', target: 'avalanche' },
  { source: 'ethereum', target: 'optimism' },
  { source: 'ethereum', target: 'zksync' }
];
