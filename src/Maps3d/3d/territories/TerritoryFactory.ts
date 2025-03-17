// src/Maps3d/3d/territories/TerritoryFactory.ts
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

export class TerritoryFactory {
  private mainlandRenderer: MainlandRenderer;
  private islandRenderer: IslandRenderer;
  private peninsulaRenderer: PeninsulaRenderer;
  private mountainRenderer: MountainRenderer;
  private archipelagoRenderer: ArchipelagoRenderer;
  private desertRenderer: DesertRenderer;
  private forestRenderer: ForestRenderer;
  
  constructor() {
    this.mainlandRenderer = new MainlandRenderer();
    this.islandRenderer = new IslandRenderer();
    this.peninsulaRenderer = new PeninsulaRenderer();
    this.mountainRenderer = new MountainRenderer();
    this.archipelagoRenderer = new ArchipelagoRenderer();
    this.desertRenderer = new DesertRenderer();
    this.forestRenderer = new ForestRenderer();
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
    return group;
  }
}
