// src/services/CachedNFTService.ts
import { ethers } from 'ethers';
import { NFTData, ActivityData } from '../types/NFTTypes';

// Interface de Cache
interface CacheStorage {
  getItem(key: string): any;
  setItem(key: string, value: any, ttl?: number): void;
  removeItem(key: string): void;
}

// Implementação baseada em localStorage
class LocalStorageCache implements CacheStorage {
  private prefix = 'crypto_atlas_';
  private defaultTTL = 30 * 60 * 1000; // 30 minutos

  getItem(key: string): any {
    const rawItem = localStorage.getItem(`${this.prefix}${key}`);
    if (!rawItem) return null;

    try {
      const item = JSON.parse(rawItem);
      
      // Verificar se o item expirou
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (e) {
      console.warn(`Failed to parse cached item ${key}:`, e);
      return null;
    }
  }

  setItem(key: string, value: any, ttl = this.defaultTTL): void {
    const item = {
      value,
      expiry: Date.now() + ttl,
      cachedAt: Date.now()
    };
    
    try {
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn(`Failed to cache item ${key}:`, e);
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`);
  }
}

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

/**
 * Serviço NFT com cache integrado para melhorar performance
 */
export class CachedNFTService {
  private static provider = new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
  private static cache: CacheStorage = new LocalStorageCache();
  
  // Cache TTLs (em milissegundos)
  private static readonly TTL = {
    TOKEN_EXISTS: 12 * 60 * 60 * 1000, // 12 horas
    NFT_DATA: 30 * 60 * 1000,         // 30 minutos
    TERRITORY_DATA: 5 * 60 * 1000,    // 5 minutos
    NETWORK_DATA: 24 * 60 * 60 * 1000, // 24 horas
    CONTRACT_INFO: 24 * 60 * 60 * 1000 // 24 horas
  };
  
  /**
   * Define um cache alternativo (para testes ou outras implementações)
   */
  public static setCache(cache: CacheStorage): void {
    this.cache = cache;
  }
  
  /**
   * Verifica se o token existe no contrato
   */
  public static async tokenExists(tokenId: string): Promise<boolean> {
    const cacheKey = `token_exists_${tokenId}`;
    const cachedValue = this.cache.getItem(cacheKey);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    try {
      // Conectar ao contrato NFT
      const nftContract = new ethers.Contract(
        CONTRACTS.CRYPTO_ATLAS_NFT,
        NFT_ABI,
        this.provider
      );
      
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
      this.cache.setItem(cacheKey, exists, this.TTL.TOKEN_EXISTS);
      return exists;
    } catch (error) {
      console.error(`Error checking if token #${tokenId} exists:`, error);
      return false;
    }
  }
  
  /**
   * Obtém dados básicos do NFT a partir do seu ID
   */
  public static async getNFTData(tokenId: string): Promise<NFTData> {
    const cacheKey = `nft_data_${tokenId}`;
    const cachedData = this.cache.getItem(cacheKey);
    
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
        this.cache.setItem(cacheKey, defaultData, 5 * 60 * 1000); // 5 minutos
        return defaultData;
      }
      
      // Conectar ao contrato NFT
      const nftContract = new ethers.Contract(
        CONTRACTS.CRYPTO_ATLAS_NFT,
        NFT_ABI,
        this.provider
      );
      
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
      this.cache.setItem(cacheKey, result, this.TTL.NFT_DATA);
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
   */
  public static async getTerritoryContractData(
    tokenId: string,
    networkId: string
  ): Promise<ActivityData> {
    const cacheKey = `territory_data_${tokenId}_${networkId}`;
    const cachedData = this.cache.getItem(cacheKey);
    
    if (cachedData !== null) {
      console.log(`Using cached territory data for token #${tokenId}, network ${networkId}`);
      return cachedData;
    }
    
    try {
      // Verificar primeiro se o token existe
      const exists = await this.tokenExists(tokenId);
      if (!exists) {
        const defaultData = {
          balance: 0,
          nftCount: 0,
          transactions: 0,
          stakedAmount: 0,
          lastUpdate: Math.floor(Date.now() / 1000)
        };
        
        this.cache.setItem(cacheKey, defaultData, 5 * 60 * 1000); // 5 minutos
        return defaultData;
      }
      
      // Conectar ao contrato TerritoryDataStore
      const territoryContract = new ethers.Contract(
        CONTRACTS.TERRITORY_DATA_STORE,
        [
          "function getTerritoryActivity(uint256 tokenId, string memory networkId) external view returns (uint256 balance, uint256 nftCount, uint256 transactions, uint256 stakedAmount, uint256 lastUpdate)"
        ],
        this.provider
      );
      
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
      this.cache.setItem(cacheKey, result, this.TTL.TERRITORY_DATA);
      return result;
    } catch (error) {
      console.error(`Error fetching territory data for token #${tokenId} and network ${networkId}:`, error);
      
      // Retornar dados zerados em caso de erro
      return {
        balance: 0,
        nftCount: 0,
        transactions: 0,
        stakedAmount: 0,
        lastUpdate: Math.floor(Date.now() / 1000)
      };
    }
  }
  
  /**
   * Invalidar cache para um token específico (após uma atualização)
   */
  public static invalidateTokenCache(tokenId: string): void {
    const cacheKey = `nft_data_${tokenId}`;
    this.cache.removeItem(cacheKey);
    
    // Também poderia invalidar caches de territórios relacionados
    // mas precisaríamos saber quais redes este token tem
  }
  
  /**
   * Invalidar cache para um território específico (após uma atualização)
   */
  public static invalidateTerritoryCache(tokenId: string, networkId: string): void {
    const cacheKey = `territory_data_${tokenId}_${networkId}`;
    this.cache.removeItem(cacheKey);
  }
}