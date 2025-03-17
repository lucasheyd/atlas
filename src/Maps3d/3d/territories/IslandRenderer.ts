// src/Maps3d/3d/territories/IslandRenderer.ts
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { ShapeVariations } from '../../utils/ShapeVariations';
import { ColorScheme } from '../../utils/ColorGenetics';

export class IslandRenderer {
  public createMesh(territory: Territory, colors: ColorScheme): THREE.Object3D {
    const territoryGroup = new THREE.Group();
    
    // Criar forma irregular de ilha
    const shape = new THREE.Shape();
    const size = territory.size;
    
    // Obter pontos para o shape baseado na variante
    const points = ShapeVariations.getIslandShape(
      size, 
      territory.visualSeed
    );
    
    // Construir o shape
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
    
    // Configurações de extrusão
    const extrudeSettings = {
      depth: 1.0 + (territory.fusionLevel * 0.1),
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
      bevelOffset: 0,
      bevelSegments: 2
    };
    
    // Criar geometria e material
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 20 + (territory.fusionLevel * 5),
      flatShading: territory.shapeVariant % 2 === 0
    });
    
    // Criar mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    territoryGroup.add(mesh);
    
    // Adicionar água rasa ao redor da ilha (opcional)
    if (territory.fusionLevel > 0) {
      // Criar forma um pouco maior que a ilha para a água rasa
      const waterShape = new THREE.Shape();
      const waterPoints = ShapeVariations.getIslandShape(
        size * 1.2, // 20% maior
        territory.visualSeed + 1000 // Seed diferente para forma diferente
      );
      
      waterShape.moveTo(waterPoints[0].x, waterPoints[0].y);
      for (let i = 1; i < waterPoints.length; i++) {
        waterShape.lineTo(waterPoints[i].x, waterPoints[i].y);
      }
      waterShape.closePath();
      
      const waterGeometry = new THREE.ShapeGeometry(waterShape);
      const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x8ed8f8, // Água mais clara
        transparent: true,
        opacity: 0.4,
        shininess: 90
      });
      
      const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      waterMesh.position.y = -0.1; // Ligeiramente abaixo da ilha
      waterMesh.rotation.x = -Math.PI / 2;
      
      territoryGroup.add(waterMesh);
    }
    
    return territoryGroup;
  }
}
