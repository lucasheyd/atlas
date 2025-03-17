// src/Maps3d/3d/territories/ArchipelagoRenderer.ts
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { ShapeVariations } from '../../utils/ShapeVariations';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';

export class ArchipelagoRenderer {
  public createMesh(territory: Territory, colors: ColorScheme): THREE.Object3D {
    const territoryGroup = new THREE.Group();
    
    // Número de ilhas baseado no nível de fusão
    const islandCount = 3 + Math.min(4, territory.fusionLevel);
    
    // Obter formas de ilhas
    const islands = ShapeVariations.getArchipelagoShape(
      territory.size,
      territory.visualSeed,
      islandCount
    );
    
    // Adicionar água rasa no arquipélago
    const waterRadius = territory.size * 1.2;
    const waterGeometry = new THREE.CircleGeometry(waterRadius, 32);
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x8ed8f8,
      transparent: true,
      opacity: 0.4,
      shininess: 90
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.1;
    
    territoryGroup.add(water);
    
    // Criar cada ilha
    const random = new RandomGenerator(territory.visualSeed);
    
    islands.forEach((islandPoints, index) => {
      // Criar forma da ilha
      const islandShape = new THREE.Shape();
      
      islandShape.moveTo(islandPoints[0].x, islandPoints[0].y);
      for (let i = 1; i < islandPoints.length; i++) {
        islandShape.lineTo(islandPoints[i].x, islandPoints[i].y);
      }
      islandShape.closePath();
      
      // Configurações de extrusão
      const extrudeSettings = {
        depth: 0.8 + (territory.fusionLevel * 0.1) * random.next(),
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 2
      };
      
      // Variação de cor entre ilhas
      const colorVariance = 0.15;
      const r = parseInt(colors.primary.substring(1, 3), 16) / 255;
      const g = parseInt(colors.primary.substring(3, 5), 16) / 255;
      const b = parseInt(colors.primary.substring(5, 7), 16) / 255;
      
      const islandColor = new THREE.Color(
        Math.max(0, Math.min(1, r + (random.next() - 0.5) * colorVariance)),
        Math.max(0, Math.min(1, g + (random.next() - 0.5) * colorVariance)),
        Math.max(0, Math.min(1, b + (random.next() - 0.5) * colorVariance))
      );
      
      // Criar geometria e material
      const geometry = new THREE.ExtrudeGeometry(islandShape, extrudeSettings);
      const material = new THREE.MeshPhongMaterial({
        color: islandColor,
        specular: new THREE.Color(colors.specular),
        shininess: 20 + (territory.fusionLevel * 2)
      });
      
      // Criar mesh
      const islandMesh = new THREE.Mesh(geometry, material);
      islandMesh.castShadow = true;
      islandMesh.receiveShadow = true;
      
      territoryGroup.add(islandMesh);
      
      // Adicionar pequena vegetação nas ilhas maiores
      if (index % 2 === 0 && territory.fusionLevel > 1) {
        const treeCount = Math.floor(random.next() * 3) + 1;
        
        for (let t = 0; t < treeCount; t++) {
          const treeGroup = new THREE.Group();
          
          // Tronco
          const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 8);
          const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.position.y = 0.3;
          trunk.castShadow = true;
          
          // Copa
          const topGeometry = new THREE.ConeGeometry(0.5, 0.8, 8);
          const topMaterial = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color(colors.secondary),
            shininess: 10
          });
          const top = new THREE.Mesh(topGeometry, topMaterial);
          top.position.y = 0.9;
          top.castShadow = true;
          
          treeGroup.add(trunk);
          treeGroup.add(top);
          
          // Posicionar aleatoriamente na ilha
          const angle = random.next() * Math.PI * 2;
          const distance = random.next() * 0.5;
          const centerX = islandPoints[0].x;
          const centerY = islandPoints[0].y;
          
          treeGroup.position.set(
            centerX + Math.cos(angle) * distance,
            extrudeSettings.depth,
            centerY + Math.sin(angle) * distance
          );
          
          territoryGroup.add(treeGroup);
        }
      }
    });
    
    return territoryGroup;
  }
}
