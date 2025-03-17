// src/services/TerritoryColorService.ts
import { RandomGenerator } from '../Maps3d/utils/RandomGenerator';

export interface TerritoryColorGenetics {
  primaryHue: number;     // 0-360 
  saturation: number;     // 0-100
  lightness: number;      // 0-100
  colorVariation: number; // 0-1
}

export class TerritoryColorService {
  // Gerar cores genéticas iniciais
  static generateInitialColorGenetics(tokenId: string, networkId: string): TerritoryColorGenetics {
    const seed = this.generateSeed(tokenId, networkId);
    const random = new RandomGenerator(seed);

    return {
      primaryHue: random.next() * 360,           // Matiz aleatório
      saturation: 50 + random.next() * 40,       // Saturação entre 50-90
      lightness: 40 + random.next() * 30,        // Luminosidade entre 40-70
      colorVariation: 0.3 + random.next() * 0.4  // Variação de 0.3-0.7
    };
  }

  // Converter genética de cores para esquema de cores
  static generateColorSchemeFromGenetics(genetics: TerritoryColorGenetics): {
    primary: string;
    secondary: string;
    accent: string;
    outline: string;
  } {
    const hslToHex = (h: number, s: number, l: number) => {
      // Conversão HSL para HEX
      const a = s * Math.min(l, 1 - l) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const primaryColor = hslToHex(
      genetics.primaryHue, 
      genetics.saturation, 
      genetics.lightness
    );

    // Gerar cores relacionadas com base na variação
    const secondaryShift = genetics.colorVariation * 30;
    const accentShift = genetics.colorVariation * 60;

    const secondaryColor = hslToHex(
      (genetics.primaryHue + secondaryShift) % 360, 
      genetics.saturation, 
      Math.min(100, genetics.lightness + 10)
    );

    const accentColor = hslToHex(
      (genetics.primaryHue + accentShift) % 360, 
      Math.min(100, genetics.saturation + 20), 
      Math.min(100, genetics.lightness + 20)
    );

    const outlineColor = hslToHex(
      genetics.primaryHue, 
      genetics.saturation, 
      Math.max(0, genetics.lightness - 20)
    );

    return {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor,
      outline: outlineColor
    };
  }

  // Método utilitário para gerar seed consistente
  private static generateSeed(tokenId: string, networkId: string): number {
    const combined = `${tokenId}-${networkId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para inteiro de 32 bits
    }
    return Math.abs(hash);
  }

  // Método para combinar cores de territórios pai durante fusão
  static fuseColorGenetics(
    genetics1: TerritoryColorGenetics, 
    genetics2: TerritoryColorGenetics
  ): TerritoryColorGenetics {
    return {
      primaryHue: (genetics1.primaryHue + genetics2.primaryHue) / 2,
      saturation: Math.min(100, (genetics1.saturation + genetics2.saturation) / 2),
      lightness: Math.min(100, (genetics1.lightness + genetics2.lightness) / 2),
      colorVariation: Math.min(1, (genetics1.colorVariation + genetics2.colorVariation) / 2)
    };
  }
}