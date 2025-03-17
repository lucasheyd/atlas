// src/Maps3d/3d/ornaments/TerrainFeatures.ts
import * as THREE from 'three';
import { ColorScheme } from '../../utils/ColorGenetics';

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
    switch (featureType) {
      case 'mountain':
        return this.createMountain(size, fusionLevel, colors);
      case 'lake':
        return this.createLake(size, fusionLevel, colors);
      case 'rock':
        return this.createRock(size, fusionLevel, colors);
      case 'hill':
        return this.createHill(size, fusionLevel, colors);
      default:
        return this.createRock(size, fusionLevel, colors);
    }
  }
  
  /**
   * Cria uma montanha pequena
   */
  private createMountain(size: number, fusionLevel: number, colors: ColorScheme): THREE.Object3D {
    const mountainGroup = new THREE.Group();
    
    // Geometria da montanha
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
    
    return mountainGroup;
  }
  
  /**
   * Cria um lago
   */
  private createLake(size: number, fusionLevel: number, colors: ColorScheme): THREE.Object3D {
    const lakeGroup = new THREE.Group();
    
    // Geometria do lago
    const lakeGeometry = new THREE.CircleGeometry(size, 24);
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
    const borderGeometry = new THREE.RingGeometry(
      size * 0.95,
      size * 1.05,
      24
    );
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
    }
    
    return lakeGroup;
  }
  
  /**
   * Cria uma formação rochosa
   */
  private createRock(size: number, fusionLevel: number, colors: ColorScheme): THREE.Object3D {
    const rockGroup = new THREE.Group();
    
    // Número de rochas na formação
    const rockCount = 3 + fusionLevel;
    
    for (let i = 0; i < rockCount; i++) {
      // Tamanho variável para cada rocha
      const rockSize = size * (0.4 + Math.random() * 0.6);
      
      // Usar geometria de dodecaedro para uma forma mais irregular
      const rockGeometry = new THREE.DodecahedronGeometry(
        rockSize,
        0 // Sem subdivisões para manter baixa poligonagem
      );
      
      const rockMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888, // Cinza
        specular: 0x111111,
        shininess: 30,
        flatShading: true
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      // Posicionar com alguma aleatoriedade
      rock.position.set(
        (Math.random() - 0.5) * size,
        rockSize * 0.5,
        (Math.random() - 0.5) * size
      );
      
      // Rotações aleatórias
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Escala variável e não uniforme
      rock.scale.set(
        1.0 + Math.random() * 0.2,
        0.7 + Math.random() * 0.3,
        1.0 + Math.random() * 0.2
      );
      
      rock.castShadow = true;
      rock.receiveShadow = true;
      
      rockGroup.add(rock);
    }
    
    return rockGroup;
  }
  
  /**
   * Cria uma colina
   */
// src/Maps3d/3d/ornaments/TerrainFeatures.ts (continuação)
  private createHill(size: number, fusionLevel: number, colors: ColorScheme): THREE.Object3D {
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
    
    // Adicionar vegetação para níveis de fusão maiores
    if (fusionLevel > 0) {
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
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI / 4; // Limitado à parte superior da colina
        
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
    }
    
    return hillGroup;
  }
}
