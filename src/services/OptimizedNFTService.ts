// src/services/OptimizedNFTService.ts
import { ethers } from 'ethers';
import { CacheService } from '../utils/CacheService';
import { ActivityData } from '../Maps3d/types/ActivityData';

// Endereços dos contratos
const CONTRACTS = {
  CRYPTO_ATLAS_NFT: '0x1A3B7cD224453cDF2EAeF79eaCFfB737E7207878',
  NETWORK_REGISTRY: '0x821587E27f9296677928d6b8045de8fdB1E20bd3',
  TERRITORY_DATA_STORE: '0xA5295C041B3Bd8dC2C7F0313Dc9808Ba484D7Ffe',
  ATLAS_RENDERER_CORE: '0x5278e3F3C5dF2ceD17588e69e49bEB3374C15D42'
};

// ABIs simplificados
const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getFusionLevel(uint256 tokenId) view returns (uint8)",
  "function getTokenFullData(uint256 tokenId) view returns (string, string[], uint8, string, string)",
  "function getActiveNetworks(uint256 tokenId) view returns (string[])",
  "function exists(uint256 tokenId) view returns (bool)",
  "function totalSupply() view returns (uint256)"
];

const TERRITORY_DATA_STORE_ABI = [
  "function getTerritoryActivity(uint256 tokenId, string memory networkId) external view returns (uint256 balance, uint256 nftCount, uint256 transactions, uint256 stakedAmount, uint256 lastUpdate)"
];

/**
 * Interface para os dados do NFT
 */
export interface NFTData {
  exists: boolean;
  owner: string;
  fusionLevel: number;
  activeNetworks: string[];
  customName?: string;
  metadata?: any;
}

/**
 * Serviço otimizado para interagir com NFTs de Atlas com cache embutido
 */
export class OptimizedNFTService {
  // Configuração do provedor
  private static provider = new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
  
  // Provider com fallback em caso de falha
  private static getProvider() {
    // Se o provedor principal falhar, tentar conexão com provedor de fallback
    return this.provider;
  }
  
  /**
   * Cria uma instância do contrato NFT com um provedor específico
   */
  private static async getNFTContract() {
    const provider = this.getProvider();
    return new ethers.Contract(CONTRACTS.CRYPTO_ATLAS_NFT, NFT_ABI, provider);
  }
  
  /**
   * Cria uma instância do contrato TerritoryDataStore com um provedor específico
   */
  private static async getTerritoryContract() {
    const provider = this.getProvider();
    return new ethers.Contract(CONTRACTS.TERRITORY_DATA_STORE, TERRITORY_DATA_STORE_ABI, provider);
  }
  
  /**
   * Verifica se o token existe no contrato
   * @param tokenId ID do token NFT
   */
  public static async tokenExists(tokenId: string): Promise<boolean> {
    const cacheKey = `token_exists_${tokenId}`;
    
    // Verificar cache primeiro
    const cachedData = CacheService.get<boolean>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }
    
    try {
      // Conectar ao contrato NFT
      const nftContract = await this.getNFTContract();
      
      // Alguns contratos têm uma função "exists"
      let exists: boolean;
      try {
        exists = await nftContract.exists(tokenId);
      } catch (e) {
        // Se não tiver a função "exists", tenta chamar ownerOf
        try {
          await nftContract.ownerOf(tokenId);
          exists = true;
        } catch (e) {
          exists = false;
        }
      }
      
      // Armazenar em cache
      CacheService.set(cacheKey, exists, CacheService.TTL.TOKEN_EXISTS);
      return exists;
    } catch (error) {
      console.error(`Error checking if token #${tokenId} exists:`, error);
      return false;
    }
  }
  
  /**
   * Obtém dados básicos do NFT a partir do seu ID
   * @param tokenId ID do token NFT
   */
  public static async getNFTData(tokenId: string): Promise<NFTData> {
    const cacheKey = `nft_data_${tokenId}`;
    
    // Verificar cache primeiro
    const cachedData = CacheService.get<NFTData>(cacheKey);
    if (cachedData !== null) {
      console.log(`Using cached NFT data for token #${tokenId}`);
      return cachedData;
    }
    
    try {
      console.log(`Fetching NFT data for token #${tokenId}`);
      
      // Verificar primeiro se o token existe
      const exists = await this.tokenExists(tokenId);
      if (!exists) {
        console.log(`Token #${tokenId} does not exist.`);
        const defaultData = {
          exists: false,
          owner: ethers.constants.AddressZero,
          fusionLevel: 1,
          activeNetworks: []
        };
        
        // Cache por um tempo mais curto para tokens que não existem
        CacheService.set(cacheKey, defaultData, 5 * 60 * 1000); // 5 minutos
        return defaultData;
      }
      
      // Conectar ao contrato NFT
      const nftContract = await this.getNFTContract();
      
      // Preparar para buscar dados em paralelo
      const ownerPromise = nftContract.ownerOf(tokenId).catch(() => ethers.constants.AddressZero);
      const fusionLevelPromise = nftContract.getFusionLevel(tokenId).catch(() => 1);
      const activeNetworksPromise = nftContract.getActiveNetworks(tokenId).catch(() => []);
      const fullDataPromise = nftContract.getTokenFullData(tokenId).catch(() => ['', [], 0, '', '']);
      
      // Aguardar todas as promessas
      const [owner, fusionLevel, activeNetworks, fullData] = await Promise.all([
        ownerPromise, fusionLevelPromise, activeNetworksPromise, fullDataPromise
      ]);
      
      // Extrair nome personalizado dos dados completos
      const customName = fullData[0] || `Crypto Atlas #${tokenId}`;
      
      // Construir resultado
      const result: NFTData = {
        exists: true,
        owner,
        fusionLevel: parseInt(fusionLevel.toString()),
        activeNetworks: activeNetworks || [],
        customName
      };
      
      // Armazenar em cache
      CacheService.set(cacheKey, result, CacheService.TTL.NFT_DATA);
      return result;
    } catch (error) {
      console.error(`Error fetching NFT data for token #${tokenId}:`, error);
      
      // Retornar dados básicos em caso de erro
      return {
        exists: false,
        owner: ethers.constants.AddressZero,
        fusionLevel: 1,
        activeNetworks: []
      };
    }
  }
  
/**
 * Obtém dados de um território específico armazenados no contrato
 * @param tokenId ID do token NFT
 * @param networkId ID da rede
 */
public static async getTerritoryContractData(
  tokenId: string,
  networkId: string
): Promise<ActivityData> {
  const cacheKey = `territory_data_${tokenId}_${networkId}`;
  
  // Verificar cache primeiro
  const cachedData = CacheService.get<ActivityData>(cacheKey);
  if (cachedData !== null) {
    console.log(`Using cached territory data for token #${tokenId}, network ${networkId}`);
    return cachedData;
  }
  
  try {
    // Verificar se o token existe
    const exists = await this.tokenExists(tokenId);
    if (!exists) {
      const defaultData = this.getDefaultActivityData();
      CacheService.set(cacheKey, defaultData, 60 * 1000); // Cache curto (1 minuto)
      return defaultData;
    }
    
    // Verificar se o território está ativo para este token
    const nftData = await this.getNFTData(tokenId);
    if (!nftData.activeNetworks.includes(networkId)) {
      console.warn(`Territory ${networkId} is not active for token #${tokenId}`);
      const defaultData = this.getDefaultActivityData();
      CacheService.set(cacheKey, defaultData, 60 * 1000); // Cache curto (1 minuto)
      return defaultData;
    }
    
    // Conectar ao contrato TerritoryDataStore
    const territoryContract = await this.getTerritoryContract();
    
    // Buscar dados do território
    const data = await territoryContract.getTerritoryActivity(tokenId, networkId);
    
    const result = {
      balance: parseFloat(ethers.utils.formatEther(data.balance)),
      nftCount: parseInt(data.nftCount.toString()),
      transactions: parseInt(data.transactions.toString()),
      stakedAmount: parseFloat(ethers.utils.formatEther(data.stakedAmount)),
      lastUpdate: parseInt(data.lastUpdate.toString())
    };
    
    // Armazenar em cache
    CacheService.set(cacheKey, result, CacheService.TTL.TERRITORY_DATA);
    return result;
  } catch (error) {
    console.error(`Error fetching territory data for token #${tokenId} and network ${networkId}:`, error);
    
    // Se o erro for "Territory not active", não é um erro crítico
    if (error.reason === "Territory not active") {
      console.warn(`Territory ${networkId} is not active for token #${tokenId}`);
    }
    
    // Retornar dados zerados em caso de erro
    const defaultData = this.getDefaultActivityData();
    
    // Cache por menos tempo em caso de erro
    CacheService.set(cacheKey, defaultData, 60 * 1000); // 1 minuto
    
    return defaultData;
  }
}

/**
 * Retorna um objeto ActivityData com valores padrão zerados
 */
private static getDefaultActivityData(): ActivityData {
  return {
    balance: 0,
    nftCount: 0,
    transactions: 0,
    stakedAmount: 0,
    lastUpdate: Math.floor(Date.now() / 1000)
  };
}
    
  /**
   * Obtém informações sobre o supply do contrato NFT
   */
  public static async getContractInfo(): Promise<{ totalSupply: number }> {
    const cacheKey = `contract_info`;
    
    // Verificar cache primeiro
    const cachedData = CacheService.get<{ totalSupply: number }>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }
    
    try {
      // Conectar ao contrato NFT
      const nftContract = await this.getNFTContract();
      
      // Obter oferta total
      const totalSupply = await nftContract.totalSupply();
      
      const result = {
        totalSupply: parseInt(totalSupply.toString())
      };
      
      // Armazenar em cache
      CacheService.set(cacheKey, result, CacheService.TTL.CONTRACT_INFO);
      return result;
    } catch (error) {
      console.error("Error fetching contract info:", error);
      return {
        totalSupply: 0
      };
    }
  }
  
  /**
   * Pré-carrega dados relacionados a um token para acelerar a experiência do usuário
   * @param tokenId ID do token a pré-carregar
   */
  public static async preloadTokenData(tokenId: string): Promise<void> {
    if (!tokenId) return;
    
    try {
      // Verificar se o token existe e pré-carregar
      const exists = await this.tokenExists(tokenId);
      if (!exists) return;
      
      // Se o token existe, carregar dados básicos em segundo plano
      setTimeout(async () => {
        try {
          // Carregar dados básicos
          const nftData = await this.getNFTData(tokenId);
          
          // Se temos redes ativas, pré-carregar dados das 2-3 primeiras
          if (nftData.activeNetworks && nftData.activeNetworks.length > 0) {
            nftData.activeNetworks.slice(0, 3).forEach(networkId => {
              setTimeout(() => {
                this.getTerritoryContractData(tokenId, networkId)
                  .catch(() => { /* Ignorar erros no pré-carregamento */ });
              }, 100);
            });
          }
        } catch (error) {
          // Ignorar erros no pré-carregamento
          console.debug(`Error preloading data for token #${tokenId}:`, error);
        }
      }, 10); // Ligeiro atraso para não bloquear a UI
    } catch (error) {
      // Ignorar erros no pré-carregamento
      console.debug(`Error in preloadTokenData for #${tokenId}:`, error);
    }
  }
  
  /**
   * Invalidar cache para um token específico (após uma atualização)
   */
  public static invalidateTokenCache(tokenId: string): void {
    CacheService.remove(`nft_data_${tokenId}`);
  }
  
  /**
   * Invalidar cache para um território específico (após uma atualização)
   */
  public static invalidateTerritoryCache(tokenId: string, networkId: string): void {
    CacheService.remove(`territory_data_${tokenId}_${networkId}`);
  }
}
