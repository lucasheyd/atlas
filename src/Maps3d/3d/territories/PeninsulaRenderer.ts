// src/Maps3d/3d/territories/PeninsulaRenderer.ts
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { ShapeVariations } from '../../utils/ShapeVariations';
import { ColorScheme } from '../../utils/ColorGenetics';

export class PeninsulaRenderer {
  public createMesh(territory: Territory, colors: ColorScheme): THREE.Object3D {
    const territoryGroup = new THREE.Group();
    
    // Criar forma de península
    const shape = new THREE.Shape();
    const size = territory.size;
    
    // Obter pontos para o shape baseado na variante
    const points = ShapeVariations.getPeninsulaShape(
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
      depth: 1.2 + (territory.fusionLevel * 0.1),
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
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
    
    // Adicionar uma conexão para o "continente" (efeito de istmo)
    if (territory.fusionLevel > 0) {
      const istmusGeometry = new THREE.BoxGeometry(4, 0.8, 2);
      const istmusMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.secondary),
        specular: new THREE.Color(colors.specular),
        shininess: 20
      });
      
      const istmus = new THREE.Mesh(istmusGeometry, istmusMaterial);
      istmus.position.set(-size * 0.6, 0.4, 0); // Posicionamento do istmo
      istmus.castShadow = true;
      istmus.receiveShadow = true;
      
      territoryGroup.add(istmus);
    }
    
    return territoryGroup;
  }
}
