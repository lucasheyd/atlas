// src/Maps3d/utils/ShapeVariations.ts
import { RandomGenerator } from './RandomGenerator';

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export class ShapeVariations {
  public static getMainlandShape(size: number, variantSeed: number): Point[] {
    const random = new RandomGenerator(variantSeed);
    const points: Point[] = [];
    
    const extraPoints = Math.floor(random.next() * 3);
    const numPoints = 6 + extraPoints;
    const sizeVariation = 0.2;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = size * (1 - sizeVariation + random.next() * sizeVariation * 2);
      
      const point = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
      
      points.push(point);
    }
    
    return points;
  }
  
  public static getIslandShape(size: number, variantSeed: number): Point[] {
    const random = new RandomGenerator(variantSeed);
    const points: Point[] = [];
    
    const numPoints = 8 + Math.floor(random.next() * 9);
    const radiusVariance = 0.4;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = size * (1 - radiusVariance + random.next() * radiusVariance * 2);
      
      const point = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
      
      points.push(point);
    }
    
    return points;
  }
  
  public static getPeninsulaShape(size: number, variantSeed: number): Point[] {
    const random = new RandomGenerator(variantSeed);
    const points: Point[] = [];
    
    points.push({ x: 0, y: 0 });
    
    const arcPoints = 5 + Math.floor(random.next() * 5);
    const radiusVariance = 0.3;
    
    for (let i = 0; i <= arcPoints; i++) {
      const angle = (i / arcPoints) * Math.PI;
      const radius = size * (1 - radiusVariance + random.next() * radiusVariance * 2);
      
      const point = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
      
      points.push(point);
    }
    
    points.push({ x: 0, y: 0 });
    
    return points;
  }
  
  public static getMountainShape(size: number, variantSeed: number, peakCount: number = 3): Point[][] {
    const random = new RandomGenerator(variantSeed);
    const mountains: Point[][] = [];
    
    const actualPeakCount = Math.max(1, Math.min(4, peakCount));
    for (let p = 0; p < actualPeakCount; p++) {
      const points: Point[] = [];
      
      const baseRadius = size * (0.4 + random.next() * 0.3);
      const baseSegments = 8;
      
      for (let i = 0; i < baseSegments; i++) {
        const angle = (i / baseSegments) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * baseRadius,
          y: Math.sin(angle) * baseRadius
        });
      }
      
      const peakHeight = size * (0.8 + random.next() * 0.6);
      points.push({ x: 0, y: 0, z: peakHeight });
      
      const angle = (p / actualPeakCount) * Math.PI * 2;
      const distance = size * (0.5 + random.next() * 0.5);
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      
      const offsetPoints = points.map(point => ({
        x: point.x + offsetX,
        y: point.y + offsetY,
        z: point.z || 0
      }));
      
      mountains.push(offsetPoints);
    }
    
    return mountains;
  }
  
  public static getArchipelagoShape(size: number, variantSeed: number, islandCount: number = 5): Point[][] {
    const random = new RandomGenerator(variantSeed);
    const islands: Point[][] = [];
    
    const actualIslandCount = Math.max(3, Math.min(7, islandCount));
    
    for (let i = 0; i < actualIslandCount; i++) {
      const islandSize = size * (0.3 + random.next() * 0.4);
      const islandSeed = variantSeed + i * 1000;
      const islandPoints = this.getIslandShape(islandSize, islandSeed);
      
      const angle = (i / actualIslandCount) * Math.PI * 2;
      const distance = size * (0.6 + random.next() * 0.8);
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      
      const offsetPoints = islandPoints.map(point => ({
        x: point.x + offsetX,
        y: point.y + offsetY
      }));
      
      islands.push(offsetPoints);
    }
    
    return islands;
  }
  
  public static getDesertShape(size: number, variantSeed: number): Point[] {
    const random = new RandomGenerator(variantSeed);
    const points: Point[] = [];
    
    const numPoints = 6 + Math.floor(random.next() * 5);
    const radiusVariance = 0.5;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = size * (1 - radiusVariance + random.next() * radiusVariance * 2);
      
      const point = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
      
      points.push(point);
    }
    
    return points;
  }
  
  public static getForestShape(size: number, variantSeed: number): {
    baseShape: Point[];
    treePositions: Point[];
  } {
    const random = new RandomGenerator(variantSeed);
    
    const baseShape = this.getIslandShape(size, variantSeed);
    
    const treeCount = 10 + Math.floor(random.next() * 15);
    const treePositions: Point[] = [];
    
    for (let i = 0; i < treeCount; i++) {
      const angle = random.next() * Math.PI * 2;
      const distance = random.next() * size * 0.8;
      
      treePositions.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: size * 0.1 * (0.7 + random.next() * 0.6)
      });
    }
    
    return {
      baseShape,
      treePositions
    };
  }
}
