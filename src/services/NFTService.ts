// src/services/NFTService.ts
import { ethers } from 'ethers';

// Endereços reais dos contratos na Base Sepolia
const CONTRACTS = {
  CRYPTO_ATLAS_NFT: '0x1A3B7cD224453cDF2EAeF79eaCFfB737E7207878',
  NETWORK_REGISTRY: '0x821587E27f9296677928d6b8045de8fdB1E20bd3',
  TERRITORY_DATA_STORE: '0xA5295C041B3Bd8dC2C7F0313Dc9808Ba484D7Ffe',
  ATLAS_RENDERER_CORE: '0x5278e3F3C5dF2ceD17588e69e49bEB3374C15D42'
};

// ABIs simplificados dos contratos
const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getFusionLevel(uint256 tokenId) view returns (uint8)",
  "function getTokenFullData(uint256 tokenId) view returns (string, string[], uint8, string, string)",
  "function getActiveNetworks(uint256 tokenId) view returns (string[])",
  "function exists(uint256 tokenId) view returns (bool)",
  "function totalSupply() view returns (uint256)"
];

const NETWORK_REGISTRY_ABI = [
  "function getNetworks() external view returns (string[] memory)",
  "function getNetwork(string memory id) external view returns (tuple(string id, string name, uint8 territoryType, string iconSVG, int256 positionX, int256 positionY, string color, string borderColor))",
  "function getNetwork3DData(string memory id) external view returns (tuple(int256 positionZ, uint256 size, uint256 scale, uint256 baseHeight, string modelType, string specialEffects))",
  "function getNetworkConnections(string memory id) external view returns (string[] memory)"
];

const TERRITORY_DATA_STORE_ABI = [
  "function getTerritoryData(uint256 tokenId, string memory networkId) external view returns (uint256 balance, uint256 nftCount, uint256 transactions, uint256 stakedAmount, uint256 lastUpdate)"
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
 * Serviço para interagir com contratos NFT
 */
export class NFTService {
  private static provider = new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
  
  /**
   * Verifica se o token existe no contrato
   * @param tokenId ID do token NFT
   */
  public static async tokenExists(tokenId: string): Promise<boolean> {
    try {
      // Conectar ao contrato NFT
      const nftContract = new ethers.Contract(
        CONTRACTS.CRYPTO_ATLAS_NFT,
        NFT_ABI,
        this.provider
      );
      
      // Alguns contratos têm uma função "exists"
      try {
        return await nftContract.exists(tokenId);
      } catch (e) {
        // Se não tiver a função "exists", tenta chamar ownerOf
        // Se não lançar exceção, o token existe
        await nftContract.ownerOf(tokenId);
        return true;
      }
    } catch (error) {
      // Se ownerOf lançar uma exceção, o token não existe
      return false;
    }
  }
  
  /**
   * Obtém dados básicos do NFT a partir do seu ID
   * @param tokenId ID do token NFT
   */
  public static async getNFTData(tokenId: string): Promise<NFTData> {
    try {
      console.log(`Fetching NFT data for token #${tokenId}`);
      
      // Verificar primeiro se o token existe
      const exists = await this.tokenExists(tokenId);
      if (!exists) {
        console.log(`Token #${tokenId} does not exist.`);
        return {
          exists: false,
          owner: ethers.constants.AddressZero,
          fusionLevel: 1,
          activeNetworks: []
        };
      }
      
      // Conectar ao contrato NFT
      const nftContract = new ethers.Contract(
        CONTRACTS.CRYPTO_ATLAS_NFT,
        NFT_ABI,
        this.provider
      );
      
      // Obter proprietário do NFT
      let owner;
      try {
        owner = await nftContract.ownerOf(tokenId);
        console.log(`Owner of token #${tokenId}: ${owner}`);
      } catch (error) {
        console.error(`Error getting owner of token #${tokenId}:`, error);
        owner = ethers.constants.AddressZero;
      }
      
      // Obter nível de fusão
      let fusionLevel;
      try {
        fusionLevel = await nftContract.getFusionLevel(tokenId);
        console.log(`Fusion level of token #${tokenId}: ${fusionLevel}`);
      } catch (error) {
        console.error(`Error getting fusion level of token #${tokenId}:`, error);
        fusionLevel = 1;
      }
      
      // Obter redes ativas
      let activeNetworks = [];
      try {
        activeNetworks = await nftContract.getActiveNetworks(tokenId);
        console.log(`Active networks for token #${tokenId}:`, activeNetworks);
      } catch (error) {
        console.error(`Error getting active networks for token #${tokenId}:`, error);
      }
      
      // Obter dados completos do token
      let customName = `Crypto Atlas #${tokenId}`;
      try {
        const fullData = await nftContract.getTokenFullData(tokenId);
        if (fullData && fullData[0]) {
          customName = fullData[0];
        }
        console.log(`Custom name for token #${tokenId}: ${customName}`);
      } catch (error) {
        console.error(`Error getting full data for token #${tokenId}:`, error);
      }
      
      return {
        exists: true,
        owner,
        fusionLevel: parseInt(fusionLevel.toString()),
        activeNetworks: activeNetworks || [],
        customName
      };
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
  ): Promise<{
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  }> {
    try {
      // Verificar primeiro se o token existe
      const exists = await this.tokenExists(tokenId);
      if (!exists) {
        return {
          balance: 0,
          nftCount: 0,
          transactions: 0,
          stakedAmount: 0,
          lastUpdate: Math.floor(Date.now() / 1000)
        };
      }
      
      // Conectar ao contrato TerritoryDataStore
      const territoryContract = new ethers.Contract(
        CONTRACTS.TERRITORY_DATA_STORE,
        TERRITORY_DATA_STORE_ABI,
        this.provider
      );
      
      // Buscar dados do território
      const data = await territoryContract.getTerritoryData(tokenId, networkId);
      
      return {
        balance: parseFloat(ethers.utils.formatEther(data.balance)),
        nftCount: parseInt(data.nftCount.toString()),
        transactions: parseInt(data.transactions.toString()),
        stakedAmount: parseFloat(ethers.utils.formatEther(data.stakedAmount)),
        lastUpdate: parseInt(data.lastUpdate.toString())
      };
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
   * Obtém dados de rede do contrato NetworkRegistry
   * @param networkId ID da rede
   */
  public static async getNetworkData(networkId: string): Promise<any> {
    try {
      // Conectar ao contrato NetworkRegistry
      const networkContract = new ethers.Contract(
        CONTRACTS.NETWORK_REGISTRY,
        NETWORK_REGISTRY_ABI,
        this.provider
      );
      
      // Buscar dados da rede
      const networkData = await networkContract.getNetwork(networkId);
      
      // Buscar dados 3D da rede
      const network3DData = await networkContract.getNetwork3DData(networkId);
      
      return {
        ...networkData,
        ...network3DData
      };
    } catch (error) {
      console.error(`Error fetching network data for ${networkId}:`, error);
      return null;
    }
  }
  
  /**
   * Retorna informações sobre o supply do contrato NFT
   */
  public static async getContractInfo(): Promise<{ totalSupply: number }> {
    try {
      // Conectar ao contrato NFT
      const nftContract = new ethers.Contract(
        CONTRACTS.CRYPTO_ATLAS_NFT,
        NFT_ABI,
        this.provider
      );
      
      // Obter oferta total
      const totalSupply = await nftContract.totalSupply();
      
      return {
        totalSupply: parseInt(totalSupply.toString())
      };
    } catch (error) {
      console.error("Error fetching contract info:", error);
      return {
        totalSupply: 0
      };
    }
  }
  
  /**
   * Obtém todas as redes disponíveis no contrato NetworkRegistry
   */
  public static async getAvailableNetworks(): Promise<string[]> {
    try {
      // Conectar ao contrato NetworkRegistry
      const networkContract = new ethers.Contract(
        CONTRACTS.NETWORK_REGISTRY,
        NETWORK_REGISTRY_ABI,
        this.provider
      );
      
      // Buscar lista de redes
      return await networkContract.getNetworks();
    } catch (error) {
      console.error("Error fetching available networks:", error);
      return [];
    }
  }
}