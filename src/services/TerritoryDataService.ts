// src/services/TerritoryDataService.ts
import { ethers } from 'ethers';
import { ActivityData } from '../Maps3d/types/ActivityData';

// RPC URLs para diferentes redes
const RPC_URLS: { [key: string]: string } = {
  ethereum: "https://eth.llamarpc.com",
  polygon: "https://polygon-rpc.com",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  optimism: "https://mainnet.optimism.io",
  base: "https://mainnet.base.org",
  zksync: "https://mainnet.era.zksync.io",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  'base-sepolia': "https://sepolia.base.org"
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
      console.log(`Fetching real data for ${networkId} and wallet ${walletAddress}`);
      
      // Verificar se temos um provedor RPC para esta rede
      if (!RPC_URLS[networkId]) {
        console.warn(`No RPC URL available for network: ${networkId}`);
        return this.getEmptyActivityData();
      }
      
      // Tenta se conectar ao provedor
      let provider;
      try {
        provider = new ethers.providers.JsonRpcProvider(RPC_URLS[networkId]);
        
        // Testamos a conexão para confirmar que o provider está funcionando
        await provider.getNetwork().catch(() => {
          throw new Error(`Failed to connect to ${networkId} network`);
        });
      } catch (error) {
        console.warn(`Error connecting to ${networkId} provider:`, error);
        return this.getEmptyActivityData();
      }
      
      // Buscar saldo da carteira
      let balance = ethers.BigNumber.from(0);
      try {
        balance = await provider.getBalance(walletAddress);
      } catch (error) {
        console.warn(`Error fetching balance for ${walletAddress} on ${networkId}:`, error);
      }
      
      // Buscar contagem de transações
      let txCount = 0;
      try {
        txCount = await provider.getTransactionCount(walletAddress);
      } catch (error) {
        console.warn(`Error fetching transaction count for ${walletAddress} on ${networkId}:`, error);
      }
      
      // Retornar dados reais da blockchain
      return {
        balance: parseFloat(ethers.utils.formatEther(balance)),
        transactions: txCount,
        nftCount: 0, // Por enquanto, definimos como 0 até implementarmos a contagem real de NFTs
        stakedAmount: 0, // Por enquanto, definimos como 0 até implementarmos o valor real em staking
        lastUpdate: Math.floor(Date.now() / 1000)
      };
    } catch (error) {
      console.error(`Error fetching blockchain data for ${networkId}:`, error);
      
      // Retornar dados vazios em caso de erro
      return this.getEmptyActivityData();
    }
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