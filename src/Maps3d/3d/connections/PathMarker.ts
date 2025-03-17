// src/Maps3d/3d/connections/PathMarker.ts
import * as THREE from 'three';

export class PathMarker {
  private curve: THREE.QuadraticBezierCurve3;
  public mesh: THREE.Mesh;
  private t: number = 0;
  private speed: number;
  
  /**
   * Cria um marcador animado que se move ao longo de um caminho
   */
  constructor(
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    color: THREE.Color = new THREE.Color(0xb98b56),
    speed: number = 0.003
  ) {
    // Criar ponto médio para a curva
    const midPoint = new THREE.Vector3().addVectors(
      startPoint, 
      endPoint
    ).multiplyScalar(0.5);
    
    // Elevar o ponto médio para criar uma curva
    midPoint.y += 1.5;
    
    // Criar curva para movimento
    this.curve = new THREE.QuadraticBezierCurve3(
      startPoint,
      midPoint,
      endPoint
    );
    
    // Posição inicial aleatória na curva
    this.t = Math.random();
    
    // Velocidade de movimento
    this.speed = speed;
    
    // Criar mesh do marcador
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Posicionar inicialmente
    this.updatePosition();
  }
  
  /**
   * Atualiza a posição do marcador ao longo da curva
   */
  private updatePosition(): void {
    const position = this.curve.getPointAt(this.t);
    this.mesh.position.copy(position);
  }
  
  /**
   * Atualiza o marcador (movimento)
   */
  public update(): void {
    // Avançar posição
    this.t += this.speed;
    
    // Loop ao chegar ao final
    if (this.t > 1) {
      this.t = 0;
    }
    
    // Atualizar posição
    this.updatePosition();
  }
}
