// src/Maps3d/3d/territories/ForestRenderer.ts
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { ShapeVariations } from '../../utils/ShapeVariations';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';

export class ForestRenderer {
  public createMesh(territory: Territory, colors: ColorScheme): THREE.Object3D {
    const territoryGroup = new THREE.Group();
    
    // Criar forma da floresta
    const forestData = ShapeVariations.getForestShape(
      territory.size,
      territory.visualSeed
    );
    
    const shape = new THREE.Shape();
    const baseShape = forestData.baseShape;
    
    // Construir o shape base
    shape.moveTo(baseShape[0].x, baseShape[0].y);
    for (let i = 1; i < baseShape.length; i++) {
      shape.lineTo(baseShape[i].x, baseShape[i].y);
    }
    shape.closePath();
    
    // Configurações de extrusão
    const extrudeSettings = {
      depth: 0.6 + (territory.fusionLevel * 0.05),
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 2
    };
    
    // Criar geometria e material para o terreno base
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 20
    });
    
    // Criar mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    territoryGroup.add(mesh);
    
    // Adicionar árvores
    const random = new RandomGenerator(territory.visualSeed);
    
    // Número de árvores baseado no nível de fusão
    const treeCount = 10 + (territory.fusionLevel * 5);
    const treePositions = forestData.treePositions;
    
    // Criar árvores baseadas em posições predefinidas
    for (let i = 0; i < Math.min(treeCount, treePositions.length); i++) {
      const treeGroup = new THREE.Group();
      const treePos = treePositions[i];
      
      // Tamanho aleatório
      const treeScale = 0.3 + random.next() * 0.4;
      
      // Tronco
      const trunkGeometry = new THREE.CylinderGeometry(
        0.1 * treeScale,
        0.15 * treeScale,
        1 * treeScale,
        8
      );
      
      const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.5 * treeScale;
      trunk.castShadow = true;
      
      // Copa da árvore - variação entre coníferas e frondosas
      let top;
      
      if (i % 3 === 0) {
        // Árvore cônica (conífera)
        const topGeometry = new THREE.ConeGeometry(
          0.5 * treeScale,
          1.5 * treeScale,
          8
        );
        
        const topMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.secondary),
          shininess: 15
        });
        
        top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = (1 + 0.75) * treeScale;
      } else {
        // Árvore esférica (frondosa)
        const topGeometry = new THREE.SphereGeometry(
          0.6 * treeScale,
          8,
          8
        );
        
        const topMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.secondary),
          shininess: 15
        });
        
        top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = (1 + 0.6) * treeScale;
      }
      
      top.castShadow = true;
      
      // Montar árvore
      treeGroup.add(trunk);
      treeGroup.add(top);
      
      // Posicionar árvore
      treeGroup.position.set(
        treePos.x,
        extrudeSettings.depth,
        treePos.y
      );
      
      territoryGroup.add(treeGroup);
    }
    
    // Para territórios de alto nível, adicionar um lago
    if (territory.fusionLevel > 1) {
      const lakeRadius = territory.size * 0.2;
      const lakeGeometry = new THREE.CircleGeometry(lakeRadius, 24);
      const lakeMaterial = new THREE.MeshPhongMaterial({
        color: 0x4682B4,
        transparent: true,
        opacity: 0.8,
        shininess: 80
      });
      
      const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
      lake.rotation.x = -Math.PI / 2;
      lake.position.y = extrudeSettings.depth + 0.05;
      
      territoryGroup.add(lake);
    }
    
    return territoryGroup;
  }
}
