// src/Maps3d/3d/territories/MainlandRenderer.ts
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { ShapeVariations } from '../../utils/ShapeVariations';
import { ColorScheme } from '../../utils/ColorGenetics';

export class MainlandRenderer {
  public createMesh(territory: Territory, colors: ColorScheme): THREE.Object3D {
    const territoryGroup = new THREE.Group();
    
    // Criar forma hexagonal com variações
    const shape = new THREE.Shape();
    const size = territory.size;
    
    // Obter pontos para o shape baseado na variante
    const points = ShapeVariations.getMainlandShape(
      size, 
      territory.shapeVariant
    );
    
    // Construir o shape
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
    
    // Configurações de extrusão
    const extrudeSettings = {
      depth: 1.5 + (territory.fusionLevel * 0.1), // Mais alto com maior nível de fusão
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.3,
      bevelOffset: 0,
      bevelSegments: 3
    };
    
    // Criar geometria e material
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 30 + (territory.fusionLevel * 5),
      flatShading: territory.shapeVariant % 2 === 0
    });
    
    // Criar mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    territoryGroup.add(mesh);
    
    // Adicionar borda superior (opcional, para destacar o território)
    if (territory.fusionLevel > 1) {
      const topShape = new THREE.Shape();
      
      // Usar mesmos pontos, mas sem extrusão para a parte superior
      topShape.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        topShape.lineTo(points[i].x, points[i].y);
      }
      topShape.closePath();
      
      const topGeometry = new THREE.ShapeGeometry(topShape);
      const topMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.secondary),
        emissive: new THREE.Color(colors.accent),
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.7
      });
      
      const topMesh = new THREE.Mesh(topGeometry, topMaterial);
      topMesh.position.y = extrudeSettings.depth + 0.05;
      topMesh.rotation.x = -Math.PI / 2;
      
      territoryGroup.add(topMesh);
    }
    
    return territoryGroup;
  }
}
