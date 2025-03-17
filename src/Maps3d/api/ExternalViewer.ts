// Maps3d/api/ExternalViewer.ts
import { DEFAULT_NETWORKS, DEFAULT_NETWORK_CONNECTIONS, DEFAULT_NETWORK_VISUAL_DATA } from '../data/DefaultNetworks';
import { Territory, TerritoryType } from '../types/Territory';
import { NetworkConnection } from '../types/Network';
import { ActivityData } from '../types/ActivityData';

/**
 * ExternalViewer - Classe para gerar dados para visualização externa
 * 
 * Fornece métodos para converter dados de redes para o formato necessário
 * para renderização 3D e para APIs externas
 */
export class ExternalViewer {
  /**
   * Converte dados de redes para territórios renderizáveis
   * 
   * @param tokenId ID do token NFT
   * @returns Array de objetos Territory
   */
  public static getTerritoriesForToken(tokenId: string): Territory[] {
    return Object.entries(DEFAULT_NETWORKS).map(([id, network]) => {
      // Gerar uma seed visual única para esse token e rede
      const visualSeed = this.generateSeed(parseInt(tokenId), id);
      
      return {
        id,
        name: network.name,
        type: network.type as TerritoryType,
        position: [
          network.positionX, 
          0, 
          DEFAULT_NETWORK_VISUAL_DATA[id]?.positionZ || 0
        ],
        color: network.color,
        borderColor: network.borderColor,
        size: DEFAULT_NETWORK_VISUAL_DATA[id]?.size / 10 || 1,
        rotation: 0,
        visualSeed,
        fusionLevel: this.getFusionLevel(tokenId),
        colorPalette: visualSeed % 6,
        shapeVariant: Math.floor(visualSeed / 6) % 4,
        rareTraits: 0
      };
    });
  }
  
  /**
   * Obtém as conexões padrão entre territórios
   * 
   * @returns Array de objetos NetworkConnection
   */
  public static getConnections(): NetworkConnection[] {
    return DEFAULT_NETWORK_CONNECTIONS;
  }
  
  /**
   * Gera dados de atividade simulados para um território
   * 
   * @param tokenId ID do token NFT
   * @param networkId ID da rede
   * @returns Objeto ActivityData com dados simulados
   */
  public static generateActivityData(tokenId: string, networkId: string): ActivityData {
    const seed = this.generateSeed(parseInt(tokenId), networkId);
    const rand = (min: number, max: number) => {
      const x = Math.sin(seed * (networkId.length + 1)) * 10000;
      const r = x - Math.floor(x);
      return min + Math.floor(r * (max - min));
    };
    
    return {
      balance: rand(0, 10) + rand(0, 100) / 100,
      nftCount: rand(0, 20),
      transactions: rand(10, 500),
      stakedAmount: rand(0, 5) + rand(0, 100) / 100,
      lastUpdate: Math.floor(Date.now() / 1000) - rand(0, 86400 * 7)
    };
  }
  
  /**
   * Gera metadados para OpenSea e outras plataformas NFT
   * 
   * @param tokenId ID do token NFT
   * @param baseUrl URL base para as APIs
   * @returns Objeto com metadados do token
   */
  public static generateMetadata(tokenId: string, baseUrl: string) {
    const territories = Object.entries(DEFAULT_NETWORKS).map(([id, network]) => {
      const visualSeed = this.generateSeed(parseInt(tokenId), id);
      return {
        id,
        name: network.name,
        type: network.type,
        visualSeed
      };
    });
    
    return {
      name: `Crypto Atlas #${tokenId}`,
      description: `An interactive multi-chain explorer map visualizing blockchain activity. This Crypto Atlas contains ${territories.length} territories at fusion level ${this.getFusionLevel(tokenId)}.`,
      image: `${baseUrl}/api/atlas-image/${tokenId}`,
      external_url: `${baseUrl}/view/atlas/${tokenId}`,
      attributes: [
        {
          trait_type: "Fusion Level",
          value: this.getFusionLevel(tokenId)
        },
        {
          trait_type: "Territories",
          value: territories.length
        },
        {
          trait_type: "Genesis Territory",
          value: "Ethereum Mainland"
        },
        {
          trait_type: "Animation Support",
          value: "Yes"
        }
      ],
      properties: {
        territories: territories.map(t => ({
          id: t.id,
          name: t.name,
          type: t.type,
          seed: t.visualSeed
        })),
        connections: DEFAULT_NETWORK_CONNECTIONS.map(c => `${c.source}-${c.target}`),
        view_url: `${baseUrl}/view/atlas/${tokenId}`,
        animation_url: `${baseUrl}/view/atlas/${tokenId}`,
        interactive: true
      }
    };
  }
  
  /**
   * Gera uma seed visual a partir do tokenId e networkId
   * 
   * @param tokenId ID do token
   * @param networkId ID da rede
   * @returns Número inteiro positivo
   */
  private static generateSeed(tokenId: number, networkId: string): number {
    let hash = 0;
    const str = `${tokenId}-${networkId}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Converter para inteiro de 32 bits
    }
    return Math.abs(hash);
  }
  
  /**
   * Determina o nível de fusão com base no tokenId
   * 
   * @param tokenId ID do token
   * @returns Nível de fusão (1-5)
   */
  private static getFusionLevel(tokenId: string): number {
    // Algoritmo simples para determinar o nível de fusão
    // Em um sistema real, isto poderia vir de dados armazenados no contrato
    return (parseInt(tokenId) % 5) || 1;
  }
}
