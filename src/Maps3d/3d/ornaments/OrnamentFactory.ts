// src/Maps3d/3d/ornaments/OrnamentFactory.ts
import * as THREE from 'three';
import { BuildingGenerator } from './BuildingGenerator';
import { TreasureGenerator } from './TreasureGenerator';
import { PathGenerator } from './PathGenerator';
import { TerrainFeatures } from './TerrainFeatures';
import { Ornaments } from '../../types/Ornament';
import { Territory } from '../../types/Territory';
import { ColorScheme } from '../../utils/ColorGenetics';

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
    // Adicionar edifícios
    this.addBuildings(
      territoryGroup,
      ornaments.buildingCount,
      activity.balance,
      territory,
      colors
    );
    
    // Adicionar tesouros
    this.addTreasures(
      territoryGroup,
      ornaments.treasureCount,
      activity.nftCount,
      territory,
      colors
    );
    
    // Adicionar caminhos
    this.addPaths(
      territoryGroup,
      ornaments.pathCount,
      activity.transactions,
      territory,
      colors
    );
    
    // Adicionar características de terreno
    this.addTerrainFeatures(
      territoryGroup,
      ornaments.mountainCount,
      activity.stakedAmount,
      territory,
      colors
    );
    
    // Adicionar estruturas especiais
    if (ornaments.specialStructures && ornaments.specialStructures !== "[]") {
      this.addSpecialStructures(
        territoryGroup,
        ornaments.specialStructures,
        territory,
        colors
      );
    }
  }
  
  /**
   * Adiciona edifícios ao território
   */
  private addBuildings(
    territoryGroup: THREE.Group,
    count: number,
    balance: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    for (let i = 0; i < count; i++) {
      // Determinar nível de edifício com base no saldo e fusão
      const buildingLevel = Math.min(5, Math.floor(Math.log10(balance + 1) * 2) + territory.fusionLevel);
      
      // Criar edifício
      const building = this.buildingGenerator.createBuilding(
        buildingLevel,
        territory.fusionLevel,
        colors
      );
      
      // Posicionar aleatoriamente dentro do território
      this.positionObjectRandomly(building, territory.size * 0.7);
      
      territoryGroup.add(building);
    }
  }
  
  /**
   * Adiciona tesouros ao território
   */
  private addTreasures(
    territoryGroup: THREE.Group,
    count: number,
    nftCount: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    for (let i = 0; i < count; i++) {
      // Determinar tamanho do tesouro com base no número de NFTs
      const treasureSize = 0.5 + Math.min(1.5, Math.log10(nftCount + 1) * 0.5);
      
      // Criar tesouro
      const treasure = this.treasureGenerator.createTreasure(
        treasureSize,
        territory.fusionLevel,
        colors
      );
      
      // Posicionar aleatoriamente dentro do território
      this.positionObjectRandomly(treasure, territory.size * 0.6);
      
      territoryGroup.add(treasure);
    }
  }
  
  /**
   * Adiciona caminhos ao território
   */
  private addPaths(
    territoryGroup: THREE.Group,
    count: number,
    transactions: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    if (count <= 0) return;
    
    // Criar caminhos que se conectam ao centro
    const centerPoint = new THREE.Vector3(0, 0.1, 0);
    
    for (let i = 0; i < count; i++) {
      // Ângulo do caminho
      const angle = (i / count) * Math.PI * 2;
      
      // Ponto final do caminho
      const distance = territory.size * (0.3 + Math.random() * 0.4);
      const endPoint = new THREE.Vector3(
        Math.cos(angle) * distance,
        0.1,
        Math.sin(angle) * distance
      );
      
      // Determinar largura do caminho com base no número de transações
      const pathWidth = 0.2 + Math.min(0.8, Math.log10(transactions + 1) * 0.2);
      
      // Criar caminho
      const path = this.pathGenerator.createPath(
        centerPoint,
        endPoint,
        pathWidth,
        colors
      );
      
      territoryGroup.add(path);
    }
  }
  
  /**
   * Adiciona características de terreno
   */
  private addTerrainFeatures(
    territoryGroup: THREE.Group,
    count: number,
    stakedAmount: number,
    territory: Territory,
    colors: ColorScheme
  ): void {
    for (let i = 0; i < count; i++) {
      // Determinar tamanho da característica com base no valor em staking
      const featureSize = 0.5 + Math.min(2.0, Math.log10(stakedAmount + 1) * 0.5);
      
      // Tipos de características (pequenas montanhas, lagos, etc.)
      const featureTypes = ['mountain', 'lake', 'rock', 'hill'];
      const featureType = featureTypes[i % featureTypes.length];
      
      // Criar característica
      const feature = this.terrainFeatures.createFeature(
        featureType,
        featureSize,
        territory.fusionLevel,
        colors
      );
      
      // Posicionar aleatoriamente
      this.positionObjectRandomly(feature, territory.size * 0.5);
      
      territoryGroup.add(feature);
    }
  }
  
  /**
   * Adiciona estruturas especiais (interpretando JSON)
   */
  private addSpecialStructures(
    territoryGroup: THREE.Group,
    specialStructuresJson: string,
    territory: Territory,
    colors: ColorScheme
  ): void {
    try {
      const specialStructures = JSON.parse(specialStructuresJson);
      
      specialStructures.forEach((structure: any) => {
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
            if (structure.start && structure.end) {
              const start = new THREE.Vector3(
                structure.start.x || 0, 
                0.5, 
                structure.start.z || 0
              );
              const end = new THREE.Vector3(
                structure.end.x || 0, 
                0.5, 
                structure.end.z || 0
              );
              
              specialObject = this.pathGenerator.createBridge(
                start,
                end,
                structure.width || 1,
                colors
              );
            }
            break;
        }
        
        if (specialObject) {
          // Posicionar conforme especificado ou aleatoriamente
          if (structure.position) {
            specialObject.position.set(
              structure.position.x || 0,
              structure.position.y || 0,
              structure.position.z || 0
            );
          } else {
            this.positionObjectRandomly(specialObject, territory.size * 0.3);
          }
          
          territoryGroup.add(specialObject);
        }
      });
    } catch (error) {
      console.error('Error parsing special structures:', error);
    }
  }
  
  /**
   * Posiciona um objeto aleatoriamente dentro de um raio
   */
  private positionObjectRandomly(object: THREE.Object3D, radius: number): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    
    object.position.set(
      Math.cos(angle) * distance,
      object.position.y,
      Math.sin(angle) * distance
    );
  }
}
