// app/api/atlas-image/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_NETWORKS, DEFAULT_NETWORK_VISUAL_DATA } from '@/Maps3d/data/DefaultNetworks';
import { TerritoryType } from '@/Maps3d/types/Territory';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';

// Função para gerar seed visual
const generateSeed = (tokenId: number, networkId: string): number => {
  let hash = 0;
  const str = `${tokenId}-${networkId}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Converter para inteiro de 32 bits
  }
  return Math.abs(hash);
};

// Cor hexadecimal para RGB
const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Desenha um hexágono
const drawHexagon = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  color: string,
  borderColor: string
) => {
  const corners = 6;
  const angle = (2 * Math.PI) / corners;
  
  ctx.beginPath();
  for (let i = 0; i < corners; i++) {
    const cornerX = x + size * Math.cos(angle * i);
    const cornerY = y + size * Math.sin(angle * i);
    if (i === 0) {
      ctx.moveTo(cornerX, cornerY);
    } else {
      ctx.lineTo(cornerX, cornerY);
    }
  }
  ctx.closePath();
  
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
};

// Desenha um círculo (ilha)
const drawCircle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  borderColor: string
) => {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
};

// Desenha uma forma de península
const drawPeninsula = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  borderColor: string
) => {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y - size * 0.5);
  ctx.lineTo(x + size, y + size * 0.5);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.5, y);
  ctx.closePath();
  
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
};

// Desenha montanhas
const drawMountains = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  borderColor: string
) => {
  // Base
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
  ctx.fill();
  
  // Montanhas
  ctx.beginPath();
  ctx.moveTo(x - size, y + size * 0.2);
  ctx.lineTo(x - size * 0.3, y - size * 0.8);
  ctx.lineTo(x + size * 0.3, y - size * 0.3);
  ctx.lineTo(x + size, y + size * 0.2);
  ctx.closePath();
  
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
};

// Desenha um grupo de ilhas (arquipélago)
const drawArchipelago = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  borderColor: string
) => {
  // Base de água
  ctx.beginPath();
  ctx.arc(x, y, size * 1.2, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
  ctx.fill();
  
  // Ilhas
  const islandCount = 5;
  for (let i = 0; i < islandCount; i++) {
    const angle = (i / islandCount) * Math.PI * 2;
    const islandX = x + Math.cos(angle) * size * 0.7;
    const islandY = y + Math.sin(angle) * size * 0.7;
    const islandSize = size * (0.2 + Math.random() * 0.3);
    
    ctx.beginPath();
    ctx.arc(islandX, islandY, islandSize, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = islandSize * 0.1;
    ctx.stroke();
  }
};

// Desenha um deserto
const drawDesert = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  borderColor: string
) => {
  // Base
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
  
  // Dunas
  for (let i = 0; i < 3; i++) {
    const duneX = x + (Math.random() - 0.5) * size;
    const duneY = y + (Math.random() - 0.5) * size;
    const duneSize = size * 0.3;
    
    ctx.beginPath();
    ctx.arc(duneX, duneY, duneSize, 0, Math.PI, true);
    ctx.fillStyle = borderColor;
    ctx.fill();
  }
};

// Desenha uma floresta
const drawForest = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  borderColor: string
) => {
  // Base
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
  
  // Árvores
  const treeCount = 7;
  for (let i = 0; i < treeCount; i++) {
    const treeX = x + (Math.random() - 0.5) * size * 1.5;
    const treeY = y + (Math.random() - 0.5) * size * 1.5;
    
    // Tronco
    ctx.beginPath();
    ctx.rect(treeX - size * 0.05, treeY - size * 0.2, size * 0.1, size * 0.4);
    ctx.fillStyle = '#8B4513';
    ctx.fill();
    
    // Copa
    ctx.beginPath();
    ctx.arc(treeX, treeY - size * 0.3, size * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#228B22';
    ctx.fill();
  }
};

// Desenha conexões entre territórios
const drawConnections = (
  ctx: CanvasRenderingContext2D,
  territories: any[],
  connections: any[]
) => {
  const territoryMap = new Map();
  territories.forEach(t => {
    territoryMap.set(t.id, { x: t.x, y: t.y });
  });
  
  connections.forEach(connection => {
    const source = territoryMap.get(connection.source);
    const target = territoryMap.get(connection.target);
    
    if (source && target) {
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      
      // Criar uma curva suave
      const controlX = (source.x + target.x) / 2;
      const controlY = (source.y + target.y) / 2 - 30;
      
      ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
      
      ctx.strokeStyle = connection.color || '#b98b56';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  });
};

// API para gerar imagem do Atlas NFT
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenId = parseInt(params.id);
    
    // Criar canvas
    const width = 1200;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#f5e9c9';
    ctx.fillRect(0, 0, width, height);
    
    // Desenhar oceano
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(207, 232, 252, 0.5)';
    ctx.fill();
    
    // Borda
    ctx.strokeStyle = '#b98b56';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.47, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Título do NFT
    ctx.font = 'bold 60px Georgia';
    ctx.fillStyle = '#5d4037';
    ctx.textAlign = 'center';
    ctx.fillText(`Crypto Atlas #${tokenId}`, width / 2, 100);
    
    // Converter redes para renderizar no mapa
    const territories: any[] = [];
    const fusionLevel = (tokenId % 5) || 1;
    
    // Calcular posições para os territórios
    Object.entries(DEFAULT_NETWORKS).forEach(([id, network], index) => {
      const visualSeed = generateSeed(tokenId, id);
      const angle = (index / Object.keys(DEFAULT_NETWORKS).length) * Math.PI * 2;
      const distance = width * 0.28;
      
      // Para território principal (Ethereum), fica no centro
      const x = id === 'ethereum' 
        ? width / 2
        : width / 2 + Math.cos(angle) * distance;
      const y = id === 'ethereum'
        ? height / 2
        : height / 2 + Math.sin(angle) * distance;
      
      const sizeScale = DEFAULT_NETWORK_VISUAL_DATA[id]?.size / 100 || 0.5;
      const size = width * 0.08 * sizeScale * (1 + (fusionLevel * 0.1));
      
      territories.push({
        id,
        x,
        y,
        size,
        type: network.type,
        color: network.color,
        borderColor: network.borderColor,
        visualSeed
      });
    });
    
    // Desenhar conexões
    const DEFAULT_NETWORK_CONNECTIONS = [
      { source: 'ethereum', target: 'base' },
      { source: 'ethereum', target: 'polygon' },
      { source: 'ethereum', target: 'arbitrum' },
      { source: 'ethereum', target: 'avalanche' },
      { source: 'ethereum', target: 'optimism' },
      { source: 'ethereum', target: 'zksync' }
    ];
    
    drawConnections(ctx, territories, DEFAULT_NETWORK_CONNECTIONS);
    
    // Desenhar os territórios
    territories.forEach(territory => {
      switch (territory.type) {
        case TerritoryType.MAINLAND:
          drawHexagon(ctx, territory.x, territory.y, territory.size, 
            territory.color, territory.borderColor);
          break;
        case TerritoryType.ISLAND:
          drawCircle(ctx, territory.x, territory.y, territory.size, 
            territory.color, territory.borderColor);
          break;
        case TerritoryType.PENINSULA:
          drawPeninsula(ctx, territory.x, territory.y, territory.size, 
            territory.color, territory.borderColor);
          break;
        case TerritoryType.MOUNTAINS:
          drawMountains(ctx, territory.x, territory.y, territory.size, 
            territory.color, territory.borderColor);
          break;
        case TerritoryType.ARCHIPELAGO:
          drawArchipelago(ctx, territory.x, territory.y, territory.size, 
            territory.color, territory.borderColor);
          break;
        case TerritoryType.DESERT:
          drawDesert(ctx, territory.x, territory.y, territory.size, 
            territory.color, territory.borderColor);
          break;
        case TerritoryType.FOREST:
          drawForest(ctx, territory.x, territory.y, territory.size, 
            territory.color, territory.borderColor);
          break;
      }
    });
    
    // Detalhes do token
    ctx.font = 'bold 28px Georgia';
    ctx.fillStyle = '#5d4037';
    ctx.textAlign = 'left';
    ctx.fillText(`Token ID: ${tokenId}`, 50, height - 150);
    ctx.fillText(`Fusion Level: ${fusionLevel}`, 50, height - 110);
    ctx.fillText(`Territories: ${territories.length}`, 50, height - 70);
    
    // Converter canvas para buffer PNG
    const buffer = canvas.toBuffer('image/png');
    
    // Retornar como imagem
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error generating atlas image:', error);
    return NextResponse.json(
      { error: 'Failed to generate atlas image' },
      { status: 500 }
    );
  }
}
