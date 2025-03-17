// src/Maps3d/3d/connections/PathMarker.ts - Animation Fix
import * as THREE from 'three';

export class PathMarker {
  private curve: THREE.QuadraticBezierCurve3;
  public mesh: THREE.Mesh;
  private t: number = 0;
  private speed: number;
  
  /**
   * Creates an animated marker that moves along a path
   * @param startPoint Start point of the path
   * @param endPoint End point of the path
   * @param color Color of the marker
   * @param speed Movement speed (0-1, where 1 is a complete lap per frame)
   */
  constructor(
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    color: number = 0xb98b56,
    speed: number = 0.003
  ) {
    try {
      // Create mid point for the curve
      const midPoint = new THREE.Vector3().addVectors(
        startPoint, 
        endPoint
      ).multiplyScalar(0.5);
      
      // Elevate the mid point to create a curve
      midPoint.y += 1.5;
      
      // Create curve for movement
      this.curve = new THREE.QuadraticBezierCurve3(
        startPoint,
        midPoint,
        endPoint
      );
      
      // Random initial position on the curve
      this.t = Math.random();
      
      // Movement speed
      this.speed = speed;
      
      // Create marker mesh
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      });
      
      this.mesh = new THREE.Mesh(geometry, material);
      
      // Position initially
      this.updatePosition();
    } catch (error) {
      console.error("Error creating path marker:", error);
      // Create a placeholder mesh if something went wrong
      const geometry = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.visible = false; // Hide the error marker
    }
  }
  
  /**
   * Updates the position of the marker along the curve
   */
  private updatePosition(): void {
    try {
      const position = this.curve.getPointAt(this.t);
      this.mesh.position.copy(position);
    } catch (error) {
      console.error("Error updating marker position:", error);
    }
  }
  
  /**
   * Updates the marker (movement)
   */
  public update(): void {
    try {
      // Advance position
      this.t += this.speed;
      
      // Loop at the end
      if (this.t > 1) {
        this.t = 0;
      }
      
      // Update position
      this.updatePosition();
    } catch (error) {
      console.error("Error updating marker:", error);
    }
  }
}