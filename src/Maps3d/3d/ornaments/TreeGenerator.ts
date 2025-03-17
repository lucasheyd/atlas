// src/Maps3d/3d/ornaments/TreeGenerator.ts
import * as THREE from 'three';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';

/**
 * Classe especializada na geração de árvores e elementos florestais
 */
export class TreeGenerator {
  /**
   * Cria uma árvore padrão
   * @param treeScale Escala da árvore
   * @param treeType Tipo de árvore ('conifer', 'leafy', 'palm', etc)
   * @param colors Esquema de cores
   */
  public createTree(
    treeScale: number = 1.0,
    treeType: string = 'leafy',
    colors: ColorScheme
  ): THREE.Group {
    const treeGroup = new THREE.Group();
    
    // Tronco
    const trunkGeometry = new THREE.CylinderGeometry(
      0.1 * treeScale,
      0.15 * treeScale,
      1 * treeScale,
      8
    );
    
    const trunkMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513, // Marrom madeira
      shininess: 20
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.5 * treeScale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    treeGroup.add(trunk);
    
    // Diferentes tipos de árvores
    switch (treeType) {
      case 'conifer': // Conífera (pinheiro)
        this.addConiferTop(treeGroup, treeScale, colors);
        break;
      case 'palm': // Palmeira
        this.addPalmTop(treeGroup, treeScale, colors);
        break;
      case 'maple': // Bordo/maple
        this.addMapleTop(treeGroup, treeScale, colors);
        break;
      case 'oak': // Carvalho
        this.addOakTop(treeGroup, treeScale, colors);
        break;
      case 'leafy': // Árvore frondosa genérica
      default:
        this.addLeafyTop(treeGroup, treeScale, colors);
        break;
    }
    
    return treeGroup;
  }
  
  /**
   * Adiciona uma copa de pinheiro (formato cônico)
   */
  private addConiferTop(
    treeGroup: THREE.Group,
    treeScale: number, 
    colors: ColorScheme
  ): void {
    // Pinheiros têm camadas de folhagem
    const layers = 3;
    
    for (let i = 0; i < layers; i++) {
      const layerScale = layers - i;
      const topGeometry = new THREE.ConeGeometry(
        0.25 * treeScale * layerScale / layers,
        0.6 * treeScale,
        8
      );
      
      const topMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.secondary),
        shininess: 15
      });
      
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 1 * treeScale + i * 0.35 * treeScale;
      top.castShadow = true;
      
      treeGroup.add(top);
    }
  }
  
  /**
   * Adiciona uma copa de árvore frondosa (formato esférico)
   */
  private addLeafyTop(
    treeGroup: THREE.Group,
    treeScale: number, 
    colors: ColorScheme
  ): void {
    const topGeometry = new THREE.SphereGeometry(
      0.6 * treeScale,
      8,
      8
    );
    
    const topMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      shininess: 15
    });
    
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.2 * treeScale;
    top.castShadow = true;
    
    treeGroup.add(top);
  }
  
  /**
   * Adiciona uma copa de palmeira
   */
  private addPalmTop(
    treeGroup: THREE.Group,
    treeScale: number, 
    colors: ColorScheme
  ): void {
    // Tronco mais alto e fino para palmeiras
    const trunk = treeGroup.children[0] as THREE.Mesh;
    trunk.position.y = 1.0 * treeScale;
    trunk.scale.set(0.7, 2.0, 0.7);
    
    // Folhas da palmeira
    const leafCount = 7;
    for (let i = 0; i < leafCount; i++) {
      const leafGeometry = new THREE.PlaneGeometry(
        1.0 * treeScale,
        0.4 * treeScale
      );
      
      const leafMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.secondary),
        side: THREE.DoubleSide,
        shininess: 15
      });
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      // Posicionar em torno do topo
      const angle = (i / leafCount) * Math.PI * 2;
      leaf.position.y = 2.0 * treeScale;
      
      // Rotação para criar efeito de folha de palmeira
      leaf.rotation.x = Math.PI / 4;
      leaf.rotation.y = angle;
      
      leaf.castShadow = true;
      
      treeGroup.add(leaf);
    }
    
    // Cocos (opcional)
    const cocoCount = 5;
    for (let i = 0; i < cocoCount; i++) {
      const cocoGeometry = new THREE.SphereGeometry(
        0.1 * treeScale,
        8,
        8
      );
      
      const cocoMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        shininess: 20
      });
      
      const coco = new THREE.Mesh(cocoGeometry, cocoMaterial);
      
      // Posicionar em agrupamento embaixo das folhas
      const angle = (i / cocoCount) * Math.PI;
      const radius = 0.2 * treeScale;
      
      coco.position.set(
        Math.cos(angle) * radius,
        1.9 * treeScale,
        Math.sin(angle) * radius
      );
      
      coco.castShadow = true;
      
      treeGroup.add(coco);
    }
  }
  
  /**
   * Adiciona uma copa de bordo/maple
   */
  private addMapleTop(
    treeGroup: THREE.Group,
    treeScale: number, 
    colors: ColorScheme
  ): void {
    // Estrutura mais complexa para um maple
    const random = new RandomGenerator(Math.random() * 1000);
    
    // Galhos principais
    const branchCount = 5;
    for (let i = 0; i < branchCount; i++) {
      const angle = (i / branchCount) * Math.PI * 2;
      const branchLength = (0.5 + random.next() * 0.3) * treeScale;
      
      const branchGeometry = new THREE.CylinderGeometry(
        0.03 * treeScale,
        0.06 * treeScale,
        branchLength,
        5
      );
      
      const branchMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        shininess: 10
      });
      
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      // Posicionar e rotacionar o galho
      branch.position.y = 1.0 * treeScale;
      branch.position.x = Math.cos(angle) * 0.1 * treeScale;
      branch.position.z = Math.sin(angle) * 0.1 * treeScale;
      
      // Rotacionar para que saia do tronco
      branch.rotation.z = Math.PI / 3;
      branch.rotation.y = angle;
      
      branch.castShadow = true;
      
      treeGroup.add(branch);
      
      // Adicionar folhagem ao galho
      const leafClusterGeometry = new THREE.SphereGeometry(
        0.25 * treeScale,
        8,
        8
      );
      
      // Para maples, usar cor de acento (pode ser vermelho para maple)
      const leafClusterMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.accent),
        shininess: 15
      });
      
      const leafCluster = new THREE.Mesh(leafClusterGeometry, leafClusterMaterial);
      
      // Posicionar no fim do galho
      leafCluster.position.set(
        Math.cos(angle) * branchLength * 0.5 * treeScale,
        1.0 * treeScale + Math.sin(Math.PI / 3) * branchLength * 0.5,
        Math.sin(angle) * branchLength * 0.5 * treeScale
      );
      
      leafCluster.castShadow = true;
      
      treeGroup.add(leafCluster);
    }
  }
  
  /**
   * Adiciona uma copa de carvalho
   */
  private addOakTop(
    treeGroup: THREE.Group,
    treeScale: number, 
    colors: ColorScheme
  ): void {
    // Carvalhos têm copas grandes e irregulares
    const random = new RandomGenerator(Math.random() * 1000);
    
    // Criar vários aglomerados de folhas
    const clusterCount = 8;
    for (let i = 0; i < clusterCount; i++) {
      const angle = (i / clusterCount) * Math.PI * 2;
      const height = (0.9 + random.next() * 0.4) * treeScale;
      const distance = (0.3 + random.next() * 0.4) * treeScale;
      
      const leafClusterGeometry = new THREE.SphereGeometry(
        (0.3 + random.next() * 0.2) * treeScale,
        8,
        8
      );
      
      const leafClusterMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.secondary),
        shininess: 15
      });
      
      const leafCluster = new THREE.Mesh(leafClusterGeometry, leafClusterMaterial);
      
      leafCluster.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      
      // Escala não uniforme para mais irregularidade
      leafCluster.scale.set(
        1.0 + random.next() * 0.2,
        0.8 + random.next() * 0.4,
        1.0 + random.next() * 0.2
      );
      
      leafCluster.castShadow = true;
      
      treeGroup.add(leafCluster);
    }
    
    // Adicionar um cluster central maior
    const centralClusterGeometry = new THREE.SphereGeometry(
      0.5 * treeScale,
      8,
      8
    );
    
    const centralClusterMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      shininess: 15
    });
    
    const centralCluster = new THREE.Mesh(centralClusterGeometry, centralClusterMaterial);
    centralCluster.position.y = 1.3 * treeScale;
    centralCluster.castShadow = true;
    
    treeGroup.add(centralCluster);
  }
  
  /**
   * Cria um grupo de árvores
   * @param count Número de árvores
   * @param radius Raio da área para posicionar
   * @param fusionLevel Nível de fusão para determinar variedade
   * @param colors Esquema de cores
   */
  public createTreeGroup(
    count: number,
    radius: number,
    fusionLevel: number,
    colors: ColorScheme
  ): THREE.Group {
    const treeGroupContainer = new THREE.Group();
    const random = new RandomGenerator(Math.random() * 10000);
    
    const treeTypes = ['leafy', 'conifer', 'oak'];
    // Adicionar mais variedade para níveis mais altos
    if (fusionLevel >= 2) {
      treeTypes.push('maple');
    }
    if (fusionLevel >= 3) {
      treeTypes.push('palm');
    }
    
    for (let i = 0; i < count; i++) {
      // Posição aleatória dentro do raio
      const angle = random.next() * Math.PI * 2;
      const distance = Math.sqrt(random.next()) * radius; // Raiz quadrada para distribuição mais uniforme
      
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Tipo de árvore aleatório
      const treeType = treeTypes[Math.floor(random.next() * treeTypes.length)];
      const treeScale = 0.3 + random.next() * 0.4;
      
      const tree = this.createTree(treeScale, treeType, colors);
      tree.position.set(x, 0, z);
      
      // Rotação aleatória
      tree.rotation.y = random.next() * Math.PI * 2;
      
      treeGroupContainer.add(tree);
    }
    
    // Adicionar alguns arbustos
    if (fusionLevel > 0) {
      const bushCount = Math.floor(count / 3);
      
      for (let i = 0; i < bushCount; i++) {
        const angle = random.next() * Math.PI * 2;
        const distance = Math.sqrt(random.next()) * radius;
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        const bushScale = 0.2 + random.next() * 0.2;
        
        const bushGeometry = new THREE.SphereGeometry(
          bushScale,
          8,
          8
        );
        
        const bushMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.secondary),
          shininess: 10
        });
        
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.set(x, bushScale, z);
        
        // Escala não uniforme para mais naturalidade
        bush.scale.set(
          1.0 + random.next() * 0.3,
          0.7 + random.next() * 0.3,
          1.0 + random.next() * 0.3
        );
        
        bush.castShadow = true;
        bush.receiveShadow = true;
        
        treeGroupContainer.add(bush);
      }
    }
    
    return treeGroupContainer;
  }
  
  /**
   * Cria um bosque de árvores com base e características específicas
   * @param size Tamanho do bosque
   * @param fusionLevel Nível de fusão
   * @param colors Esquema de cores
   * @param includeLake Adicionar lago no centro
   */
  public createForestGrove(
    size: number,
    fusionLevel: number,
    colors: ColorScheme,
    includeLake: boolean = false
  ): THREE.Group {
    const groveGroup = new THREE.Group();
    const random = new RandomGenerator(Math.random() * 10000);
    
    // Base do bosque
    const baseGeometry = new THREE.CircleGeometry(size, 24);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x228B22, // Verde floresta para o chão
      shininess: 5
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.01;
    base.receiveShadow = true;
    
    groveGroup.add(base);
    
    // Adicionar lago opcional
    if (includeLake) {
      const lakeGeometry = new THREE.CircleGeometry(size * 0.3, 24);
      const lakeMaterial = new THREE.MeshPhongMaterial({
        color: 0x4682B4, // Azul
        transparent: true,
        opacity: 0.8,
        shininess: 80
      });
      
      const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
      lake.rotation.x = -Math.PI / 2;
      lake.position.y = 0.05;
      
      groveGroup.add(lake);
      
      // Margem do lago
      const shoreGeometry = new THREE.RingGeometry(size * 0.3, size * 0.35, 24);
      const shoreMaterial = new THREE.MeshPhongMaterial({
        color: 0xD2B48C, // Marrom areia
        shininess: 10
      });
      
      const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
      shore.rotation.x = -Math.PI / 2;
      shore.position.y = 0.03;
      
      groveGroup.add(shore);
    }
    
    // Calcular número de árvores com base no tamanho e nível
    const treeCount = Math.floor(size * 3) + fusionLevel * 3;
    
    // Criar árvores em círculo, evitando o centro se houver lago
    const innerRadius = includeLake ? size * 0.4 : 0;
    const outerRadius = size * 0.9;
    
    // Adicionar árvores
    const trees = this.createTreeGroup(treeCount, outerRadius, fusionLevel, colors);
    
    // Se tiver lago, remover árvores que estejam no lago
    if (includeLake) {
      trees.children.forEach(child => {
        const distanceFromCenter = Math.sqrt(
          child.position.x * child.position.x + 
          child.position.z * child.position.z
        );
        
        if (distanceFromCenter < innerRadius) {
          child.visible = false;
        }
      });
    }
    
    groveGroup.add(trees);
    
    // Adicionar pedras, troncos caídos ou outros detalhes para níveis mais altos
    if (fusionLevel > 1) {
      const detailCount = fusionLevel * 2;
      
      for (let i = 0; i < detailCount; i++) {
        // Posição aleatória
        const angle = random.next() * Math.PI * 2;
        const distance = innerRadius + random.next() * (outerRadius - innerRadius);
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        // Alternar entre pedras e troncos
        if (i % 2 === 0) {
          // Pedra
          const rockSize = 0.2 + random.next() * 0.2;
          const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
          
          const rockMaterial = new THREE.MeshPhongMaterial({
            color: 0x777777, // Cinza
            shininess: 20,
            flatShading: true
          });
          
          const rock = new THREE.Mesh(rockGeometry, rockMaterial);
          rock.position.set(x, rockSize, z);
          
          // Rotação aleatória
          rock.rotation.set(
            random.next() * Math.PI,
            random.next() * Math.PI,
            random.next() * Math.PI
          );
          
          rock.castShadow = true;
          rock.receiveShadow = true;
          
          groveGroup.add(rock);
        } else {
          // Tronco caído
          const logLength = 0.5 + random.next() * 0.5;
          const logRadius = 0.1;
          
          const logGeometry = new THREE.CylinderGeometry(
            logRadius,
            logRadius,
            logLength,
            8
          );
          
          const logMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513, // Marrom
            shininess: 5
          });
          
          const log = new THREE.Mesh(logGeometry, logMaterial);
          log.position.set(x, logRadius, z);
          
          // Deitar o tronco
          log.rotation.x = Math.PI / 2;
          log.rotation.z = random.next() * Math.PI;
          
          log.castShadow = true;
          log.receiveShadow = true;
          
          groveGroup.add(log);
        }
      }
    }
    
    return groveGroup;
  }
}
