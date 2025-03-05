// utils/mazeTypes.ts

// Color and theme mappings
export const COLOR_MAP: {[key: string]: number[]} = {
  'Purple': [150, 0, 255],
  'Hot Pink': [255, 105, 180],
  'Deep Sky Blue': [0, 191, 255],
  'Gold': [255, 215, 0],
  'Lime Green': [50, 205, 50],
  'Coral': [255, 127, 80]
};

export const THEME_MAP: {[key: string]: any} = {
  'Neon Green': {
    name: 'Neon Green',
    primary: '#00FF00',
    secondary: '#00ff00',
    accent: '#008000',
    text: '#0f0',
    bg: '#121212',
    statusColor: 'yellow'
  },
  'Cyber Blue': {
    name: 'Cyber Blue',
    primary: '#00FFFF',
    secondary: '#00ccff',
    accent: '#0066ff',
    text: '#00ffff', 
    bg: '#001133',
    statusColor: '#ffcc00'
  },
  'Digital Pink': {
    name: 'Digital Pink',
    primary: '#FF00FF',
    secondary: '#ff66ff',
    accent: '#cc00cc',
    text: '#ff66ff',
    bg: '#220033',
    statusColor: '#ffcc00'
  },
  'Retro Orange': {
    name: 'Retro Orange',
    primary: '#FF6600',
    secondary: '#ff9933',
    accent: '#cc5500',
    text: '#ff9933',
    bg: '#331100',
    statusColor: '#ffff00'
  },
  'Matrix Green': {
    name: 'Matrix Green',
    primary: '#33FF33',
    secondary: '#00cc00',
    accent: '#006600',
    text: '#33ff33',
    bg: '#001100',
    statusColor: '#ffff33'
  },
  'Synthwave Purple': {
    name: 'Synthwave Purple',
    primary: '#CC33FF',
    secondary: '#9933ff',
    accent: '#6600cc',
    text: '#cc99ff',
    bg: '#110022',
    statusColor: '#ffcc00'
  }
};

// Cell class for maze generation
export class Cell {
  i: number;
  j: number;
  walls: boolean[];
  visited: boolean;

  constructor(i: number, j: number) {
    this.i = i;
    this.j = j;
    this.walls = [true, true, true, true]; // Top, Right, Bottom, Left
    this.visited = false;
  }

  // Check neighboring cells
  checkNeighbors(grid: Cell[], cols: number, rows: number): Cell | undefined {
    const neighbors: Cell[] = [];
    const top = this.index(this.i, this.j - 1, cols, rows);
    const right = this.index(this.i + 1, this.j, cols, rows);
    const bottom = this.index(this.i, this.j + 1, cols, rows);
    const left = this.index(this.i - 1, this.j, cols, rows);

    if (top !== -1 && !grid[top].visited) neighbors.push(grid[top]);
    if (right !== -1 && !grid[right].visited) neighbors.push(grid[right]);
    if (bottom !== -1 && !grid[bottom].visited) neighbors.push(grid[bottom]);
    if (left !== -1 && !grid[left].visited) neighbors.push(grid[left]);

    return neighbors.length > 0 ? neighbors[Math.floor(Math.random() * neighbors.length)] : undefined;
  }

  // Helper to get index
  index(x: number, y: number, cols: number, rows: number): number {
    if (x < 0 || y < 0 || x > cols - 1 || y > rows - 1) return -1;
    return x + y * cols;
  }
}

// Game Data interface
export interface GameData {
  currentLevel: number;
  bestTimes: (number | null)[];
  bestMoves: (number | null)[];
}

// NFT Traits interface
export interface NFTTraits {
  playerShape: string;
  goalShape: string;
  trailColor: number[];
  uiTheme: {
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    bg: string;
    statusColor: string;
  };
}

// ChainID constants
export const CHAIN_IDS = {
  BASE_SEPOLIA: '0x14a34',
  BASE_MAINNET: '0x2105', // Base Mainnet Chain ID
};