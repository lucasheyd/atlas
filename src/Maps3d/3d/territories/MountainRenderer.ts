// src/Maps3d/3d/territories/MountainRenderer.ts
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { ShapeVariations } from '../../utils/ShapeVariations';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';

export class MountainRenderer {
  public createMesh(territory: Territory, colors: ColorScheme): THREE.Object3D {
    const territoryGroup = new THREE.Group();
    
    // Usar seed para randomização consistente
    const random = new RandomGenerator(territory.visualSeed);
    
    // Número de picos baseado no nível de fusão e tamanho
    const peakCount = 2 + Math.min(3, territory.fusionLevel);
    
    // Obter formas de montanhas
    const mountains = ShapeVariations.getMountainShape(
      territory.size,
      territory.visualSeed,
      peakCount
    );
    
    // Base plana sob as montanhas
    const baseRadius = territory.size * 0.8;
    const baseGeometry = new THREE.CircleGeometry(baseRadius, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      shininess: 10
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.1;
    base.receiveShadow = true;
    
    territoryGroup.add(base);
    
    // Criar cada pico de montanha
    mountains.forEach((mountainPoints, index) => {
      // Criar um cone para cada montanha
      const coneHeight = territory.size * (0.8 + random.next() * 0.6);
      const coneRadius = territory.size * (0.4 + random.next() * 0.3);
      
      const coneGeometry = new THREE.ConeGeometry(
        coneRadius,
        coneHeight,
        8, // Segmentos
        1, // Altura segmentos
        false // Aberto
      );
      
      // Material com variação de cor por montanha
      const colorVariance = 0.1;
      const r = parseInt(colors.primary.substring(1, 3), 16) / 255;
      const g = parseInt(colors.primary.substring(3, 5), 16) / 255;
      const b = parseInt(colors.primary.substring(5, 7), 16) / 255;
      
      const mountainColor = new THREE.Color(
        Math.max(0, Math.min(1, r + (random.next() - 0.5) * colorVariance)),
        Math.max(0, Math.min(1, g + (random.next() - 0.5) * colorVariance)),
        Math.max(0, Math.min(1, b + (random.next() - 0.5) * colorVariance))
      );
      
      const coneMaterial = new THREE.MeshPhongMaterial({
        color: mountainColor,
        shininess: 20,
        flatShading: true
      });
      
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      
      // Posição baseada nos pontos calculados
      const centerX = mountainPoints[0].x;
      const centerY = mountainPoints[0].y;
      cone.position.set(centerX, coneHeight / 2, centerY);
      
      cone.castShadow = true;
      cone.receiveShadow = true;
      
      territoryGroup.add(cone);
      
      // Adicionar neve no topo para montanhas altas (nível de fusão > 1)
      if (territory.fusionLevel > 1 && coneHeight > territory.size * 1.0) {
        const snowCapGeometry = new THREE.ConeGeometry(
          coneRadius * 0.3,
          coneHeight * 0.2,
          8,
          1,
          false
        );
        
        const snowMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          shininess: 70
        });
        
        const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
        snowCap.position.set(centerX, coneHeight - (coneHeight * 0.1), centerY);
        snowCap.castShadow = true;
        
        territoryGroup.add(snowCap);
      }
    });
    
    return territoryGroup;
  }
}
