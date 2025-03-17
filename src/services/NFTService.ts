// src/services/NFTService.ts
import { ethers } from 'ethers';

// Endereços reais dos contratos na Base Sepolia
const CONTRACTS = {
  CRYPTO_ATLAS_NFT: '0x91B80CcE88B265392e801f2e9C9F4B4994EE66a7',
  NETWORK_REGISTRY: '0xDBB3963F74AbBC2baF2A2ffbD9e1391F7c6C65DF',
  TERRITORY_DATA_STORE: '0xcc3f4Fd23806F9a309355eBcada6c25372ff2B84',
  ATLAS_RENDERER_CORE: '0x2D210E4F67b866e7BC28976bac810FF814e30B16'
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
  
  // Lista padrão de redes - usada como fallback
  private static DEFAULT_NETWORKS = [
    "ethereum", "polygon", "arbitrum", "optimism", 
    "avalanche", "base", "zksync"
  ];
  
  /**
   * Verifica se o token existe no contrato
   * @param tokenId ID do token NFT
   */
  public static async tokenExists(tokenId: string): Promise<boolean> {
    try {
      // Validar tokenId
      if (isNaN(parseInt(tokenId)) || parseInt(tokenId) <= 0) {
        return false;
      }
      
      // Tenta conectar ao contrato NFT
      try {
        const nftContract = new ethers.Contract(
          CONTRACTS.CRYPTO_ATLAS_NFT,
          NFT_ABI,
          this.provider
        );
      
        // Tenta usar função exists() se existir
        try {
          return await nftContract.exists(tokenId);
        } catch (e) {
          // Se não tiver a função "exists", tenta chamar ownerOf
          try {
            await nftContract.ownerOf(tokenId);
            return true;
          } catch (ownerError) {
            // Se houver erro específico de token não existente
            if (
              (ownerError.message && ownerError.message.includes("nonexistent token")) ||
              (ownerError.code && ownerError.code === "CALL_EXCEPTION")
            ) {
              return false;
            }
            
            // Outros erros mais genéricos
            console.warn(`Error checking token existence: ${ownerError.message}`);
            return false;
          }
        }
      } catch (contractError) {
        console.error("Error interacting with contract:", contractError);
        return false;
      }
    } catch (error) {
      console.debug('Error checking if token exists:', error);
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
        console.log(`Token #${tokenId} does not exist or contract revert. Using fallback data.`);
        
        // Retornar dados de fallback indicando que o token não existe
        return {
          exists: false,
          owner: ethers.constants.AddressZero,
          fusionLevel: 1,
          activeNetworks: []
        };
      }
      
      // Tentando obter um contrato NFT
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
      
      // Obter dados específicos do token de acordo com o design do contrato atual
      let fusionLevel = 1;  // Valor padrão para NFTs recém-mintados
      let activeNetworks = ["ethereum"];  // Padrão conforme CryptoAtlasNFT.sol - ethereum é adicionado por padrão
      let customName = `Crypto Atlas #${tokenId}`;
      
      try {
        // Tenta obter dados de fusão - se falhar, usa os valores padrão
        fusionLevel = await nftContract.getFusionLevel(tokenId);
        console.log(`Fusion level of token #${tokenId}: ${fusionLevel}`);
      } catch (error) {
        console.warn(`Error getting fusion level for token #${tokenId}, using default level 1:`, error);
        // Manter o valor padrão 1
      }
      
      try {
        // Tenta obter redes ativas - se falhar, usa os valores padrão (ethereum)
        const networks = await nftContract.getActiveNetworks(tokenId);
        if (networks && networks.length > 0) {
          activeNetworks = networks;
        }
        console.log(`Active networks for token #${tokenId}:`, activeNetworks);
      } catch (error) {
        console.warn(`Error getting active networks for token #${tokenId}, using default (ethereum):`, error);
        // Manter a ethereum como rede padrão
      }
      
      try {
        // Tenta obter nome customizado e outros dados
        const fullData = await nftContract.getTokenFullData(tokenId);
        if (fullData && fullData[0]) {
          customName = fullData[0];
        }
        console.log(`Custom name for token #${tokenId}: ${customName}`);
        
        // Se getTokenFullData retornar dados de rede, usar isso em vez dos dados padrão
        if (fullData && fullData[1] && fullData[1].length > 0) {
          activeNetworks = fullData[1];
        }
        
        // Se getTokenFullData retornar nível de fusão, usar isso em vez do valor padrão
        if (fullData && fullData[2]) {
          fusionLevel = fullData[2];
        }
      } catch (error) {
        console.warn(`Error getting full data for token #${tokenId}, using defaults:`, error);
        // Manter os valores padrão já definidos
      }
      
      return {
        exists: true,
        owner,
        fusionLevel: parseInt(fusionLevel.toString()) || 1,
        activeNetworks: activeNetworks || ["ethereum"],
        customName
      };
    } catch (error) {
      console.error(`Error fetching NFT data for token #${tokenId}:`, error);
      
      // Em caso de erro geral, retornar dados básicos
      return {
        exists: true, // Presumimos que existe já que verificamos antes
        owner: ethers.constants.AddressZero,
        fusionLevel: 1,
        activeNetworks: ["ethereum"],
        customName: `Crypto Atlas #${tokenId}`
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
      // Tenta conectar ao contrato
      const territoryContract = new ethers.Contract(
        CONTRACTS.TERRITORY_DATA_STORE,
        TERRITORY_DATA_STORE_ABI,
        this.provider
      );
      
      // Tenta obter os dados do território
      try {
        const data = await territoryContract.getTerritoryData(tokenId, networkId);
        
        return {
          balance: parseFloat(ethers.utils.formatEther(data.balance)),
          nftCount: parseInt(data.nftCount.toString()),
          transactions: parseInt(data.transactions.toString()),
          stakedAmount: parseFloat(ethers.utils.formatEther(data.stakedAmount)),
          lastUpdate: parseInt(data.lastUpdate.toString())
        };
      } catch (error) {
        console.debug(`Error getting territory data from contract:`, error);
        // Este território pode não estar ativo para este token
        return this.getEmptyTerritoryData();
      }
    } catch (error) {
      console.error(`Error fetching territory data for token #${tokenId} and network ${networkId}:`, error);
      return this.getEmptyTerritoryData();
    }
  }
  
  /**
   * Retorna um objeto de dados de território vazio
   */
  private static getEmptyTerritoryData(): {
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  } {
    return {
      balance: 0,
      nftCount: 0,
      transactions: 0,
      stakedAmount: 0,
      lastUpdate: Math.floor(Date.now() / 1000)
    };
  }
  
  /**
   * Retorna informações sobre o supply do contrato NFT
   */
  public static async getContractInfo(): Promise<{ totalSupply: number }> {
    try {
      // Tenta conectar ao contrato
      const nftContract = new ethers.Contract(
        CONTRACTS.CRYPTO_ATLAS_NFT,
        NFT_ABI,
        this.provider
      );
      
      // Obter oferta total
      try {
        const totalSupply = await nftContract.totalSupply();
        return {
          totalSupply: parseInt(totalSupply.toString())
        };
      } catch (error) {
        console.error("Error fetching totalSupply:", error);
        // Retornar um valor padrão
        return {
          totalSupply: 100
        };
      }
    } catch (error) {
      console.error("Error fetching contract info:", error);
      return {
        totalSupply: 100
      };
    }
  }
  
  /**
   * Obtém todas as redes disponíveis no contrato NetworkRegistry
   */
  public static async getAvailableNetworks(): Promise<string[]> {
    try {
      // Tenta conectar ao contrato
      const networkContract = new ethers.Contract(
        CONTRACTS.NETWORK_REGISTRY,
        NETWORK_REGISTRY_ABI,
        this.provider
      );
      
      // Buscar lista de redes
      try {
        return await networkContract.getNetworks();
      } catch (error) {
        console.error("Error fetching network list:", error);
        // Retornar lista padrão de redes
        return this.DEFAULT_NETWORKS;
      }
    } catch (error) {
      console.error("Error fetching available networks:", error);
      return this.DEFAULT_NETWORKS;
    }
  }
}