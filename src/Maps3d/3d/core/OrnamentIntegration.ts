// src/Maps3d/3d/core/OrnamentIntegration.ts (ajustado para posicionamento correto)
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
    // Analisar a geometria do território para corrigir posicionamento
    // Primeiro, encontrar o objeto que contém a geometria do território
    const territoryMesh = this.findTerrainMesh(territoryObject);
    
    if (!territoryMesh) {
      console.warn("Não foi possível encontrar o mesh do território para", territory.id);
      return; // Não podemos adicionar ornamentos sem encontrar o mesh
    }
    
    // Obter a altura do terreno e a sua bounding box
    const boundingBox = new THREE.Box3().setFromObject(territoryMesh);
    const terrainHeight = boundingBox.max.y;
    console.log(`Território ${territory.id} tem altura máxima de ${terrainHeight}`);
    
    // Criar um grupo separado para ornamentos ao lado do território em vez de dentro dele
    const ornamentsGroup = new THREE.Group();
    ornamentsGroup.name = `ornaments-${territory.id}`;
    
    // Posicionar o grupo de ornamentos adjacente ao território, não dentro dele
    const territoryRadius = territory.size;
    ornamentsGroup.position.set(
      territoryObject.position.x + territoryRadius * 1.2,
      0, // Começar no nível do chão
      territoryObject.position.z + territoryRadius * 0.5
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
    
    // Adicionar ornamentos ao grupo separado
    this.ornamentFactory.addOrnaments(
      ornamentsGroup,
      ornaments,
      activityData,
      territory,
      colors
    );
    
    // Para florestas, adicionar árvores extras
    if (territory.type === 'forest') {
      this.addExtraTreesToForest(ornamentsGroup, territory, colors);
    }
    
    // Adicionar o grupo de ornamentos ao lado do território
    const parentObject = territoryObject.parent || territoryObject;
    parentObject.add(ornamentsGroup);
  }

  /**
   * Encontra o mesh que contém o terreno do território
   */
  private findTerrainMesh(territoryObject: THREE.Object3D): THREE.Mesh | null {
    // Função recursiva para procurar mesh com geometria no objeto e seus filhos
    const findMesh = (object: THREE.Object3D): THREE.Mesh | null => {
      if (object instanceof THREE.Mesh) {
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
    colors: any
  ): void {
    const random = new RandomGenerator(territory.visualSeed + 500);
    
    // Criar um bosque
    const grove = this.treeGenerator.createForestGrove(
      territory.size * 0.4,
      territory.fusionLevel,
      colors,
      territory.fusionLevel > 1 // Incluir lago para níveis mais altos
    );
    
    // Posicionar o bosque (deslocado do território)
    grove.position.set(
      territory.size * 0.3, // Deslocado para o lado
      0, // Na altura base
      territory.size * 0.2 // Um pouco para frente
    );
    
    ornamentsGroup.add(grove);
  }
  
  /**
   * Gera uma configuração de ornamentos com base no tipo de território e nível de fusão
   */
  private generateOrnamentConfig(territory: Territory): any {
    const random = new RandomGenerator(territory.visualSeed);
    
    // Base mínima de ornamentos para qualquer território
    let baseOrnaments = {
      buildingCount: 1,
      treasureCount: 0,
      pathCount: 1,
      mountainCount: 0,
      treeCount: 3, // Valor mínimo de árvores
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
        baseOrnaments.treeCount += 2;
        break;
      case 'peninsula':
        baseOrnaments.buildingCount = 2;
        baseOrnaments.pathCount = 1;
        baseOrnaments.treeCount += 1;
        break;
      case 'mountains':
        baseOrnaments.mountainCount = 2 + Math.floor(random.next() * 2);
        baseOrnaments.buildingCount = 1;
        baseOrnaments.treeCount += 3;
        break;
      case 'archipelago':
        baseOrnaments.treasureCount = 1;
        baseOrnaments.buildingCount = 1;
        baseOrnaments.treeCount += 2;
        break;
      case 'desert':
        baseOrnaments.buildingCount = 1;
        baseOrnaments.mountainCount = 1;
        baseOrnaments.treeCount = 1; // Menos árvores no deserto
        break;
      case 'forest':
        baseOrnaments.treeCount = 7 + Math.floor(random.next() * 5); // Muito mais árvores na floresta
        baseOrnaments.buildingCount = 1;
        break;
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
    
    return baseOrnaments;
  }
  
  /**
   * Gera uma estrutura especial para territórios de nível alto
   */
  private generateSpecialStructure(territory: Territory, random: RandomGenerator): any {
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
}