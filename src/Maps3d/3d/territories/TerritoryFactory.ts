// src/Maps3d/3d/territories/TerritoryFactory.ts
import { 
  Object3D, 
  MeshStandardMaterial, 
  Color, 
  Group,
  Scene,
  Vector3,
  Mesh,
  DirectionalLight,
  PlaneGeometry  // Add PlaneGeometry to imports
} from 'three';
import { PRNG } from '../../utils/PRNG';
import { generateColorScheme } from '../../utils/ColorGenetics';
import { createLandscape } from './LandscapeGenerator';
import { addForestElements } from './ForestGenerator';
import { addWaterElements } from './WaterGenerator';
import { addMountainElements } from './MountainGenerator';
import { addBuildingElements } from './BuildingGenerator';

// Natural element colors
const NATURAL_COLORS = {
  water: "#1565C0",       // Natural blue water
  forest: "#2E7D32",      // Natural green trees
  mountains: "#757575",   // Natural gray mountains
  desert: "#FBC02D",      // Natural sand color
  plains: "#8BC34A",      // Natural grass color
  snow: "#ECEFF1",        // Snow white
  buildings: "#37474F"    // Dark gray building base color
};

export class TerritoryFactory {
  private scene: Scene | null = null;
  private loadedTerritories: Map<string, Object3D> = new Map();
  private territoryScale: number = 1;
  private defaultSize: number = 100;
  
  constructor(scene?: Scene, options: { territoryScale?: number } = {}) {
    if (scene) {
      this.scene = scene;
    }
    
    this.territoryScale = options.territoryScale || 1;
  }
  
  /**
   * Set the scene where territories will be added
   */
  setScene(scene: Scene) {
    this.scene = scene;
  }
  
  /**
   * Set the scale for all territories
   */
  setTerritoryScale(scale: number) {
    this.territoryScale = scale;
  }
  
  /**
   * Create a territory based on data from the blockchain and add it to the scene
   */
  createTerritory(territoryData: any, options: any = {}) {
   try {
    console.log("Creating territory with data:", {
      id: territoryData?.id,
      position: territoryData?.position,
      type: territoryData?.type
    });

    const networkId = territoryData?.id || 'unknown';
    
    // Check if already loaded
    if (this.loadedTerritories.has(networkId) && !options.forceRecreate) {
      console.log(`Territory ${networkId} already loaded, returning existing instance`);
      return this.loadedTerritories.get(networkId);
    }
    
    // Create random number generator with seed from visual seed
    const seed = territoryData?.visualSeed || Math.floor(Math.random() * 1000000);
    const random = new PRNG(seed);
    
    // Create main container for the territory
    const territory = new Group();
    territory.name = `territory-${networkId}`;
    
    // Generate color scheme - using robust function that handles missing palette
    const colorScheme = generateColorScheme(territoryData, random);
    console.log("Generated color scheme:", colorScheme);
    
    // Use the appropriate renderer based on territory type
    let territoryMesh;
    
    // Import the needed renderers
    const MainlandRenderer = require('./MainlandRenderer').MainlandRenderer;
    const IslandRenderer = require('./IslandRenderer').IslandRenderer;
    const PeninsulaRenderer = require('./PeninsulaRenderer').PeninsulaRenderer;
    const MountainRenderer = require('./MountainRenderer').MountainRenderer;
    const ArchipelagoRenderer = require('./ArchipelagoRenderer').ArchipelagoRenderer;
    const DesertRenderer = require('./DesertRenderer').DesertRenderer;
    const ForestRenderer = require('./ForestRenderer').ForestRenderer;

    // Definir posição do território antes de adicionar o mesh
    if (territoryData?.position) {
      console.log("Setting territory position:", territoryData.position);
      territory.position.set(
        territoryData.position[0], 
        territoryData.position[1], 
        territoryData.position[2]
      );
    }
    
    // Create renderer based on territory type
    switch (territoryData.type) {
      case 'mainland':
        territoryMesh = new MainlandRenderer().createMesh(territoryData, colorScheme);
        break;
      case 'island':
        territoryMesh = new IslandRenderer().createMesh(territoryData, colorScheme);
        break;
      case 'peninsula':
        territoryMesh = new PeninsulaRenderer().createMesh(territoryData, colorScheme);
        break;
      case 'mountains':
        territoryMesh = new MountainRenderer().createMesh(territoryData, colorScheme);
        break;
      case 'archipelago':
        territoryMesh = new ArchipelagoRenderer().createMesh(territoryData, colorScheme);
        break;
      case 'desert':
        territoryMesh = new DesertRenderer().createMesh(territoryData, colorScheme);
        break;
      case 'forest':
        territoryMesh = new ForestRenderer().createMesh(territoryData, colorScheme);
        break;
      default:
        // Fallback to mainland if type is unknown
        territoryMesh = new MainlandRenderer().createMesh(territoryData, colorScheme);
    }
    
    // Add the territory mesh to the group
    territory.add(territoryMesh);
    
    // Rest of your code for applying position, etc.
    
    return territory;
  } catch (error) {
    console.error("Error creating territory:", error);
    // Your fallback code here
  }
}
  
  /**
   * Create multiple territories at once
   */
  createTerritories(territoriesData: any[]) {
    const territories: Object3D[] = [];
    
    for (const territoryData of territoriesData) {
      const territory = this.createTerritory(territoryData);
      if (territory) {
        territories.push(territory);
      }
    }
    
    return territories;
  }
  
  /**
   * Update an existing territory with new data
   */
  updateTerritory(networkId: string, newData: any) {
    if (!this.loadedTerritories.has(networkId)) {
      console.warn(`Territory ${networkId} not found, creating new`);
      return this.createTerritory(newData);
    }
    
    const territory = this.loadedTerritories.get(networkId);
    if (!territory) return null;
    
    // Update user data
    territory.userData = {
      ...territory.userData,
      ...newData,
      colorScheme: territory.userData.colorScheme // Keep original color scheme
    };
    
    // Update activity-based elements if activity data changed
    if (
      newData.balance !== undefined || 
      newData.transactions !== undefined ||
      newData.stakedAmount !== undefined
    ) {
      // Remove existing activity elements
      const activityGroup = territory.getObjectByName('activity-elements');
      if (activityGroup) {
        territory.remove(activityGroup);
      }
      
      // Add new activity elements
      const random = new PRNG(newData.visualSeed || territory.userData.visualSeed || 12345);
      this.addActivityBasedElements(territory, {
        ...territory.userData,
        ...newData
      }, territory.userData.colorScheme, random);
    }
    
    // Update fusion effects if fusion level changed
    if (newData.fusionLevel !== undefined && newData.fusionLevel !== territory.userData.fusionLevel) {
      // Remove existing fusion effects
      const fusionGroup = territory.getObjectByName('fusion-effects');
      if (fusionGroup) {
        territory.remove(fusionGroup);
      }
      
      // Add new fusion effects
      if (newData.fusionLevel > 0) {
        const random = new PRNG(newData.visualSeed || territory.userData.visualSeed || 12345);
        this.addFusionEffects(territory, newData.fusionLevel, territory.userData.colorScheme, random);
      }
    }
    
    return territory;
  }
  
  /**
   * Remove a territory from the scene and cache
   */
  removeTerritory(networkId: string) {
    if (!this.loadedTerritories.has(networkId)) {
      console.warn(`Territory ${networkId} not found, nothing to remove`);
      return;
    }
    
    const territory = this.loadedTerritories.get(networkId);
    if (territory && this.scene) {
      this.scene.remove(territory);
    }
    
    this.loadedTerritories.delete(networkId);
  }
  
  /**
   * Clear all territories from the scene and cache
   */
  clearTerritories() {
    if (this.scene) {
      for (const territory of this.loadedTerritories.values()) {
        this.scene.remove(territory);
      }
    }
    
    this.loadedTerritories.clear();
  }
  
  /**
   * Get a loaded territory by ID
   */
  getTerritory(networkId: string) {
    return this.loadedTerritories.get(networkId) || null;
  }
  
  /**
   * Get all loaded territories
   */
  getAllTerritories() {
    return Array.from(this.loadedTerritories.values());
  }
  
  /**
   * Create the base landscape for a territory
   */
  private createBaseLandscape(territoryData: any, colorScheme: any, random: PRNG) {
    try {
      const size = territoryData?.size || this.defaultSize;
      
      return createLandscape({
        type: territoryData?.type || 'mainland',
        seed: territoryData?.visualSeed || Math.floor(Math.random() * 1000000),
        size: size,
        color: colorScheme.primary,
        random: random
      });
    } catch (error) {
      console.error("Error creating base landscape:", error);
      
      // Create fallback landscape
      return createLandscape({
        type: 'mainland',
        seed: 12345,
        size: this.defaultSize, 
        color: "#4285F4",
        random: new PRNG(12345)
      });
    }
  }
  
  /**
   * Add natural elements specific to the territory type
   */
  private addNaturalElements(territory: Object3D, territoryData: any, random: PRNG) {
    try {
      const type = territoryData?.type || 'mainland';
      
      const naturalGroup = new Group();
      naturalGroup.name = 'natural-elements';
      
      // Using natural colors for elements regardless of territory base color
      switch (type) {
        case 'forest':
          // Add more trees with natural green color
          addForestElements(naturalGroup, {
            density: 0.8,
            color: NATURAL_COLORS.forest,
            random
          });
          break;
          
        case 'island':
        case 'archipelago':
          // Add water surrounding with natural blue color
          addWaterElements(naturalGroup, {
            coverage: 0.6,
            color: NATURAL_COLORS.water,
            random
          });
          break;
          
        case 'mountains':
          // Add mountain ranges with natural gray color
          addMountainElements(naturalGroup, {
            height: 15,
            count: 5,
            color: NATURAL_COLORS.mountains,
            random
          });
          break;
          
        case 'desert':
          // Add desert features with natural sand color
          territory.traverse(child => {
            if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
              child.material = new MeshStandardMaterial({
                color: new Color(NATURAL_COLORS.desert),
                roughness: 0.8,
                metalness: 0.1
              });
            }
          });
          break;
          
        case 'peninsula':
          // Add water on one side and maybe some trees
          addWaterElements(naturalGroup, {
            coverage: 0.3,
            partial: true,
            color: NATURAL_COLORS.water,
            random
          });
          
          addForestElements(naturalGroup, {
            density: 0.3,
            color: NATURAL_COLORS.forest,
            random
          });
          break;
          
        default: // mainland
          // Add some of everything in moderation
          if (random.next() > 0.5) {
            addForestElements(naturalGroup, {
              density: 0.2,
              color: NATURAL_COLORS.forest,
              random
            });
          }
          
          if (random.next() > 0.7) {
            addWaterElements(naturalGroup, {
              coverage: 0.1,
              color: NATURAL_COLORS.water,
              random
            });
          }
          
          if (random.next() > 0.8) {
            addMountainElements(naturalGroup, {
              height: 8,
              count: 2,
              color: NATURAL_COLORS.mountains,
              random
            });
          }
          break;
      }
      
      territory.add(naturalGroup);
    } catch (error) {
      console.error("Error adding natural elements:", error);
      // Just continue without adding natural elements
    }
  }
  
  /**
   * Add elements based on on-chain activity
   */
  private addActivityBasedElements(territory: Object3D, territoryData: any, colorScheme: any, random: PRNG) {
    try {
      const balance = territoryData?.balance || 0;
      const transactions = territoryData?.transactions || 0;
      const stakedAmount = territoryData?.stakedAmount || 0;
      
      const activityGroup = new Group();
      activityGroup.name = 'activity-elements';
      
      // Scale to reasonable values
      const buildingCount = Math.min(10, Math.max(1, Math.floor(transactions / 10) + 1));
      const buildingScale = Math.min(2, Math.max(0.5, (balance / 1000) + 0.5));
      
      // Add buildings with natural building color but accent color highlights
      addBuildingElements(activityGroup, {
        count: buildingCount,
        scale: buildingScale,
        baseColor: NATURAL_COLORS.buildings,
        accentColor: colorScheme.accent,
        random
      });
      
      territory.add(activityGroup);
    } catch (error) {
      console.error("Error adding activity-based elements:", error);
      // Just continue without adding activity elements
    }
  }
  
  /**
   * Add special effects based on fusion level
   */
  private addFusionEffects(territory: Object3D, fusionLevel: number, colorScheme: any, random: PRNG) {
    try {
      const effectsGroup = new Group();
      effectsGroup.name = 'fusion-effects';
      
      // More impressive effects for higher fusion levels
      const intensity = 0.5 + (fusionLevel * 0.2);
      const effectColor = new Color(colorScheme.accent);
      
      // Add glow effect
      if (fusionLevel >= 1) {
        const light = new DirectionalLight(effectColor, intensity);
        light.position.set(0, 50, 0);
        light.target = territory;
        effectsGroup.add(light);
      }
      
      // Add more impressive effects for higher fusion levels...
      
      territory.add(effectsGroup);
    } catch (error) {
      console.error("Error adding fusion effects:", error);
      // Just continue without adding effects
    }
  }
}

// Implementation of the required generator functions
// (These would be imported from separate files in practice)

/**
 * Create base landscape for a territory
 */
function createLandscape(options: any = {}) {
  // This function would create the base terrain mesh
  // Simplified implementation for this example
  const { type = 'mainland', size = 100, color = '#4285F4', random } = options;
  
  // Create a simple landscape mesh
  // Fixed: Added THREE. prefix to PlaneGeometry
  const mesh = new Mesh(
    new PlaneGeometry(size, size, 1, 1),  // Using the imported PlaneGeometry
    new MeshStandardMaterial({ 
      color: new Color(color),
      roughness: 0.7,
      metalness: 0.1,
      side: 2 // DoubleSide = 2 in THREE.js
    })
  );
  
  mesh.rotation.x = -Math.PI / 2; // Make it horizontal
  mesh.name = 'landscape-base';
  return mesh;
}

/**
 * Add forest elements to a territory
 */
function addForestElements(target: Object3D, options: any = {}) {
  // This function would add trees and vegetation
  // Simplified implementation for this example
  const { density = 0.3, color = '#2E7D32', random } = options;
  
  // Create trees based on density
  const treeCount = Math.floor(20 * density);
  
  for (let i = 0; i < treeCount; i++) {
    // Create a tree mesh
    const tree = new Group();
    /* tree implementation */
    
    // Position randomly on the territory
    tree.position.set(
      (random.next() - 0.5) * 80,
      0,
      (random.next() - 0.5) * 80
    );
    
    target.add(tree);
  }
  
  return target;
}

/**
 * Add water elements to a territory
 */
function addWaterElements(target: Object3D, options: any = {}) {
  // This function would add lakes, rivers, etc.
  // Simplified implementation for this example
  const { coverage = 0.3, color = '#1565C0', partial = false, random } = options;
  
  // Create water mesh
  const water = new Mesh(
    new PlaneGeometry(100 * coverage, 100 * coverage), // Using PlaneGeometry for water plane
    new MeshStandardMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.3
    })
  );
  
  water.rotation.x = -Math.PI / 2; // Make it horizontal
  water.position.y = -0.5; // Slightly below ground
  
  target.add(water);
  return target;
}

/**
 * Add mountain elements to a territory
 */
function addMountainElements(target: Object3D, options: any = {}) {
  // This function would add mountains
  // Simplified implementation for this example
  const { height = 10, count = 3, color = '#757575', random } = options;
  
  for (let i = 0; i < count; i++) {
    // Create a mountain mesh using a cone shape
    const mountain = new Mesh(
      new PlaneGeometry(10, 10), // Simplified - should be a cone in real implementation
      new MeshStandardMaterial({
        color: new Color(color),
        roughness: 0.9,
        metalness: 0.1
      })
    );
    
    // Position randomly on the territory
    mountain.position.set(
      (random.next() - 0.5) * 70,
      0,
      (random.next() - 0.5) * 70
    );
    
    target.add(mountain);
  }
  
  return target;
}