// src/Maps3d/3d/core/OrnamentIntegration.ts
import * as THREE from 'three';
import { Territory } from '../../types/Territory';
import { OrnamentFactory } from '../ornaments/OrnamentFactory';
import { TreeGenerator } from '../ornaments/TreeGenerator';
import { RandomGenerator } from '../../utils/RandomGenerator';
import { ColorGenetics } from '../../utils/ColorGenetics';

/**
 * Classe para integração direta de ornamentos com o SceneManager
 * Garante que ornamentos sejam adicionados a territórios mesmo se o TerritoryFactory não os chamar
 */
export class OrnamentIntegration {
  private ornamentFactory: OrnamentFactory;
  private treeGenerator: TreeGenerator;
  
  constructor() {
    this.ornamentFactory = new OrnamentFactory();
    this.treeGenerator = new TreeGenerator();
  }
  
  /**
   * Adiciona ornamentos a um território já renderizado
   * @param territoryObject Objeto 3D do território
   * @param territory Dados do território
   */
  public addOrnamentsToTerritory(territoryObject: THREE.Object3D, territory: Territory): void {
    // Analisar o território para determinar sua forma e tamanho
    const territoryBounds = this.analyzeTerritoryBounds(territoryObject);
    
    // Avaliar a superfície para evitar colocação em áreas inadequadas
    const surfaceInfo = this.evaluateTerritorySurface(territoryObject, territoryBounds);
    
    // Criar um grupo separado para ornamentos
    const ornamentsGroup = new THREE.Group();
    ornamentsGroup.name = `ornaments-${territory.id}`;
    
    // Posicionar o grupo de ornamentos no mesmo local do território, mas com y=0
    ornamentsGroup.position.set(
      territoryObject.position.x,
      0, // Começar no nível do chão
      territoryObject.position.z
    );
    
    // Gerar cores consistentes
    const colors = ColorGenetics.generateColorScheme(
      territory.visualSeed,
      territory.fusionLevel,
      territory.colorPalette
    );
    
    // Gerar configuração de ornamentos
    const ornaments = this.generateOrnamentConfig(territory);
    
    // Gerar dados de atividade simulados
    const activityData = this.generateSimulatedActivity(territory);
    
    console.log(`Adicionando ornamentos para ${territory.id} (nível ${territory.fusionLevel}):`, 
      ornaments.buildingCount, "edifícios,", 
      ornaments.treeCount, "árvores");
    
    // Adicionar ornamentos usando o OrnamentFactory
    this.ornamentFactory.addOrnaments(
      ornamentsGroup,
      ornaments,
      activityData,
      territory,
      colors
    );
    
    // Para florestas, adicionar árvores extras nas áreas adequadas
    if (territory.type === 'forest') {
      this.addExtraTreesToForest(ornamentsGroup, territory, colors, surfaceInfo);
    }
    
    // Para montanhas, adicionar características específicas
    if (territory.type === 'mountains') {
      this.addMountainFeatures(ornamentsGroup, territory, colors, surfaceInfo);
    }
    
    // Adicionar o grupo de ornamentos ao lado do território
    const parentObject = territoryObject.parent || territoryObject;
    parentObject.add(ornamentsGroup);
  }
  
  /**
   * Analisa os limites do território para entender sua forma
   */
  private analyzeTerritoryBounds(territoryObject: THREE.Object3D): THREE.Box3 {
    // Calcular a caixa delimitadora do território
    const bounds = new THREE.Box3().setFromObject(territoryObject);
    
    // Log para debug
    console.log(`Limites do território: min=${bounds.min.toArray()}, max=${bounds.max.toArray()}`);
    console.log(`Dimensões: ${bounds.max.x - bounds.min.x} x ${bounds.max.y - bounds.min.y} x ${bounds.max.z - bounds.min.z}`);
    
    return bounds;
  }
  
  /**
   * Avalia a superfície do território para encontrar áreas planas, inclinações, etc.
   */
  private evaluateTerritorySurface(territoryObject: THREE.Object3D, bounds: THREE.Box3): any {
    // Aqui buscamos analisar a superfície para determinar onde é seguro colocar ornamentos
    
    // Encontrar o mesh que contém a geometria do terreno
    const terrainMesh = this.findTerrainMesh(territoryObject);
    
    if (!terrainMesh) {
      console.warn("Não foi possível encontrar o mesh do território");
      
      // Retornar informações básicas baseadas apenas no boundingBox
      return {
        centerHeight: bounds.max.y,
        maxHeight: bounds.max.y,
        minHeight: bounds.min.y,
        safeRadius: (bounds.max.x - bounds.min.x) * 0.8, // 80% do raio é "seguro"
        slopeMap: null // Não temos mapa de inclinação
      };
    }
    
    // Analisar a geometria para detectar inclinações
    const geometry = terrainMesh.geometry;
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    // Determinar a altura central aproximada
    const centerHeight = (bounds.max.y + bounds.min.y) / 2;
    
    // Estimar um raio "seguro" onde objetos não cairão para fora do território
    // Por padrão, 80% do tamanho do território
    const safeRadius = Math.min(
      bounds.max.x - bounds.min.x,
      bounds.max.z - bounds.min.z
    ) * 0.4;
    
    return {
      centerHeight,
      maxHeight: bounds.max.y,
      minHeight: bounds.min.y,
      safeRadius,
      // Outros dados que possam ser úteis
      terrainMesh
    };
  }
  
  /**
   * Encontra o mesh que contém o terreno do território
   */
  private findTerrainMesh(territoryObject: THREE.Object3D): THREE.Mesh | null {
    // Função recursiva para encontrar o primeiro mesh com geometria
    const findMesh = (object: THREE.Object3D): THREE.Mesh | null => {
      if (object instanceof THREE.Mesh && object.geometry) {
        return object;
      }
      
      for (const child of object.children) {
        const found = findMesh(child);
        if (found) return found;
      }
      
      return null;
    };
    
    return findMesh(territoryObject);
  }
  
  /**
   * Adiciona árvores extras a um território de floresta
   */
  private addExtraTreesToForest(
    ornamentsGroup: THREE.Group,
    territory: Territory,
    colors: any,
    surfaceInfo: any
  ): void {
    const random = new RandomGenerator(territory.visualSeed + 500);
    
    // Criar um bosque denso
    const groveRadius = territory.size * 0.4;
    
    // Para níveis mais altos, adicionar um lago no bosque
    const includeLake = territory.fusionLevel > 1;
    
    // Criar o bosque usando o TreeGenerator
    const grove = this.treeGenerator.createForestGrove(
      groveRadius,
      territory.fusionLevel,
      colors,
      includeLake
    );
    
    // Posicionar o bosque fora do território principal, mas conectado
    // Usar o safeRadius para garantir que não fica muito perto da borda
    const angle = random.next() * Math.PI * 2;
    const distance = territory.size * 1.1; // Distância adequada
    
    grove.position.set(
      Math.cos(angle) * distance,
      0, // Na base
      Math.sin(angle) * distance
    );
    
    ornamentsGroup.add(grove);
    
    // Adicionar caminho conectando o bosque ao território
    this.addConnectingPath(ornamentsGroup, territory, grove.position, colors);
  }
  
  /**
   * Adiciona características específicas a territórios montanhosos
   */
  private addMountainFeatures(
    ornamentsGroup: THREE.Group,
    territory: Territory,
    colors: any,
    surfaceInfo: any
  ): void {
    const random = new RandomGenerator(territory.visualSeed + 600);
    
    // Adicionar um pico de montanha adicional (para níveis mais altos)
    if (territory.fusionLevel >= 2) {
      // Criar um grupo para o pico
      const peakGroup = new THREE.Group();
      
      // Geometria do pico (cone)
      const peakHeight = territory.size * (0.8 + random.next() * 0.6);
      const peakRadius = territory.size * (0.4 + random.next() * 0.3);
      
      const peakGeometry = new THREE.ConeGeometry(
        peakRadius,
        peakHeight,
        8, // Segmentos
        1, // Altura segmentos
        false // Aberto
      );
      
      const peakMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.primary),
        shininess: 20,
        flatShading: true
      });
      
      const peak = new THREE.Mesh(peakGeometry, peakMaterial);
      peak.position.y = peakHeight / 2;
      peak.castShadow = true;
      peak.receiveShadow = true;
      
      peakGroup.add(peak);
      
      // Adicionar neve no topo
      const snowCapGeometry = new THREE.ConeGeometry(
        peakRadius * 0.3,
        peakHeight * 0.2,
        8,
        1,
        false
      );
      
      const snowMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 70
      });
      
      const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
      snowCap.position.y = peakHeight - (peakHeight * 0.1);
      snowCap.castShadow = true;
      
      peakGroup.add(snowCap);
      
      // Posicionar o pico em uma posição adequada
      const angle = random.next() * Math.PI * 2;
      const distance = territory.size * 1.5;
      
      peakGroup.position.set(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );
      
      ornamentsGroup.add(peakGroup);
    }
  }
  
  /**
   * Adiciona um caminho conectando um ponto ao centro do território
   */
  private addConnectingPath(
    ornamentsGroup: THREE.Group,
    territory: Territory,
    targetPosition: THREE.Vector3,
    colors: any
  ): void {
    // Importar o PathGenerator aqui para evitar dependência circular
    const PathGenerator = require('../ornaments/PathGenerator').PathGenerator;
    const pathGenerator = new PathGenerator();
    
    // Criar ponto central e ponto alvo
    const centerPoint = new THREE.Vector3(0, 0.1, 0);
    const endPoint = new THREE.Vector3(
      targetPosition.x,
      0.1, // Ligeiramente acima da base
      targetPosition.z
    );
    
    // Criar caminho
    const path = pathGenerator.createPath(
      centerPoint,
      endPoint,
      0.3, // Largura
      colors
    );
    
    ornamentsGroup.add(path);
  }
  
  /**
   * Gera uma configuração de ornamentos com base no território
   */
  private generateOrnamentConfig(territory: Territory): any {
    const random = new RandomGenerator(territory.visualSeed);
    
    // Base de ornamentos - mesmo para nível 1
    let baseOrnaments = {
      buildingCount: 0,
      treasureCount: 0,
      pathCount: 0,
      mountainCount: 0,
      treeCount: 0,
      specialStructures: "[]",
      animations: "[]"
    };
    
    // Ajustar quantidades com base no tipo de território
    switch (territory.type) {
      case 'mainland':
        baseOrnaments.buildingCount = 3 + Math.floor(random.next() * 2);
        baseOrnaments.pathCount = 2 + Math.floor(random.next() * 2);
        break;
      case 'island':
        baseOrnaments.buildingCount = 1 + Math.floor(random.next() * 2);
        baseOrnaments.treasureCount = 1;
        baseOrnaments.treeCount = 3;
        break;
      case 'peninsula':
        baseOrnaments.buildingCount = 2 + Math.floor(random.next() * 2);
        baseOrnaments.pathCount = 1;
        baseOrnaments.treeCount = 2;
        break;
      case 'mountains':
        baseOrnaments.mountainCount = 2 + Math.floor(random.next() * 2);
        baseOrnaments.buildingCount = 1;
        baseOrnaments.treeCount = 3 + Math.floor(random.next() * 2);
        break;
      case 'archipelago':
        baseOrnaments.treasureCount = 2;
        baseOrnaments.buildingCount = Math.floor(random.next() * 2);
        baseOrnaments.treeCount = 2;
        break;
      case 'desert':
        baseOrnaments.buildingCount = 1;
        baseOrnaments.mountainCount = 1;
        baseOrnaments.treeCount = 1; // Menos árvores no deserto
        break;
      case 'forest':
        baseOrnaments.treeCount = 7 + Math.floor(random.next() * 5); // Muito mais árvores na floresta
        baseOrnaments.buildingCount = 1;
        baseOrnaments.pathCount = 1;
        break;
      default:
        baseOrnaments.buildingCount = 1;
        baseOrnaments.treeCount = 3;
        baseOrnaments.pathCount = 1;
    }
    
    // Aumentar quantidade de ornamentos com base no nível de fusão
    if (territory.fusionLevel > 1) {
      const bonusFactor = territory.fusionLevel - 1;
      baseOrnaments.buildingCount += bonusFactor;
      baseOrnaments.treasureCount += Math.floor(bonusFactor / 2);
      baseOrnaments.pathCount += Math.floor(bonusFactor / 2);
      baseOrnaments.mountainCount += Math.floor(bonusFactor / 2);
      baseOrnaments.treeCount += bonusFactor * 3;
      
      // Adicionar estruturas especiais para níveis mais altos
      if (territory.fusionLevel >= 3) {
        const structure = this.generateSpecialStructure(territory, random);
        baseOrnaments.specialStructures = JSON.stringify([structure]);
      }
    }
    
    // Garantir que os valores não fiquem negativos ou muito altos
    for (const key in baseOrnaments) {
      if (typeof baseOrnaments[key] === 'number') {
        baseOrnaments[key] = Math.max(0, Math.min(15, baseOrnaments[key]));
      }
    }
    
    return baseOrnaments;
  }
  
  /**
   * Gera dados de atividade simulados para ornamentos
   */
  private generateSimulatedActivity(territory: Territory): any {
    const random = new RandomGenerator(territory.visualSeed);
    
    // Gerar valores baseados na semente visual para consistência
    const baseValue = 1 + (territory.fusionLevel * 0.5) + (random.next() * 2);
    
    return {
      balance: baseValue + random.next() * 3,
      nftCount: Math.floor(baseValue * 2 + random.next() * 5),
      transactions: Math.floor(baseValue * 10 + random.next() * 50),
      stakedAmount: baseValue * 0.5 + random.next() * 2,
      lastUpdate: Math.floor(Date.now() / 1000 - random.next() * 86400 * 7)
    };
  }
  
  /**
   * Gera uma estrutura especial para territórios de nível alto
   */
  private generateSpecialStructure(
    territory: Territory,
    random: RandomGenerator
  ): any {
    const structureTypes = ['tower', 'monument', 'bridge'];
    const monumentStyles = ['obelisk', 'statue', 'arch'];
    
    const type = structureTypes[Math.floor(random.next() * structureTypes.length)];
    
    if (type === 'tower') {
      return {
        type: 'tower',
        height: 3 + random.next() * 2,
        width: 1 + random.next() * 0.5,
        position: {
          x: (random.next() - 0.5) * territory.size * 0.6,
          y: 0,
          z: (random.next() - 0.5) * territory.size * 0.6
        }
      };
    } else if (type === 'monument') {
      return {
        type: 'monument',
        height: 4 + random.next() * 2,
        style: monumentStyles[Math.floor(random.next() * monumentStyles.length)],
        position: {
          x: (random.next() - 0.5) * territory.size * 0.4,
          y: 0,
          z: (random.next() - 0.5) * territory.size * 0.4
        }
      };
    } else { // bridge
      const angle = random.next() * Math.PI * 2;
      const distance = territory.size * 0.3;
      return {
        type: 'bridge',
        width: 0.8 + random.next() * 0.4,
        start: {
          x: Math.cos(angle) * distance,
          z: Math.sin(angle) * distance
        },
        end: {
          x: Math.cos(angle + Math.PI) * distance,
          z: Math.sin(angle + Math.PI) * distance
        }
      };
    }
  }
}