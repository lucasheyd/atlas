// app/api/nft-game/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get('tokenId') || '1';
  const playerShape = searchParams.get('playerShape') || 'circle';
  const goalShape = searchParams.get('goalShape') || 'circle';
  const trailColor = searchParams.get('trailColor') || 'Purple';
  const uiTheme = searchParams.get('uiTheme') || 'Neon Green';
  const level = searchParams.get('level') || '1';

  // Definir cores baseadas no tema
  let bgColor = '#121212';
  let primaryColor = '#00FF00';
  let textColor = '#0f0';

  switch (uiTheme) {
    case 'Neon Green':
      bgColor = '#121212';
      primaryColor = '#00FF00';
      textColor = '#0f0';
      break;
    case 'Cyber Blue':
      bgColor = '#001133';
      primaryColor = '#00FFFF';
      textColor = '#00ffff';
      break;
    case 'Digital Pink':
      bgColor = '#220033';
      primaryColor = '#FF00FF';
      textColor = '#ff66ff';
      break;
    case 'Retro Orange':
      bgColor = '#331100';
      primaryColor = '#FF6600';
      textColor = '#ff9933';
      break;
    case 'Matrix Green':
      bgColor = '#001100';
      primaryColor = '#33FF33';
      textColor = '#33ff33';
      break;
    case 'Synthwave Purple':
      bgColor = '#110022';
      primaryColor = '#CC33FF';
      textColor = '#cc99ff';
      break;
  }

  // Construir HTML completo
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Maze Puzzle NFT #${tokenId}</title>
  <style>
    body, html { 
      margin: 0; 
      padding: 0; 
      height: 100%; 
      font-family: monospace;
      background-color: ${bgColor};
      color: ${primaryColor};
    }
    
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
      box-sizing: border-box;
    }
    
    h1 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
.level-selector {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.level-btn {
  background: transparent;
  border: 2px solid ${primaryColor};
  color: ${primaryColor};
  opacity: 0.5;
  transition: opacity 0.3s;
  padding: 0.5rem 1rem;
}

.level-btn.active {
  opacity: 1;
}

.level-btn:hover {
  opacity: 0.8;
}
    
    a {
      color: ${primaryColor};
      text-decoration: underline;
    }
    
    p {
      margin: 0.5rem 0;
    }
    
    .info {
      color: ${textColor};
      font-size: 0.875rem;
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .stats {
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .level {
      font-size: 0.875rem;
      opacity: 0.8;
    }
    
    canvas {
      border: 2px solid ${primaryColor};
      border-radius: 0.5rem;
      touch-action: none;
      max-width: 100%;
      height: auto;
    }
    
    .controls {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      max-width: 15rem;
      margin-top: 1.5rem;
    }
    
    .btn {
      padding: 1rem;
      border: 2px solid ${primaryColor};
      border-radius: 0.375rem;
      background: transparent;
      color: ${primaryColor};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      font-size: 1.25rem;
    }
    
    .btn:active {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .traits {
      margin-top: 1rem;
      text-align: center;
      font-size: 0.75rem;
      color: ${textColor};
    }
    
    .modal {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }
    
    .modal-content {
      background-color: ${bgColor};
      border: 2px solid ${primaryColor};
      border-radius: 0.5rem;
      padding: 2rem;
      text-align: center;
      max-width: 90%;
      width: 30rem;
    }
    
    .modal-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: ${primaryColor};
    }
    
    .modal-body {
      margin-bottom: 1.5rem;
      color: ${textColor};
    }
    
    .modal-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    
    .hidden {
      display: none;
    }
    
    /* Loading spinner */
    .spinner {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      border: 0.25rem solid rgba(255, 255, 255, 0.1);
      border-top-color: ${primaryColor};
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Maze Puzzle #${tokenId}</h1>
    
   <div class="level-selector">
     <button class="btn level-btn ${level === '1' ? 'active' : ''}" data-level="1">Level 1</button>
     <button class="btn level-btn ${level === '2' ? 'active' : ''}" data-level="2">Level 2</button>
     <button class="btn level-btn ${level === '3' ? 'active' : ''}" data-level="3">Level 3</button>
  </div>
    
    <div class="stats">
      <div id="game-stats">Time: 0s | Moves: 0</div>
      <div class="level">Level <span id="current-level">${level}</span>/3</div>
    </div>
    
    <div id="loading">
      <div class="spinner"></div>
      <p>Carregando...</p>
    </div>
    
    <canvas id="game-canvas" width="600" height="600" style="display: none;"></canvas>
    
    <div class="controls">
      <div></div>
      <button class="btn" id="up-btn">↑</button>
      <div></div>
      
      <button class="btn" id="left-btn">←</button>
      <button class="btn" id="reset-btn">↻</button>
      <button class="btn" id="right-btn">→</button>
      
      <div></div>
      <button class="btn" id="down-btn">↓</button>
      <div></div>
    </div>
    
    <div class="traits">
      <p>UUse the arrow keys or buttons to move.</p>
      <p>Player: ${playerShape} | Goal: ${goalShape} | Trail: ${trailColor} | Theme: ${uiTheme}</p>
    </div>
  </div>
  
  <div id="win-modal" class="modal hidden">
    <div class="modal-content">
      <h2 class="modal-title">Level Completed!</h2>
      <div class="modal-body">
        <p id="win-stats">Time: 0s | Moves: 0</p>
        <p style="margin-top: 1rem;">
          Visit <a href="https://fractal-swarm.xyz/game" target="_blank">fractal-swarm.xyz/game</a> to save your progress!
        </p>
      </div>
      <div class="modal-buttons">
        <button id="next-level-btn" class="btn" style="padding: 0.5rem 1rem; display: ${parseInt(level) < 3 ? 'block' : 'none'}">
          Next Level
        </button>
        <button id="replay-btn" class="btn" style="padding: 0.5rem 1rem;">
          Play Again
        </button>
      </div>
    </div>
  </div>
  
  <script>
    // Game Configuration
    const config = {
      tokenId: ${tokenId},
      playerShape: "${playerShape}",
      goalShape: "${goalShape}",
      trailColor: "${trailColor}",
      uiTheme: "${uiTheme}",
      level: ${level}
    };
    
    // Get color values for trail
    function getTrailColor(name) {
      switch(name) {
        case "Purple": return [150, 0, 255];
        case "Hot Pink": return [255, 105, 180];
        case "Deep Sky Blue": return [0, 191, 255];
        case "Gold": return [255, 215, 0];
        case "Lime Green": return [50, 205, 50];
        case "Coral": return [255, 127, 80];
        default: return [150, 0, 255]; // Default to purple
      }
    }
    
    // Cell class for maze generation
    class Cell {
      constructor(i, j) {
        this.i = i;
        this.j = j;
        this.walls = [true, true, true, true]; // Top, Right, Bottom, Left
        this.visited = false;
      }
      
      // Check neighboring cells
      checkNeighbors(grid, cols, rows) {
        const neighbors = [];
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
      index(x, y, cols, rows) {
        if (x < 0 || y < 0 || x > cols - 1 || y > rows - 1) return -1;
        return x + y * cols;
      }
    }
    
    // Game state
    const game = {
      canvas: document.getElementById('game-canvas'),
      loading: document.getElementById('loading'),
      statsEl: document.getElementById('game-stats'),
      levelEl: document.getElementById('current-level'),
      winModal: document.getElementById('win-modal'),
      winStats: document.getElementById('win-stats'),
      nextLevelBtn: document.getElementById('next-level-btn'),
      replayBtn: document.getElementById('replay-btn'),
      cols: 0,
      rows: 0,
      w: 0,
      grid: [],
      player: null,
      goal: null,
      gameStarted: false,
      gameWon: false,
      moveCount: 0,
      startTime: 0,
      currentTime: 0,
      currentLevel: config.level,
      visitedCells: [],
      timer: null,
      trailColor: getTrailColor(config.trailColor),
      
      // Initialize game
      init() {
        // Setup event listeners
        document.getElementById('up-btn').addEventListener('mousedown', () => this.movePlayer(0, -1));
        document.getElementById('right-btn').addEventListener('mousedown', () => this.movePlayer(1, 0));
        document.getElementById('down-btn').addEventListener('mousedown', () => this.movePlayer(0, 1));
        document.getElementById('left-btn').addEventListener('mousedown', () => this.movePlayer(-1, 0));
        document.getElementById('reset-btn').addEventListener('mousedown', () => this.resetGame(this.currentLevel));
        
        // Touch events
        document.getElementById('up-btn').addEventListener('touchstart', (e) => { e.preventDefault(); this.movePlayer(0, -1); });
        document.getElementById('right-btn').addEventListener('touchstart', (e) => { e.preventDefault(); this.movePlayer(1, 0); });
        document.getElementById('down-btn').addEventListener('touchstart', (e) => { e.preventDefault(); this.movePlayer(0, 1); });
        document.getElementById('left-btn').addEventListener('touchstart', (e) => { e.preventDefault(); this.movePlayer(-1, 0); });
        document.getElementById('reset-btn').addEventListener('touchstart', (e) => { e.preventDefault(); this.resetGame(this.currentLevel); });
        
        // Level selector buttons
       document.querySelectorAll('.level-btn').forEach(btn => {
                  btn.addEventListener('click', () => {
                  const selectedLevel = btn.getAttribute('data-level');
    
                  // Update URL
                       const url = new URL(window.location.href);
                    url.searchParams.set('level', selectedLevel);
                      window.location.href = url.toString();
                       });
                    });

        // Keyboard events
        window.addEventListener('keydown', (e) => {
          switch (e.key) {
            case 'ArrowUp': this.movePlayer(0, -1, e); break;
            case 'ArrowRight': this.movePlayer(1, 0, e); break;
            case 'ArrowDown': this.movePlayer(0, 1, e); break;
            case 'ArrowLeft': this.movePlayer(-1, 0, e); break;
          }
        });
        
        // Modal buttons
        this.nextLevelBtn.addEventListener('click', () => {
          const nextLevel = this.currentLevel < 3 ? this.currentLevel + 1 : this.currentLevel;
          // Update URL
          const url = new URL(window.location.href);
          url.searchParams.set('level', nextLevel.toString());
          window.location.href = url.toString();
        });
        
        this.replayBtn.addEventListener('click', () => {
          this.winModal.classList.add('hidden');
          this.resetGame(this.currentLevel);
        });
        
        // Start the game
        this.resetGame(this.currentLevel);
      },
      
      // Reset game with specific level
      resetGame(level) {
        // Set difficulty based on level
        let newW;
        switch(level) {
          case 1: newW = 30; break; // Easy
          case 2: newW = 20; break; // Medium
          case 3: newW = 15; break; // Hard
          default: newW = 30;
        }
        this.w = newW;
        
        // Canvas size
        const canvasSize = 600;
        this.cols = Math.floor(canvasSize / newW);
        this.rows = Math.floor(canvasSize / newW);
        
        // Generate grid
        this.grid = [];
        for (let j = 0; j < this.rows; j++) {
          for (let i = 0; i < this.cols; i++) {
            this.grid.push(new Cell(i, j));
          }
        }
        
        // Maze generation
        let currentCell = this.grid[0];
        const stack = [];
        
        while (true) {
          currentCell.visited = true;
          const next = currentCell.checkNeighbors(this.grid, this.cols, this.rows);
          
          if (next) {
            next.visited = true;
            stack.push(currentCell);
            
            // Remove walls
            const x = currentCell.i - next.i;
            const y = currentCell.j - next.j;
            
            if (x === 1) {
              currentCell.walls[3] = false;
              next.walls[1] = false;
            } else if (x === -1) {
              currentCell.walls[1] = false;
              next.walls[3] = false;
            }
            
            if (y === 1) {
              currentCell.walls[0] = false;
              next.walls[2] = false;
            } else if (y === -1) {
              currentCell.walls[2] = false;
              next.walls[0] = false;
            }
            
            currentCell = next;
          } else if (stack.length > 0) {
            currentCell = stack.pop();
          } else {
            break;
          }
        }
        
        // Reset visited status
        this.grid.forEach(cell => cell.visited = false);
        
        // Set player and goal
        this.player = this.grid[0];
        this.goal = this.grid[this.grid.length - 1];
        
        // Initialize visited cells with starting point
        this.visitedCells = [{ x: this.player.i, y: this.player.j }];
        
        this.moveCount = 0;
        this.gameWon = false;
        this.gameStarted = false;
        this.currentTime = 0;
        
        // Clear any existing timer
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        
        this.currentLevel = level;
        this.levelEl.textContent = level;
        this.updateStats();
        
        // Show canvas, hide loading
        this.loading.style.display = 'none';
        this.canvas.style.display = 'block';
        
        // Draw the maze
        this.drawMaze();
      },
      
      // Move player
      movePlayer(dx, dy, event) {
        // Prevent default behavior if event provided
        if (event) {
          event.preventDefault();
        }
        
        if (this.gameWon || !this.player) return;
        
        const newI = this.player.i + dx;
        const newJ = this.player.j + dy;
        const newIndex = this.getIndex(newI, newJ);
        
        if (newIndex !== -1) {
          const next = this.grid[newIndex];
          
          // Check wall constraints
          if (dx === 1 && this.player.walls[1]) return; // Right wall
          if (dx === -1 && this.player.walls[3]) return; // Left wall
          if (dy === 1 && this.player.walls[2]) return; // Bottom wall
          if (dy === -1 && this.player.walls[0]) return; // Top wall
          
          // Start game timer on first move
          if (!this.gameStarted) {
            this.startTime = Date.now();
            this.gameStarted = true;
            
            this.timer = setInterval(() => {
              this.currentTime = Math.floor((Date.now() - this.startTime) / 1000);
              this.updateStats();
            }, 1000);
          }
          
          // Move player
          this.player = next;
          this.moveCount++;
          this.updateStats();
          
          // Add to visited cells
          this.visitedCells.push({ x: next.i, y: next.j });
          
          // Draw the maze
          this.drawMaze();
          
          // Check win condition
          if (next === this.goal) {
            this.handleGameWon();
          }
        }
      },
      
      // Handle game won
      handleGameWon() {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        
        this.gameWon = true;
        
        // Update win modal
        this.winStats.textContent = \`Time: \${this.currentTime}s | Moves: \${this.moveCount}\`;
        
        // Show/hide next level button based on current level
        this.nextLevelBtn.style.display = this.currentLevel < 3 ? 'block' : 'none';
        
        // Show win modal
        this.winModal.classList.remove('hidden');
      },
      
      // Update game stats display
      updateStats() {
        this.statsEl.textContent = \`Time: \${this.currentTime}s | Moves: \${this.moveCount}\`;
      },
      
      // Helper to get grid index
      getIndex(i, j) {
        if (i < 0 || j < 0 || i > this.cols - 1 || j > this.rows - 1) return -1;
        return i + j * this.cols;
      },
      
      // Draw the maze
      drawMaze() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear canvas
        ctx.fillStyle = '${bgColor}';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.grid.forEach(cell => {
          const x = cell.i * this.w;
          const y = cell.j * this.w;
          
          // Draw walls
          ctx.strokeStyle = '${primaryColor}';
          ctx.lineWidth = 2;
          
          if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + this.w, y); ctx.stroke(); } // Top
          if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + this.w, y); ctx.lineTo(x + this.w, y + this.w); ctx.stroke(); } // Right
          if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x + this.w, y + this.w); ctx.lineTo(x, y + this.w); ctx.stroke(); } // Bottom
          if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y + this.w); ctx.lineTo(x, y); ctx.stroke(); } // Left
          
          // Draw trail
          if (this.visitedCells.some(c => c.x === cell.i && c.y === cell.j)) {
            ctx.fillStyle = \`rgba(\${this.trailColor[0]}, \${this.trailColor[1]}, \${this.trailColor[2]}, 0.3)\`;
            ctx.fillRect(x, y, this.w, this.w);
          }
        });
        
        // Draw goal
        if (this.goal) {
          const gx = this.goal.i * this.w + this.w/2;
          const gy = this.goal.j * this.w + this.w/2;
          this.drawShape(ctx, gx, gy, this.w/2, 'red', config.goalShape);
        }
        
        // Draw player
        if (this.player) {
          const px = this.player.i * this.w + this.w/2;
          const py = this.player.j * this.w + this.w/2;
          this.drawShape(ctx, px, py, this.w/2, 'green', config.playerShape);
        }
      },
      
      // Draw shapes
      drawShape(ctx, x, y, size, color, shape) {
        ctx.fillStyle = color;
        
        switch (shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'square':
            ctx.fillRect(x - size * 0.7, y - size * 0.7, size * 1.4, size * 1.4);
            break;
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(x, y - size * 0.8);
            ctx.lineTo(x - size * 0.8, y + size * 0.8);
            ctx.lineTo(x + size * 0.8, y + size * 0.8);
            ctx.closePath();
            ctx.fill();
            break;
          case 'diamond':
            ctx.beginPath();
            ctx.moveTo(x, y - size * 0.8);
            ctx.lineTo(x + size * 0.8, y);
            ctx.lineTo(x, y + size * 0.8);
            ctx.lineTo(x - size * 0.8, y);
            ctx.closePath();
            ctx.fill();
            break;
          case 'star':
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = size * 0.8;
            const innerRadius = size * 0.4;
            
            for (let i = 0; i < spikes * 2; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (Math.PI / spikes) * i;
              
              if (i === 0) {
                ctx.moveTo(x + radius * Math.sin(angle), y - radius * Math.cos(angle));
              } else {
                ctx.lineTo(x + radius * Math.sin(angle), y - radius * Math.cos(angle));
              }
            }
            
            ctx.closePath();
            ctx.fill();
            break;
          case 'heart':
            ctx.beginPath();
            ctx.moveTo(x, y + size * 0.6);
            ctx.bezierCurveTo(
              x + size * 1.1, y - size * 0.6,
              x + size * 0.5, y - size * 0.8,
              x, y - size * 0.2
            );
            ctx.bezierCurveTo(
              x - size * 0.5, y - size * 0.8,
              x - size * 1.1, y - size * 0.6,
              x, y + size * 0.6
            );
            ctx.fill();
            break;
          default:
            ctx.beginPath();
            ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
      }
    };
    
    // Start the game when page loads
    window.addEventListener('load', () => {
      game.init();
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}