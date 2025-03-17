// src/Maps3d/utils/RandomGenerator.ts
export class RandomGenerator {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }
  
  nextInt(min: number, max: number): number {
    const range = max - min;
    return Math.floor(this.next() * range) + min;
  }
  
  nextFloat(min: number, max: number): number {
    const range = max - min;
    return this.next() * range + min;
  }
  
  choose<T>(array: T[]): T {
    const index = this.nextInt(0, array.length);
    return array[index];
  }
  
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
  }
}
