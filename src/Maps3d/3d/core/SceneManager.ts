// src/Maps3d/3d/core/SceneManager.ts - Correção do erro de boundingSphere
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { NetworkConnection } from '../../types/Network';
import { TerritoryFactory } from '../territories/TerritoryFactory';
import { ConnectionManager } from '../connections/ConnectionManager';
import { CameraController } from './CameraController';
import { InteractionManager, Interactable } from './InteractionManager';
import { LightingSetup } from './LightingSetup';
import { OceanRenderer } from '../elements/OceanRenderer';
import { BorderRenderer } from '../elements/BorderRenderer';
import { CompassRenderer } from '../elements/CompassRenderer';

export class SceneManager {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private cameraController: CameraController;
  private interactionManager: InteractionManager;
  private lightingSetup: LightingSetup;
  private territoryFactory: TerritoryFactory;
  private connectionManager: ConnectionManager;
  private oceanRenderer: OceanRenderer;
  private borderRenderer: BorderRenderer;
  private compassRenderer: CompassRenderer;
  
  private territories: Map<string, THREE.Object3D> = new Map();
  private isAnimating: boolean = false;
  private lastCameraPosition: THREE.Vector3 = new THREE.Vector3();
  
  /**
   * Creates the scene manager for the 3D map
   * @param container HTML element that will contain the Three.js canvas
   */
  constructor(container: HTMLElement) {
    this.container = container;
    
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5e9c9);

    // Initialize renderer with better settings for performance
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    
    // Configure shadows for better performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false; // Manually update for better performance
    this.renderer.shadowMap.needsUpdate = true;
    
    container.appendChild(this.renderer.domElement);
    
    // Initialize camera controller with the DOM element for direct event handling
    this.cameraController = new CameraController(
      container.clientWidth / container.clientHeight,
      this.renderer.domElement
    );
    
    // Other components initialization
    this.lightingSetup = new LightingSetup(this.scene);
    this.interactionManager = new InteractionManager(
      this.cameraController.getCamera(),
      this.renderer.domElement
    );
    
    // Initialize renderers
    this.territoryFactory = new TerritoryFactory();
    this.connectionManager = new ConnectionManager(this.scene);
    this.oceanRenderer = new OceanRenderer();
    this.borderRenderer = new BorderRenderer();
    this.compassRenderer = new CompassRenderer();
    
    // Add base elements
    this.scene.add(this.oceanRenderer.create());
    this.scene.add(this.borderRenderer.create());
    this.scene.add(this.compassRenderer.create());
    
    // Add resize event
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  /**
   * Load territories into the scene
   * @param territories List of territories to render
   */
  public async loadTerritories(territories: Territory[]): Promise<void> {
    console.log(`Loading ${territories.length} territories`);
    
    // Clear existing territories
    this.territories.forEach(territory => {
      this.interactionManager.unregister(territory);
      this.scene.remove(territory);
    });
    this.territories.clear();
    
    // Check if we have a large number of territories to load
    const isLargeSet = territories.length > 10;
    
    // Create promise queue for loading territories
    const loadPromises: Promise<void>[] = [];
    
    // Load territories with load balancing for large sets
    for (let i = 0; i < territories.length; i++) {
      const territory = territories[i];
      
      // For large sets, stagger the loading to prevent freezing
      if (isLargeSet) {
        loadPromises.push(
          new Promise<void>(resolve => {
            // Delay loading of later territories for better responsiveness
            setTimeout(() => {
              this.loadSingleTerritory(territory);
              resolve();
            }, i * 50); // 50ms stagger between territory loading
          })
        );
      } else {
        // For small sets, load immediately
        this.loadSingleTerritory(territory);
      }
    }
    
    // Wait for all territories to load if we're using staggered loading
    if (isLargeSet) {
      await Promise.all(loadPromises);
    }
    
    // Force shadow map update after all territories are loaded
    this.renderer.shadowMap.needsUpdate = true;
    
    // Reset view to show all territories
    this.resetView();
    
    return Promise.resolve();
  }
  
  /**
   * Load a single territory and add it to the scene
   */
  private loadSingleTerritory(territory: Territory): void {
    try {
      // Create territory with integrated ornaments
      const territoryObject = this.territoryFactory.createTerritory(territory);
      
      // Add to scene and territory map
      this.scene.add(territoryObject);
      this.territories.set(territory.id, territoryObject);
      
      // Register territory for interaction
      this.interactionManager.register({
        object: territoryObject,
        userData: { territoryId: territory.id },
        onClick: () => {
          // Dispatch custom event when a territory is clicked
          const event = new CustomEvent('territory-click', {
            detail: { territoryId: territory.id }
          });
          this.container.dispatchEvent(event);
        },
        onHover: () => {
          // Change cursor to pointer on hover
          this.container.style.cursor = 'pointer';
        },
        onBlur: () => {
          // Reset cursor
          this.container.style.cursor = 'default';
        }
      });
      
      // Apply optimizations
      this.applyTerritoryOptimizations(territoryObject);
      
    } catch (error) {
      console.error(`Error loading territory ${territory.id}:`, error);
    }
  }
  
  /**
   * Apply performance optimizations to territory objects
   */
  private applyTerritoryOptimizations(territoryObject: THREE.Object3D): void {
    // Otimizações para melhorar o desempenho com muitos territórios
    
    // Percorrer a hierarquia e configurar frustrumCulled = true para todos os elementos
    territoryObject.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.frustumCulled = true;
        
        // Simplificar geometrias complexas quando distantes
        if (object.geometry && object.geometry.attributes && 
            object.geometry.attributes.position && 
            object.geometry.attributes.position.count > 1000) {
          
          // Salvar referência à geometria original (alta qualidade)
          object.userData.highQualityGeometry = object.geometry;
        }
      }
    });
  }
  
  /**
   * Add connections between territories
   * @param connections List of connections to render
   */
  public addConnections(connections: NetworkConnection[]): void {
    this.connectionManager.createConnections(connections, this.territories);
  }
  
  /**
   * Start the animation loop
   */
  public startAnimation(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animate();
  }
  
  /**
   * Stop the animation loop
   */
  public stopAnimation(): void {
    this.isAnimating = false;
  }
  
  /**
   * Focus the camera on a specific territory
   * @param territoryId ID of the territory to focus on
   */
  public focusOnTerritory(territoryId: string): void {
    const territory = this.territories.get(territoryId);
    if (!territory) return;
    
    // Guardar a vista atual para poder voltar depois
    territory.userData.previousCameraPosition = this.cameraController.getCamera().position.clone();
    
    const position = new THREE.Vector3();
    territory.getWorldPosition(position);
    
    this.cameraController.focusOn(position, territory);
    
    // Forçar a atualização do mapa de sombras após o foco
    this.renderer.shadowMap.needsUpdate = true;
  }
  
  /**
   * Reset the view to show all territories
   */
  public resetView(): void {
    // If there are no territories, use default view
    if (this.territories.size === 0) {
      this.cameraController.resetToDefault();
      return;
    }
    
    // Calculate bounds of all territories
    const bounds = new THREE.Box3();
    this.territories.forEach(territory => {
      const territoryBounds = new THREE.Box3().setFromObject(territory);
      bounds.union(territoryBounds);
    });
    
    // Calculate center and size
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    
    const size = new THREE.Vector3();
    bounds.getSize(size);
    
    // Adjust camera to show all territories
    this.cameraController.fitToView(center, size);
    
    // Atualizar o mapa de sombras
    this.renderer.shadowMap.needsUpdate = true;
  }
  
  /**
   * Update the scene when the window is resized
   */
  public onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.cameraController.updateAspect(width / height);
    this.renderer.setSize(width, height);
  }
  
  /**
   * Update LOD (Level of Detail) based on camera distance - versão simplificada sem usar frustum
   */
  private updateLOD(): void {
    // Otimizar apenas se a câmera moveu significativamente
    const camera = this.cameraController.getCamera();
    const cameraPosition = camera.position.clone();
    
    if (cameraPosition.distanceTo(this.lastCameraPosition) < 2.0) {
      return; // Não atualizar LOD se a câmera não moveu o suficiente
    }
    
    this.lastCameraPosition.copy(cameraPosition);
    
    // Verificar cada território baseado apenas na distância
    this.territories.forEach(territory => {
      // Ajustar LOD com base na distância
      const distance = camera.position.distanceTo(territory.position);
      
      // Desativar detalhes para territórios muito distantes
      if (distance > 100) {
        // Reduzir detalhes para territórios distantes
        territory.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = false;
          }
        });
      } else {
        // Restaurar detalhes para territórios próximos
        territory.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
          }
        });
      }
    });
  }
  
  /**
   * Main animation loop
   */
  private animate(): void {
    if (!this.isAnimating) return;
    
    requestAnimationFrame(this.animate.bind(this));
    
    // Update camera controls
    this.cameraController.update();
    
    // Update LOD based on camera distance
    this.updateLOD();
    
    // Update connection animations
    this.connectionManager.updateAnimations();
    
    // Update interactions
    this.interactionManager.update();
    
    // Render scene
    this.renderer.render(this.scene, this.cameraController.getCamera());
  }
  
  /**
   * Release resources when the scene is no longer needed
   */
  public dispose(): void {
    // Stop animation
    this.stopAnimation();
    
    // Remove listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    // Clear interactions
    this.interactionManager.dispose();
    
    // Clear scene
    this.scene.clear();
    
    // Remove canvas
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    
    // Dispose of renderer
    this.renderer.dispose();
    
    // Clear all object references
    this.territories.clear();
  }
}