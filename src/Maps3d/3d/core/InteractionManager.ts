// src/Maps3d/3d/core/InteractionManager.ts
import * as THREE from 'three';

export interface Interactable {
  object: THREE.Object3D;
  userData: { [key: string]: any };
  onHover?: () => void;
  onClick?: () => void;
  onBlur?: () => void;
}

export class InteractionManager {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private interactables: Interactable[] = [];
  private hoveredObject: Interactable | null = null;
  
  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.domElement = domElement;
    
    // Register events
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('click', this.onClick.bind(this));
  }
  
  public register(interactable: Interactable): void {
    this.interactables.push(interactable);
  }
  
  public unregister(object: THREE.Object3D): void {
    this.interactables = this.interactables.filter(
      interactable => interactable.object !== object
    );
    
    if (this.hoveredObject?.object === object) {
      this.hoveredObject = null;
    }
  }
  
  public update(): void {
    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check for intersections
    const interactableObjects = this.interactables.map(i => i.object);
    const intersects = this.raycaster.intersectObjects(interactableObjects, true);
    
    // Check if we have an intersection
    if (intersects.length > 0) {
      // Find the interactive object in which the intersection occurred
      const intersectedObject = intersects[0].object;
      let targetObject: THREE.Object3D | null = intersectedObject;
      
      // Go up the hierarchy to find the registered interactive object
      while (targetObject && !interactableObjects.includes(targetObject)) {
        targetObject = targetObject.parent;
      }
      
      if (targetObject) {
        const interactable = this.interactables.find(i => i.object === targetObject);
        
        if (interactable && interactable !== this.hoveredObject) {
          // Leaving previous object
          if (this.hoveredObject && this.hoveredObject.onBlur) {
            this.hoveredObject.onBlur();
          }
          
          // Entering new object
          this.hoveredObject = interactable;
          
          if (interactable.onHover) {
            interactable.onHover();
          }
          
          this.domElement.style.cursor = 'pointer';
        }
      }
    } else if (this.hoveredObject) {
      // Leaving any object without entering another
      if (this.hoveredObject.onBlur) {
        this.hoveredObject.onBlur();
      }
      
      this.hoveredObject = null;
      this.domElement.style.cursor = 'default';
    }
  }
  
  private onMouseMove(event: MouseEvent): void {
    // Calculate normalized mouse position (-1 to 1)
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  private onClick(event: MouseEvent): void {
    // If we have an object under the cursor, call its click handler
    if (this.hoveredObject && this.hoveredObject.onClick) {
      this.hoveredObject.onClick();
    }
  }
  
  public dispose(): void {
    this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.removeEventListener('click', this.onClick.bind(this));
    this.interactables = [];
    this.hoveredObject = null;
  }
}