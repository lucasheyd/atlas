// src/Maps3d/3d/ornaments/OrnamentFactory.ts (Versão aprimorada)
import * as THREE from 'three';
import { BuildingGenerator } from './BuildingGenerator';
import { TreasureGenerator } from './TreasureGenerator';
import { PathGenerator } from './PathGenerator';
import { TerrainFeatures } from './TerrainFeatures';
import { Ornaments } from '../../types/Ornament';
import { Territory } from '../../types/Territory';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';

export class OrnamentFactory {
  private buildingGenerator: BuildingGenerator;
  private treasureGenerator: TreasureGenerator;
  private pathGenerator: PathGenerator;
  private terrainFeatures: TerrainFeatures;
  
  constructor() {
    this.buildingGenerator = new BuildingGenerator();
    this.treasureGenerator = new TreasureGenerator();
    this.pathGenerator = new PathGenerator();
    this.terrainFeatures = new TerrainFeatures();
  }
  
  /**
   * Adiciona ornamentos a um território com base nos dados
   */
  public addOrnaments(
    territoryGroup: THREE.Group,
    ornaments: Ornaments,
    activity: any,
    territory: Territory,
    colors: ColorScheme
  ): void {
    // Garantir que ornaments não é null ou undefined
    if (!ornaments) {
      console.warn('Ornaments configuration is missing for territory:', territory.id);
      ornaments = this.getDefaultOrnaments(territory);
    }
    
    // Garantir que activity não é null ou undefined
    if (!activity) {
      console.warn('Activity data is missing for territory:', territory.id);
      activity = this.getDefaultActivity(territory);
    }
    
    // Criar um grupo para cada tipo de ornamento para organizá-los
    const buildingsGroup = new THREE.Group();
    buildingsGroup.name = "buildings";
    
    const treesGroup = new THREE.Group();
    treesGroup.name = "trees";
    
    const featuresGroup = new THREE.Group();
    featuresGroup.name = "features";
    
    const treasuresGroup = new THREE.Group();
    treasuresGroup.name = "treasures";
    
    const pathsGroup = new THREE.Group();
    pathsGroup.name = "paths";
    
    const specialGroup = new THREE.Group();
    specialGroup.name = "special";
    
    // Adicionar os grupos ao grupo principal
    territoryGroup.add(buildingsGroup);
    territoryGroup.add(treesGroup);
    territoryGroup.add(featuresGroup);
    territoryGroup.add(treasuresGroup);
    territoryGroup.add(pathsGroup);
    territoryGroup.add(specialGroup);
    
    // Adicionar árvores
    this.addTrees(
      treesGroup,
      ornaments.treeCount || 0,
      territory,
      colors
    );
    
    // Adicionar edifícios
    this.addBuildings(
      buildingsGroup,
      ornaments.buildingCount || 0,
      activity.balance,
      territory,
      colors
    );
    
    // Adicionar tesouros
    this.addTreasures(
      treasuresGroup,
      ornaments.treasureCount || 0,
      activity.nftCount,
      territory,
      colors
    );
    
    // Adicionar caminhos
    this.addPaths(
      pathsGroup,
      ornaments.pathCount || 0,
      activity.transactions,
      territory,
      colors
    );
    
    // Adicionar características de terreno
    this.addTerrainFeatures(
      featuresGroup,
      ornaments.mountainCount || 0,
      activity.stakedAmount,
      territory,
      colors
    );
    
    // Adicionar estruturas especiais
    if (ornaments.specialStructures && ornaments.specialStructures !== "[]") {
      this.addSpecialStructures(
        specialGroup,
        ornaments.specialStructures,
        territory,
        colors
      );
    }
  }
  
  /**
   * Retorna configuração de ornamentos padrão
   */
  private getDefaultOrnaments(territory: Territory): Ornaments {
    const random = new RandomGenerator(territory.visualSeed);
    
    // Criar configuração baseada no tipo de território
    const base = {
      buildingCount: 1 + Math.floor(random.next() * 2),
      treasureCount: Math.floor(random.next() * 2),
      pathCount: 1,
      mountainCount: Math.floor(random.next() * 2),
      treeCount: 3 + Math.floor(random.next() * 3),
      specialStructures: "[]",
      animations: "[]"
    };
    
    // Adicionar mais elementos baseado no tipo
    if (territory.type === 'forest') {
      base.treeCount += 5;
    } else if (territory.type === 'mountains') {
      base.mountainCount += 3;
      base.treeCount += 2;
    }
    
    return base;
  }
  
  /**
   * Retorna dados de atividade padrão
   */
  private getDefaultActivity(territory: Territory): any {
    return {
      balance: 1.0,
      nftCount: 5,
      transactions: 20,
      stakedAmount: 0.5,
      lastUpdate: Math.floor(Date.now() / 1000)
    };
  }
  
  /**
   * Adiciona edifícios ao território
   */
  private addBuildings(
    buildingsGroup: THREE.Group,
    count: number,
    balance: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    if (count <= 0) return;
    
    const random = new RandomGenerator(territory.visualSeed + 1);
    
    // Distribuir edifícios na borda do território
    const baseRadius = territory.size * 1.1; // Posicionar logo fora da borda do território
    
    for (let i = 0; i < count; i++) {
      // Determinar nível de edifício com base no saldo e fusão
      const buildingLevel = Math.min(5, Math.floor(Math.log10(balance + 1) * 2) + territory.fusionLevel);
      
      // Criar edifício
      const building = this.buildingGenerator.createBuilding(
        buildingLevel,
        territory.fusionLevel,
        colors
      );
      
      // Ângulo para posicionamento radial
      const angle = (i / count) * Math.PI * 2;
      // Pequena variação no raio para evitar uniformidade perfeita
      const radius = baseRadius + (random.next() * 0.2 * territory.size);
      
      // Posicionar na borda do território
      building.position.set(
        Math.cos(angle) * radius,
        0, // Iniciar na altura base
        Math.sin(angle) * radius
      );
      
      // Rotacionar para que o edifício "olhe" para o centro do território
      building.lookAt(new THREE.Vector3(0, 0, 0));
      // Adicionar pequena rotação aleatória para variação
      building.rotation.y += (random.next() - 0.5) * Math.PI / 6;
      
      // Ajustar altura para ficar na superfície
      this.adjustHeightToSurface(building, territory);
      
      buildingsGroup.add(building);
    }
  }
  
  /**
   * Adiciona tesouros ao território
   */
  private addTreasures(
    treasuresGroup: THREE.Group,
    count: number,
    nftCount: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    if (count <= 0) return;
    
    const random = new RandomGenerator(territory.visualSeed + 2);
    
    // Misturar os tesouros entre interior e exterior do território
    for (let i = 0; i < count; i++) {
      // Determinar tamanho do tesouro com base no número de NFTs
      const treasureSize = 0.5 + Math.min(1.5, Math.log10(nftCount + 1) * 0.5);
      
      // Criar tesouro
      const treasure = this.treasureGenerator.createTreasure(
        treasureSize,
        territory.fusionLevel,
        colors
      );
      
      // Alguns tesouros dentro, outros fora do território
      const isInside = random.next() > 0.5;
      const radius = isInside 
        ? territory.size * 0.5 * random.next() // Dentro: em qualquer lugar
        : territory.size * (1.1 + random.next() * 0.3); // Fora: na borda exterior
      
      const angle = random.next() * Math.PI * 2;
      
      treasure.position.set(
        Math.cos(angle) * radius,
        0, // Iniciar na altura base
        Math.sin(angle) * radius
      );
      
      // Ajustar altura para ficar na superfície
      this.adjustHeightToSurface(treasure, territory);
      
      // Adicionar pequena elevação para tesouros ficarem visíveis
      treasure.position.y += 0.05;
      
      treasuresGroup.add(treasure);
    }
  }
  
  /**
   * Adiciona caminhos ao território
   */
  private addPaths(
    pathsGroup: THREE.Group,
    count: number,
    transactions: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    if (count <= 0) return;
    
    // Criar caminhos que conectam o centro aos pontos na borda ou entre pontos na borda
    const centerPoint = new THREE.Vector3(0, 0.1, 0);
    const random = new RandomGenerator(territory.visualSeed + 5);
    
    for (let i = 0; i < count; i++) {
      // Determinar largura do caminho com base no número de transações
      const pathWidth = 0.2 + Math.min(0.8, Math.log10(transactions + 1) * 0.2);
      
      // Alternativa entre caminhos radiais (centro-borda) e caminhos circulares (borda-borda)
      if (i % 2 === 0 || count === 1) {
        // Caminho radial (centro para borda)
        const angle = (i / count) * Math.PI * 2;
        const radius = territory.size * 0.9; // Até quase a borda
        
        const endPoint = new THREE.Vector3(
          Math.cos(angle) * radius,
          0.1, // Ligeiramente acima da base
          Math.sin(angle) * radius
        );
        
        // Ajustar altura do ponto final para seguir a superfície do terreno
        this.adjustPointHeightToSurface(endPoint, territory);
        
        // Criar caminho
        const path = this.pathGenerator.createPath(
          centerPoint,
          endPoint,
          pathWidth,
          colors
        );
        
        pathsGroup.add(path);
      } else {
        // Caminho circular (conectando pontos na borda)
        const angle1 = ((i-1) / count) * Math.PI * 2;
        const angle2 = (i / count) * Math.PI * 2;
        const radius = territory.size * 0.7; // Um pouco dentro da borda
        
        const startPoint = new THREE.Vector3(
          Math.cos(angle1) * radius,
          0.1, // Ligeiramente acima da base
          Math.sin(angle1) * radius
        );
        
        const endPoint = new THREE.Vector3(
          Math.cos(angle2) * radius,
          0.1, // Ligeiramente acima da base
          Math.sin(angle2) * radius
        );
        
        // Ajustar altura para seguir a superfície do terreno
        this.adjustPointHeightToSurface(startPoint, territory);
        this.adjustPointHeightToSurface(endPoint, territory);
        
        // Criar caminho
        const path = this.pathGenerator.createPath(
          startPoint,
          endPoint,
          pathWidth,
          colors
        );
        
        pathsGroup.add(path);
      }
    }
  }
  
  /**
   * Adiciona árvores ao território
   */
  private addTrees(
    treesGroup: THREE.Group,
    count: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    if (count <= 0) return;
    
    const random = new RandomGenerator(territory.visualSeed + 3);
    
    // Distribuir árvores em diferentes anéis ao redor e dentro do território
    const innerTree = Math.floor(count * 0.3); // 30% das árvores dentro do território
    const innerRadius = territory.size * 0.8;
    
    const middleTree = Math.floor(count * 0.4); // 40% das árvores na borda
    const middleInnerRadius = territory.size * 0.9;
    const middleOuterRadius = territory.size * 1.1;
    
    const outerTree = count - innerTree - middleTree; // 30% das árvores na área externa
    const outerInnerRadius = territory.size * 1.2;
    const outerOuterRadius = territory.size * 1.8;
    
    // Função para criar e posicionar árvore com raio específico
    const createAndPositionTree = (radius: number) => {
      const treeGroup = new THREE.Group();
      const treeScale = 0.3 + random.next() * 0.4;
      const treeType = random.next() > 0.5 ? 0 : 1;
      
      // Tronco
      const trunkGeometry = new THREE.CylinderGeometry(
        0.1 * treeScale,
        0.15 * treeScale,
        1 * treeScale,
        8
      );
      
      const trunkMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        shininess: 20
      });
      
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.5 * treeScale;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      
      treeGroup.add(trunk);
      
      // Copa da árvore
      let treeTop;
      if (treeType === 0) {
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
        
        treeTop = new THREE.Mesh(topGeometry, topMaterial);
        treeTop.position.y = (1 + 0.75) * treeScale;
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
        
        treeTop = new THREE.Mesh(topGeometry, topMaterial);
        treeTop.position.y = (1 + 0.6) * treeScale;
      }
      
      treeTop.castShadow = true;
      treeGroup.add(treeTop);
      
      // Posição da árvore
      const angle = random.next() * Math.PI * 2;
      treeGroup.position.set(
        Math.cos(angle) * radius,
        0, // Será ajustado para a superfície
        Math.sin(angle) * radius
      );
      
      // Ajustar altura para ficar na superfície
      this.adjustHeightToSurface(treeGroup, territory);
      
      // Pequena rotação aleatória
      treeGroup.rotation.y = random.next() * Math.PI * 2;
      
      return treeGroup;
    };
    
    // Adicionar árvores internas
    for (let i = 0; i < innerTree; i++) {
      const radius = random.next() * innerRadius;
      const tree = createAndPositionTree(radius);
      treesGroup.add(tree);
    }
    
    // Adicionar árvores na borda
    for (let i = 0; i < middleTree; i++) {
      const radius = middleInnerRadius + random.next() * (middleOuterRadius - middleInnerRadius);
      const tree = createAndPositionTree(radius);
      treesGroup.add(tree);
    }
    
    // Adicionar árvores externas
    for (let i = 0; i < outerTree; i++) {
      const radius = outerInnerRadius + random.next() * (outerOuterRadius - outerInnerRadius);
      const tree = createAndPositionTree(radius);
      treesGroup.add(tree);
    }
  }
  
  /**
   * Adiciona características de terreno
   */
  private addTerrainFeatures(
    featuresGroup: THREE.Group,
    count: number,
    stakedAmount: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    if (count <= 0) return;
    
    const random = new RandomGenerator(territory.visualSeed + 4);
    
    // Distribuir características de terreno em duas áreas: dentro e fora do território
    const innerFeatures = Math.ceil(count / 2); // Metade dentro
    const outerFeatures = count - innerFeatures; // Metade fora
    
    // Função para criar e posicionar característica
    const createAndPositionFeature = (isInside: boolean, index: number, totalCount: number) => {
      // Determinar tamanho da característica com base no valor em staking
      const featureSize = 0.5 + Math.min(2.0, Math.log10(stakedAmount + 1) * 0.5);
      
      // Tipos de características (pequenas montanhas, lagos, etc.)
      const featureTypes = ['mountain', 'lake', 'rock', 'hill'];
      const featureType = featureTypes[index % featureTypes.length];
      
      // Criar característica
      const feature = this.terrainFeatures.createFeature(
        featureType,
        featureSize,
        territory.fusionLevel,
        colors
      );
      
      // Determinar posição
      let radius, angle;
      
      if (isInside) {
        // Distribuir uniformemente dentro do território
        angle = (index / totalCount) * Math.PI * 2;
        radius = (0.3 + random.next() * 0.5) * territory.size;
      } else {
        // Distribuir uniformemente fora do território
        angle = ((index + 0.5) / totalCount) * Math.PI * 2; // Offset para não alinhar com features internas
        radius = (1.2 + random.next() * 0.4) * territory.size;
      }
      
      feature.position.set(
        Math.cos(angle) * radius,
        0, // Será ajustado para a superfície
        Math.sin(angle) * radius
      );
      
      // Ajustar altura para ficar na superfície
      this.adjustHeightToSurface(feature, territory);
      
      // Para lagos e outras características planas, afundar ligeiramente no terreno
      if (featureType === 'lake') {
        feature.position.y -= 0.1;
      }
      
      // Pequena rotação aleatória para variação
      feature.rotation.y = random.next() * Math.PI * 2;
      
      return feature;
    };
    
    // Adicionar características internas
    for (let i = 0; i < innerFeatures; i++) {
      const feature = createAndPositionFeature(true, i, innerFeatures);
      featuresGroup.add(feature);
    }
    
    // Adicionar características externas
    for (let i = 0; i < outerFeatures; i++) {
      const feature = createAndPositionFeature(false, i, outerFeatures);
      featuresGroup.add(feature);
    }
  }
  
  /**
   * Adiciona estruturas especiais (interpretando JSON)
   */
  private addSpecialStructures(
    specialGroup: THREE.Group,
    specialStructuresJson: string,
    territory: Territory,
    colors: ColorScheme
  ): void {
    try {
      const specialStructures = JSON.parse(specialStructuresJson);
      const random = new RandomGenerator(territory.visualSeed + 6);
      
      // As estruturas especiais serão colocadas em locais de destaque
      specialStructures.forEach((structure: any, index: number) => {
        let specialObject: THREE.Object3D | null = null;
        
        // Interpretar tipo de estrutura
        switch (structure.type) {
          case 'tower':
            specialObject = this.buildingGenerator.createTower(
              structure.height || 3,
              structure.width || 1,
              colors
            );
            break;
            
          case 'monument':
            specialObject = this.buildingGenerator.createMonument(
              structure.height || 4,
              structure.style || 'obelisk',
              colors
            );
            break;
            
          case 'bridge':
            // Para pontes, precisamos conectar pontos específicos
            // Escolher pontos para a ponte
            const angle1 = (index / specialStructures.length) * Math.PI * 2;
            const angle2 = angle1 + Math.PI / 4; // 45 graus de diferença
            
            const radius = territory.size * 0.7;
            
            const start = new THREE.Vector3(
              Math.cos(angle1) * radius,
              0.5, 
              Math.sin(angle1) * radius
            );
            
            const end = new THREE.Vector3(
              Math.cos(angle2) * radius, 
              0.5, 
              Math.sin(angle2) * radius
            );
            
            // Ajustar alturas dos pontos da ponte para a superfície
            this.adjustPointHeightToSurface(start, territory);
            this.adjustPointHeightToSurface(end, territory);
            
            // Elevar ligeiramente para ficar acima do terreno
            start.y += 0.2;
            end.y += 0.2;
            
            specialObject = this.pathGenerator.createBridge(
              start,
              end,
              structure.width || 1,
              colors
            );
            break;
        }
        
        if (specialObject) {
          // Posicionar estruturas especiais conforme especificação ou em locais específicos
          if (structure.position && structure.type !== 'bridge') { // Pontes já estão posicionadas
            specialObject.position.set(
              structure.position.x || 0,
              0, // Altura base, será ajustada
              structure.position.z || 0
            );
          } else if (structure.type !== 'bridge') {
            // Posicionar em locais importantes ao redor do território
            const angle = (index / specialStructures.length) * Math.PI * 2;
            const radius = territory.size * 1.5; // Mais distante que os outros elementos
            
            specialObject.position.set(
              Math.cos(angle) * radius,
              0, // Altura base, será ajustada
              Math.sin(angle) * radius
            );
            
            // Rotacionar para olhar para o território
            specialObject.lookAt(new THREE.Vector3(0, specialObject.position.y, 0));
          }
          
          // Se não for ponte, ajustar altura para a superfície
          if (structure.type !== 'bridge') {
            this.adjustHeightToSurface(specialObject, territory);
          }
          
          specialGroup.add(specialObject);
        }
      });
    } catch (error) {
      console.error('Error parsing special structures:', error);
    }
  }
  
  /**
   * Ajusta a altura de um objeto para ficar na superfície do território
   */
  private adjustHeightToSurface(object: THREE.Object3D, territory: Territory): void {
    // Obter coordenadas no plano XZ
    const x = object.position.x;
    const z = object.position.z;
    
    // Calcular altura para o ponto atual
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    const normalizedDistance = distanceFromCenter / territory.size;
    
    // Ajustar altura baseada no território
    // Esta é uma função simples que pode ser substituída por algo mais complexo
    // como ray casting ou consulta à geometria do território
    let height = 0;
    
    // Ajuste para diferentes tipos de território
    if (territory.type === 'mountains') {
      // Terreno montanhoso tem elevação gradual do centro para fora
      if (normalizedDistance < 0.7) {
        height = Math.pow(normalizedDistance, 2) * 2;
      } else {
        height = Math.pow(normalizedDistance - 0.7, 2) * -3 + 0.98;
      }
    } else if (territory.type === 'forest') {
      // Terreno florestal tem colinas suaves
      height = Math.sin(normalizedDistance * Math.PI) * 0.3;
    } else if (territory.type === 'plains') {
      // Planícies são quase planas
      height = Math.sin(normalizedDistance * Math.PI * 2) * 0.1;
    } else {
      // Território padrão tem uma elevação suave
      height = (1 - Math.pow(normalizedDistance, 2)) * 0.5;
    }
    
    // Ajustar altura do objeto
    object.position.y = height;
  }
  
  /**
   * Ajusta a altura de um ponto para ficar na superfície do território
   */
  private adjustPointHeightToSurface(point: THREE.Vector3, territory: Territory): void {
    // Obter coordenadas no plano XZ
    const x = point.x;
    const z = point.z;
    
    // Calcular altura para o ponto atual
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    const normalizedDistance = distanceFromCenter / territory.size;
    
    // Ajustar altura baseada no território
    let height = 0;
    
    // Ajuste para diferentes tipos de território (mesmo algoritmo do método acima)
    if (territory.type === 'mountains') {
      if (normalizedDistance < 0.7) {
        height = Math.pow(normalizedDistance, 2) * 2;
      } else {
        height = Math.pow(normalizedDistance - 0.7, 2) * -3 + 0.98;
      }
    } else if (territory.type === 'forest') {
      height = Math.sin(normalizedDistance * Math.PI) * 0.3;
    } else if (territory.type === 'plains') {
      height = Math.sin(normalizedDistance * Math.PI * 2) * 0.1;
    } else {
      height = (1 - Math.pow(normalizedDistance, 2)) * 0.5;
    }
    
    // Ajustar altura do ponto
    point.y = height;
  }
}