// src/Maps3d/3d/elements/OceanRenderer.ts
import * as THREE from 'three';

export class OceanRenderer {
  public create(options?: {
    size?: number;
    color?: number;
    opacity?: number;
    segments?: number;
    shininess?: number;
  }): THREE.Mesh {
    const size = options?.size ?? 200;
    const segments = options?.segments ?? 40;
    
    // Geometria plana
    const oceanGeometry = new THREE.PlaneGeometry(size, size, segments, segments);
    
    // Material com transparência e brilho
    const oceanMaterial = new THREE.MeshPhongMaterial({
      color: options?.color ?? 0xcfe8fc,
      specular: 0xffffff,
      shininess: options?.shininess ?? 100,
      transparent: true,
      opacity: options?.opacity ?? 0.8
    });
    
    // Criar mesh
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.rotation.x = -Math.PI / 2; // Rotacionar para horizontal
    ocean.position.y = -0.2; // Ligeiramente abaixo do nível 0
    ocean.receiveShadow = true;
    
    return ocean;
  }
  
  // Método opcional para adicionar animação de ondas
  public addWaveAnimation(mesh: THREE.Mesh, options?: {
    amplitude?: number;
    frequency?: number;
    speed?: number;
  }): (delta: number) => void {
    // Acessar posições dos vértices
    const positions = mesh.geometry.attributes.position;
    
    // Guardar as posições originais
    const originalPositions = new Float32Array(positions.array.length);
    originalPositions.set(positions.array);
    
    // Amplitude e frequência das ondas
    const amplitude = options?.amplitude ?? 0.2;
    const frequency = options?.frequency ?? 0.1;
    const speed = options?.speed ?? 0.5;
    
    // Fase inicial aleatória para cada vértice
    const phases: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      phases.push(Math.random() * Math.PI * 2);
    }
    
    // Função de animação
    return (delta: number) => {
      const time = performance.now() * 0.001 * speed;
      
      for (let i = 0; i < positions.count; i++) {
        // Apenas mover vértices em Y (altura)
        const y = i * 3 + 1;
        
        // Calcular nova altura com onda senoidal
        const phase = phases[i];
        const distance = Math.sqrt(
          Math.pow(originalPositions[i * 3], 2) + 
          Math.pow(originalPositions[i * 3 + 2], 2)
        );
        
        positions.array[y] = originalPositions[y] + 
          Math.sin(frequency * distance + time + phase) * amplitude;
      }
      
      positions.needsUpdate = true;
    };
  }
}
