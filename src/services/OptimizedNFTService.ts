// src/services/OptimizedAtlasService.ts

import { CacheService } from '../utils/CacheService';
import { NFTService } from './NFTService';
import { AtlasModuleLoader } from '../Maps3d/AtlasModuleLoader';
import { DEFAULT_NETWORK_CONNECTIONS } from '../Maps3d/data/DefaultNetworks';
import { Territory } from '../Maps3d/types/Territory';
import { NetworkConnection } from '../Maps3d/types/Network';

/**
 * Optimized service for loading Atlas NFT data
 * Implements aggressive caching, preloading, and fallbacks
 */
export class OptimizedAtlasService {
  /**
   * Load all territories for a token with optimizations
   * @param tokenId The token ID to load
   */
  public static async loadOptimizedTerritories(tokenId: string): Promise<{
    territories: Territory[];
    connections: NetworkConnection[];
    usingFallback: boolean;
    owner: string | null;
    fusionLevel: number;
    customName: string;
  }> {
    // Check cache first
    const cacheKey = `atlas_data_${tokenId}`;
    const cachedData = CacheService.get(cacheKey);
    
    if (cachedData) {
      console.log(`Using cached data for token #${tokenId}`);
      return cachedData;
    }
    
    try {
      // Try to get real data
      console.log(`Loading real NFT data for token #${tokenId}`);
      
      // Get NFT data (owner, fusion level, active networks)
      const nftData = await NFTService.getNFTData(tokenId);
      
      // Load territories using the built-in module loader
      const territories = AtlasModuleLoader.loadTerritories(
        tokenId,
        nftData.activeNetworks,
        nftData.fusionLevel
      );
      
      // Load connections
      const connections = AtlasModuleLoader.loadConnections(
        territories,
        DEFAULT_NETWORK_CONNECTIONS
      );
      
      // Prepare result
      const result = {
        territories,
        connections,
        usingFallback: false,
        owner: nftData.owner,
        fusionLevel: nftData.fusionLevel,
        customName: nftData.customName || `Crypto Atlas #${tokenId}`
      };
      
      // Cache the result
      CacheService.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes
      
      // Start preloading territory activity data
      this.preloadTerritoryData(tokenId, territories.slice(0, 3).map(t => t.id));
      
      return result;
    } catch (error) {
      console.error(`Error loading NFT data for token #${tokenId}:`, error);
      
      // Fallback to demo data if real data fails
      console.log(`Using fallback data for token #${tokenId}`);
      return this.loadFallbackData(tokenId);
    }
  }
  
  /**
   * Load fallback data for demo purposes
   */
  private static async loadFallbackData(tokenId: string): Promise<any> {
    try {
      // Generate demo fusion level based on token ID
      const demoFusionLevel = Math.max(1, (parseInt(tokenId) % 5) || 1);
      
      // Generate active networks based on fusion level
      const availableNetworks = [
        "ethereum", "polygon", "arbitrum", "optimism", 
        "avalanche", "base", "zksync"
      ];
      
      // Ethereum is always active
      let activeNetworks = ["ethereum"];
      
      // Add more networks based on fusion level
      const additionalNetworks = Math.min(
        availableNetworks.length - 1, 
        demoFusionLevel * 2 - 1
      );
      
      for (let i = 0; i < additionalNetworks; i++) {
        if (i + 1 < availableNetworks.length) {
          activeNetworks.push(availableNetworks[i + 1]);
        }
      }
      
      // Load territories and connections
      const territories = AtlasModuleLoader.loadTerritories(
        tokenId,
        activeNetworks,
        demoFusionLevel
      );
      
      const connections = AtlasModuleLoader.loadConnections(
        territories,
        DEFAULT_NETWORK_CONNECTIONS
      );
      
      // Prepare result
      const result = {
        territories,
        connections,
        usingFallback: true,
        owner: "0xDemoAddress1234567890123456789012345678AbCd",
        fusionLevel: demoFusionLevel,
        customName: `Crypto Atlas #${tokenId} (Demo)`
      };
      
      // Cache with shorter TTL since it's demo data
      CacheService.set(`atlas_data_${tokenId}`, result, 2 * 60 * 1000); // 2 minutes
      
      return result;
    } catch (error) {
      console.error(`Error loading fallback data for token #${tokenId}:`, error);
      
      // Return minimal data if even fallback fails
      return {
        territories: [],
        connections: [],
        usingFallback: true,
        owner: null,
        fusionLevel: 1,
        customName: `Crypto Atlas #${tokenId}`
      };
    }
  }
  
  /**
   * Preload territory activity data
   */
  private static async preloadTerritoryData(
    tokenId: string,
    networkIds: string[]
  ): Promise<void> {
    // Don't block the UI thread
    setTimeout(async () => {
      try {
        // Load activity data for each territory in parallel
        await Promise.all(networkIds.map(async (networkId) => {
          const cacheKey = `territory_data_${tokenId}_${networkId}`;
          
          // Skip if already cached
          if (CacheService.has(cacheKey)) {
            return;
          }
          
          try {
            // Get data from contract
            const data = await NFTService.getTerritoryContractData(tokenId, networkId);
            
            // Cache the result
            CacheService.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
          } catch (error) {
            console.debug(`Error preloading data for ${networkId}:`, error);
          }
        }));
      } catch (error) {
        // Don't crash if preloading fails
        console.debug("Error during preloading:", error);
      }
    }, 100);
  }
  
  /**
   * Refresh cached data for a token
   */
  public static invalidateCache(tokenId: string): void {
    CacheService.remove(`atlas_data_${tokenId}`);
  }
}