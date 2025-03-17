// Atualização do TerritoryFactory.ts para garantir que ornamentos sejam adicionados
// corretamente para todos os níveis de fusão

import * as THREE from 'three';
import { MainlandRenderer } from './MainlandRenderer';
import { IslandRenderer } from './IslandRenderer';
import { PeninsulaRenderer } from './PeninsulaRenderer';
import { MountainRenderer } from './MountainRenderer';
import { ArchipelagoRenderer } from './ArchipelagoRenderer';
import { DesertRenderer } from './DesertRenderer';
import { ForestRenderer } from './ForestRenderer';
import { Territory, TerritoryType } from '../../types/Territory';
import { ColorGenetics } from '../../utils/ColorGenetics';
import { OrnamentFactory } from '../ornaments/OrnamentFactory';
import { RandomGenerator } from '../../utils/RandomGenerator';

export class TerritoryFactory {
  private mainlandRenderer: MainlandRenderer;
  private islandRenderer: IslandRenderer;
  private peninsulaRenderer: PeninsulaRenderer;
  private mountainRenderer: MountainRenderer;
  private archipelagoRenderer: ArchipelagoRenderer;
  private desertRenderer: DesertRenderer;
  private forestRenderer: ForestRenderer;
  private ornamentFactory: OrnamentFactory;
  
  constructor() {
    this.mainlandRenderer = new MainlandRenderer();
    this.islandRenderer = new IslandRenderer();
    this.peninsulaRenderer = new PeninsulaRenderer();
    this.mountainRenderer = new MountainRenderer();
    this.archipelagoRenderer = new ArchipelagoRenderer();
    this.desertRenderer = new DesertRenderer();
    this.forestRenderer = new ForestRenderer();
    this.ornamentFactory = new OrnamentFactory();
  }
  
  public createTerritory(territory: Territory): THREE.Object3D {
    const group = new THREE.Group();
    group.name = `territory-${territory.id}`;
    
    // Posicionamento base
    group.position.set(...territory.position);
    if (territory.rotation) {
      group.rotation.y = territory.rotation * Math.PI / 180;
    }
    
    // Cores baseadas em genética
    const colors = ColorGenetics.generateColorScheme(
      territory.visualSeed,
      territory.fusionLevel,
      territory.colorPalette
    );
    
    // Criar mesh baseado no tipo
    let mesh: THREE.Object3D;
    
    switch(territory.type) {
      case TerritoryType.MAINLAND:
        mesh = this.mainlandRenderer.createMesh(territory, colors);
        break;
      case TerritoryType.ISLAND:
        mesh = this.islandRenderer.createMesh(territory, colors);
        break;
      case TerritoryType.PENINSULA:
        mesh = this.peninsulaRenderer.createMesh(territory, colors);
        break;
      case TerritoryType.MOUNTAINS:
        mesh = this.mountainRenderer.createMesh(territory, colors);
        break;
      case TerritoryType.ARCHIPELAGO:
        mesh = this.archipelagoRenderer.createMesh(territory, colors);
        break;
      case TerritoryType.DESERT:
        mesh = this.desertRenderer.createMesh(territory, colors);
        break;
      case TerritoryType.FOREST:
        mesh = this.forestRenderer.createMesh(territory, colors);
        break;
      default:
        mesh = this.islandRenderer.createMesh(territory, colors);
    }
    
    group.add(mesh);
    
    // Adicionar ornamentos baseados no tipo de território e nível de fusão
    this.addOrnamentsToTerritory(group, territory, colors);
    
    return group;
  }
  
  /**
   * Adiciona ornamentos ao território com base no tipo e nível de fusão
   * @param group Grupo 3D do território
   * @param territory Dados do território
   * @param colors Esquema de cores
   */
  private addOrnamentsToTerritory(
    group: THREE.Group, 
    territory: Territory, 
    colors: any
  ): void {
    // Criar gerador de números aleatórios com a semente do território
    const random = new RandomGenerator(territory.visualSeed);
    
    // Configurar ornamentos com base no tipo de território e nível de fusão
    const ornaments = this.generateOrnamentConfig(territory, random);
    
    // Criar dados de atividade simulados para ornamentos
    // Normalmente viriam do contrato, mas aqui estamos gerando para fins de visualização
    const simulatedActivity = this.generateSimulatedActivity(territory, random);
    
    // Adicionar ornamentos usando o OrnamentFactory
    this.ornamentFactory.addOrnaments(
      group,
      ornaments,
      simulatedActivity,
      territory,
      colors
    );
  }
  
  /**
   * Gera uma configuração de ornamentos com base no território
   */
  private generateOrnamentConfig(territory: Territory, random: RandomGenerator): any {
  let baseOrnaments = {
    buildingCount: 0,
    treasureCount: 0,
    pathCount: 0,
    mountainCount: 0,
    treeCount: 0,
    lakeCount: 0,
    bridgeCount: 0,
    specialStructures: "[]",
    animations: "[]"
  };
  
  switch (territory.type) {
    case TerritoryType.MAINLAND:
      baseOrnaments.buildingCount = 3 + Math.floor(random.next() * 2);
      baseOrnaments.pathCount = 2 + Math.floor(random.next() * 2);
      baseOrnaments.bridgeCount = 1;
      break;
    
    case TerritoryType.ISLAND:
      baseOrnaments.buildingCount = 1 + Math.floor(random.next() * 2);
      baseOrnaments.treasureCount = 1;
      baseOrnaments.lakeCount = 1;
      break;
    
    case TerritoryType.PENINSULA:
      baseOrnaments.buildingCount = 2 + Math.floor(random.next() * 2);
      baseOrnaments.pathCount = 1;
      baseOrnaments.bridgeCount = 1;
      break;
    
    case TerritoryType.MOUNTAINS:
      baseOrnaments.mountainCount = 2 + Math.floor(random.next() * 2);
      baseOrnaments.buildingCount = 1;
      baseOrnaments.treeCount = 3;
      break;
    
    case TerritoryType.ARCHIPELAGO:
      baseOrnaments.treasureCount = 2;
      baseOrnaments.buildingCount = Math.floor(random.next() * 2);
      baseOrnaments.lakeCount = 1;
      break;
    
    case TerritoryType.DESERT:
      baseOrnaments.buildingCount = 1;
      baseOrnaments.mountainCount = 1;
      break;
    
    case TerritoryType.FOREST:
      baseOrnaments.treeCount = 5 + Math.floor(random.next() * 5);
      baseOrnaments.buildingCount = 1;
      baseOrnaments.lakeCount = 1;
      baseOrnaments.pathCount = 1;
      break;
  }
  
  // Aumentar quantidade de ornamentos com base no nível de fusão
  if (territory.fusionLevel > 1) {
    baseOrnaments.buildingCount += (territory.fusionLevel - 1);
    baseOrnaments.treasureCount += Math.floor((territory.fusionLevel - 1) / 2);
    baseOrnaments.pathCount += Math.floor((territory.fusionLevel - 1) / 2);
    baseOrnaments.mountainCount += Math.floor((territory.fusionLevel - 1) / 2);
    baseOrnaments.treeCount += (territory.fusionLevel - 1) * 2;
    baseOrnaments.lakeCount += Math.floor(territory.fusionLevel / 2);
    baseOrnaments.bridgeCount += Math.floor((territory.fusionLevel - 1) / 2);
    
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
  
  /**
   * Gera dados de atividade simulados para ornamentos
   */
  private generateSimulatedActivity(
    territory: Territory,
    random: RandomGenerator
  ): any {
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