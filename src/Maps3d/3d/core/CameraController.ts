// src/Maps3d/3d/core/CameraController.ts
import * as THREE from 'three';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  
  // Rotation controls
  private isRotating: boolean = false;
  private rotateStart = new THREE.Vector2();
  private rotateEnd = new THREE.Vector2();
  private rotateDelta = new THREE.Vector2();
  private rotateSpeed: number = 1.0;
  
  // Zoom controls
  private isZooming: boolean = false;
  private zoomStart: number = 0;
  private zoomEnd: number = 0;
  private zoomDelta: number = 0;
  private zoomSpeed: number = 1.0;
  
  // Pan controls
  private isPanning: boolean = false;
  private panStart = new THREE.Vector2();
  private panEnd = new THREE.Vector2();
  private panDelta = new THREE.Vector2();
  private panSpeed: number = 1.0;
  
  // Spherical coordinates
  private spherical = new THREE.Spherical();
  
  // Limits
  private minDistance: number = 5;
  private maxDistance: number = 100;
  private minPolarAngle: number = Math.PI * 0.1; // 18 degrees
  private maxPolarAngle: number = Math.PI * 0.45; // 81 degrees
  
  // Animation
  private isAnimating: boolean = false;
  private animationStartPosition = new THREE.Vector3();
  private animationEndPosition = new THREE.Vector3();
  private animationStartTarget = new THREE.Vector3();
  private animationEndTarget = new THREE.Vector3();
  private animationProgress: number = 0;
  private animationDuration: number = 800; // ms
  private animationStartTime: number = 0;
  
  /**
   * Constructor
   * @param aspect Aspect ratio for camera
   * @param domElement Optional DOM element for event binding (defaults to document)
   */
  constructor(aspect: number, domElement?: HTMLElement) {
    // Create camera
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.resetToDefault();
    
    // Set DOM element
    this.domElement = domElement || document.body;
    
    // Initialize spherical coordinates
    this.updateSpherical();
    
    // Bind event handlers
    this.bindEvents();
  }
  
  /**
   * Get the camera instance
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  /**
   * Bind DOM event listeners
   */
  private bindEvents(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });
    this.domElement.addEventListener('contextmenu', this.onContextMenu.bind(this));
    
    // Touch events for mobile
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
  }
  
  /**
   * Mouse down event handler
   */
  private onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    
    if (event.button === 0) { // Left mouse button
      this.isRotating = true;
      this.rotateStart.set(event.clientX, event.clientY);
    } else if (event.button === 2) { // Right mouse button
      this.isPanning = true;
      this.panStart.set(event.clientX, event.clientY);
    }
    
    const onMouseMove = (e: MouseEvent) => {
      if (this.isRotating) {
        this.rotateEnd.set(e.clientX, e.clientY);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
        
        // Apply rotation
        const element = this.domElement;
        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed);
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed);
        
        this.rotateStart.copy(this.rotateEnd);
      }
      
      if (this.isPanning) {
        this.panEnd.set(e.clientX, e.clientY);
        this.panDelta.subVectors(this.panEnd, this.panStart);
        
        // Apply pan
        this.pan(this.panDelta.x, this.panDelta.y);
        
        this.panStart.copy(this.panEnd);
      }
    };
    
    const onMouseUp = () => {
      this.isRotating = false;
      this.isPanning = false;
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  
  /**
   * Mouse wheel event handler
   */
  private onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    
    this.zoomDelta = event.deltaY * 0.01;
    this.zoom(this.zoomDelta);
  }
  
  /**
   * Context menu event handler (prevent right-click menu)
   */
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }
  
  /**
   * Touch start event handler
   */
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    switch (event.touches.length) {
      case 1: // Single touch: rotate
        this.isRotating = true;
        this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
        break;
        
      case 2: // Two finger touch: zoom
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.isZooming = true;
        this.zoomStart = distance;
        break;
    }
  }
  
  /**
   * Touch move event handler
   */
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    switch (event.touches.length) {
      case 1: // Single touch: rotate
        if (this.isRotating) {
          this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
          this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
          
          // Apply rotation
          const element = this.domElement;
          this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed);
          this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed);
          
          this.rotateStart.copy(this.rotateEnd);
        }
        break;
        
      case 2: // Two finger touch: zoom
        if (this.isZooming) {
          const dx = event.touches[0].pageX - event.touches[1].pageX;
          const dy = event.touches[0].pageY - event.touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          this.zoomEnd = distance;
          this.zoomDelta = (this.zoomStart - this.zoomEnd) * 0.01;
          
          this.zoom(this.zoomDelta);
          this.zoomStart = this.zoomEnd;
        }
        break;
    }
  }
  
  /**
   * Touch end event handler
   */
  private onTouchEnd(event: TouchEvent): void {
    this.isRotating = false;
    this.isZooming = false;
    this.isPanning = false;
  }
  
  /**
   * Rotate left/right around the target
   * @param angle Rotation angle in radians
   */
  private rotateLeft(angle: number): void {
    this.spherical.theta -= angle;
    this.updateCamera();
  }
  
  /**
   * Rotate up/down around the target
   * @param angle Rotation angle in radians
   */
  private rotateUp(angle: number): void {
    this.spherical.phi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.spherical.phi + angle)
    );
    this.updateCamera();
  }
  
  /**
   * Pan the camera
   * @param deltaX X movement
   * @param deltaY Y movement
   */
  private pan(deltaX: number, deltaY: number): void {
    const offset = new THREE.Vector3();
    
    // Get camera direction vectors
    const forward = new THREE.Vector3();
    forward.subVectors(this.camera.position, this.target).normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(this.camera.up, forward).normalize();
    
    const up = new THREE.Vector3();
    up.crossVectors(forward, right);
    
    // Apply pan offsets
    const speedFactor = this.camera.position.distanceTo(this.target) * 0.001;
    
    offset.copy(right).multiplyScalar(-deltaX * this.panSpeed * speedFactor);
    offset.add(up.multiplyScalar(deltaY * this.panSpeed * speedFactor));
    
    this.camera.position.add(offset);
    this.target.add(offset);
    
    this.camera.lookAt(this.target);
  }
  
  /**
   * Zoom the camera
   * @param delta Zoom amount
   */
  private zoom(delta: number): void {
    if (delta > 0) {
      this.spherical.radius = Math.max(this.minDistance, this.spherical.radius - delta * this.spherical.radius * 0.1);
    } else {
      this.spherical.radius = Math.min(this.maxDistance, this.spherical.radius - delta * this.spherical.radius * 0.1);
    }
    
    this.updateCamera();
  }
  
  /**
   * Update spherical coordinates from camera position
   */
  private updateSpherical(): void {
    const offset = new THREE.Vector3();
    offset.subVectors(this.camera.position, this.target);
    
    // Convert to spherical
    this.spherical.setFromVector3(offset);
  }
  
  /**
   * Update camera position from spherical coordinates
   */
  private updateCamera(): void {
    const offset = new THREE.Vector3();
    offset.setFromSpherical(this.spherical);
    
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }
  
  /**
   * Update the camera's aspect ratio
   * @param aspect New aspect ratio
   */
  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Reset the camera to default position
   */
  public resetToDefault(): void {
    this.camera.position.set(0, 40, 35);
    this.target.set(0, 0, 0);
    this.camera.lookAt(this.target);
    this.updateSpherical();
  }
  
  /**
   * Focus the camera on a specific object
   * @param position Position to focus on
   * @param object Optional object to determine appropriate distance
   */
  public focusOn(position: THREE.Vector3, object?: THREE.Object3D): void {
    this.stopAnimation();
    
    // Calculate distance based on object size if provided
    let distance = this.spherical.radius;
    if (object) {
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      distance = Math.max(size.x, size.y, size.z) * 2;
    }
    
    // Calculate new camera position
    const targetPosition = position.clone();
    const direction = new THREE.Vector3().subVectors(this.camera.position, this.target).normalize();
    const cameraPosition = targetPosition.clone().add(direction.multiplyScalar(distance));
    
    // Animate to new position
    this.animateTo(cameraPosition, targetPosition);
  }
  
  /**
   * Animate camera to new position and target
   * @param newPosition New camera position
   * @param newTarget New target to look at
   */
  public animateTo(newPosition: THREE.Vector3, newTarget: THREE.Vector3): void {
    this.isAnimating = true;
    
    // Store start and end positions
    this.animationStartPosition.copy(this.camera.position);
    this.animationEndPosition.copy(newPosition);
    
    this.animationStartTarget.copy(this.target);
    this.animationEndTarget.copy(newTarget);
    
    // Initialize animation
    this.animationStartTime = Date.now();
  }
  
  /**
   * Stop current animation
   */
  public stopAnimation(): void {
    this.isAnimating = false;
  }
  
  /**
   * Fit camera view to include all objects
   * @param center Center point to orbit around
   * @param size Size of the volume to view
   */
  public fitToView(center: THREE.Vector3, size: THREE.Vector3): void {
    this.stopAnimation();
    
    // Calculate maximum dimension
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    // Calculate distance needed to view the entire volume
    const fov = this.camera.fov * Math.PI / 180;
    const distance = maxDimension / (2 * Math.tan(fov / 2)) * 1.2; // Add 20% margin
    
    // Calculate new camera position
    const cameraPosition = new THREE.Vector3(
      center.x,
      center.y + distance * 0.5,
      center.z + distance
    );
    
    // Animate to new position
    this.animateTo(cameraPosition, center);
  }
  
  /**
   * Update camera position and animation
   */
  public update(): void {
    if (this.isAnimating) {
      this.updateAnimation();
    }
  }
  
  /**
   * Update animation
   */
  private updateAnimation(): void {
    const currentTime = Date.now();
    const elapsed = currentTime - this.animationStartTime;
    
    if (elapsed >= this.animationDuration) {
      // Animation complete
      this.camera.position.copy(this.animationEndPosition);
      this.target.copy(this.animationEndTarget);
      this.camera.lookAt(this.target);
      this.updateSpherical();
      this.isAnimating = false;
      return;
    }
    
    // Calculate progress with easing
    const t = elapsed / this.animationDuration;
    const easedT = this.easeInOutCubic(t);
    
    // Interpolate position and target
    this.camera.position.lerpVectors(
      this.animationStartPosition,
      this.animationEndPosition,
      easedT
    );
    
    this.target.lerpVectors(
      this.animationStartTarget,
      this.animationEndTarget,
      easedT
    );
    
    // Update camera
    this.camera.lookAt(this.target);
    this.updateSpherical();
  }
  
  /**
   * Easing function for smooth animation
   * @param t Progress from 0 to 1
   * @returns Eased value
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ?
      4 * t * t * t :
      1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Dispose event listeners
   */
  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.removeEventListener('wheel', this.onMouseWheel.bind(this));
    this.domElement.removeEventListener('contextmenu', this.onContextMenu.bind(this));
    this.domElement.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
}