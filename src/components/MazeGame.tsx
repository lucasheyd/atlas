'use client';

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo 
} from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Gamepad2, 
  Loader2, 
  AlertTriangle, 
  Shield, 
  Trophy, 
  WalletIcon, 
  ArrowRightCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useWalletForMaze from '../hooks/useWalletForMaze';

// Import Color and theme mappings from the existing code
import { COLOR_MAP, THEME_MAP, Cell } from '@/utils/mazeTypes';

const MazeGame: React.FC = () => {
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Extract token ID from URL parameters
  const tokenId = parseInt(searchParams?.get('tokenId') || '1');
  
  // Use our custom wallet hook with the token ID
  const { 
    wallet, 
    loading: walletLoading, 
    error: walletError, 
    connect, 
    switchNetwork, 
    ownsToken, 
    gameData, 
    saveProgress 
  } = useWalletForMaze({ tokenId, autoConnect: true });
  
  // Loading and token state
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Game state variables (from original component)
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [w, setW] = useState(20);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [player, setPlayer] = useState<Cell | null>(null);
  const [goal, setGoal] = useState<Cell | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [visitedCells, setVisitedCells] = useState<{x: number, y: number}[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);

  // State for unlocked levels and best performance (will now be loaded from contract)
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [bestTimes, setBestTimes] = useState<(number | null)[]>([null, null, null]);
  const [bestMoves, setBestMoves] = useState<(number | null)[]>([null, null, null]);

  // Timer reference to clear interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // NFT Traits state
  const [nftTraits, setNftTraits] = useState({
    playerShape: 'circle',
    goalShape: 'circle',
    trailColor: [150, 0, 255], // Default purple
    uiTheme: THEME_MAP['Neon Green']
  });

  // Load NFT traits from contract
  const fetchNFTTraits = useCallback(async () => {
    if (!wallet.contract) return;
    
    try {
      // Fetch traits from contract
      const [playerShape, goalShape, trailColor, uiTheme] = 
        await wallet.contract.getTraits(tokenId);
      
      // Update traits state
      setNftTraits({
        playerShape,
        goalShape,
        trailColor: COLOR_MAP[trailColor] || [150, 0, 255],
        uiTheme: THEME_MAP[uiTheme] || THEME_MAP['Neon Green']
      });
    } catch (error) {
      console.error('Error fetching NFT traits:', error);
    }
  }, [wallet.contract, tokenId]);

  // Initialize game based on contract data
useEffect(() => {
  if (!initialized && gameData && !walletLoading) {
    console.log('Game data loaded:', gameData);
    
    try {
      // Obter o nível dos parâmetros URL ou usar o padrão 1
      const levelParam = parseInt(searchParams?.get('level') || '1');
      const safeLevel = Math.min(Math.max(1, levelParam), 3); // Limitar entre 1 e 3
      
      setCurrentLevel(safeLevel);
      
      // Usar todos os níveis disponíveis
      setUnlockedLevels([1, 2, 3]);
      
      // Definir melhores tempos e movimentos
      setBestTimes(gameData.bestTimes || [null, null, null]);
      setBestMoves(gameData.bestMoves || [null, null, null]);
      
      // Marcar como inicializado
      setInitialized(true);
      setIsLoading(false);
      
      console.log('Game initialized with level:', safeLevel);
    } catch (error) {
      console.error('Error initializing game:', error);
      // Fallback para valores padrão
      setUnlockedLevels([1, 2, 3]);
      setCurrentLevel(1);
      setBestTimes([null, null, null]);
      setBestMoves([null, null, null]);
      setInitialized(true);
      setIsLoading(false);
    }
  }
}, [gameData, walletLoading, initialized, searchParams]);

  // Load traits when contract is available
  useEffect(() => {
    if (wallet.contract && ownsToken) {
      fetchNFTTraits();
    }
  }, [wallet.contract, ownsToken, fetchNFTTraits]);

  // Reset game with specific level difficulty (from original component)
  const resetGame = useCallback((level: number) => {
    // Set difficulty based on level
    let newW: number;
    switch(level) {
      case 1:
        newW = 30; // Easy
        break;
      case 2:
        newW = 20; // Medium
        break;
      case 3:
        newW = 15; // Hard
        break;
      default:
        newW = 30;
    }
    setW(newW);

    // Canvas size
    const canvasSize = 600;
    const newCols = Math.floor(canvasSize / newW);
    const newRows = Math.floor(canvasSize / newW);
    
    setCols(newCols);
    setRows(newRows);

    // Generate grid
    const newGrid: Cell[] = [];
    for (let j = 0; j < newRows; j++) {
      for (let i = 0; i < newCols; i++) {
        newGrid.push(new Cell(i, j));
      }
    }
    setGrid(newGrid);

    // Maze generation
    let currentCell = newGrid[0];
    const stack: Cell[] = [];
    const solution: Cell[] = [];

    while (true) {
      currentCell.visited = true;
      const next = currentCell.checkNeighbors(newGrid, newCols, newRows);

      if (next) {
        next.visited = true;
        stack.push(currentCell);
        solution.push(currentCell);

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
        currentCell = stack.pop()!;
      } else {
        break;
      }
    }

    // Reset visited status
    newGrid.forEach(cell => cell.visited = false);

    // Set player and goal
    const playerCell = newGrid[0];
    const goalCell = newGrid[newGrid.length - 1];
    
    setPlayer(playerCell);
    setGoal(goalCell);
    
    // Initialize visited cells with starting point
    setVisitedCells([{ x: playerCell.i, y: playerCell.j }]);
    
    setMoveCount(0);
    setGameWon(false);
    setGameStarted(false);
    setCurrentTime(0);

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setCurrentLevel(level);
  }, []);


  const [isSavingBlocked, setIsSavingBlocked] = useState(false);

  // Save progress to contract
 const handleSaveProgress = useCallback(async () => {
  if (isSavingBlocked) return; // Previne múltiplas tentativas

  if (!wallet.isConnected) {
    // Usuário não está conectado, não tenta salvar
    return;
  }
  
  if (!ownsToken) {
    // Usuário está conectado mas não é proprietário, não tenta salvar
    return;
  }
  
  if (!gameWon) return;
    
    setSaving(true);
    setSavingError(null);
    
    try {
    await saveProgress(currentLevel, currentTime, moveCount);
    
    // Se salvou com sucesso, avança automaticamente para próximo nível
    if (currentLevel < 3) {
      const nextLevel = currentLevel + 1;
      const url = new URL(window.location.href);
      url.searchParams.set('level', nextLevel.toString());
      window.history.replaceState({}, '', url.toString());
      
      resetGame(nextLevel);
    }
  } catch (error: any) {
    setSavingError(error.message || 'Failed to save progress');
  } finally {
    setSaving(false);
    setIsSavingBlocked(false); // Desbloqueia após tentativa
  }
}, [
  ownsToken, 
  gameWon, 
  currentLevel, 
  currentTime, 
  moveCount, 
  saveProgress, 
  resetGame,
  isSavingBlocked
]);

  // Automatically save progress when game is won
//  useEffect(() => {
//    if (gameWon && !saving && ownsToken) {
//      handleSaveProgress();
//    }
//  }, [gameWon, saving, ownsToken, handleSaveProgress]);


  // Move player (from original component with ownership validation)
  const movePlayer = useCallback((dx: number, dy: number, event?: React.MouseEvent | KeyboardEvent) => {
    // Prevent default scroll behavior
    if (event) {
      event.preventDefault();
    }

    // Don't allow movement if the user doesn't own the token
   // if (!ownsToken) return;
    
    if (gameWon || !player) return;

    const newI = player.i + dx;
    const newJ = player.j + dy;
    const newIndex = index(newI, newJ);

    if (newIndex !== -1) {
      const next = grid[newIndex];

      // Check wall constraints
      if (dx === 1 && player.walls[1]) return; // Right wall
      if (dx === -1 && player.walls[3]) return; // Left wall
      if (dy === 1 && player.walls[2]) return; // Bottom wall
      if (dy === -1 && player.walls[0]) return; // Top wall

      // Start game timer on first move
      if (!gameStarted) {
        const startTs = Date.now();
        setStartTime(startTs);
        setGameStarted(true);
        
        const gameTimer = setInterval(() => {
          setCurrentTime(Math.floor((Date.now() - startTs) / 1000));
        }, 1000);
        
        timerRef.current = gameTimer;
      }

      // Move player
      setPlayer(next);
      setMoveCount(prev => prev + 1);

      // Add to visited cells
      setVisitedCells(prev => [...prev, { x: next.i, y: next.j }]);

      // Check win condition
      if (next === goal) {
        handleGameWon();
      }
    }
  }, [player, gameWon, grid, gameStarted, goal, ownsToken]);

  // Handle game won
  const handleGameWon = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameWon(true);
  }, []);

  // Helper to get grid index
  const index = useCallback((i: number, j: number): number => {
    if (i < 0 || j < 0 || i > cols - 1 || j > rows - 1) return -1;
    return i + j * cols;
  }, [cols, rows]);

  // Draw shapes on canvas (from original component)
  const drawShape = useCallback((
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number, 
    color: string, 
    shape: string
  ) => {
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
  }, []);

  // Initialize game when data is loaded
  useEffect(() => {
    if (initialized && !isLoading && unlockedLevels.length > 0) {
      resetGame(currentLevel);
    }
  }, [initialized, isLoading, unlockedLevels, currentLevel, resetGame]);

  // Level Selector Component
  const LevelSelector = () => (
  <div className="flex justify-center gap-4 mb-4">
    {[1, 2, 3].map(level => (
      <button
        key={level}
        onClick={() => {
          // Change URL to reflect selected level
          const url = new URL(window.location.href);
          url.searchParams.set('level', level.toString());
          window.history.replaceState({}, '', url.toString());
          
          // Reset game for selected level
          resetGame(level);
        }}
        // Remover verificação de unlockedLevels
        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
          currentLevel === level
            ? 'bg-opacity-100 cursor-pointer border-2' 
            : 'bg-opacity-80 cursor-pointer'
        }`}
        style={{
          backgroundColor: nftTraits.uiTheme.primary,
          borderColor: currentLevel === level ? nftTraits.uiTheme.bg : nftTraits.uiTheme.primary,
          color: nftTraits.uiTheme.bg
        }}
      >
        Level {level}
        {bestTimes[level-1] !== null && (
          <span className="text-xs block">
            Best: {bestTimes[level-1]}s
          </span>
        )}
      </button>
    ))}
  </div>
);

  // Game won overlay component
const GameWonOverlay = () => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div 
      className="bg-opacity-90 p-8 rounded-lg text-center"
      style={{ 
        backgroundColor: nftTraits.uiTheme.bg, 
        borderColor: nftTraits.uiTheme.primary 
      }}
    >
      <h2 
        className="text-2xl font-bold mb-4" 
        style={{ color: nftTraits.uiTheme.primary }}
      >
        Level Completed!
      </h2>
      <p className="mb-4" style={{ color: nftTraits.uiTheme.text }}>
        Time: {currentTime}s | Moves: {moveCount}
      </p>
      
      {/* Prompt to save progress */}
      {!saving && !savingError && ownsToken && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Would you like to save your progress to the blockchain?
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={handleSaveProgress}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Save Progress
            </Button>

          </div>
        </div>
      )}
      
      {/* Saving progress state */}
      {saving ? (
        <div className="flex items-center justify-center mb-4" style={{ color: nftTraits.uiTheme.text }}>
          <Loader2 className="animate-spin mr-2" />
          Saving progress to blockchain...
        </div>
      ) : savingError ? (
        <div className="text-red-500 mb-4">
          Error saving: {savingError}
          <Button 
            onClick={() => {
              setSavingError(null);
              // Optional: retry saving
              handleSaveProgress();
            }}
            className="ml-2"
          >
            Retry
          </Button>
        </div>
      ) : null}
      
      {/* Level navigation buttons */}
      <div className="flex justify-center space-x-4">
        {currentLevel < 3 && (
          <Button
            onClick={() => {
              const nextLevel = currentLevel + 1;
              const url = new URL(window.location.href);
              url.searchParams.set('level', nextLevel.toString());
              window.history.replaceState({}, '', url.toString());
              
              resetGame(nextLevel);
            }}
            variant="outline"
            disabled={saving || isSavingBlocked}
          >
            Next Level
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => resetGame(currentLevel)}
          disabled={saving || isSavingBlocked}
        >
          Play Again
        </Button>
      </div>
    </div>
  </div>
);

  // Ownership validation overlay
  const OwnershipValidationOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/30 flex items-center justify-center">
          <Shield className="h-10 w-10 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-white">
          Ownership Required
        </h2>
        
        {!wallet.isConnected ? (
          <>
            <p className="mb-6 text-gray-300">
              Please connect your wallet to verify that you own this Maze Puzzle NFT.
            </p>
            <Button 
              onClick={connect} 
              disabled={walletLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {walletLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WalletIcon className="mr-2 h-4 w-4" />}
              Connect Wallet
            </Button>
          </>
        ) : !wallet.isCorrectNetwork ? (
          <>
            <p className="mb-6 text-gray-300">
              Please switch to the correct network to play this game.
            </p>
            <Button 
              onClick={switchNetwork} 
              disabled={walletLoading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {walletLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightCircle className="mr-2 h-4 w-4" />}
              Switch to Base Network
            </Button>
          </>
        ) : ownsToken === false ? (
          <>
            <p className="mb-6 text-gray-300">
              This wallet does not own Maze Puzzle NFT #{tokenId}. Please connect with the correct wallet.
            </p>
            <Button 
              onClick={connect} 
              disabled={walletLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {walletLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WalletIcon className="mr-2 h-4 w-4" />}
              Try Another Wallet
            </Button>
          </>
        ) : (
          <>
            <p className="mb-6 text-gray-300">
              Verifying ownership...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Render game on canvas
  useEffect(() => {
    if (isLoading || !grid.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = nftTraits.uiTheme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    grid.forEach(cell => {
      const x = cell.i * w;
      const y = cell.j * w;

      // Draw walls
      ctx.strokeStyle = nftTraits.uiTheme.primary;
      ctx.lineWidth = 2;
      
      if (cell.walls[0]) ctx.beginPath(), ctx.moveTo(x, y), ctx.lineTo(x + w, y), ctx.stroke(); // Top
      if (cell.walls[1]) ctx.beginPath(), ctx.moveTo(x + w, y), ctx.lineTo(x + w, y + w), ctx.stroke(); // Right
      if (cell.walls[2]) ctx.beginPath(), ctx.moveTo(x + w, y + w), ctx.lineTo(x, y + w), ctx.stroke(); // Bottom
      if (cell.walls[3]) ctx.beginPath(), ctx.moveTo(x, y + w), ctx.lineTo(x, y), ctx.stroke(); // Left

      // Draw trail
      if (visitedCells.some(c => c.x === cell.i && c.y === cell.j)) {
        ctx.fillStyle = `rgba(${nftTraits.trailColor[0]}, ${nftTraits.trailColor[1]}, ${nftTraits.trailColor[2]}, 0.3)`;
        ctx.fillRect(x, y, w, w);
      }
    });

    // Draw goal
    if (goal) {
      const gx = goal.i * w + w/2;
      const gy = goal.j * w + w/2;
      drawShape(ctx, gx, gy, w/2, 'red', nftTraits.goalShape);
    }

    // Draw player
    if (player) {
      const px = player.i * w + w/2;
      const py = player.j * w + w/2;
      drawShape(ctx, px, py, w/2, 'green', nftTraits.playerShape);
    }
  }, [grid, player, goal, nftTraits, w, visitedCells, drawShape, isLoading]);

  // Register keyboard events for movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          movePlayer(0, -1, e);
          break;
        case 'ArrowRight':
          movePlayer(1, 0, e);
          break;
        case 'ArrowDown':
          movePlayer(0, 1, e);
          break;
        case 'ArrowLeft':
          movePlayer(-1, 0, e);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movePlayer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Render the game
  return (
    <div 
      className="w-full min-h-[calc(100vh-116px)] flex flex-col items-center justify-center p-4 md:p-8"
      style={{ 
        backgroundColor: nftTraits.uiTheme.bg, 
        color: nftTraits.uiTheme.primary, 
        fontFamily: 'monospace' 
      }}
    >
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
          Maze Puzzle #{tokenId}
      </h1>

      {/* Network Warning */}


      {/* Wallet connection status */}
      {!wallet.isConnected && (
  <div className="mb-4">
    <p className="text-sm mb-2 opacity-80">
      You can play right now! Connect your wallet to save your progress.
    </p>
    <Button 
      onClick={connect} 
      className="bg-teal-600 hover:bg-teal-700 text-white"
    >
      <WalletIcon className="mr-2 h-4 w-4" />
      Connect Wallet (optional)
    </Button>
  </div>
)}

      {/* Level Selector */}
      <LevelSelector />

      {/* Game stats */}
      <div className="text-center mb-4">
        <div className="text-lg md:text-xl">
          Time: {currentTime}s | Moves: {moveCount}
        </div>
        <div className="text-sm md:text-base opacity-80">
          Current Level: {currentLevel}
        </div>
      </div>

      {/* Loading state */}
      {(isLoading || walletLoading) && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading game data...</span>
        </div>
      )}

      {/* Game canvas */}
      <canvas 
        ref={canvasRef}
        width={600}
        height={600}
        className="border-2 rounded-lg touch-none"
        style={{ 
          borderColor: nftTraits.uiTheme.primary,
          touchAction: 'none',
          display: isLoading ? 'none' : 'block'
        }}
        onTouchStart={(e) => e.preventDefault()}
      />

      {/* Game won overlay */}
      {gameWon && <GameWonOverlay />}

      {/* Ownership validation overlay */}
     {/* {!isLoading && !walletLoading && ownsToken === false && <OwnershipValidationOverlay />} */}

      {/* Mobile controls */}
      <div className="mt-6 grid grid-cols-3 gap-2 max-w-xs touch-none">
        <div></div>
        <button 
          onTouchStart={(e) => { e.preventDefault(); movePlayer(0, -1, e.nativeEvent); }}
          onMouseDown={() => movePlayer(0, -1)}
          className="p-4 rounded border-2 flex items-center justify-center touch-none"
          style={{ 
            borderColor: nftTraits.uiTheme.primary, 
            color: nftTraits.uiTheme.primary 
          }}
         
        >
          ↑
        </button>
        <div></div>
        
        <button 
          onTouchStart={(e) => { e.preventDefault(); movePlayer(-1, 0, e.nativeEvent); }}
          onMouseDown={() => movePlayer(-1, 0)}
          className="p-4 rounded border-2 flex items-center justify-center touch-none"
          style={{ 
            borderColor: nftTraits.uiTheme.primary, 
            color: nftTraits.uiTheme.primary 
          }}
          disabled={!ownsToken}
        >
          ←
        </button>
        
        <button 
          onTouchStart={(e) => { e.preventDefault(); resetGame(currentLevel); }}
          onMouseDown={() => resetGame(currentLevel)}
          className="p-4 rounded border-2 flex items-center justify-center touch-none"
          style={{ 
            borderColor: nftTraits.uiTheme.primary, 
            color: nftTraits.uiTheme.primary 
          }}
          disabled={!ownsToken}
        >
          ↻
        </button>
        
        <button 
          onTouchStart={(e) => { e.preventDefault(); movePlayer(1, 0, e.nativeEvent); }}
          onMouseDown={() => movePlayer(1, 0)}
          className="p-4 rounded border-2 flex items-center justify-center touch-none"
          style={{ 
            borderColor: nftTraits.uiTheme.primary, 
            color: nftTraits.uiTheme.primary 
          }}
          disabled={!ownsToken}
        >
          →
        </button>
        
        <div></div>
        <button 
          onTouchStart={(e) => { e.preventDefault(); movePlayer(0, 1, e.nativeEvent); }}
          onMouseDown={() => movePlayer(0, 1)}
          className="p-4 rounded border-2 flex items-center justify-center touch-none"
          style={{ 
            borderColor: nftTraits.uiTheme.primary, 
            color: nftTraits.uiTheme.primary 
          }}
          disabled={!ownsToken}
        >
          ↓
        </button>
        <div></div>
      </div>

      {/* NFT Traits Display */}
      <div className="mt-6 text-center">
        <p>Use arrow keys or buttons to move</p>
        <p className="mt-2 text-sm opacity-80">
          Player: {nftTraits.playerShape} | 
          Goal: {nftTraits.goalShape} | 
          Trail: {(() => {
            const colorNames: {[key: string]: string} = {
              '150,0,255': 'Purple',
              '255,105,180': 'Hot Pink',
              '0,191,255': 'Deep Sky Blue',
              '255,215,0': 'Gold',
              '50,205,50': 'Lime Green',
              '255,127,80': 'Coral'
            };
            return colorNames[nftTraits.trailColor.join(',')] || 'Purple';
          })()} | 
          Theme: {nftTraits.uiTheme.name}
        </p>
      </div>
    </div>
  );
};

export default MazeGame;