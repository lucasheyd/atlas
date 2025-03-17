// src/Maps3d/3d/territories/ForestRenderer.ts (com integração de TreeGenerator)
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { ShapeVariations } from '../../utils/ShapeVariations';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';
import { TreeGenerator } from '../ornaments/TreeGenerator';

export class ForestRenderer {
  private treeGenerator: TreeGenerator;
  
  constructor() {
    this.treeGenerator = new TreeGenerator();
  }
  
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
    
    // Adicionar árvores usando o TreeGenerator
    this.addForestTrees(territoryGroup, territory, forestData.treePositions, colors, extrudeSettings.depth);
    
    // Adicionar bosque específico com mais densidade de árvores para todos os níveis de fusão
    this.addForestGrove(territoryGroup, territory, colors, extrudeSettings.depth);
    
    // Para níveis mais altos, adicionar características adicionais
    if (territory.fusionLevel > 1) {
      this.addSpecialFeatures(territoryGroup, territory, colors, extrudeSettings.depth);
    }
    
    return territoryGroup;
  }
  
  /**
   * Adiciona árvores ao território florestal
   */
  private addForestTrees(
    group: THREE.Group,
    territory: Territory,
    predefinedPositions: any[],
    colors: ColorScheme,
    terrainHeight: number
  ): void {
    const random = new RandomGenerator(territory.visualSeed);
    
    // Base de árvores mesmo para nível 1
    const treeCount = 10 + Math.floor(random.next() * 10);
    
    // Array para armazenar posições de árvores
    const positions: {x: number, z: number}[] = [];
    
    // Usar as posições predefinidas primeiro
    predefinedPositions.forEach(pos => {
      positions.push({x: pos.x, z: pos.y});
    });
    
    // Adicionar posições aleatórias se necessário
    while (positions.length < treeCount) {
      const angle = random.next() * Math.PI * 2;
      const distance = random.next() * territory.size * 0.8;
      
      positions.push({
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance
      });
    }
    
    // Criar árvores nas posições
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      // Escala aleatória
      const treeScale = 0.3 + random.next() * 0.4;
      
      // Alternar entre tipos de árvores
      let treeType = 'leafy';
      
      if (i % 3 === 0) {
        treeType = 'conifer';
      } else if (i % 7 === 0 && territory.fusionLevel > 1) {
        treeType = 'oak';
      } else if (i % 11 === 0 && territory.fusionLevel > 2) {
        treeType = 'maple';
      }
      
      const tree = this.treeGenerator.createTree(treeScale, treeType, colors);
      tree.position.set(pos.x, terrainHeight, pos.z);
      
      group.add(tree);
    }
  }
  
  /**
   * Adiciona um bosque denso à floresta
   */
  private addForestGrove(
    group: THREE.Group,
    territory: Territory,
    colors: ColorScheme,
    terrainHeight: number
  ): void {
    const random = new RandomGenerator(territory.visualSeed + 1000);
    
    // Posicionar o bosque (mais denso) em algum lugar do território
    const angle = random.next() * Math.PI * 2;
    const distance = territory.size * 0.4;
    
    const grovePosition = {
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance
    };
    
    // Criar o bosque
    const grove = this.treeGenerator.createForestGrove(
      territory.size * 0.3,
      territory.fusionLevel,
      colors,
      territory.fusionLevel > 1 // Incluir lago para níveis mais altos
    );
    
    grove.position.set(grovePosition.x, terrainHeight, grovePosition.z);
    
    group.add(grove);
  }
  
  /**
   * Adiciona características especiais para níveis de fusão mais altos
   */
  private addSpecialFeatures(
    group: THREE.Group,
    territory: Territory,
    colors: ColorScheme,
    terrainHeight: number
  ): void {
    const random = new RandomGenerator(territory.visualSeed + 2000);
    
    if (territory.fusionLevel >= 2) {
      // Adicionar uma clareira com círculo de pedras
      this.addClearingWithStones(group, territory.size, random, colors, terrainHeight);
    }
    
    if (territory.fusionLevel >= 3) {
      // Adicionar uma cabana ou estrutura
      this.addCabin(group, territory.size, random, colors, terrainHeight);
    }
  }
  
  /**
   * Adiciona uma clareira com pedras em círculo
   */
  private addClearingWithStones(
    group: THREE.Group,
    size: number,
    random: RandomGenerator,
    colors: ColorScheme,
    terrainHeight: number
  ): void {
    // Posição da clareira
    const angle = random.next() * Math.PI * 2;
    const distance = size * 0.4;
    const clearingX = Math.cos(angle) * distance;
    const clearingZ = Math.sin(angle) * distance;
    
    // Criar a clareira
    const clearingRadius = size * 0.15;
    const clearingGeometry = new THREE.CircleGeometry(clearingRadius, 16);
    const clearingMaterial = new THREE.MeshPhongMaterial({
      color: 0xC2B280, // Cor de terra/areia
      shininess: 10
    });
    
    const clearing = new THREE.Mesh(clearingGeometry, clearingMaterial);
    clearing.rotation.x = -Math.PI / 2;
    clearing.position.set(clearingX, terrainHeight + 0.02, clearingZ);
    
    group.add(clearing);
    
    // Adicionar pedras em círculo
    const stoneCount = 5 + Math.floor(random.next() * 3);
    
    for (let i = 0; i < stoneCount; i++) {
      const stoneAngle = (i / stoneCount) * Math.PI * 2;
      const stoneDistance = clearingRadius * 0.7;
      const stoneX = clearingX + Math.cos(stoneAngle) * stoneDistance;
      const stoneZ = clearingZ + Math.sin(stoneAngle) * stoneDistance;
      
      // Tamanho aleatório para cada pedra
      const stoneSize = 0.2 + random.next() * 0.2;
      
      // Alternância entre formas diferentes
      let stoneGeometry;
      if (i % 3 === 0) {
        stoneGeometry = new THREE.DodecahedronGeometry(stoneSize, 0);
      } else if (i % 3 === 1) {
        stoneGeometry = new THREE.OctahedronGeometry(stoneSize, 0);
      } else {
        stoneGeometry = new THREE.BoxGeometry(
          stoneSize * 1.5,
          stoneSize * 2,
          stoneSize
        );
      }
      
      const stoneMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        shininess: 30
      });
      
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.position.set(stoneX, terrainHeight + stoneSize / 2, stoneZ);
      
      // Rotação aleatória
      stone.rotation.set(
        random.next() * Math.PI,
        random.next() * Math.PI,
        random.next() * Math.PI
      );
      
      stone.castShadow = true;
      stone.receiveShadow = true;
      
      group.add(stone);
    }
    
    // Adicionar uma fogueira no centro (para níveis mais altos)
    const fireGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.1, 8);
    const fireMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 10
    });
    
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(clearingX, terrainHeight + 0.05, clearingZ);
    
    group.add(fire);
    
    // Adicionar madeira para a fogueira
    for (let i = 0; i < 3; i++) {
      const woodGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
      const woodMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        shininess: 10
      });
      
      const wood = new THREE.Mesh(woodGeometry, woodMaterial);
      const woodAngle = (i / 3) * Math.PI * 2;
      
      wood.position.set(
        clearingX + Math.cos(woodAngle) * 0.15,
        terrainHeight + 0.15,
        clearingZ + Math.sin(woodAngle) * 0.15
      );
      
      wood.rotation.x = Math.PI / 4;
      wood.rotation.y = woodAngle;
      
      wood.castShadow = true;
      
      group.add(wood);
    }
  }
  
  /**
   * Adiciona uma cabana à floresta
   */
  private addCabin(
    group: THREE.Group,
    size: number,
    random: RandomGenerator,
    colors: ColorScheme,
    terrainHeight: number
  ): void {
    // Encontrar local para a cabana (longe do centro)
    const angle = random.next() * Math.PI * 2;
    const distance = size * 0.6;
    const cabinX = Math.cos(angle) * distance;
    const cabinZ = Math.sin(angle) * distance;
    
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(cabinX, terrainHeight, cabinZ);
    
    // Rotação aleatória
    cabinGroup.rotation.y = random.next() * Math.PI * 2;
    
    // Base da cabana
    const baseSize = { width: 1.5, height: 1.0, depth: 1.2 };
    const baseGeometry = new THREE.BoxGeometry(
      baseSize.width,
      baseSize.height,
      baseSize.depth
    );
    
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513, // Marrom madeira
      shininess: 30
    });
    
    const cabinBase = new THREE.Mesh(baseGeometry, baseMaterial);
    cabinBase.position.y = baseSize.height / 2;
    cabinBase.castShadow = true;
    cabinBase.receiveShadow = true;
    
    cabinGroup.add(cabinBase);
    
    // Telhado
    const roofGeometry = new THREE.ConeGeometry(
      Math.sqrt(baseSize.width * baseSize.width + baseSize.depth * baseSize.depth) / 1.5,
      baseSize.height * 0.7,
      4
    );
    
    const roofMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      shininess: 30
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = baseSize.height + baseSize.height * 0.35;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    
    cabinGroup.add(roof);
    
    // Porta
    const doorGeometry = new THREE.PlaneGeometry(0.4, 0.7);
    const doorMaterial = new THREE.MeshPhongMaterial({
      color: 0x4B3621, // Marrom escuro
      shininess: 10
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, baseSize.height / 2, baseSize.depth / 2 + 0.01);
    door.castShadow = true;
    
    cabinGroup.add(door);
    
    // Janela
    const windowGeometry = new THREE.PlaneGeometry(0.3, 0.3);
    const windowMaterial = new THREE.MeshPhongMaterial({
      color: 0xA5F2F3, // Azul claro
      shininess: 100,
      transparent: true,
      opacity: 0.7
    });
    
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(baseSize.width / 2 + 0.01, baseSize.height / 2 + 0.1, 0);
    window1.rotation.y = Math.PI / 2;
    
    cabinGroup.add(window1);
    
    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(-baseSize.width / 2 - 0.01, baseSize.height / 2 + 0.1, 0);
    window2.rotation.y = -Math.PI / 2;
    
    cabinGroup.add(window2);
    
    // Chaminé
    const chimneyGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const chimneyMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513,
      shininess: 5
    });
    
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(
      baseSize.width / 3,
      baseSize.height + baseSize.height * 0.6,
      0
    );
    
    cabinGroup.add(chimney);
    
    group.add(cabinGroup);
    
    // Adicionar caminho até a cabana
    const pathStart = new THREE.Vector3(0, terrainHeight + 0.02, 0);
    const pathEnd = new THREE.Vector3(cabinX, terrainHeight + 0.02, cabinZ);
    
    // Mesclar o caminho com o terreno
    const pathWidth = 0.4;
    
    const pathShape = new THREE.Shape();
    
    // Vetor direção do caminho
    const pathDir = new THREE.Vector3().subVectors(pathEnd, pathStart).normalize();
    
    // Vetor perpendicular ao caminho
    const pathPerp = new THREE.Vector3(-pathDir.z, 0, pathDir.x).normalize();
    
    // Início do caminho
    const p1 = new THREE.Vector3().addVectors(
      pathStart,
      new THREE.Vector3().copy(pathPerp).multiplyScalar(pathWidth / 2)
    );
    
    const p2 = new THREE.Vector3().addVectors(
      pathStart,
      new THREE.Vector3().copy(pathPerp).multiplyScalar(-pathWidth / 2)
    );
    
    // Fim do caminho
    const p3 = new THREE.Vector3().addVectors(
      pathEnd,
      new THREE.Vector3().copy(pathPerp).multiplyScalar(-pathWidth / 2)
    );
    
    const p4 = new THREE.Vector3().addVectors(
      pathEnd,
      new THREE.Vector3().copy(pathPerp).multiplyScalar(pathWidth / 2)
    );
    
    // Criar forma do caminho
    pathShape.moveTo(p1.x, p1.z);
    pathShape.lineTo(p2.x, p2.z);
    pathShape.lineTo(p3.x, p3.z);
    pathShape.lineTo(p4.x, p4.z);
    pathShape.closePath();
    
    const pathGeometry = new THREE.ShapeGeometry(pathShape);
    const pathMaterial = new THREE.MeshPhongMaterial({
      color: 0xC2B280, // Cor de terra
      shininess: 5
    });
    
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    path.position.y = terrainHeight + 0.01;
    
    group.add(path);
  }
}