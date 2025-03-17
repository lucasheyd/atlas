// src/Maps3d/types/Network.ts
import { TerritoryType } from './Territory';

export interface NetworkInfo {
  id: string;
  name: string;
  type: TerritoryType;
  iconSVG: string;
  positionX: number;
  positionY: number;
  color: string;
  borderColor: string;
  isActive: boolean;
  chainId: string;
  rpcUrl: string;
}

export interface NetworkVisualData {
  positionZ: number;
  size: number;
  scale: number;
  baseHeight: number;
  modelType: string;
  specialEffects: string;
}

export interface NetworkConnection {
  source: string;
  target: string;
  color?: string;
}
