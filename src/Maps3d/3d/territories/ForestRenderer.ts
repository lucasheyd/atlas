// src/Maps3d/3d/territories/ForestRenderer.ts
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
  console.log('🌳 Creating Forest Mesh', {
    size: territory.size,
    fusionLevel: territory.fusionLevel,
    visualSeed: territory.visualSeed
  });
    const territoryGroup = new THREE.Group();
    
    // Criar forma da floresta com mais detalhes
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
    
    // Configurações de extrusão melhoradas para terreno florestal
    const extrudeSettings = {
      depth: 0.7 + (territory.fusionLevel * 0.08),
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelOffset: 0,
      bevelSegments: 3
    };
    
    // Adicionar algumas "elevações" para o terreno parecer mais natural
    // (Preparação para o terreno base)
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 10
    });
    
    // Criar mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    territoryGroup.add(mesh);
    
    // Adicionar árvores usando o TreeGenerator com posicionamento mais realista
    this.addForestTrees(territoryGroup, territory, forestData.treePositions, colors, extrudeSettings.depth);
    
    // Adicionar relevo para o terreno florestal (pequenas elevações)
    this.addTerrainVariations(territoryGroup, territory, colors, extrudeSettings.depth);
    
    // Adicionar bosque específico com mais densidade de árvores para todos os níveis de fusão
    this.addForestGrove(territoryGroup, territory, colors, extrudeSettings.depth);
    
    // Adicionar rio ou lago para todos os níveis de fusão, com tamanho variando
    this.addWaterBody(territoryGroup, territory, colors, extrudeSettings.depth);
    
    // Para níveis mais altos, adicionar características adicionais
    if (territory.fusionLevel > 1) {
      this.addSpecialFeatures(territoryGroup, territory, colors, extrudeSettings.depth);
    }
    
    return territoryGroup;
  }
  
  /**
   * Adiciona variações de terreno para tornar a floresta mais realista
   */
  private addTerrainVariations(
    group: THREE.Group,
    territory: Territory,
    colors: ColorScheme,
    baseHeight: number
  ): void {
    const random = new RandomGenerator(territory.visualSeed + 1000);
    
    // Número de pequenas colinas baseado no tamanho do território
    const hillCount = Math.floor(territory.size / 5) + 2;
    
    for (let i = 0; i < hillCount; i++) {
      // Posição aleatória
      const angle = random.next() * Math.PI * 2;
      const distance = random.next() * territory.size * 0.7;
      
      const hillX = Math.cos(angle) * distance;
      const hillZ = Math.sin(angle) * distance;
      
      // Tamanho aleatório para a colina
      const hillSize = territory.size * (0.1 + random.next() * 0.15);
      const hillHeight = 0.1 + random.next() * 0.2;
      
      // Geometria da colina (hemisfério achatado)
      const hillGeometry = new THREE.SphereGeometry(
        hillSize,
        8,
        6,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      
      const hillMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.primary),
        shininess: 5
      });
      
      const hill = new THREE.Mesh(hillGeometry, hillMaterial);
      hill.position.set(hillX, baseHeight, hillZ);
      hill.scale.y = hillHeight; // Achatar a colina
      
      hill.receiveShadow = true;
      
      group.add(hill);
    }
  }
  
  /**
   * Adiciona um corpo d'água (rio ou lago) à floresta
   */
  private addWaterBody(
    group: THREE.Group,
    territory: Territory,
    colors: ColorScheme,
    baseHeight: number
  ): void {
    const random = new RandomGenerator(territory.visualSeed + 3000);
    
    // Decidir entre lago (70% chance) ou rio (30% chance)
    const isLake = random.next() < 0.7;
    
    if (isLake) {
      // Criar um lago com forma irregular
      const lakeRadius = territory.size * (0.15 + random.next() * 0.1);
      
      // Posição do lago - perto do centro mas não exatamente
      const angle = random.next() * Math.PI * 2;
      const distance = territory.size * random.next() * 0.3;
      const lakeX = Math.cos(angle) * distance;
      const lakeZ = Math.sin(angle) * distance;
      
      // Forma irregular para o lago
      const lakeShape = new THREE.Shape();
      const lakeSegments = 12 + Math.floor(random.next() * 8);
      
      for (let i = 0; i < lakeSegments; i++) {
        const segmentAngle = (i / lakeSegments) * Math.PI * 2;
        const segmentRadius = lakeRadius * (0.8 + random.next() * 0.4);
        
        const x = Math.cos(segmentAngle) * segmentRadius;
        const y = Math.sin(segmentAngle) * segmentRadius;
        
        if (i === 0) {
          lakeShape.moveTo(x, y);
        } else {
          lakeShape.lineTo(x, y);
        }
      }
      
      lakeShape.closePath();
      
      const lakeGeometry = new THREE.ShapeGeometry(lakeShape);
      const lakeMaterial = new THREE.MeshPhongMaterial({
        color: 0x3399ff,
        transparent: true,
        opacity: 0.8,
        shininess: 90
      });
      
      const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
      lake.rotation.x = -Math.PI / 2;
      lake.position.set(lakeX, baseHeight + 0.05, lakeZ);
      
      group.add(lake);
      
      // Adicionar margem do lago
      const shoreShape = new THREE.Shape();
      const shoreSegments = lakeSegments;
      
      for (let i = 0; i < shoreSegments; i++) {
        const segmentAngle = (i / shoreSegments) * Math.PI * 2;
        // Margem ligeiramente maior que o lago
        const segmentRadius = lakeRadius * (0.9 + random.next() * 0.4) * 1.1;
        
        const x = Math.cos(segmentAngle) * segmentRadius;
        const y = Math.sin(segmentAngle) * segmentRadius;
        
        if (i === 0) {
          shoreShape.moveTo(x, y);
        } else {
          shoreShape.lineTo(x, y);
        }
      }
      
      shoreShape.closePath();
      
      // Recortar a forma do lago para ter apenas a margem
      const hole = new THREE.Path();
      for (let i = 0; i < lakeSegments; i++) {
        const segmentAngle = (i / lakeSegments) * Math.PI * 2;
        const segmentRadius = lakeRadius * (0.8 + random.next() * 0.4);
        
        const x = Math.cos(segmentAngle) * segmentRadius;
        const y = Math.sin(segmentAngle) * segmentRadius;
        
        if (i === 0) {
          hole.moveTo(x, y);
        } else {
          hole.lineTo(x, y);
        }
      }
      
      hole.closePath();
      shoreShape.holes.push(hole);
      
      const shoreGeometry = new THREE.ShapeGeometry(shoreShape);
      const shoreMaterial = new THREE.MeshPhongMaterial({
        color: 0xD2B48C, // Marrom areia
        shininess: 5
      });
      
      const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
      shore.rotation.x = -Math.PI / 2;
      shore.position.set(lakeX, baseHeight + 0.03, lakeZ);
      
      group.add(shore);
    } else {
      // Criar um rio sinuoso
      const points: THREE.Vector3[] = [];
      const riverSegments = 10 + Math.floor(random.next() * 8);
      const riverWidth = territory.size * (0.06 + random.next() * 0.04);
      
      // Determinar ponto de entrada e saída do rio
      const entryAngle = random.next() * Math.PI * 2;
      const exitAngle = entryAngle + Math.PI * (0.5 + random.next() * 1.0);
      
      const entryPoint = new THREE.Vector3(
        Math.cos(entryAngle) * territory.size * 0.9,
        baseHeight + 0.05,
        Math.sin(entryAngle) * territory.size * 0.9
      );
      
      const exitPoint = new THREE.Vector3(
        Math.cos(exitAngle) * territory.size * 0.9,
        baseHeight + 0.05,
        Math.sin(exitAngle) * territory.size * 0.9
      );
      
      // Criar pontos intermediários com alguma aleatoriedade
      points.push(entryPoint);
      
      const ctrlPoint1 = new THREE.Vector3(
        entryPoint.x * 0.5 + random.next() * territory.size * 0.4 - territory.size * 0.2,
        baseHeight + 0.05,
        entryPoint.z * 0.5 + random.next() * territory.size * 0.4 - territory.size * 0.2
      );
      
      const ctrlPoint2 = new THREE.Vector3(
        exitPoint.x * 0.5 + random.next() * territory.size * 0.4 - territory.size * 0.2,
        baseHeight + 0.05,
        exitPoint.z * 0.5 + random.next() * territory.size * 0.4 - territory.size * 0.2
      );
      
      // Criar curva para o rio
      const curve = new THREE.CubicBezierCurve3(
        entryPoint,
        ctrlPoint1,
        ctrlPoint2,
        exitPoint
      );
      
      const riverPoints = curve.getPoints(riverSegments);
      
      // Criar geometria do rio com curve
      const riverShapes: THREE.Shape[] = [];
      
      for (let i = 0; i < riverPoints.length - 1; i++) {
        const current = riverPoints[i];
        const next = riverPoints[i + 1];
        
        // Vetor direção
        const direction = new THREE.Vector3().subVectors(next, current).normalize();
        
        // Vetor perpendicular (para largura do rio)
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        
        // Pontos para esta seção do rio
        const p1 = new THREE.Vector3().addVectors(current, perpendicular.clone().multiplyScalar(riverWidth/2));
        const p2 = new THREE.Vector3().addVectors(current, perpendicular.clone().multiplyScalar(-riverWidth/2));
        const p3 = new THREE.Vector3().addVectors(next, perpendicular.clone().multiplyScalar(-riverWidth/2));
        const p4 = new THREE.Vector3().addVectors(next, perpendicular.clone().multiplyScalar(riverWidth/2));
        
        // Criar shape para esta seção
        const riverShape = new THREE.Shape();
        riverShape.moveTo(p1.x, p1.z);
        riverShape.lineTo(p2.x, p2.z);
        riverShape.lineTo(p3.x, p3.z);
        riverShape.lineTo(p4.x, p4.z);
        riverShape.closePath();
        
        riverShapes.push(riverShape);
      }
      
      // Renderizar todas as seções do rio
      riverShapes.forEach(shape => {
        const riverGeometry = new THREE.ShapeGeometry(shape);
        const riverMaterial = new THREE.MeshPhongMaterial({
          color: 0x3399ff,
          transparent: true,
          opacity: 0.8,
          shininess: 90
        });
        
        const riverSegment = new THREE.Mesh(riverGeometry, riverMaterial);
        riverSegment.rotation.x = -Math.PI / 2;
        riverSegment.position.y = baseHeight + 0.05;
        
        group.add(riverSegment);
        
        // Margem do rio
        const shoreShape = new THREE.Shape();
        
        // Copiar a forma do rio e expandir ligeiramente
        const riverVertices = riverGeometry.getAttribute('position');
        
        if (riverVertices) {
          const expandFactor = 1.2;
          const midX = 0;
          const midZ = 0;
          
          for (let i = 0; i < 4; i++) {
            const x = riverVertices.getX(i);
            const z = riverVertices.getZ(i);
            
            // Expande a partir do centro
            const expandedX = midX + (x - midX) * expandFactor;
            const expandedZ = midZ + (z - midZ) * expandFactor;
            
            if (i === 0) {
              shoreShape.moveTo(expandedX, expandedZ);
            } else {
              shoreShape.lineTo(expandedX, expandedZ);
            }
          }
          
          shoreShape.closePath();
          
          // Recortar a forma original
          const hole = new THREE.Path();
          for (let i = 0; i < 4; i++) {
            const x = riverVertices.getX(i);
            const z = riverVertices.getZ(i);
            
            if (i === 0) {
              hole.moveTo(x, z);
            } else {
              hole.lineTo(x, z);
            }
          }
          
          hole.closePath();
          shoreShape.holes.push(hole);
          
          const shoreGeometry = new THREE.ShapeGeometry(shoreShape);
          const shoreMaterial = new THREE.MeshPhongMaterial({
            color: 0xD2B48C, // Marrom areia
            shininess: 5
          });
          
          const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
          shore.rotation.x = -Math.PI / 2;
          shore.position.y = baseHeight + 0.03;
          
          group.add(shore);
        }
      });
    }
  }
  
  /**
   * Adiciona árvores ao território florestal de forma mais eficiente
   */
  private addForestTrees(
  group: THREE.Group, 
  territory: Territory, 
  predefinedPositions: any[], 
  colors: ColorScheme, 
  terrainHeight: number
): void {
  console.log('🌲 Adding Forest Trees', {
    predefinedPositionsCount: predefinedPositions.length,
    territoryType: territory.type,
    fusionLevel: territory.fusionLevel
  });
    const random = new RandomGenerator(territory.visualSeed);
    
    // Densidades baseadas no nível de fusão
    let treeCountMultiplier = 1.0;
    if (territory.fusionLevel > 1) {
      treeCountMultiplier = 1.0 + (territory.fusionLevel * 0.2);
    }
    
    // Base de árvores 
    const treeCount = Math.floor((10 + Math.floor(random.next() * 10)) * treeCountMultiplier);
    
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
    
    // Criar instâncias para árvores comuns para economizar memória
    const instancedMeshes = this.createInstancedTrees(colors, territory.fusionLevel);
    
    // Contadores para cada tipo
    let coniferCount = 0;
    let leafyCount = 0;
    let oakCount = 0;
    let mapleCount = 0;
    
    // Criar árvores nas posições usando instâncias
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      // Escala aleatória
      const treeScale = 0.3 + random.next() * 0.4;
      
      // Alternar entre tipos de árvores
      let treeType = 'leafy';
      
      if (i % 3 === 0) {
        treeType = 'conifer';
        coniferCount++;
        
        // Aplicar a matriz transformada
        const matrix = new THREE.Matrix4();
        matrix.makeScale(treeScale, treeScale, treeScale);
        matrix.setPosition(pos.x, terrainHeight, pos.z);
        
        if (instancedMeshes.conifer && coniferCount < 1000) {
          instancedMeshes.conifer.setMatrixAt(coniferCount - 1, matrix);
        }
      } else if (i % 7 === 0 && territory.fusionLevel > 1) {
        treeType = 'oak';
        oakCount++;
        
        // Aplicar a matriz transformada
        const matrix = new THREE.Matrix4();
        matrix.makeScale(treeScale, treeScale, treeScale);
        matrix.setPosition(pos.x, terrainHeight, pos.z);
        
        if (instancedMeshes.oak && oakCount < 1000) {
          instancedMeshes.oak.setMatrixAt(oakCount - 1, matrix);
        }
      } else if (i % 11 === 0 && territory.fusionLevel > 2) {
        treeType = 'maple';
        mapleCount++;
        
        // Aplicar a matriz transformada
        const matrix = new THREE.Matrix4();
        matrix.makeScale(treeScale, treeScale, treeScale);
        matrix.setPosition(pos.x, terrainHeight, pos.z);
        
        if (instancedMeshes.maple && mapleCount < 1000) {
          instancedMeshes.maple.setMatrixAt(mapleCount - 1, matrix);
        }
      } else {
        leafyCount++;
        
        // Aplicar a matriz transformada
        const matrix = new THREE.Matrix4();
        matrix.makeScale(treeScale, treeScale, treeScale);
        matrix.setPosition(pos.x, terrainHeight, pos.z);
        
        if (instancedMeshes.leafy && leafyCount < 1000) {
          instancedMeshes.leafy.setMatrixAt(leafyCount - 1, matrix);
        }
      }
    }
    
    // Atualizar as matrizes das instâncias
    Object.values(instancedMeshes).forEach(mesh => {
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.count = Math.min(1000, Math.max(coniferCount, leafyCount, oakCount, mapleCount));
        group.add(mesh);
      }
    });
    
    // Para árvores específicas (tipos raros ou decorativas), usar geometria normal
    const specialTreeCount = Math.min(5, Math.floor(territory.fusionLevel * 2));
    
    for (let i = 0; i < specialTreeCount; i++) {
      const angle = random.next() * Math.PI * 2;
      const distance = territory.size * 0.6 * random.next();
      
      const specialTreeX = Math.cos(angle) * distance;
      const specialTreeZ = Math.sin(angle) * distance;
      
      // Criar árvore especial (tamanho maior)
      const treeScale = 0.5 + random.next() * 0.3;
      const treeType = territory.fusionLevel > 2 ? 'maple' : (random.next() > 0.5 ? 'oak' : 'conifer');
      
      const tree = this.treeGenerator.createTree(treeScale, treeType, colors);
      tree.position.set(specialTreeX, terrainHeight, specialTreeZ);
      
      group.add(tree);
    }
  }
  
  /**
   * Cria árvores instanciadas para melhor desempenho
   */
  private createInstancedTrees(colors: ColorScheme, fusionLevel: number): { 
    conifer?: THREE.InstancedMesh, 
    leafy?: THREE.InstancedMesh,
    oak?: THREE.InstancedMesh,
    maple?: THREE.InstancedMesh
  } {
    const instances: any = {};
    const maxCount = 1000; // Número máximo de instâncias
    
    // Conifer (pinheiro)
    const coniferTrunk = new THREE.CylinderGeometry(0.05, 0.08, 0.5, 5);
    const coniferTop = new THREE.ConeGeometry(0.25, 0.5, 8);
    
    const coniferGroup = new THREE.Object3D();
    coniferGroup.add(new THREE.Mesh(coniferTrunk, new THREE.MeshPhongMaterial({ color: 0x8B4513 })));
    
    // Adicionar camadas de galhos para pinheiros
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(
        coniferTop, 
        new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.secondary) })
      );
      cone.position.y = 0.25 + i * 0.2;
      cone.scale.set(1.0 - i * 0.2, 1.0, 1.0 - i * 0.2);
      coniferGroup.add(cone);
    }
    
    // Leafy (árvore frondosa)
    const leafyTrunk = new THREE.CylinderGeometry(0.05, 0.08, 0.5, 5);
    const leafyTop = new THREE.SphereGeometry(0.3, 8, 8);
    
    const leafyGroup = new THREE.Object3D();
    leafyGroup.add(new THREE.Mesh(leafyTrunk, new THREE.MeshPhongMaterial({ color: 0x8B4513 })));
    leafyGroup.add(new THREE.Mesh(
      leafyTop, 
      new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.secondary) })
    ));
    leafyGroup.children[1].position.y = 0.5;
    
    // Converter para instâncias
    const coniferMesh = this.createInstancedMeshFromGroup(coniferGroup, maxCount);
    const leafyMesh = this.createInstancedMeshFromGroup(leafyGroup, maxCount);
    
    instances.conifer = coniferMesh;
    instances.leafy = leafyMesh;
    
    // Adicionar tipos de árvores extras para níveis de fusão mais altos
    if (fusionLevel > 1) {
      // Oak (carvalho)
      const oakTrunk = new THREE.CylinderGeometry(0.07, 0.1, 0.6, 5);
      const oakTop = new THREE.SphereGeometry(0.4, 8, 8);
      
      const oakGroup = new THREE.Object3D();
      oakGroup.add(new THREE.Mesh(oakTrunk, new THREE.MeshPhongMaterial({ color: 0x8B4513 })));
      
      const oakTopMesh = new THREE.Mesh(
        oakTop, 
        new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.secondary) })
      );
      oakTopMesh.position.y = 0.6;
      oakTopMesh.scale.set(1.0, 0.8, 1.0);
      oakGroup.add(oakTopMesh);
      
      instances.oak = this.createInstancedMeshFromGroup(oakGroup, maxCount);
    }
    
    if (fusionLevel > 2) {
      // Maple (bordo)
      const mapleTrunk = new THREE.CylinderGeometry(0.06, 0.09, 0.6, 5);
      const mapleTop = new THREE.SphereGeometry(0.35, 8, 8);
      
      const mapleGroup = new THREE.Object3D();
      mapleGroup.add(new THREE.Mesh(mapleTrunk, new THREE.MeshPhongMaterial({ color: 0x8B4513 })));
      
      const mapleTopMesh = new THREE.Mesh(
        mapleTop, 
        new THREE.MeshPhongMaterial({ color: new THREE.Color(colors.accent) })
      );
      mapleTopMesh.position.y = 0.6;
      mapleGroup.add(mapleTopMesh);
      
      instances.maple = this.createInstancedMeshFromGroup(mapleGroup, maxCount);
    }
    
    return instances;
  }
  
  /**
   * Cria um InstancedMesh a partir de um grupo
   */
  private createInstancedMeshFromGroup(group: THREE.Object3D, maxCount: number): THREE.InstancedMesh | undefined {
    // Combinar todas as geometrias
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    
    // Extrair geometrias e materiais
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.push(object.geometry);
        materials.push(object.material);
      }
    });
    
    if (geometries.length === 0) return undefined;
    
    // Combinar geometrias manualmente (não usar BufferGeometryUtils que pode não estar disponível)
    let totalVertices = 0;
    let totalIndices = 0;
    
    // Contar total de vértices e índices
    geometries.forEach(geometry => {
      if (geometry.index) {
        totalIndices += geometry.index.count;
      } else {
        totalIndices += geometry.attributes.position.count;
      }
      totalVertices += geometry.attributes.position.count;
    });
    
    // Criar novo buffer
    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const indices = new Uint32Array(totalIndices);
    
    let vertexOffset = 0;
    let indexOffset = 0;
    
    // Combinar dados
    geometries.forEach(geometry => {
      const positionAttr = geometry.attributes.position;
      const normalAttr = geometry.attributes.normal;
      
      // Copiar posições
      for (let i = 0; i < positionAttr.count; i++) {
        positions[(vertexOffset + i) * 3] = positionAttr.getX(i);
        positions[(vertexOffset + i) * 3 + 1] = positionAttr.getY(i);
        positions[(vertexOffset + i) * 3 + 2] = positionAttr.getZ(i);
      }
      
      // Copiar normais
      for (let i = 0; i < normalAttr.count; i++) {
        normals[(vertexOffset + i) * 3] = normalAttr.getX(i);
        normals[(vertexOffset + i) * 3 + 1] = normalAttr.getY(i);
        normals[(vertexOffset + i) * 3 + 2] = normalAttr.getZ(i);
      }
      
      // Copiar índices ajustando o offset
      if (geometry.index) {
        for (let i = 0; i < geometry.index.count; i++) {
          indices[indexOffset + i] = geometry.index.getX(i) + vertexOffset;
        }
        indexOffset += geometry.index.count;
      } else {
        // Se não houver índices, criar sequenciais
        for (let i = 0; i < positionAttr.count; i++) {
          indices[indexOffset + i] = i + vertexOffset;
        }
        indexOffset += positionAttr.count;
      }
      
      vertexOffset += positionAttr.count;
    });
    
    // Criar geometria combinada
    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    const mergedMaterial = materials[0]; // Simplificação - usar apenas o primeiro material
    
    // Criar instâncias
    const instancedMesh = new THREE.InstancedMesh(mergedGeometry, mergedMaterial, maxCount);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    
    return instancedMesh;
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
    
    // Adicionar um caminho que conecta o bosque ao centro da floresta
    this.addConnectingPath(group, grovePosition, terrainHeight, colors);
  }
  
  /**
   * Adiciona um caminho conectando o bosque ao centro da floresta
   */
  private addConnectingPath(
    group: THREE.Group,
    destination: {x: number, z: number},
    baseHeight: number,
    colors: ColorScheme
  ): void {
    const pathWidth = 0.4;
    
    // Vetor direção do caminho (do centro para o destino)
    const direction = new THREE.Vector3(destination.x, 0, destination.z).normalize();
    const pathLength = Math.sqrt(destination.x * destination.x + destination.z * destination.z);
    
    // Criar pontos de controle para um caminho curvo natural
    const pathShape = new THREE.Shape();
    
    // Vetor perpendicular para largura do caminho
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    
    // Pontos para o caminho
    const p1 = new THREE.Vector3(
      0 + perpendicular.x * pathWidth/2,
      0,
      0 + perpendicular.z * pathWidth/2
    );
    
    const p2 = new THREE.Vector3(
      0 - perpendicular.x * pathWidth/2,
      0,
      0 - perpendicular.z * pathWidth/2
    );
    
    const p3 = new THREE.Vector3(
      destination.x - perpendicular.x * pathWidth/2,
      0,
      destination.z - perpendicular.z * pathWidth/2
    );
    
    const p4 = new THREE.Vector3(
      destination.x + perpendicular.x * pathWidth/2,
      0,
      destination.z + perpendicular.z * pathWidth/2
    );
    
    // Criar a forma do caminho
    pathShape.moveTo(p1.x, p1.z);
    pathShape.lineTo(p2.x, p2.z);
    pathShape.lineTo(p3.x, p3.z);
    pathShape.lineTo(p4.x, p4.z);
    pathShape.closePath();
    
    // Geometria do caminho
    const pathGeometry = new THREE.ShapeGeometry(pathShape);
    const pathMaterial = new THREE.MeshPhongMaterial({
      color: 0xC2B280, // Cor de terra
      shininess: 5
    });
    
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    path.position.y = baseHeight + 0.03; // Ligeiramente acima do terreno
    
    group.add(path);
    
    // Adicionar pedras/detalhes ao longo do caminho
    this.addPathDetails(group, baseHeight, p1, p2, p3, p4, colors);
  }
  
  /**
   * Adiciona detalhes ao caminho como pedras e arbustos
   */
  private addPathDetails(
    group: THREE.Group,
    baseHeight: number,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    p3: THREE.Vector3,
    p4: THREE.Vector3,
    colors: ColorScheme
  ): void {
    const random = new RandomGenerator(Math.random() * 1000);
    
    // Calcular o comprimento do caminho
    const pathLength = p1.distanceTo(p4);
    
    // Número de detalhes ao longo do caminho
    const detailCount = Math.max(3, Math.floor(pathLength * 2));
    
    for (let i = 0; i < detailCount; i++) {
      // Posição interpolada ao longo do caminho
      const t = i / (detailCount - 1);
      
      // Lados alternados
      const side = i % 2 === 0 ? 1 : -1;
      
      // Posição entre p1->p4 ou p2->p3
      const pos1 = p1.clone().lerp(p4, t);
      const pos2 = p2.clone().lerp(p3, t);
      
      // Escolher lado e adicionar desvio aleatório
      const position = side > 0 ? pos1 : pos2;
      
      // Desvio perpendicular ao caminho
      const pathDir = new THREE.Vector3().subVectors(p4, p1).normalize();
      const perpendicular = new THREE.Vector3(-pathDir.z, 0, pathDir.x).normalize();
      
      // Adicionar desvio para fora do caminho
      position.add(perpendicular.multiplyScalar(side * (0.3 + random.next() * 0.1)));
      
      // Alternar entre pedras e arbustos
      if (i % 3 === 0) {
        // Criar uma pedra
        const stoneSize = 0.07 + random.next() * 0.05;
        let stoneGeometry;
        
        if (random.next() > 0.5) {
          stoneGeometry = new THREE.DodecahedronGeometry(stoneSize, 0);
        } else {
          stoneGeometry = new THREE.OctahedronGeometry(stoneSize, 0);
        }
        
        const stoneMaterial = new THREE.MeshPhongMaterial({
          color: 0x888888,
          shininess: 30,
          flatShading: true
        });
        
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stone.position.set(
          position.x,
          baseHeight + stoneSize,
          position.z
        );
        
        // Rotação aleatória
        stone.rotation.set(
          random.next() * Math.PI,
          random.next() * Math.PI,
          random.next() * Math.PI
        );
        
        stone.castShadow = true;
        stone.receiveShadow = true;
        
        group.add(stone);
      } else {
        // Criar um pequeno arbusto/tufo de grama
        const bushSize = 0.1 + random.next() * 0.05;
        const bushGeometry = new THREE.SphereGeometry(bushSize, 8, 8);
        const bushMaterial = new THREE.MeshPhongMaterial({
          color: 0x228B22, // Verde floresta
          shininess: 10
        });
        
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.set(
          position.x,
          baseHeight + bushSize * 0.5,
          position.z
        );
        
        // Achatar o arbusto
        bush.scale.y = 0.6;
        
        bush.castShadow = true;
        bush.receiveShadow = true;
        
        group.add(bush);
      }
    }
  }
}