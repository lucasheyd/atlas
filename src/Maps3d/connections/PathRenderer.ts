// src/Maps3d/connections/PathRenderer.ts
import * as THREE from 'three';

export class PathRenderer {
  /**
   * Cria um caminho curvo entre dois pontos
   * 
   * @param startPoint Ponto inicial
   * @param endPoint Ponto final
   * @param color Cor do caminho
   * @returns Objeto 3D representando o caminho
   */
  public createPath(
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    color: number = 0xb98b56
  ): THREE.Object3D {
    // Criar ponto médio para a curva
    const midPoint = new THREE.Vector3().addVectors(
      startPoint, 
      endPoint
    ).multiplyScalar(0.5);
    
    // Elevar o ponto médio para criar uma curva
    midPoint.y += 1.5;
    
    // Criar curva
    const curve = new THREE.QuadraticBezierCurve3(
      startPoint,
      midPoint,
      endPoint
    );
    
    // Criar pontos ao longo da curva
    const points = curve.getPoints(30);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Material da linha
    const material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2
    });
    
    // Criar linha
    const path = new THREE.Line(geometry, material);
    
    return path;
  }
}

// src/Maps3d/connections/PathMarker.ts
import * as THREE from 'three';

export class PathMarker {
  private curve: THREE.QuadraticBezierCurve3;
  public mesh: THREE.Mesh;
  private t: number = 0;
  private speed: number;
  
  /**
   * Cria um marcador animado que se move ao longo de um caminho
   * 
   * @param startPoint Ponto inicial do caminho
   * @param endPoint Ponto final do caminho
   * @param color Cor do marcador
   * @param speed Velocidade de movimento (0-1, onde 1 é uma volta completa por frame)
   */
  constructor(
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    color: number = 0xb98b56,
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
      color: color
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
