import { TreeParameterNormalizer } from './TreeParameterNormalizer';
import { TreeComplexityCalculator } from './TreeComplexityCalculator';

export class TreeMetadataGenerator {
  static generateMetadata(params: any, tokenId: string) {
    const colorSchemes = ['Gradient', 'Rainbow', 'Autumn', 'Monochrome', 'Neon'];
    const complexity = TreeComplexityCalculator.calculateComplexity(params);

    return {
      name: `Fractal Tree #${tokenId}`,
      description: "Generative Fractal Tree NFT with unique characteristics",
      attributes: [
        { trait_type: "Branches", value: params.branches },
        { trait_type: "Max Depth", value: params.maxDepth },
        { trait_type: "Symmetrical", value: params.symmetrical ? "Yes" : "No" },
        { trait_type: "Length Ratio", value: params.lengthRatio * 100 },
        { trait_type: "Branch Angle", value: params.branchAngle },
        { trait_type: "Color Scheme", value: colorSchemes[params.colorScheme] },
        { trait_type: "Wind Strength", value: params.windStrength * 100 }
      ],
      properties: {
        colorPalette: this.generateColorPalette(params),
        particleData: [],
        complexity: complexity
      }
    };
  }

  private static generateColorPalette(params: any): string[] {
    const palette = [];
    for (let i = 0; i < 5; i++) {
      const hue = (params.hueStart + (i * params.hueRange / 4)) % 360;
      palette.push(`hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`);
    }
    return palette;
  }
}