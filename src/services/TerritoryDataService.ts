// src/services/TerritoryDataService.ts
import { ethers } from 'ethers';
import { ActivityData } from '../Maps3d/types/ActivityData';

// RPC URLs para diferentes redes
const RPC_URLS: { [key: string]: string[] } = {
  ethereum: [
    "https://eth.llamarpc.com",
    "https://cloudflare-eth.com",
    "https://main-rpc.linkpool.io",
    "https://eth-mainnet.nodereal.io/v1/1659dfb40a4b4bdeb83c2937c892bf73",
    "https://rpc.ankr.com/eth"
  ],
  polygon: [
    "https://polygon-rpc.com", 
    "https://matic-mainnet.chainstacklabs.com",
    "https://rpc-mainnet.maticvigil.com",
    "https://rpc-mainnet.matic.network",
    "https://matic-mainnet-full-rpc.bwarelabs.com"
  ],
  arbitrum: [
    "https://arb1.arbitrum.io/rpc",
    "https://arbitrum-one.public.blastapi.io",
    "https://rpc.ankr.com/arbitrum",
    "https://arbitrum.getblock.io/mainnet/ext/eth/full/rpc",
    "https://arb-mainnet.g.alchemy.com/v2/demo"
  ],
  optimism: [
    "https://mainnet.optimism.io",
    "https://optimism-mainnet.public.blastapi.io",
    "https://rpc.ankr.com/optimism",
    "https://opt-mainnet.g.alchemy.com/v2/demo",
    "https://optimism.meowrpc.com"
  ],
  base: [
    "https://mainnet.base.org",
    "https://base.drpc.org",
    "https://base.publicnode.com",
    "https://base.gateway.tenderly.co",
    "https://base-rpc.publicnode.com"
  ],
  zksync: [
    "https://mainnet.era.zksync.io",
    "https://zksync.drpc.org",
    "https://zksync-era.blockpi.network/v1/rpc/public",
    "https://zksync.meowrpc.com",
    "https://zksync-era.public.blastapi.io"
  ],
  avalanche: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche-c-chain.publicnode.com",
    "https://avax-mainnet.public.blastapi.io",
    "https://rpc.ankr.com/avalanche-c",
    "https://ava-mainnet.public.blastapi.io"
  ],
  'base-sepolia': [
    "https://sepolia.base.org",
    "https://base-sepolia.public.blastapi.io",
    "https://base-sepolia.blockpi.network/v1/rpc/public",
    "https://base-sepolia-rpc.publicnode.com"
  ]
};

// Símbolos das moedas para cada rede
const CURRENCY_SYMBOLS: { [key: string]: string } = {
  ethereum: "ETH",
  polygon: "MATIC",
  arbitrum: "ETH",
  optimism: "ETH",
  base: "ETH",
  zksync: "ETH",
  avalanche: "AVAX",
  'base-sepolia': "ETH"
};

/**
 * Serviço para buscar dados reais de territórios da blockchain
 */
export class TerritoryDataService {

private static async tryRPCProviders(networkId: string): Promise<ethers.providers.JsonRpcProvider | null> {
    const providerUrls = RPC_URLS[networkId] || [];
    
    for (const url of providerUrls) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(url);
        await provider.getNetwork(); // Verificação de conexão
        return provider;
      } catch (error) {
        console.warn(`Failed to connect to RPC: ${url}`);
      }
    }
    
    return null;
  }
  
  /**
   * Busca dados de atividade para um território específico
   * @param networkId ID da rede blockchain
   * @param walletAddress Endereço da carteira
   */
  public static async fetchActivityData(
    networkId: string,
    walletAddress: string
  ): Promise<ActivityData> {
    try {
      const provider = await this.tryRPCProviders(networkId);
      
      if (!provider) {
        console.error(`No working RPC provider for ${networkId}`);
        return this.getEmptyActivityData();
      }

      // Dados paralelos com timeouts
      const [balance, txCount, nftCount, stakedAmount] = await Promise.all([
        this.safeGetBalance(provider, walletAddress),
        this.safeGetTransactionCount(provider, walletAddress),
        this.safeGetNFTCount(networkId, walletAddress),
        this.safeGetStakedAmount(networkId, walletAddress)
      ]);

      return {
        balance,
        transactions: txCount,
        nftCount,
        stakedAmount,
        lastUpdate: Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      console.error(`Comprehensive error fetching data for ${networkId}:`, error);
      return this.getEmptyActivityData();
    }
  }
  
    private static async safeGetBalance(
    provider: ethers.providers.JsonRpcProvider, 
    address: string
  ): Promise<number> {
    try {
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.utils.formatEther(balance));
    } catch (error) {
      console.warn('Balance fetch error:', error);
      return 0;
    }
  }

  private static async safeGetTransactionCount(
    provider: ethers.providers.JsonRpcProvider, 
    address: string
  ): Promise<number> {
    try {
      return await provider.getTransactionCount(address);
    } catch (error) {
      console.warn('Transaction count fetch error:', error);
      return 0;
    }
  }

  private static async safeGetNFTCount(
    networkId: string, 
    address: string
  ): Promise<number> {
    // Implementação de contagem de NFTs específica para cada rede
    // Pode usar subgraphs, APIs específicas, etc.
    return 0; // Placeholder
  }

  private static async safeGetStakedAmount(
    networkId: string, 
    address: string
  ): Promise<number> {
    // Implementação de recuperação de valor em stake
    return 0; // Placeholder
  }


  
  /**
   * Retorna um objeto de dados de atividade vazio
   */
  private static getEmptyActivityData(): ActivityData {
    return {
      balance: 0,
      nftCount: 0,
      transactions: 0,
      stakedAmount: 0,
      lastUpdate: Math.floor(Date.now() / 1000)
    };
  }
}