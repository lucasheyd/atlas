export class TreeComplexityCalculator {
  static calculateComplexity(params: any): number {
    let complexity = 50;
    
    complexity += Math.pow(params.branches, 1.5) * 3;
    complexity += params.maxDepth * 2;
    complexity += params.randomness * 20;
    complexity += params.drawLeaves ? 10 : 0;
    complexity += params.curvature * 15;
    complexity += params.particleAmount / 5;
    
    return Math.min(100, Math.max(0, complexity));
  }
}