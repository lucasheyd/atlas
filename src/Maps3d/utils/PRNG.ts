// src/Maps3d/utils/PRNG.ts
/**
 * A simple deterministic pseudo-random number generator
 * This allows consistent random values based on a seed
 */
export class PRNG {
  private seed: number;
  private state: number;

  /**
   * Creates a new PRNG with the given seed
   * @param seed - The initial seed value
   */
  constructor(seed: number) {
    this.seed = seed;
    this.state = seed;
  }

  /**
   * Resets the generator to its initial seed
   */
  reset(): void {
    this.state = this.seed;
  }

  /**
   * Sets a new seed
   * @param seed - The new seed value
   */
  setSeed(seed: number): void {
    this.seed = seed;
    this.state = seed;
  }

  /**
   * Returns the current seed
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Generates a random float between 0 (inclusive) and 1 (exclusive)
   * Uses a simple linear congruential generator algorithm
   * @returns A pseudo-random number between 0 and 1
   */
  next(): number {
    // Constants for a decent LCG
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);

    // Update state using the LCG formula
    this.state = (a * this.state + c) % m;

    // Return a number between 0 and 1
    return this.state / m;
  }

  /**
   * Generates a random integer between min (inclusive) and max (inclusive)
   * @param min - The minimum value
   * @param max - The maximum value
   * @returns A pseudo-random integer in the specified range
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generates a random float between min (inclusive) and max (exclusive)
   * @param min - The minimum value
   * @param max - The maximum value
   * @returns A pseudo-random float in the specified range
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Returns a random item from an array
   * @param array - The array to select from
   * @returns A random item from the array
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Returns true with the given probability
   * @param probability - Probability between 0 and 1
   * @returns Boolean result
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Shuffles an array in place
   * @param array - The array to shuffle
   * @returns The shuffled array
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
  }
}
