// src/Maps3d/types/Territory.ts
export enum TerritoryType {
  MAINLAND = 'mainland',
  ISLAND = 'island',
  PENINSULA = 'peninsula',
  MOUNTAINS = 'mountains',
  ARCHIPELAGO = 'archipelago',
  DESERT = 'desert',
  FOREST = 'forest'
}

export interface Territory {
  id: string;
  name: string;
  type: TerritoryType;
  position: [number, number, number];
  color: string;
  borderColor?: string;
  size: number;
  rotation?: number;
  visualSeed: number;
  fusionLevel: number;
  colorPalette: number;
  shapeVariant: number;
  rareTraits: number;
  primaryColor: string;    // Cor principal do território
  secondaryColor: string; // Cor secundária
  accentColor: string;    // Cor de destaque
  outlineColor: string;   // Cor de contorno
}

export interface TerrainFeature {
  featureType: string;
  posX: number;
  posZ: number;
  size: number;
  rotation: number;
  properties: string;
}
