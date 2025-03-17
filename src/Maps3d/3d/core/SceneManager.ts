// src/Maps3d/3d/core/SceneManager.ts
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
import { OrnamentIntegration } from './OrnamentIntegration';

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
  private ornamentIntegration: OrnamentIntegration;
  
  private territories: Map<string, THREE.Object3D> = new Map();
  private isAnimating: boolean = false;
  
  /**
   * Creates the scene manager for the 3D map
   * @param container HTML element that will contain the Three.js canvas
   */
  constructor(container: HTMLElement) {
    this.container = container;
    
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5e9c9);
    this.ornamentIntegration = new OrnamentIntegration();

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    // Clear existing territories
    this.territories.forEach(territory => this.scene.remove(territory));
    this.territories.clear();
    
    // Load new territories
    for (const territory of territories) {
      const territoryObject = this.territoryFactory.createTerritory(territory);
      // Store territory ID in userData for later reference
      territoryObject.userData = {
        ...territoryObject.userData,
        id: territory.id
      };
      
      this.scene.add(territoryObject);
      this.territories.set(territory.id, territoryObject);
      
      this.ornamentIntegration.addOrnamentsToTerritory(territoryObject, territory);

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
    }
    
    // Reset view to show all territories
    this.resetView();
    
    return Promise.resolve();
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
    
    const position = new THREE.Vector3();
    territory.getWorldPosition(position);
    
    this.cameraController.focusOn(position, territory);
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
   * Main animation loop
   */
  private animate(): void {
    if (!this.isAnimating) return;
    
    requestAnimationFrame(this.animate.bind(this));
    
    // Update camera controls
    this.cameraController.update();
    
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
  }
}