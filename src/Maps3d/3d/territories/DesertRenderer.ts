// src/Maps3d/3d/territories/DesertRenderer.ts
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { ShapeVariations } from '../../utils/ShapeVariations';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';

export class DesertRenderer {
  public createMesh(territory: Territory, colors: ColorScheme): THREE.Object3D {
    const territoryGroup = new THREE.Group();
    
    // Criar forma do deserto
    const shape = new THREE.Shape();
    const size = territory.size;
    
    // Obter pontos para o shape baseado na variante
    const points = ShapeVariations.getDesertShape(
      size, 
      territory.visualSeed
    );
    
    // Construir o shape
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
    
    // Configurações de extrusão - desertos são mais planos
    const extrudeSettings = {
      depth: 0.4 + (territory.fusionLevel * 0.05),
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 2
    };
    
    // Cores de deserto
    const desertColor = new THREE.Color(colors.primary);
    
    // Criar geometria e material
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
      color: desertColor,
      specular: new THREE.Color(colors.specular),
      shininess: 10,
      flatShading: true
    });
    
    // Criar mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    territoryGroup.add(mesh);
    
    // Adicionar dunas e decorações de deserto
    if (territory.fusionLevel > 0) {
      const random = new RandomGenerator(territory.visualSeed);
      
      // Número de dunas
      const duneCount = 3 + Math.min(5, territory.fusionLevel);
      
      for (let i = 0; i < duneCount; i++) {
        // Posição aleatória dentro do deserto
        const angle = random.next() * Math.PI * 2;
        const distance = random.next() * size * 0.7;
        const posX = Math.cos(angle) * distance;
        const posZ = Math.sin(angle) * distance;
        
        // Tamanho aleatório
        const duneSize = size * (0.2 + random.next() * 0.3);
        const duneHeight = 0.5 + random.next() * 0.8;
        
        // Geometria e material
        const duneGeometry = new THREE.ConeGeometry(
          duneSize,
          duneHeight,
          8,
          1,
          false
        );
        
        // Cor da duna (ligeiramente diferente da base)
        const duneColor = new THREE.Color(
          desertColor.r * (0.9 + random.next() * 0.2),
          desertColor.g * (0.9 + random.next() * 0.2),
          desertColor.b * (0.9 + random.next() * 0.2)
        );
        
        const duneMaterial = new THREE.MeshPhongMaterial({
          color: duneColor,
          shininess: 10,
          flatShading: true
        });
        
        const dune = new THREE.Mesh(duneGeometry, duneMaterial);
        dune.position.set(posX, extrudeSettings.depth + (duneHeight / 2), posZ);
        dune.rotation.y = random.next() * Math.PI * 2; // Rotação aleatória
        dune.castShadow = true;
        dune.receiveShadow = true;
        
        territoryGroup.add(dune);
      }
      
      // Adicionar oásis para territórios de nível alto
      if (territory.fusionLevel > 2) {
        const oasisRadius = size * 0.15;
        const oasisGeometry = new THREE.CircleGeometry(oasisRadius, 16);
        const oasisMaterial = new THREE.MeshPhongMaterial({
          color: 0x3399ff,
          transparent: true,
          opacity: 0.8,
          shininess: 90
        });
        
        const oasis = new THREE.Mesh(oasisGeometry, oasisMaterial);
        oasis.rotation.x = -Math.PI / 2;
        oasis.position.set(0, extrudeSettings.depth + 0.05, 0);
        
        territoryGroup.add(oasis);
        
        // Palmeira ao lado do oásis
        const palmGroup = new THREE.Group();
        
        // Tronco
        const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.25, 2, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        
        // Folhas
        for (let f = 0; f < 5; f++) {
          const leafGeometry = new THREE.PlaneGeometry(1, 0.4);
          const leafMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x33aa33,
            side: THREE.DoubleSide
          });
          
          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          leaf.position.y = 2;
          
          // Rotação e inclinação das folhas
          const leafAngle = (f / 5) * Math.PI * 2;
          leaf.rotation.y = leafAngle;
          leaf.rotation.x = -Math.PI / 4; // Inclinação para baixo
          
          // Posição para formar uma palmeira
          leaf.position.x = Math.cos(leafAngle) * 0.5;
          leaf.position.z = Math.sin(leafAngle) * 0.5;
          
          leaf.castShadow = true;
          palmGroup.add(leaf);
        }
        
        palmGroup.add(trunk);
        palmGroup.position.set(oasisRadius * 1.2, extrudeSettings.depth, 0);
        
        territoryGroup.add(palmGroup);
      }
    }
    
    return territoryGroup;
  }
}
