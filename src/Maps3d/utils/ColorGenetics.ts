// src/Maps3d/utils/ColorGenetics.ts
import { RandomGenerator } from './RandomGenerator';

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  outline: string;
  specular: string;
}

// Paletas de cores predefinidas
const COLOR_PALETTES = [
  // Azul Marinho
  {
    primary: ['#3498db', '#2980b9', '#1f618d', '#154360'],
    secondary: ['#85c1e9', '#5dade2', '#3498db', '#2980b9'],
    accent: ['#f7dc6f', '#f1c40f', '#f39c12', '#e67e22'],
    outline: ['#2c3e50', '#212f3d', '#1c2833', '#17202a']
  },
  // Verde Floresta
  {
    primary: ['#27ae60', '#229954', '#1e8449', '#196f3d'],
    secondary: ['#82e0aa', '#58d68d', '#2ecc71', '#27ae60'],
    accent: ['#f5b041', '#f39c12', '#e67e22', '#d35400'],
    outline: ['#145a32', '#0e6251', '#0b5345', '#08403b']
  },
  // Roxo Profundo
  {
    primary: ['#9b59b6', '#8e44ad', '#7d3c98', '#6c3483'],
    secondary: ['#d2b4de', '#bb8fce', '#a569bd', '#8e44ad'],
    accent: ['#f9e79f', '#f7dc6f', '#f1c40f', '#f39c12'],
    outline: ['#4a235a', '#401c51', '#311548', '#231338']
  },
  // Vermelho Fogo
  {
    primary: ['#e74c3c', '#cb4335', '#b03a2e', '#943126'],
    secondary: ['#f5b7b1', '#f1948a', '#ec7063', '#e74c3c'],
    accent: ['#5dade2', '#3498db', '#2980b9', '#1f618d'],
    outline: ['#7b241c', '#641e16', '#512e12', '#3d261c']
  },
  // Dourado
  {
    primary: ['#f1c40f', '#f39c12', '#d4ac0d', '#b7950b'],
    secondary: ['#f9e79f', '#f7dc6f', '#f4d03f', '#f1c40f'],
    accent: ['#5dade2', '#3498db', '#2980b9', '#1f618d'],
    outline: ['#9a7d0a', '#7d6608', '#614e05', '#4a3a03']
  },
  // Ciano Glacial
  {
    primary: ['#1abc9c', '#16a085', '#148f77', '#117a65'],
    secondary: ['#a2d9ce', '#76d7c4', '#48c9b0', '#1abc9c'],
    accent: ['#f5b041', '#f39c12', '#e67e22', '#d35400'],
    outline: ['#0e6655', '#0b5345', '#09523c', '#073e2c']
  }
];

export class ColorGenetics {
  public static generateColorScheme(
  seed: number,
  fusionLevel: number, 
  colorPaletteIndex: number
): ColorScheme {
  // Adicionar um offset único para cada território
  const territoryOffset = colorPaletteIndex * 1000;
  const combinedSeed = seed + territoryOffset;
  
  const random = new RandomGenerator(combinedSeed);
  
  // Escolher paleta aleatoriamente se não especificada
  const validPaletteIndex = (colorPaletteIndex % COLOR_PALETTES.length + random.next() * 2) % COLOR_PALETTES.length;
  const palette = COLOR_PALETTES[validPaletteIndex];
  
  const fusionFactor = Math.min(1, fusionLevel / 5);
  const variantIndex = Math.floor(fusionFactor * 3);
  
  const variationFactor = 0.2 * random.next();
  
  const primaryColor = palette.primary[variantIndex];
    const secondaryColor = palette.secondary[variantIndex];
    const accentColor = palette.accent[variantIndex];
    const outlineColor = palette.outline[variantIndex];
    
    const primary = this.varyColor(primaryColor, variationFactor);
    const secondary = this.varyColor(secondaryColor, variationFactor);
    const accent = this.varyColor(accentColor, variationFactor);
    const outline = this.varyColor(outlineColor, variationFactor);
    const specular = this.lightenColor(primary, 0.2);
    
    return {
      primary,
      secondary,
      accent,
      outline,
      specular
    };
  }
  
  private static varyColor(hexColor: string, factor: number): string {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    
    const variation = Math.floor(20 * factor);
    
    const newR = Math.min(255, Math.max(0, r + (Math.random() > 0.5 ? variation : -variation)));
    const newG = Math.min(255, Math.max(0, g + (Math.random() > 0.5 ? variation : -variation)));
    const newB = Math.min(255, Math.max(0, b + (Math.random() > 0.5 ? variation : -variation)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  
  private static lightenColor(hexColor: string, factor: number): string {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    
    const newR = Math.min(255, r + Math.floor((255 - r) * factor));
    const newG = Math.min(255, g + Math.floor((255 - g) * factor));
    const newB = Math.min(255, b + Math.floor((255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}
