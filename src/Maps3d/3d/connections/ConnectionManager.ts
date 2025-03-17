// src/Maps3d/3d/connections/ConnectionManager.ts - Animation Fix
import * as THREE from 'three';
import { NetworkConnection } from '../../types/Network';
import { PathMarker } from './PathMarker';
import { PathRenderer } from './PathRenderer';

export class ConnectionManager {
  private scene: THREE.Scene;
  private connections: THREE.Group[] = [];
  private pathMarkers: PathMarker[] = [];
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  /**
   * Creates connections between territories
   */
  public createConnections(
    connections: NetworkConnection[],
    territories: Map<string, THREE.Object3D>
  ): void {
    console.log(`Creating ${connections.length} connections between territories`);
    
    // Clear existing connections
    this.connections.forEach(conn => this.scene.remove(conn));
    this.connections = [];
    this.pathMarkers = [];
    
    // Create new connections
    connections.forEach(connection => {
      const sourceObj = territories.get(connection.source);
      const targetObj = territories.get(connection.target);
      
      if (sourceObj && targetObj) {
        console.log(`Creating connection from ${connection.source} to ${connection.target}`);
        
        const sourcePosition = new THREE.Vector3();
        sourceObj.getWorldPosition(sourcePosition);
        
        const targetPosition = new THREE.Vector3();
        targetObj.getWorldPosition(targetPosition);
        
        // Slightly elevate connections to be above ocean level
        sourcePosition.y += 0.5;
        targetPosition.y += 0.5;
        
        // Create path between points
        const pathRenderer = new PathRenderer();
        
        // Default color for connection
        const pathColor = connection.color ? 
          new THREE.Color(connection.color).getHex() : 
          0xb98b56;
        
        const path = pathRenderer.createPath(
          sourcePosition, 
          targetPosition, 
          pathColor
        );
        
        this.scene.add(path);
        this.connections.push(path);
        
        // Add animated markers (3 per path with slightly different speeds)
        for (let i = 0; i < 3; i++) {
          const marker = new PathMarker(
            sourcePosition,
            targetPosition,
            pathColor,
            0.003 + (i * 0.001) // Slightly different speeds
          );
          
          this.scene.add(marker.mesh);
          this.pathMarkers.push(marker);
        }
      } else {
        console.warn(`Could not create connection: missing territory ${!sourceObj ? connection.source : connection.target}`);
      }
    });
    
    console.log(`Created ${this.connections.length} connections with ${this.pathMarkers.length} markers`);
  }
  
  /**
   * Updates the animations of path markers
   */
  public updateAnimations(): void {
    if (this.pathMarkers.length === 0) {
      return; // No markers to update
    }
    
    try {
      this.pathMarkers.forEach(marker => marker.update());
    } catch (error) {
      console.error("Error updating connection animations:", error);
    }
  }
}