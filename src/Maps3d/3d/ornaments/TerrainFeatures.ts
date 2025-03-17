// src/Maps3d/3d/ornaments/TerrainFeatures.ts (versão aprimorada completa)
import * as THREE from 'three';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';

export class TerrainFeatures {
  /**
   * Cria uma característica de terreno baseada no tipo
   */
  public createFeature(
    featureType: string,
    size: number,
    fusionLevel: number,
    colors: ColorScheme
  ): THREE.Object3D {
    const random = new RandomGenerator(Math.floor(Math.random() * 100000));
    
    switch (featureType) {
      case 'mountain':
        return this.createMountain(size, fusionLevel, colors, random);
      case 'lake':
        return this.createLake(size, fusionLevel, colors, random);
      case 'rock':
        return this.createRock(size, fusionLevel, colors, random);
      case 'hill':
        return this.createHill(size, fusionLevel, colors, random);
      case 'forest-patch':
        return this.createForestPatch(size, fusionLevel, colors, random);
      default:
        return this.createRock(size, fusionLevel, colors, random);
    }
  }
  
  /**
   * Cria uma montanha pequena
   */
  private createMountain(
    size: number,
    fusionLevel: number,
    colors: ColorScheme,
    random: RandomGenerator
  ): THREE.Object3D {
    const mountainGroup = new THREE.Group();
    
    // Geometria da montanha com mais detalhes
    const mountainGeometry = new THREE.ConeGeometry(
      size * 0.8,
      size * 1.5,
      8
    );
    
    const mountainMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: 0x333333,
      shininess: 20,
      flatShading: true
    });
    
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain.position.y = size * 0.75;
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    
    mountainGroup.add(mountain);
    
    // Adicionar neve no topo para níveis de fusão altos
    if (fusionLevel > 1) {
      const snowCapGeometry = new THREE.ConeGeometry(
        size * 0.4,
        size * 0.3,
        8
      );
      
      const snowMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        shininess: 70
      });
      
      const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
      snowCap.position.y = size * 1.35;
      snowCap.castShadow = true;
      
      mountainGroup.add(snowCap);
    }
    
    // Adicionar rochas na base
    const rockCount = 3 + fusionLevel;
    
    for (let i = 0; i < rockCount; i++) {
      const rockSize = size * 0.15 * (0.7 + random.next() * 0.6);
      const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
      
      const rockMaterial = new THREE.MeshPhongMaterial({
        color: 0x777777,
        shininess: 10,
        flatShading: true
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      // Posicionar em torno da base
      const rockAngle = (i / rockCount) * Math.PI * 2;
      const rockRadius = size * 0.6 + random.next() * size * 0.2;
      
      rock.position.set(
        Math.cos(rockAngle) * rockRadius,
        rockSize,
        Math.sin(rockAngle) * rockRadius
      );
      
      // Rotação aleatória
      rock.rotation.set(
        random.next() * Math.PI,
        random.next() * Math.PI,
        random.next() * Math.PI
      );
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      
      mountainGroup.add(rock);
    }
    
    // Para montanhas grandes, adicionar árvores na base
    if (size > 1.0 && fusionLevel >= 2) {
      const treeCount = 4 + Math.floor(random.next() * 3);
      
      for (let i = 0; i < treeCount; i++) {
        const treeAngle = random.next() * Math.PI * 2;
        const treeRadius = size * 0.7 + random.next() * size * 0.3;
        
        const treeGroup = new THREE.Group();
        const treeScale = 0.2 + random.next() * 0.2;
        
        // Tronco
        const trunkGeometry = new THREE.CylinderGeometry(
          0.07 * treeScale,
          0.1 * treeScale,
          0.6 * treeScale,
          5
        );
        
        const trunkMaterial = new THREE.MeshPhongMaterial({
          color: 0x8B4513,
          shininess: 10
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.3 * treeScale;
        trunk.castShadow = true;
        
        // Copa
        const treeTopGeometry = new THREE.ConeGeometry(
          0.3 * treeScale,
          0.8 * treeScale,
          6
        );
        
        const treeTopMaterial = new THREE.MeshPhongMaterial({
          color: 0x005000,
          shininess: 10
        });
        
        const treeTop = new THREE.Mesh(treeTopGeometry, treeTopMaterial);
        treeTop.position.y = 0.7 * treeScale;
        treeTop.castShadow = true;
        
        treeGroup.add(trunk);
        treeGroup.add(treeTop);
        
        treeGroup.position.set(
          Math.cos(treeAngle) * treeRadius,
          0,
          Math.sin(treeAngle) * treeRadius
        );
        
        mountainGroup.add(treeGroup);
      }
    }
    
    return mountainGroup;
  }
  
  /**
   * Cria um lago
   */
  private createLake(
    size: number,
    fusionLevel: number,
    colors: ColorScheme,
    random: RandomGenerator
  ): THREE.Object3D {
    const lakeGroup = new THREE.Group();
    
    // Forma irregular do lago
    const segments = 12 + fusionLevel * 2;
    const lakeShape = new THREE.Shape();
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radius = size * (0.8 + random.next() * 0.4);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        lakeShape.moveTo(x, y);
      } else {
        lakeShape.lineTo(x, y);
      }
    }
    lakeShape.closePath();
    
    // Geometria do lago
    const lakeGeometry = new THREE.ShapeGeometry(lakeShape);
    const lakeMaterial = new THREE.MeshPhongMaterial({
      color: 0x4682B4, // Azul
      transparent: true,
      opacity: 0.8,
      shininess: 80
    });
    
    const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
    lake.rotation.x = -Math.PI / 2;
    lake.position.y = 0.05;
    
    lakeGroup.add(lake);
    
    // Adicionar borda do lago
    const borderShape = new THREE.Shape();
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radius = size * (0.9 + random.next() * 0.4);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        borderShape.moveTo(x, y);
      } else {
        borderShape.lineTo(x, y);
      }
    }
    borderShape.closePath();
    
    const hole = new THREE.Path();
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radius = size * (0.75 + random.next() * 0.3);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        hole.moveTo(x, y);
      } else {
        hole.lineTo(x, y);
      }
    }
    hole.closePath();
    
    borderShape.holes.push(hole);
    
    const borderGeometry = new THREE.ShapeGeometry(borderShape);
    const borderMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      shininess: 10
    });
    
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.02;
    
    lakeGroup.add(border);
    
    // Adicionar detalhes para níveis de fusão mais altos
    if (fusionLevel > 1) {
      // Adicionar algumas pedras ao redor do lago
      const stoneCount = Math.floor(fusionLevel * 3);
      
      for (let i = 0; i < stoneCount; i++) {
        const stoneGeometry = new THREE.SphereGeometry(
          size * 0.1,
          8,
          8
        );
        
        const stoneMaterial = new THREE.MeshPhongMaterial({
          color: 0x888888,
          shininess: 10,
          flatShading: true
        });
        
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        
        // Posicionar aleatoriamente ao redor do lago
        const angle = (i / stoneCount) * Math.PI * 2;
        stone.position.set(
          Math.cos(angle) * size * 1.05,
          0.05,
          Math.sin(angle) * size * 1.05
        );
        
        stone.scale.y = 0.5; // Achatado
        stone.castShadow = true;
        stone.receiveShadow = true;
        
        lakeGroup.add(stone);
      }
      
      // Para níveis mais altos, adicionar vegetação aquática
      if (fusionLevel > 2) {
        const lilyCount = 3 + Math.floor(random.next() * 4);
        
        for (let i = 0; i < lilyCount; i++) {
          const lilyGeometry = new THREE.CircleGeometry(size * 0.15, 5);
          const lilyMaterial = new THREE.MeshPhongMaterial({
            color: 0x006400, // Verde escuro
            transparent: true,
            opacity: 0.9,
            shininess: 10
          });
          
          const lily = new THREE.Mesh(lilyGeometry, lilyMaterial);
          lily.rotation.x = -Math.PI / 2;
          
          // Posicionar dentro do lago
          const angle = random.next() * Math.PI * 2;
          const radius = size * 0.5 * random.next();
          
          lily.position.set(
            Math.cos(angle) * radius,
            0.06,
            Math.sin(angle) * radius
          );
          
          lakeGroup.add(lily);
          
          // Adicionar flor em alguns lírios
          if (random.next() > 0.5) {
            const flowerGeometry = new THREE.CircleGeometry(size * 0.03, 8);
            const flowerMaterial = new THREE.MeshPhongMaterial({
              color: 0xFFFFFF, // Branco
              shininess: 70
            });
            
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.rotation.x = -Math.PI / 2;
            flower.position.y = 0.01;
            
            lily.add(flower);
          }
        }
      }
    }
    
    return lakeGroup;
  }
  
  /**
   * Cria uma formação rochosa
   */
  private createRock(
    size: number,
    fusionLevel: number,
    colors: ColorScheme,
    random: RandomGenerator
  ): THREE.Object3D {
    const rockGroup = new THREE.Group();
    
    // Número de rochas na formação
    const rockCount = 3 + fusionLevel;
    
    for (let i = 0; i < rockCount; i++) {
      // Tamanho variável para cada rocha
      const rockSize = size * (0.4 + random.next() * 0.6);
      
      // Usar geometrias diferentes para mais variedade
      let rockGeometry;
      const rockType = Math.floor(random.next() * 4);
      
      switch (rockType) {
        case 0:
          rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
          break;
        case 1:
          rockGeometry = new THREE.OctahedronGeometry(rockSize, 0);
          break;
        case 2:
          rockGeometry = new THREE.TetrahedronGeometry(rockSize, 0);
          break;
        default:
          rockGeometry = new THREE.IcosahedronGeometry(rockSize, 0);
      }
      
      // Cores ligeiramente diferentes para cada rocha
      const colorVariance = 0.2;
      const rockColor = new THREE.Color(
        0.5 + (random.next() - 0.5) * colorVariance,
        0.5 + (random.next() - 0.5) * colorVariance,
        0.5 + (random.next() - 0.5) * colorVariance
      );
      
      const rockMaterial = new THREE.MeshPhongMaterial({
        color: rockColor,
        specular: 0x111111,
        shininess: 30,
        flatShading: true
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      // Posicionar com alguma aleatoriedade
      rock.position.set(
        (random.next() - 0.5) * size,
        rockSize * 0.5,
        (random.next() - 0.5) * size
      );
      
      // Rotações aleatórias
      rock.rotation.set(
        random.next() * Math.PI,
        random.next() * Math.PI,
        random.next() * Math.PI
      );
      
      // Escala variável e não uniforme
      rock.scale.set(
        1.0 + random.next() * 0.2,
        0.7 + random.next() * 0.3,
        1.0 + random.next() * 0.2
      );
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      
      rockGroup.add(rock);
    }
    
    // Adicionar musgo em níveis mais altos
    if (fusionLevel > 1) {
      // Adicionar patches de musgo em algumas rochas
      for (let i = 0; i < rockCount; i += 2) {
        if (i < rockGroup.children.length) {
          const rock = rockGroup.children[i] as THREE.Mesh;
          const rockPosition = rock.position.clone();
          const rockSize = rock.scale.x;
          
          const mossGeometry = new THREE.CircleGeometry(rockSize * 0.7, 8);
          const mossColor = new THREE.Color(colors.secondary);
          // Tornar o musgo mais verde
          mossColor.g += 0.2;
          
          const mossMaterial = new THREE.MeshPhongMaterial({
            color: mossColor,
            transparent: true,
            opacity: 0.9,
            shininess: 5
          });
          
          const moss = new THREE.Mesh(mossGeometry, mossMaterial);
          moss.rotation.x = -Math.PI / 2;
          moss.position.set(
            rockPosition.x,
            rockPosition.y + rockSize * 0.5,
            rockPosition.z
          );
          
          rockGroup.add(moss);
        }
      }
    }
    
    return rockGroup;
  }
  
  /**
   * Cria uma colina
   */
  private createHill(
    size: number,
    fusionLevel: number,
    colors: ColorScheme,
    random: RandomGenerator
  ): THREE.Object3D {
    const hillGroup = new THREE.Group();
    
    // Geometria da colina (hemisfério)
    const hillGeometry = new THREE.SphereGeometry(
      size,
      16,
      8,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    
    const hillMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      specular: new THREE.Color(colors.specular),
      shininess: 10
    });
    
    const hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.receiveShadow = true;
    
    hillGroup.add(hill);
    
    // Adicionar vegetação
    const grassCount = 10 + fusionLevel * 5;
    
    // Material para grama
    const grassMaterial = new THREE.MeshPhongMaterial({
      color: 0x3CB371, // Verde médio
      specular: 0x003300,
      shininess: 5
    });
    
    // Criar vários tufos de grama
    for (let i = 0; i < grassCount; i++) {
      // Posição aleatória na colina
      const theta = random.next() * Math.PI * 2;
      const phi = random.next() * Math.PI / 4; // Limitado à parte superior da colina
      
      const x = size * Math.sin(phi) * Math.cos(theta);
      const y = size * Math.cos(phi);
      const z = size * Math.sin(phi) * Math.sin(theta);
      
      // Tufo de grama simples
      const grassGeometry = new THREE.ConeGeometry(
        0.1,
        0.2,
        4
      );
      
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      grass.position.set(x, y, z);
      
      // Apontar para fora da colina
      grass.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2));
      
      hillGroup.add(grass);
    }
    
    // Para níveis de fusão mais altos, adicionar flores
    if (fusionLevel > 1) {
      const flowerCount = fusionLevel * 3;
      
      for (let i = 0; i < flowerCount; i++) {
        // Posição aleatória na colina
        const theta = random.next() * Math.PI * 2;
        const phi = random.next() * Math.PI / 4; // Limitado à parte superior da colina
        
        const x = size * Math.sin(phi) * Math.cos(theta);
        const y = size * Math.cos(phi);
        const z = size * Math.sin(phi) * Math.sin(theta);
        
        // Flor
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
        const stemMaterial = new THREE.MeshPhongMaterial({
          color: 0x006400, // Verde escuro
          shininess: 5
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        // Pétala
        const petalGeometry = new THREE.SphereGeometry(0.08, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        
        // Cor aleatória para as flores
        const colors = [0xFF69B4, 0xFFFACD, 0xFFFFFF, 0x9370DB, 0xFF6347];
        const petalColor = colors[Math.floor(random.next() * colors.length)];
        
        const petalMaterial = new THREE.MeshPhongMaterial({
          color: petalColor,
          shininess: 50
        });
        
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.rotation.x = Math.PI;
        petal.position.y = 0.15;
        
        // Grupo para a flor
        const flower = new THREE.Group();
        flower.add(stem);
        flower.add(petal);
        
        flower.position.set(x, y, z);
        flower.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2));
        
        hillGroup.add(flower);
      }
    }
    
    return hillGroup;
  }
  
  /**
   * Cria um pequeno patch de floresta
   */
  private createForestPatch(
    size: number,
    fusionLevel: number,
    colors: ColorScheme,
    random: RandomGenerator
  ): THREE.Object3D {
    const forestGroup = new THREE.Group();
    
    // Base da floresta (disco verde)
    const baseGeometry = new THREE.CircleGeometry(size, 16);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x228B22, // Verde floresta
      shininess: 5
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.01;
    base.receiveShadow = true;
    
    forestGroup.add(base);
    
    // Adicionar árvores
    const treeCount = 5 + (fusionLevel * 2);
    
    for (let i = 0; i < treeCount; i++) {
      const treeGroup = new THREE.Group();
      
      // Posição aleatória dentro do patch
      const angle = random.next() * Math.PI * 2;
      const distance = random.next() * size * 0.8;
      const treeX = Math.cos(angle) * distance;
      const treeZ = Math.sin(angle) * distance;
      
      // Tamanho aleatório
      const treeScale = 0.2 + random.next() * 0.3;
      
      // Tipo de árvore (conífera ou folhosa)
      const treeType = random.next() > 0.7 ? 'conifer' : 'leafy';
      
      // Tronco
      const trunkGeometry = new THREE.CylinderGeometry(
        0.1 * treeScale,
        0.14 * treeScale,
        0.8 * treeScale,
        6
      );
      
      const trunkMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513, // Marrom
        shininess: 15
      });
      
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.4 * treeScale;
      trunk.castShadow = true;
      
      treeGroup.add(trunk);
      
      // Copa da árvore
      if (treeType === 'conifer') {
        // Árvore em camadas (pinheiro)
        for (let l = 0; l < 3; l++) {
          const coneSize = (3 - l) * 0.25 * treeScale;
          const coneHeight = 0.5 * treeScale;
          const coneGeometry = new THREE.ConeGeometry(coneSize, coneHeight, 8);
          
          const coneMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(colors.secondary),
            shininess: 10
          });
          
          const cone = new THREE.Mesh(coneGeometry, coneMaterial);
          cone.position.y = 0.5 * treeScale + (l * 0.4 * treeScale);
          cone.castShadow = true;
          
          treeGroup.add(cone);
        }
      } else {
        // Árvore de copa esférica
        const topGeometry = new THREE.SphereGeometry(
          0.5 * treeScale,
          8,
          8
        );
        
        const topMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.secondary),
          shininess: 10
        });
        
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 0.9 * treeScale;
        top.castShadow = true;
        
        treeGroup.add(top);
      }
      
      // Posicionar a árvore
      treeGroup.position.set(treeX, 0, treeZ);
      
      forestGroup.add(treeGroup);
    }
    
    // Adicionar arbustos para níveis mais altos
    if (fusionLevel > 1) {
      const bushCount = 3 + fusionLevel * 2;
      
      for (let i = 0; i < bushCount; i++) {
        const bushGeometry = new THREE.SphereGeometry(
          0.15 + random.next() * 0.1,
          8,
          8
        );
        
        const bushMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.secondary),
          shininess: 5
        });
        
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        
        // Posição aleatória
        const angle = random.next() * Math.PI * 2;
        const distance = random.next() * size * 0.9;
        
        bush.position.set(
          Math.cos(angle) * distance,
          0.15,
          Math.sin(angle) * distance
        );
        
        // Escala não uniforme para parecer mais natural
        bush.scale.set(
          1.0 + random.next() * 0.3,
          0.8 + random.next() * 0.2,
          1.0 + random.next() * 0.3
        );
        
        bush.castShadow = true;
        
        forestGroup.add(bush);
      }
    }
    
    return forestGroup;
  }
}