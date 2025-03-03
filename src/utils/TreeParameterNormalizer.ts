export class TreeParameterNormalizer {
  static normalizeStructureParams(params: any) {
    return {
      branches: params.branches,
      maxDepth: params.maxDepth,
      symmetrical: params.symmetrical,
      lengthRatio: Math.floor(params.lengthRatio * 1000),
      branchAngle: params.branchAngle,
      initialLength: params.initialLength,
      branchWidth: Math.floor(params.branchWidth * 10),
      randomness: Math.floor(params.randomness * 1000),
      curvature: Math.floor(params.curvature * 1000)
    };
  }

  static normalizeAppearanceParams(params: any) {
    const colorSchemes: { [key: string]: number } = {
      'gradient': 0,
      'rainbow': 1,
      'autumn': 2,
      'monochrome': 3,
      'neon': 4
    };

    return {
      colorScheme: colorSchemes[params.colorScheme] || 0,
      hueStart: params.hueStart,
      hueRange: params.hueRange,
      saturation: Math.floor(params.saturation * 10),
      lightness: Math.floor(params.lightness * 10),
      drawLeaves: params.drawLeaves
    };
  }

  static normalizeAnimationParams(params: any) {
    return {
      windStrength: Math.floor(params.windStrength * (1000/3)),
      windSpeed: Math.floor(params.windSpeed * (1000/5)),
      particleAmount: params.particleAmount * 10,
      animateGrowth: true,
      postGrowthMovement: true
    };
  }
}