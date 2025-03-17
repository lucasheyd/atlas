// src/Maps3d/3d/connections/ConnectionManager.ts
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
   * Cria conexões entre territórios
   */
  public createConnections(
    connections: NetworkConnection[],
    territories: Map<string, THREE.Object3D>
  ): void {
    // Limpar conexões existentes
    this.connections.forEach(conn => this.scene.remove(conn));
    this.connections = [];
    this.pathMarkers = [];
    
    // Criar novas conexões
    connections.forEach(connection => {
      const sourceObj = territories.get(connection.source);
      const targetObj = territories.get(connection.target);
      
      if (sourceObj && targetObj) {
        const sourcePosition = new THREE.Vector3();
        sourceObj.getWorldPosition(sourcePosition);
        
        const targetPosition = new THREE.Vector3();
        targetObj.getWorldPosition(targetPosition);
        
        // Elevar ligeiramente para ficar acima do nível do oceano
        sourcePosition.y += 0.5;
        targetPosition.y += 0.5;
        
        // Criar caminho entre os pontos
        const pathRenderer = new PathRenderer();
        
        // Cor padrão para conexão
        const pathColor = connection.color ? 
          new THREE.Color(connection.color) : 
          new THREE.Color(0xb98b56);
        
        const path = pathRenderer.createPath(
          sourcePosition, 
          targetPosition, 
          pathColor
        );
        
        this.scene.add(path);
        this.connections.push(path);
        
        // Adicionar marcadores animados (3 por caminho)
        for (let i = 0; i < 3; i++) {
          const marker = new PathMarker(
            sourcePosition,
            targetPosition,
            pathColor,
            0.003 + (i * 0.001) // Velocidades ligeiramente diferentes
          );
          
          this.scene.add(marker.mesh);
          this.pathMarkers.push(marker);
        }
      }
    });
  }
  
  /**
   * Atualiza as animações dos marcadores de caminho
   */
  public updateAnimations(): void {
    this.pathMarkers.forEach(marker => marker.update());
  }
}
