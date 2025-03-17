// src/Maps3d/3d/elements/BorderRenderer.ts
import * as THREE from 'three';

export class BorderRenderer {
  public create(options?: {
    innerRadius?: number;
    outerRadius?: number;
    color?: number;
    opacity?: number;
  }): THREE.Object3D {
    const borderGroup = new THREE.Group();
    
    // Borda de pergaminho
    const borderGeometry = new THREE.PlaneGeometry(options?.innerRadius ?? 180, options?.innerRadius ?? 180);
    const borderMaterial = new THREE.MeshPhongMaterial({
      color: options?.color ?? 0xf7ecd5,
      transparent: true,
      opacity: options?.opacity ?? 0.15,
      side: THREE.DoubleSide
    });
    
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = -0.1;
    
    borderGroup.add(border);
    
    // Linha costeira
    const outerRadius = options?.outerRadius ?? 71;
    const innerRadius = outerRadius - 1;
    
    const shorelineGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 90, 1);
    const shorelineMaterial = new THREE.MeshPhongMaterial({
      color: 0xf5e9c9,
      side: THREE.DoubleSide
    });
    
    const shoreline = new THREE.Mesh(shorelineGeometry, shorelineMaterial);
    shoreline.rotation.x = -Math.PI / 2;
    shoreline.position.y = -0.1;
    
    borderGroup.add(shoreline);
    
    return borderGroup;
  }
  
  // Método para adicionar uma moldura decorativa
  public addDecorativeBorder(options?: {
    radius?: number;
    color?: number;
    width?: number;
  }): THREE.Object3D {
    const radius = options?.radius ?? 85;
    const width = options?.width ?? 2;
    const color = options?.color ?? 0xb98b56;
    
    const group = new THREE.Group();
    
    // Círculo externo
    const outerGeometry = new THREE.RingGeometry(radius, radius + width, 90, 1);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });
    
    const outerRing = new THREE.Mesh(outerGeometry, outerMaterial);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = -0.05;
    
    group.add(outerRing);
    
    // Adicionar decorações nas pontas
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const decorGeometry = new THREE.CircleGeometry(width * 2, 32);
      const decorMaterial = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide
      });
      
      const decor = new THREE.Mesh(decorGeometry, decorMaterial);
      decor.rotation.x = -Math.PI / 2;
      decor.position.set(x, -0.05, z);
      
      group.add(decor);
    }
    
    return group;
  }
}
