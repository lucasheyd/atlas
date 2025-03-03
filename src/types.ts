/**
 * Tipos de parâmetros para a árvore fractal usados no frontend
 */

// Definição dos esquemas de cores válidos
export type ColorScheme = 'gradient' | 'rainbow' | 'autumn' | 'monochrome' | 'neon';

// Definição dos tipos de background válidos
export type BackgroundType = 'dark' | 'light' | 'gradient' | 'starfield';

// Interface para os parâmetros da árvore fractal
export interface TreeParams {
  // Estrutura da árvore
  branches: number;          // 1-5, quantidade de ramificações em cada nó
  maxDepth: number;          // 2-12, profundidade da recursão (limite baseado em branches)
  lengthRatio: number;       // 0.5-0.9, razão de comprimento entre níveis
  branchAngle: number;       // 10-90 graus, ângulo de ramificação
  initialLength: number;     // 50-200 pixels, comprimento inicial
  branchWidth: number;       // 1-20 pixels, largura do ramo
  randomness: number;        // 0-1, fator de aleatoriedade na geração
  curvature: number;         // 0-1, curvatura dos ramos
  symmetrical: boolean;      // true/false, se os ramos são simétricos
  
  // Aparência
  colorScheme: ColorScheme;  // esquema de cores
  hueStart: number;          // 0-360, tom inicial no círculo de cores
  hueRange: number;          // 0-180, intervalo de tons a partir do inicial
  saturation: number;        // 0-100%, saturação das cores
  lightness: number;         // 20-80%, luminosidade das cores
  backgroundColor: BackgroundType; // tipo de fundo
  drawLeaves: boolean;       // true/false, se deve desenhar folhas
  
  // Animação e efeitos
  windStrength: number;      // 0-1, força do vento
  windSpeed: number;         // 0-5, velocidade do vento
  growthSpeed: number;       // 0-2, velocidade da animação de crescimento
  particleAmount: number;    // 0-100, quantidade de partículas
  animateGrowth: boolean;    // true/false, se deve animar o crescimento
  postGrowthMovement: boolean; // true/false, se deve continuar movimentando após crescimento
}

// Interface para metadados da árvore
export interface TreeMetadata {
  tokenId: string;
  complexity: number;
  owner: string;
  createdAt: number;
}

// Interface para resultados da operação de mint
export interface MintResult {
  success: boolean;
  tokenId?: string;
  txHash?: string;
  error?: string;
}

// Interface para resultados da operação de carregamento
export interface LoadTreeResult {
  params: TreeParams;
  metadata?: TreeMetadata;
  complexity: number;
}

// Conversão entre formatos do contrato e frontend
export interface ContractParams {
  // Estrutura
  branches: number;
  maxDepth: number;
  symmetrical: boolean;
  lengthRatio: number;     // Multiplicado por 1000
  branchAngle: number;
  initialLength: number;
  branchWidth: number;     // Multiplicado por 10
  randomness: number;      // Multiplicado por 1000
  curvature: number;       // Multiplicado por 1000
  
  // Aparência
  colorSchemeValue: number; // Valor enum: 0=gradient, 1=rainbow, etc
  hueStart: number;
  hueRange: number;
  saturation: number;       // Multiplicado por 10
  lightness: number;        // Multiplicado por 10
  drawLeaves: boolean;
  
  // Animação
  windStrength: number;     // Multiplicado por 333.33
  windSpeed: number;        // Multiplicado por 200
  particleAmount: number;   // Multiplicado por 10
}

// Interface para presets
export interface TreePreset {
  name: string;
  description: string;
  params: TreeParams;
}