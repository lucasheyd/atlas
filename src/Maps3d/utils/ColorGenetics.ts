// src/Maps3d/utils/ColorGenetics.ts

// Default color palettes to use when territory color is available but no palette is defined
export const DEFAULT_PALETTES = {
  // Each palette has arrays of color variations
  'red': {
    primary: ['#FF5252', '#FF1744', '#D50000', '#B71C1C'],
    secondary: ['#FFCDD2', '#EF9A9A', '#E57373', '#EF5350'],
    accent: ['#FF8A80', '#FF5252', '#FF1744', '#D50000'],
    outline: ['#D32F2F', '#C62828', '#B71C1C', '#891212']
  },
  'blue': {
    primary: ['#2196F3', '#1E88E5', '#1976D2', '#1565C0'],
    secondary: ['#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5'],
    accent: ['#82B1FF', '#448AFF', '#2979FF', '#2962FF'],
    outline: ['#1976D2', '#1565C0', '#0D47A1', '#0A367C']
  },
  'green': {
    primary: ['#4CAF50', '#43A047', '#388E3C', '#2E7D32'],
    secondary: ['#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A'],
    accent: ['#69F0AE', '#00E676', '#00C853', '#00A040'],
    outline: ['#388E3C', '#2E7D32', '#1B5E20', '#154019']
  },
  'purple': {
    primary: ['#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A'],
    secondary: ['#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC'],
    accent: ['#EA80FC', '#E040FB', '#D500F9', '#AA00FF'],
    outline: ['#7B1FA2', '#6A1B9A', '#4A148C', '#3B1070']
  },
  'yellow': {
    primary: ['#FFEB3B', '#FDD835', '#FBC02D', '#F9A825'],
    secondary: ['#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58'],
    accent: ['#FFFF8D', '#FFFF00', '#FFEA00', '#FFD600'],
    outline: ['#F9A825', '#F57F17', '#FF6F00', '#E65100']
  },
  'cyan': {
    primary: ['#00BCD4', '#00ACC1', '#0097A7', '#00838F'],
    secondary: ['#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'],
    accent: ['#84FFFF', '#18FFFF', '#00E5FF', '#00B8D4'],
    outline: ['#0097A7', '#00838F', '#006064', '#004D51']
  }
};

// Function to generate color palette from a hex color
export function generatePaletteFromColor(hexColor: string) {
  // If no color provided, return default blue palette
  if (!hexColor) {
    return DEFAULT_PALETTES.blue;
  }

  try {
    // Extract RGB components
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Find closest base palette
    let closestPalette = 'blue'; // Default
    
    if (r > g && r > b) closestPalette = 'red';
    else if (g > r && g > b) closestPalette = 'green';
    else if (b > r && b > g) closestPalette = 'blue';
    else if (r > 200 && g > 200 && b < 100) closestPalette = 'yellow';
    else if (r > 150 && g < 100 && b > 150) closestPalette = 'purple';
    else if (r < 100 && g > 150 && b > 150) closestPalette = 'cyan';
    
    // Create a custom variant of this palette using the input color
    return {
      primary: [hexColor, darken(hexColor, 10), darken(hexColor, 20), darken(hexColor, 30)],
      secondary: [lighten(hexColor, 30), lighten(hexColor, 20), lighten(hexColor, 10), hexColor],
      accent: createAccentColors(hexColor),
      outline: [darken(hexColor, 10), darken(hexColor, 20), darken(hexColor, 30), darken(hexColor, 40)]
    };
  } catch (error) {
    console.error("Error generating palette from color:", error);
    return DEFAULT_PALETTES.blue;
  }
}

// Helper function to darken a color
export function darken(hexColor: string, percent: number): string {
  return adjustColor(hexColor, -percent);
}

// Helper function to lighten a color
export function lighten(hexColor: string, percent: number): string {
  return adjustColor(hexColor, percent);
}

// Helper function to adjust color brightness
export function adjustColor(hexColor: string, percent: number): string {
  try {
    // Convert hex to RGB
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + Math.floor(r * percent / 100)));
    g = Math.max(0, Math.min(255, g + Math.floor(g * percent / 100)));
    b = Math.max(0, Math.min(255, b + Math.floor(b * percent / 100)));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch (error) {
    console.error("Error adjusting color:", error);
    return hexColor; // Return original if there's an error
  }
}

// Create accent colors (slightly more vibrant variants)
export function createAccentColors(hexColor: string): string[] {
  try {
    // Convert hex to RGB
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);
    
    // Find dominant and secondary colors
    const max = Math.max(r, g, b);
    let accent = hexColor;
    
    // Boost the dominant color component
    if (r === max) {
      r = Math.min(255, r + 30);
      accent = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } else if (g === max) {
      g = Math.min(255, g + 30);
      accent = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } else {
      b = Math.min(255, b + 30);
      accent = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    return [accent, darken(accent, 10), darken(accent, 20), darken(accent, 30)];
  } catch (error) {
    console.error("Error creating accent colors:", error);
    return [`#448AFF`, `#2979FF`, `#2962FF`, `#1A44AA`]; // Return default blue accents
  }
}

// Main function to generate color scheme for a territory
export function generateColorScheme(territoryData: any, random: any) {
  try {
    // Extract relevant info from territory data
    const { color, visualSeed } = territoryData || {};
    
    // Generate a deterministic seed based on visualSeed for color variations
    const seed = visualSeed || Math.floor(Math.random() * 1000000);
    const variantIndex = seed % 4; // Use 4 variants
    
    // Get random value or use deterministic seed
    const getRandomValue = () => {
      if (random && typeof random.next === 'function') {
        return random.next();
      }
      return Math.random();
    };
    
    // Generate palette from color
    let palette = null;
    
    // If we have a color, generate palette from it
    if (color && color.startsWith('#')) {
      palette = generatePaletteFromColor(color);
    } else {
      // Default to blue palette
      palette = DEFAULT_PALETTES.blue;
    }
    
    // Compute variation factor
    const variationFactor = 0.2 * getRandomValue();
    
    // Get colors from palette
    const primaryColor = palette.primary[variantIndex];
    const secondaryColor = palette.secondary[variantIndex];
    const accentColor = palette.accent[variantIndex];
    const outlineColor = palette.outline[variantIndex];
    
    return {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor,
      outline: outlineColor,
      variation: variationFactor
    };
  } catch (error) {
    console.error("Error generating color scheme:", error);
    
    // Fallback to a safe default
    return {
      primary: "#4285F4",
      secondary: "#A8C7FA",
      accent: "#1967D2",
      outline: "#174EA6",
      variation: 0.1
    };
  }
}