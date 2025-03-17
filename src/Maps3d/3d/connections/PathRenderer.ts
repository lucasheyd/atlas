// src/Maps3d/3d/connections/PathRenderer.ts
import * as THREE from 'three';

export class PathRenderer {
  /**
   * Cria um caminho curvo entre dois pontos
   */
  public createPath(
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    color: THREE.Color = new THREE.Color(0xb98b56)
  ): THREE.Group {
    const pathGroup = new THREE.Group();
    
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
    pathGroup.add(path);
    
    // Adicionar brilho ao caminho (opcional)
    const glowMaterial = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 4,
      transparent: true,
      opacity: 0.3
    });
    
    const glowLine = new THREE.Line(geometry, glowMaterial);
    pathGroup.add(glowLine);
    
    return pathGroup;
  }
}
