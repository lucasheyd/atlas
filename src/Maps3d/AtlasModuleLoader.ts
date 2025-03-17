// src/Maps3d/AtlasModuleLoader.ts
// Este módulo se encarrega de carregar apenas os territórios que o usuário possui

import { Territory, TerritoryType } from './types/Territory';
import { NetworkConnection } from './types/Network';
import { DEFAULT_NETWORKS, DEFAULT_NETWORK_VISUAL_DATA } from './data/DefaultNetworks';
import { TerritoryColorService } from '../services/TerritoryColorService';

/**
 * Classe para gerenciar o carregamento de módulos do Atlas
 */
export class AtlasModuleLoader {
  
  /**
   * Carrega apenas os territórios que o usuário possui no NFT
   * @param tokenId ID do token NFT
   * @param activeNetworks Lista de redes ativas no NFT (pode vir do contrato)
   * @param fusionLevel Nível de fusão do NFT
   */
  public static loadTerritories(
  tokenId: string, 
  activeNetworks: string[] = [], 
  fusionLevel: number = 1
): Territory[] {
  // Limitar o número de redes com base no nível de fusão
  const networksToLoad = activeNetworks.length > 0 
    ? activeNetworks.slice(0, fusionLevel * 2)
    : Object.keys(DEFAULT_NETWORKS).slice(0, fusionLevel * 2);

  console.log('Loading territories', {
    tokenId,
    activeNetworks,
    fusionLevel,
    networksToLoad
  });

 
  return networksToLoad.map(networkId => {
    const network = DEFAULT_NETWORKS[networkId];
    
    // Gerar seed visual consistente
    const visualSeed = this.generateSeed(parseInt(tokenId), networkId);

   const colorGenetics = TerritoryColorService.generateInitialColorGenetics(tokenId, networkId);
   const colorScheme = TerritoryColorService.generateColorSchemeFromGenetics(colorGenetics);
    
    return {
      id: networkId,
      name: network.name,
      type: network.type as TerritoryType,
      position: [
        network.positionX, 
        0, 
        DEFAULT_NETWORK_VISUAL_DATA[networkId]?.positionZ || 0
      ],
      color: network.color,
      borderColor: network.borderColor,
      size: DEFAULT_NETWORK_VISUAL_DATA[networkId]?.size / 10 || 1,
      rotation: 0,
      visualSeed,
      fusionLevel: fusionLevel,
      colorPalette: visualSeed % 6,
      shapeVariant: Math.floor(visualSeed / 6) % 4,
      rareTraits: 0,
      primaryColor: colorScheme.primary,
     secondaryColor: colorScheme.secondary,
     accentColor: colorScheme.accent,
     outlineColor: colorScheme.outline,
     colorGenetics: JSON.stringify(colorGenetics) // Para armazenar no tokenURI
    };
  });
}
  
  public static loadTerritories(
    tokenId: string, 
    activeNetworks: string[] = [], 
    fusionLevel: number = 1
  ): Territory[] {
    const networksToLoad = activeNetworks.length > 0 
      ? activeNetworks.slice(0, fusionLevel * 2)
      : Object.keys(DEFAULT_NETWORKS).slice(0, fusionLevel * 2);

    return networksToLoad.map(networkId => {
      const network = DEFAULT_NETWORKS[networkId];
      
      // Gerar seed visual consistente
      const visualSeed = this.generateSeed(parseInt(tokenId), networkId);
      
      // Gerar cores genéticas
      const colorGenetics = TerritoryColorService.generateInitialColorGenetics(tokenId, networkId);
      const colorScheme = TerritoryColorService.generateColorSchemeFromGenetics(colorGenetics);
      
      return {
        id: networkId,
        name: network.name,
        type: network.type as TerritoryType,
        position: [
          network.positionX, 
          0, 
          DEFAULT_NETWORK_VISUAL_DATA[networkId]?.positionZ || 0
        ],
        color: network.color,
        borderColor: network.borderColor,
        size: DEFAULT_NETWORK_VISUAL_DATA[networkId]?.size / 10 || 1,
        rotation: 0,
        visualSeed,
        fusionLevel: fusionLevel,
        colorPalette: visualSeed % 6,
        shapeVariant: Math.floor(visualSeed / 6) % 4,
        rareTraits: 0,
        primaryColor: colorScheme.primary,
        secondaryColor: colorScheme.secondary,
        accentColor: colorScheme.accent,
        outlineColor: colorScheme.outline
      };
    });
  }

  /**
   * Carrega as conexões relevantes para os territórios ativos
   * @param territories Lista de territórios ativos
   * @param allConnections Lista completa de conexões
   */
  public static loadConnections(
    territories: Territory[],
    allConnections: NetworkConnection[]
  ): NetworkConnection[] {
    // Obter IDs dos territórios ativos
    const activeIds = territories.map(t => t.id);
    
    // Filtrar apenas conexões entre territórios ativos
    return allConnections.filter(conn => 
      activeIds.includes(conn.source) && activeIds.includes(conn.target)
    );
  }
  
  /**
   * Gera um seed visual consistente
   * @param tokenId ID do token NFT
   * @param networkId ID da rede
   */
  private static generateSeed(tokenId: number, networkId: string): number {
    let hash = 0;
    const str = `${tokenId}-${networkId}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Valida o nível de fusão e as redes ativas
   * @param tokenId ID do token NFT
   * @param activeNetworks Redes ativas
   * @param fusionLevel Nível de fusão
   */
  public static validateNetworks(
    tokenId: string,
    activeNetworks: string[],
    fusionLevel: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Verificar nível de fusão
    if (fusionLevel <= 0 || fusionLevel > 10) {
      errors.push(`Invalid fusion level: ${fusionLevel}. Must be between 1 and 10.`);
    }
    
    // Verificar número de redes
    if (activeNetworks.length > fusionLevel * 2) {
      errors.push(`Too many networks (${activeNetworks.length}) for fusion level ${fusionLevel}. Maximum allowed: ${fusionLevel * 2}.`);
    }
    
    // Verificar se as redes existem
    activeNetworks.forEach(networkId => {
      if (!DEFAULT_NETWORKS[networkId]) {
        errors.push(`Network ${networkId} not found in network registry.`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
