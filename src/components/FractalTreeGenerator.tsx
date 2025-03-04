"use client";

import MintButton from './MintButton';
import React, { useEffect, useRef, useState, useCallback } from 'react';

const getTreeRenderingScript = (params) => {
  return `
    class FractalTreeNFT {
      constructor(canvasId) {
        // Inicializar canvas
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Parâmetros da árvore
        this.params = ${JSON.stringify(params)};
        
        // Variáveis de animação
        this.animations = {
          growthProgress: ${params.animateGrowth ? 0 : 1},
          windTime: 0,
          particles: []
        };
        
        // Flag para determinar se o crescimento está completo
        this.isGrowthComplete = !${params.animateGrowth};
        
        // Seed para aleatoriedade consistente
        this.randomSeed = 0;
        this.initRandomSeed();
        
        // Iniciar animação
        this.isAnimating = true;
        this.animate();
      }
      
      // Inicializar seed aleatório com base no token
      initRandomSeed() {
        this.randomSeed = this.hashString('${params.tokenId || "FT-" + Math.floor(Math.random() * 1000000)}');
      }
      
      // Função de hash simples para seed aleatório
      hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return hash;
      }
      
      // Pseudo-random generator baseado no seed
      random() {
        this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
        return this.randomSeed / 233280;
      }
      
      // Redimensionar canvas
      resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const { width, height } = container.getBoundingClientRect();
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.width = width;
        this.height = height;
      }
      
      // Loop de animação principal
      animate() {
        if (this.isAnimating) {
          // Atualizar progressão de crescimento
          if (this.params.animateGrowth && this.animations.growthProgress < 1) {
            this.animations.growthProgress += 0.01 * this.params.growthSpeed;
            if (this.animations.growthProgress >= 1) {
              this.animations.growthProgress = 1;
              this.isGrowthComplete = true;
            }
          }
          
          // Atualizar animação de vento - APENAS se houver força de vento ou movimento pós-crescimento ativado
          if ((this.params.windStrength > 0 || this.params.postGrowthMovement) && 
              (this.params.curvature > 0 || this.params.windStrength > 0)) {
            this.animations.windTime += 0.01 * this.params.windSpeed;
          }
          
          // Atualizar partículas
          this.updateParticles();
          
          // Renderizar
          this.render();
          
          // Continuar animação
          requestAnimationFrame(() => this.animate());
        }
      }
      
      // Renderizar a cena
      render() {
        const ctx = this.ctx;
        
        // Limpar canvas
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Desenhar fundo
        this.drawBackground();
        
        // Configurar contexto de desenho
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Desenhar a árvore
        const startX = this.width / 2;
        const startY = this.height;
        const startAngle = -Math.PI / 2; // Para cima
        
        this.drawBranch(
          startX, 
          startY, 
          this.params.initialLength * this.animations.growthProgress, 
          startAngle, 
          this.params.branchWidth,
          0, // Profundidade atual
          0  // Índice do ramo
        );
        
        // Desenhar partículas
        this.drawParticles();
      }
      
      // Desenhar o fundo
      drawBackground() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        switch (this.params.backgroundColor) {
          case 'dark':
            ctx.fillStyle = '#0c1016';
            ctx.fillRect(0, 0, width, height);
            break;
            
          case 'light':
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, width, height);
            break;
            
          case 'gradient':
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#0d1b2a');
            gradient.addColorStop(1, '#1b263b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            break;
            
          case 'starfield':
            // Fundo escuro
            ctx.fillStyle = '#050a15';
            ctx.fillRect(0, 0, width, height);
            
            // Desenhar estrelas
            const starCount = 200;
            ctx.fillStyle = 'white';
            
            for (let i = 0; i < starCount; i++) {
              const x = Math.random() * width;
              const y = Math.random() * height;
              const size = Math.random() * 2;
              
              ctx.globalAlpha = 0.1 + Math.random() * 0.9;
              ctx.beginPath();
              ctx.arc(x, y, size, 0, Math.PI * 2);
              ctx.fill();
            }
            
            ctx.globalAlpha = 1;
            break;
        }
      }
      
      // Desenhar um ramo da árvore fractal
      drawBranch(x, y, length, angle, width, depth, branchIndex) {
        if (depth >= this.params.maxDepth || length < 1) return;
        
        const ctx = this.ctx;
        const params = this.params;
        
        // Usar um seed consistente baseado na posição e profundidade para curvatura
        const curveSeed = this.hashString(\`\${x}-\${y}-\${depth}-\${branchIndex}\`);
        
        // Aplicar efeito de vento
        let windEffect = 0;
        if (this.isGrowthComplete && (params.postGrowthMovement || params.windStrength > 0.01)) {
          const windForce = Math.sin(this.animations.windTime + x * 0.01) * params.windStrength;
          windEffect = windForce * (depth / params.maxDepth);
        }
        
        // Calcular ponto final considerando curvatura
        let endX, endY;
        
        if (params.curvature > 0) {
          // Gerar uma direção de curvatura consistente baseada no seed
          const curveDirection = curveSeed % 2 === 0 ? 1 : -1;
          
          // Aplicar curvatura ao ramo de forma mais suave e consistente
          const curveControl = params.curvature * curveDirection * 50;
          const controlX = x + Math.cos(angle + Math.PI/2 * curveDirection) * curveControl + Math.cos(angle) * length * 0.5;
          const controlY = y + Math.sin(angle + Math.PI/2 * curveDirection) * curveControl + Math.sin(angle) * length * 0.5;
          
          endX = x + Math.cos(angle + windEffect) * length;
          endY = y + Math.sin(angle + windEffect) * length;
          
          // Desenhar o ramo com curvatura
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
          
          // Definir cor baseada na profundidade e esquema de cores
          ctx.strokeStyle = this.getBranchColor(depth);
          
          // Largura da linha diminui com a profundidade
          const strokeWidth = width * (1 - depth / params.maxDepth * 0.7);
          ctx.lineWidth = Math.max(1, strokeWidth);
          
          ctx.stroke();
        } else {
          // Ramo reto
          endX = x + Math.cos(angle + windEffect) * length;
          endY = y + Math.sin(angle + windEffect) * length;
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          
          ctx.strokeStyle = this.getBranchColor(depth);
          ctx.lineWidth = Math.max(1, width * (1 - depth / params.maxDepth * 0.7));
          ctx.stroke();
        }
        
        // Desenhar folhas nos ramos finais
        if (params.drawLeaves && depth >= this.params.maxDepth - 2) {
          // Desenhar múltiplas folhas para maior visibilidade
          const leafCount = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < leafCount; i++) {
            this.drawLeaf(endX, endY, depth);
          }
        }
        
        // Calcular tamanho do próximo ramo
        const nextLength = length * params.lengthRatio;
        const nextWidth = width * 0.7;
        
        // Desenhar ramos filhos recursivamente
        for (let i = 0; i < params.branches; i++) {
          let branchAngle;
          
          if (params.symmetrical) {
            // Distribuir ângulos simetricamente
            const angleStep = Math.PI * params.branchAngle / 180;
            const baseAngle = angle - (angleStep * (params.branches - 1)) / 2;
            branchAngle = baseAngle + i * angleStep;
          } else {
            // Melhorar distribuição não simétrica
            const angleStep = Math.PI * params.branchAngle / 180;
            const baseAngle = angle - (angleStep * (params.branches - 1)) / 2;
            
            // Aplicar aleatoriedade ao ângulo de cada ramo
            const randomFactor = params.randomness * (this.random() * 2 - 1);
            const randomVariation = baseAngle * randomFactor * 0.3;
            
            // Calcular ângulo com aleatoriedade, mas ainda bem distribuído
            branchAngle = baseAngle + i * angleStep + randomVariation;
          }
          
          // Adicionar aleatorização extra ao comprimento se desejado
          const lengthVariation = 1 + (params.randomness > 0 ? (this.random() * 2 - 1) * params.randomness * 0.4 : 0);
          
          this.drawBranch(
            endX, 
            endY, 
            nextLength * lengthVariation, 
            branchAngle, 
            nextWidth,
            depth + 1,
            i
          );
        }
      }
      
      drawLeaf(x, y, depth) {
        const ctx = this.ctx;
        const leafSize = 4 + Math.random() * 3;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Rotação aleatória
        ctx.rotate(Math.random() * Math.PI * 2);
        
        // Cor da folha
        ctx.fillStyle = this.getLeafColor(depth / this.params.maxDepth);
        
        if (Math.random() > 0.5) {
          // Desenhar como círculo (flor)
          ctx.beginPath();
          ctx.arc(0, 0, leafSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Desenhar como oval (folha)
          ctx.beginPath();
          ctx.ellipse(0, 0, leafSize, leafSize * 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
      
      // Obter cor para um ramo baseado na profundidade e no esquema de cores
      getBranchColor(depth) {
        const normalizedDepth = depth / this.params.maxDepth;
        
        switch (this.params.colorScheme) {
          case 'gradient':
            // Gradiente natural marrom -> verde
            const hue = this.params.hueStart - normalizedDepth * this.params.hueRange;
            const saturation = this.params.saturation;
            const lightness = this.params.lightness - normalizedDepth * 20;
            return \`hsl(\${hue}, \${saturation}%, \${lightness}%)\`;
            
          case 'rainbow':
            // Espectro de cores do arco-íris
            const rainbowHue = (this.params.hueStart + normalizedDepth * 360) % 360;
            return \`hsl(\${rainbowHue}, \${this.params.saturation}%, \${this.params.lightness}%)\`;
            
          case 'autumn':
            // Cores de outono (vermelho, laranja, amarelo)
            const autumnHue = 30 + normalizedDepth * 30;
            return \`hsl(\${autumnHue}, \${this.params.saturation}%, \${this.params.lightness}%)\`;
            
          case 'monochrome':
            // Escala de cinza baseada na profundidade
            const shade = 100 - normalizedDepth * 60;
            return \`hsl(0, 0%, \${shade}%)\`;
            
          case 'neon':
            // Cores neon vibrantes
            const neonHue = (this.params.hueStart + normalizedDepth * this.params.hueRange) % 360;
            return \`hsl(\${neonHue}, \${this.params.saturation + 20}%, \${this.params.lightness + 10}%)\`;
            
          default:
            return '#4ecca3';
        }
      }
      
      // Obter cor para folhas
      getLeafColor(depthFactor) {
        switch (this.params.colorScheme) {
          case 'gradient':
            return \`hsl(\${this.params.hueStart - 20}, \${this.params.saturation + 10}%, \${this.params.lightness + 10}%)\`;
            
          case 'rainbow':
            const rainbowHue = (this.params.hueStart + depthFactor * 180) % 360;
            return \`hsl(\${rainbowHue}, \${this.params.saturation}%, \${this.params.lightness + 10}%)\`;
            
          case 'autumn':
            const autumnHue = 20 + depthFactor * 20;
            return \`hsl(\${autumnHue}, \${this.params.saturation + 20}%, \${this.params.lightness + 10}%)\`;
            
          case 'monochrome':
            return \`hsl(0, 0%, \${80 - depthFactor * 20}%)\`;
            
          case 'neon':
            const neonHue = (this.params.hueStart + 120) % 360;
            return \`hsl(\${neonHue}, 100%, 70%)\`;
            
          default:
            return '#4ecca3';
        }
      }
      
      // Criar partícula
      createParticle() {
        // Encontrar posição aleatória da árvore
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.params.initialLength * 0.7;
        
        const x = this.width / 2 + Math.cos(angle) * distance;
        const y = this.height - this.params.initialLength * 0.2 + Math.sin(angle) * distance;
        
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * -1 - 0.5,
          color: this.getLeafColor(Math.random()),
          size: 2 + Math.random() * 3,
          life: 100 + Math.random() * 100,
          rotation: Math.random() * Math.PI * 2
        };
      }
      
      // Atualizar partículas
      updateParticles() {
        // Remover partículas mortas
        this.animations.particles = this.animations.particles.filter(p => p.life > 0);
        
        // Adicionar novas partículas se necessário
        if (this.params.particleAmount > 0 && this.animations.growthProgress > 0.5) {
          const newParticlesCount = Math.floor(this.params.particleAmount / 20);
          
          for (let i = 0; i < newParticlesCount; i++) {
            if (this.animations.particles.length < this.params.particleAmount && Math.random() > 0.7) {
              this.animations.particles.push(this.createParticle());
            }
          }
        }
        
        // Atualizar partículas existentes
        for (const particle of this.animations.particles) {
          // Mover partícula
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Aplicar gravidade suave
          particle.vy += 0.01;
          
          // Aplicar resistência do ar
          particle.vx *= 0.99;
          particle.vy *= 0.99;
          
          // Reduzir vida
          particle.life -= 1;
          
          // Reduzir tamanho
          particle.size *= 0.99;
        }
      }
      
      // Desenhar partículas
      drawParticles() {
        const ctx = this.ctx;
        
        for (const particle of this.animations.particles) {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          
          // Definir cor e transparência
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.life / 200;
          
          // Desenhar partícula
          ctx.beginPath();
          ctx.ellipse(0, 0, particle.size, particle.size * 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
        
        ctx.globalAlpha = 1;
      }
    }
    
    // Inicializar a árvore fractal quando o documento carregar
    document.addEventListener('DOMContentLoaded', () => {
      const fractalTree = new FractalTreeNFT('treeCanvas');
      
      // Expor a instância globalmente para depuração, se necessário
      window.fractalTree = fractalTree;
    });
  `;
};



const FractalTreeGenerator = () => {
  const canvasRef = useRef(null);
  const [tokenId, setTokenId] = useState('FT-129873');
  const [complexityScore, setComplexityScore] = useState('78.5%');
const [isFullScreen, setIsFullScreen] = useState(false);

const toggleFullScreen = useCallback(() => {
  try {
    const canvas = canvasRef.current;
    const container = canvas?.closest('.canvas-container');

    if (!document.fullscreenElement) {
      if (container?.requestFullscreen) {
        container.requestFullscreen();
        setIsFullScreen(true);
      } else if ((container as any)?.mozRequestFullScreen) { // Firefox
        (container as any).mozRequestFullScreen();
        setIsFullScreen(true);
      } else if ((container as any)?.webkitRequestFullscreen) { // Chrome, Safari and Opera
        (container as any)?.webkitRequestFullscreen();
        setIsFullScreen(true);
      } else if ((container as any)?.msRequestFullscreen) { // IE/Edge
        (container as any)?.msRequestFullscreen();
        setIsFullScreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      } else if ((document as any).mozCancelFullScreen) { // Firefox
        (document as any).mozCancelFullScreen();
        setIsFullScreen(false);
      } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari and Opera
        (document as any).webkitExitFullscreen();
        setIsFullScreen(false);
      } else if ((document as any).msExitFullscreen) { // IE/Edge
        (document as any).msExitFullscreen();
        setIsFullScreen(false);
      }
    }
  } catch (error) {
    console.error('Fullscreen toggle error:', error);
  }
}, []);

// Adicionar listener de eventos de fullscreen
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullScreen(!!document.fullscreenElement);
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);

  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  };
}, []);
  
  // State para todos os parâmetros
  const [params, setParams] = useState({
    // Estrutura da árvore
    branches: 2,
    maxDepth: 8,
    lengthRatio: 0.7,
    branchAngle: 35,
    initialLength: 130,
    branchWidth: 8,
    randomness: 0.3,
    curvature: 0.2,
    symmetrical: true,
    
    // Aparência
    colorScheme: 'gradient',
    hueStart: 120,
    hueRange: 40,
    saturation: 70,
    lightness: 50,
    backgroundColor: 'dark',
    drawLeaves: false,
    
    // Animação & Efeitos
    windStrength: 0.8,
    windSpeed: 1,
    growthSpeed: 1,
    particleAmount: 0,
    animateGrowth: true,
    postGrowthMovement: true
  });

  // Use refs para estado de animação para evitar re-renderizações
  const animationsRef = useRef({
    growthProgress: 0,
    windTime: 0,
    particles: []
  });
  const [isAnimating, setIsAnimating] = useState(true);
  const isGrowthCompleteRef = useRef(false);
  
  // Referências para animação e canvas
  const animationRef = useRef<number | null>(null);
  const fractalTreeRef = useRef<any>(null);
  const randomSeedRef = useRef<number>(0);





const captureTreeImage = async () => {
  if (!canvasRef.current) {
    console.error("Canvas ref is null or undefined");
    return {
      imageDataURL: "", 
      params: {
        ...params,
        tokenId: tokenId
      }
    };
  }

  // Pausar animação
  const wasAnimating = isAnimating;
  setIsAnimating(false);

  // Garantir que a árvore esteja completamente crescida
  animationsRef.current.growthProgress = 1;
  isGrowthCompleteRef.current = true;

  // Forçar uma renderização final
  if (fractalTreeRef.current) {
    fractalTreeRef.current.render();
  }

  // Criar um canvas temporário para redimensionamento
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  // Tamanho reduzido - ajuste conforme necessário
  const targetWidth = 400;
  const scaleFactor = targetWidth / canvasRef.current.width;
  
  tempCanvas.width = targetWidth;
  tempCanvas.height = canvasRef.current.height * scaleFactor;

  // Desenhar o canvas original redimensionado no canvas temporário
  if (tempCtx) {
    tempCtx.scale(scaleFactor, scaleFactor);
    tempCtx.drawImage(canvasRef.current, 0, 0);
  }

  // Capturar imagem reduzida com qualidade comprimida
  const imageDataURL = tempCanvas.toDataURL('image/jpeg', 0.6);

  // Restaurar estado de animação
  setIsAnimating(wasAnimating);

  return {
    imageDataURL,
    params: {
      ...params,
      tokenId: tokenId
    }
  };
};
  
  // Gerar token ID
  const generateTokenId = useCallback(() => {
    return 'FT-' + Math.floor(Math.random() * 1000000).toString();
  }, []);
  
  // Função de hash simples para seed
  const hashString = useCallback((str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }, []);
  
  // Atualizar score de complexidade
  const updateComplexityScore = useCallback(() => {
    const baseScore = 50;
    let complexity = baseScore;
    
    // Adicionar complexidade baseada nos parâmetros
    complexity += Math.pow(params.branches, 1.5) * 3;
    complexity += params.maxDepth * 2;
    complexity += params.randomness * 20;
    complexity += params.drawLeaves ? 10 : 0;
    complexity += params.curvature * 15;
    complexity += params.particleAmount / 5;
    
    // Limitar entre 0-100
    complexity = Math.min(100, Math.max(0, complexity));
    
    setComplexityScore(complexity.toFixed(1) + '%');
  }, [params]);
  
  // Aplicar preset
  const applyPreset = useCallback((presetName: string) => {
    const presets = {
      classic: {
        branches: 2,
        maxDepth: 9,
        lengthRatio: 0.7,
        branchAngle: 35,
        initialLength: 130,
        branchWidth: 8,
        randomness: 0.1,
        curvature: 0.1,
        symmetrical: true,
        colorScheme: 'gradient',
        hueStart: 120,
        hueRange: 40,
        saturation: 70,
        lightness: 50,
        backgroundColor: 'dark',
        drawLeaves: false,
        windStrength: 0.8,
        windSpeed: 1
      },
      bonsai: {
        branches: 3,
        maxDepth: 7,
        lengthRatio: 0.6,
        branchAngle: 25,
        initialLength: 80,
        branchWidth: 12,
        randomness: 0.5,
        curvature: 0.4,
        symmetrical: false,
        colorScheme: 'gradient',
        hueStart: 30,
        hueRange: 10,
        saturation: 60,
        lightness: 40,
        backgroundColor: 'light',
        drawLeaves: true,
        windStrength: 0.05,
        windSpeed: 0.5
      },
      winter: {
        branches: 2,
        maxDepth: 10,
        lengthRatio: 0.75,
        branchAngle: 30,
        initialLength: 120,
        branchWidth: 5,
        randomness: 0.2,
        curvature: 0.05,
        symmetrical: false,
        colorScheme: 'monochrome',
        hueStart: 220,
        hueRange: 0,
        saturation: 10,
        lightness: 70,
        backgroundColor: 'gradient',
        drawLeaves: false,
        windStrength: 0.1,
        windSpeed: 1.5
      },
      'cherry-blossom': {
        branches: 2,
        maxDepth: 9,
        lengthRatio: 0.7,
        branchAngle: 40,
        initialLength: 110,
        branchWidth: 6,
        randomness: 0.3,
        curvature: 0.3,
        symmetrical: false,
        colorScheme: 'gradient',
        hueStart: 340,
        hueRange: 40,
        saturation: 80,
        lightness: 70,
        backgroundColor: 'light',
        drawLeaves: true,
        windStrength: 0.3,
        windSpeed: 1.2
      },
      alien: {
        branches: 3,
        maxDepth: 6,
        lengthRatio: 0.8,
        branchAngle: 70,
        initialLength: 100,
        branchWidth: 10,
        randomness: 0.3,
        curvature: 0.6,
        symmetrical: false,
        colorScheme: 'neon',
        hueStart: 160,
        hueRange: 140,
        saturation: 90,
        lightness: 60,
        backgroundColor: 'dark',
        drawLeaves: true,
        windStrength: 0.4,
        windSpeed: 0.8
      },
      fractal: {
        branches: 4,
        maxDepth: 8,
        lengthRatio: 0.7,
        branchAngle: 90,
        initialLength: 100,
        branchWidth: 6,
        randomness: 0,
        curvature: 0,
        symmetrical: true,
        colorScheme: 'rainbow',
        hueStart: 0,
        hueRange: 360,
        saturation: 90,
        lightness: 50,
        backgroundColor: 'dark',
        drawLeaves: false,
        windStrength: 0,
        windSpeed: 0
      },
      willow: {
        branches: 2,
        maxDepth: 10,
        lengthRatio: 0.8,
        branchAngle: 25,
        initialLength: 120,
        branchWidth: 10,
        randomness: 0.4,
        curvature: 0.8,
        symmetrical: false,
        colorScheme: 'gradient',
        hueStart: 80,
        hueRange: 40,
        saturation: 60,
        lightness: 45,
        backgroundColor: 'gradient',
        drawLeaves: true,
        windStrength: 0.6,
        windSpeed: 1.2
      },
      palm: {
        branches: 1,
        maxDepth: 4,
        lengthRatio: 0.9,
        branchAngle: 40,
        initialLength: 150,
        branchWidth: 15,
        randomness: 0.2,
        curvature: 0.6,
        symmetrical: false,
        colorScheme: 'gradient',
        hueStart: 90,
        hueRange: 20,
        saturation: 70,
        lightness: 40,
        backgroundColor: 'starfield',
        drawLeaves: true,
        windStrength: 0.3,
        windSpeed: 1.5
      }
    };
    
    if (presets[presetName]) {
      setParams(prev => ({
        ...prev,
        ...presets[presetName]
      }));
      
      // Reset animation if needed
      if (params.animateGrowth) {
        animationsRef.current.growthProgress = 0;
        isGrowthCompleteRef.current = false;
      } else {
        animationsRef.current.growthProgress = 1;
        isGrowthCompleteRef.current = true;
      }
    }
  }, [params.animateGrowth]);
  
  // Get hue name
  const getHueName = useCallback((hue: number) => {
    const hueNames = [
      {range: [0, 20], name: 'Red'},
      {range: [20, 40], name: 'Orange-Red'},
      {range: [40, 60], name: 'Orange'},
      {range: [60, 80], name: 'Yellow'},
      {range: [80, 140], name: 'Green'},
      {range: [140, 180], name: 'Cyan'},
      {range: [180, 220], name: 'Light Blue'},
      {range: [220, 260], name: 'Blue'},
      {range: [260, 280], name: 'Purple'},
      {range: [280, 320], name: 'Magenta'},
      {range: [320, 350], name: 'Pink'},
      {range: [350, 360], name: 'Red'}
    ];
    
    for (const {range, name} of hueNames) {
      if (hue >= range[0] && hue < range[1]) {
        return name;
      }
    }
    
    return 'Unknown';
  }, []);
  
  // Generate new tree
  const generateNewTree = useCallback(() => {
    const newTokenId = generateTokenId();
    setTokenId(newTokenId);
    randomSeedRef.current = hashString(newTokenId);
    
    // Reset animation
    if (params.animateGrowth) {
      animationsRef.current.growthProgress = 0;
      isGrowthCompleteRef.current = false;
    }
    
    updateComplexityScore();
  }, [generateTokenId, hashString, params.animateGrowth, updateComplexityScore]);
  
  // Download as PNG
  const downloadAsPNG = useCallback(() => {
    if (!canvasRef.current) return;
    
    // Pause animation
    const wasAnimating = isAnimating;
    setIsAnimating(false);
    
    // Ensure tree is fully grown
    const previousProgress = animationsRef.current.growthProgress;
    animationsRef.current.growthProgress = 1;
    
    // Render once to get full image
    if (fractalTreeRef.current) {
      fractalTreeRef.current.render();
    }
    
    // Create download link
    const link = document.createElement('a');
    link.download = `fractal-tree-${tokenId}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    
    // Restore state
    animationsRef.current.growthProgress = previousProgress;
    setIsAnimating(wasAnimating);
  }, [isAnimating, tokenId]);
  
  // Calculate max recursion depth based on branch count
  const getMaxRecursionDepth = useCallback((branchCount: number) => {
    switch (branchCount) {
      case 2: return 12;
      case 3: return 10;
      case 4: return 8;
      case 5: return 7;
      default: return 12;
    }
  }, []);

  // Function to generate and download HTML
  const generateHTMLFromCurrentParams = useCallback(() => {
    // Criar uma cópia dos parâmetros para a exportação, garantindo que tokenId está incluído
    const exportParams = {
      ...params,
      tokenId: tokenId
    };
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fractal Tree - ${tokenId}</title>
    <style>
        body { 
            margin: 0; 
            padding: 0;
            display: flex; 
            flex-direction: column;
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            background-color: #0c1016; 
            font-family: Arial, sans-serif;
            color: #e0e0e0;
        }
        .container {
            width: 100%;
            max-width: 800px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .header {
            width: 100%;
            text-align: center;
            margin-bottom: 20px;
        }
        h1 {
            color: #4ecca3;
            font-weight: 300;
            margin-bottom: 10px;
        }
        .canvas-container { 
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 100%; /* Aspect ratio 1:1 */
            background-color: #000;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(78, 204, 163, 0.2);
            margin-bottom: 20px;
        }
        canvas { 
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        .info {
            display: flex;
            justify-content: space-between;
            width: 100%;
            background-color: rgba(78, 204, 163, 0.1);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid rgba(78, 204, 163, 0.3);
        }
        .token-id {
            color: #4ecca3;
            font-weight: bold;
        }
        .controls {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        button {
            background-color: #4ecca3;
            color: #0c1016;
            border: none;
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        button:hover {
            background-color: #3dbb92;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Fractal Tree NFT</h1>
        </div>
        
        <div class="info">
            <div>
                <span class="token-id">Token ID: ${tokenId}</span>
            </div>
            <div>
                <span>Complexity: ${complexityScore}</span>
            </div>
        </div>
        
        <div class="canvas-container">
            <canvas id="treeCanvas" width="800" height="800"></canvas>
        </div>
        
        <div class="controls">
            <button id="resetBtn">Reset Animation</button>
            <button id="downloadBtn">Download as PNG</button>
        </div>
    </div>

    <script>
    ${getTreeRenderingScript(exportParams)}
    
    // Adicionar controles
    document.getElementById('resetBtn').addEventListener('click', function() {
        // Reiniciar a animação
        if (window.fractalTree) {
            window.fractalTree.animations.growthProgress = 0;
            window.fractalTree.isGrowthComplete = false;
        }
    });
    
    document.getElementById('downloadBtn').addEventListener('click', function() {
        // Download como PNG
        const canvas = document.getElementById('treeCanvas');
        const link = document.createElement('a');
        link.download = \`fractal-tree-${tokenId}.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fractal-tree-${tokenId}.html`;
    link.click();
  }, [params, tokenId, complexityScore]);

  // Handle parameter changes
  const handleParamChange = useCallback((paramName: string, value: any) => {
    setParams(prev => {
      const newParams = { ...prev, [paramName]: value };
      
      // If branch count is changing, adjust max depth if needed
      if (paramName === 'branches') {
        const maxAllowedDepth = getMaxRecursionDepth(value);
        if (newParams.maxDepth > maxAllowedDepth) {
          newParams.maxDepth = maxAllowedDepth;
        }
      }
      
      return newParams;
    });
    
    if (paramName === 'animateGrowth' && !value) {
      animationsRef.current.growthProgress = 1;
      isGrowthCompleteRef.current = true;
    }
  }, [getMaxRecursionDepth]);
  
  // Esta função inicializa diretamente o canvas
  const initializeCanvas = useCallback(() => {
    const canvas = document.getElementById('treeCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    console.log("Inicializando canvas diretamente...");

    // Limpar o contexto existente
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Garantir que o canvas tenha o tamanho correto
    const container = canvas.parentElement;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    }

    // Classe FractalTree usando a função construtora para evitar conflitos
    const FractalTree = function(this: any) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.width = canvas.width;
      this.height = canvas.height;
      this.params = params;
      this.randomSeed = hashString(tokenId);
      
      // Variáveis de animação
      this.animations = {
        growthProgress: params.animateGrowth ? 0 : 1,
        windTime: 0,
        particles: []
      };
      
      this.isGrowthComplete = !params.animateGrowth;
      
      // Métodos
      this.hashString = hashString;
      
      this.random = function() {
        this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
        return this.randomSeed / 233280;
      };
      
      this.render = function() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Desenhar fundo
        this.drawBackground();
        
        // Configurar contexto de desenho
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Desenhar a árvore
        const startX = this.width / 2;
        const startY = this.height;
        const startAngle = -Math.PI / 2; // Para cima
        
        this.drawBranch(
          startX, 
          startY, 
          this.params.initialLength * this.animations.growthProgress, 
          startAngle, 
          this.params.branchWidth,
          0, 
          0
        );
        
        // Desenhar partículas
        this.drawParticles();
      };
      
      this.drawBackground = function() {
        const backgroundColor = this.params.backgroundColor || 'dark';
        if (backgroundColor === 'dark') {
          this.ctx.fillStyle = '#0c1016';
          this.ctx.fillRect(0, 0, this.width, this.height);
        } else if (backgroundColor === 'light') {
          this.ctx.fillStyle = '#f5f5f5';
          this.ctx.fillRect(0, 0, this.width, this.height);
        } else if (backgroundColor === 'gradient') {
          const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
          gradient.addColorStop(0, '#0d1b2a');
          gradient.addColorStop(1, '#1b263b');
          this.ctx.fillStyle = gradient;
          this.ctx.fillRect(0, 0, this.width, this.height);
        } else if (backgroundColor === 'starfield') {
          // Fundo escuro
          this.ctx.fillStyle = '#050a15';
          this.ctx.fillRect(0, 0, this.width, this.height);
          
          // Desenhar estrelas
          const starCount = 200;
          this.ctx.fillStyle = 'white';
          
          for (let i = 0; i < starCount; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 2;
            
            this.ctx.globalAlpha = 0.1 + Math.random() * 0.9;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
          }
          
          this.ctx.globalAlpha = 1;
        }
      };
      
      // Métodos de desenho da árvore e outros componentes
      this.getBranchColor = function(depth) {
        const normalizedDepth = depth / this.params.maxDepth;
        const colorScheme = this.params.colorScheme || 'gradient';
        
        switch (colorScheme) {
          case 'gradient':
            // Gradiente natural marrom -> verde
            const hue = this.params.hueStart - normalizedDepth * this.params.hueRange;
            const saturation = this.params.saturation;
            const lightness = this.params.lightness - normalizedDepth * 20;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
          case 'rainbow':
            // Espectro de cores do arco-íris
            const rainbowHue = (this.params.hueStart + normalizedDepth * 360) % 360;
            return `hsl(${rainbowHue}, ${this.params.saturation}%, ${this.params.lightness}%)`;
            
          case 'autumn':
            // Cores de outono (vermelho, laranja, amarelo)
            const autumnHue = 30 + normalizedDepth * 30;
            return `hsl(${autumnHue}, ${this.params.saturation}%, ${this.params.lightness}%)`;
            
          case 'monochrome':
            // Escala de cinza baseada na profundidade
            const shade = 100 - normalizedDepth * 60;
            return `hsl(0, 0%, ${shade}%)`;
            
          case 'neon':
            // Cores neon vibrantes
            const neonHue = (this.params.hueStart + normalizedDepth * this.params.hueRange) % 360;
            return `hsl(${neonHue}, ${this.params.saturation + 20}%, ${this.params.lightness + 10}%)`;
          
          default:
            return '#4ecca3';
        }
      };
      
      this.getLeafColor = function(depthFactor) {
        const colorScheme = this.params.colorScheme || 'gradient';
        
        switch (colorScheme) {
          case 'gradient':
            return `hsl(${this.params.hueStart - 20}, ${this.params.saturation + 10}%, ${this.params.lightness + 10}%)`;
            
          case 'rainbow':
            const rainbowHue = (this.params.hueStart + depthFactor * 180) % 360;
            return `hsl(${rainbowHue}, ${this.params.saturation}%, ${this.params.lightness + 10}%)`;
            
          case 'autumn':
            const autumnHue = 20 + depthFactor * 20;
            return `hsl(${autumnHue}, ${this.params.saturation + 20}%, ${this.params.lightness + 10}%)`;
            
          case 'monochrome':
            return `hsl(0, 0%, ${80 - depthFactor * 20}%)`;
            
          case 'neon':
            const neonHue = (this.params.hueStart + 120) % 360;
            return `hsl(${neonHue}, 100%, 70%)`;
          
          default:
            return '#4ecca3';
        }
      };
      
      this.drawBranch = function(x, y, length, angle, width, depth, branchIndex) {
        if (depth >= this.params.maxDepth || length < 1) return;
        
        // Usar um seed consistente baseado na posição e profundidade para curvatura
        const curveSeed = this.hashString(`${x}-${y}-${depth}-${branchIndex}`);
        
        // Aplicar efeito de vento
        let windEffect = 0;
        if (this.isGrowthComplete && (this.params.postGrowthMovement || this.params.windStrength > 0.01)) {
          const windForce = Math.sin(this.animations.windTime + x * 0.01) * this.params.windStrength;
          windEffect = windForce * (depth / this.params.maxDepth);
        }
        
        // Calcular ponto final
        let endX, endY;
        
        if (this.params.curvature > 0) {
          // Lógica para ramos curvos
          const curveDirection = curveSeed % 2 === 0 ? 1 : -1;
          const curveControl = this.params.curvature * curveDirection * 50;
          const controlX = x + Math.cos(angle + Math.PI/2 * curveDirection) * curveControl + Math.cos(angle) * length * 0.5;
          const controlY = y + Math.sin(angle + Math.PI/2 * curveDirection) * curveControl + Math.sin(angle) * length * 0.5;
          
          endX = x + Math.cos(angle + windEffect) * length;
          endY = y + Math.sin(angle + windEffect) * length;
          
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
          this.ctx.strokeStyle = this.getBranchColor(depth);
          this.ctx.lineWidth = Math.max(1, width * (1 - depth / this.params.maxDepth * 0.7));
          this.ctx.stroke();
        } else {
          // Lógica para ramos retos
          endX = x + Math.cos(angle + windEffect) * length;
          endY = y + Math.sin(angle + windEffect) * length;
          
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(endX, endY);
          this.ctx.strokeStyle = this.getBranchColor(depth);
          this.ctx.lineWidth = Math.max(1, width * (1 - depth / this.params.maxDepth * 0.7));
          this.ctx.stroke();
        }
        
        // Desenhar folhas nos ramos finais
        if (this.params.drawLeaves && depth >= this.params.maxDepth - 2) {
          const leafCount = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < leafCount; i++) {
            this.drawLeaf(endX, endY, depth);
          }
        }
        
        // Calcular próximos ramos
        const nextLength = length * this.params.lengthRatio;
        const nextWidth = width * 0.7;
        
        // Desenhar ramos filhos
        for (let i = 0; i < this.params.branches; i++) {
          let branchAngle;
          
          if (this.params.symmetrical) {
            // Distribuição simétrica
            const angleStep = Math.PI * this.params.branchAngle / 180;
            const baseAngle = angle - (angleStep * (this.params.branches - 1)) / 2;
            branchAngle = baseAngle + i * angleStep;
          } else {
            // Distribuição não simétrica
            const angleStep = Math.PI * this.params.branchAngle / 180;
            const baseAngle = angle - (angleStep * (this.params.branches - 1)) / 2;
            const randomFactor = this.params.randomness * (this.random() * 2 - 1);
            branchAngle = baseAngle + i * angleStep + baseAngle * randomFactor * 0.3;
          }
          
          // Variação de comprimento
          const lengthVariation = 1 + (this.params.randomness > 0 ? (this.random() * 2 - 1) * this.params.randomness * 0.4 : 0);
          
          this.drawBranch(
            endX,
            endY,
            nextLength * lengthVariation,
            branchAngle,
            nextWidth,
            depth + 1,
            i
          );
        }
      };
      
      this.drawLeaf = function(x, y, depth) {
        const leafSize = 4 + Math.random() * 3;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Math.random() * Math.PI * 2);
        this.ctx.fillStyle = this.getLeafColor(depth / this.params.maxDepth);
        
        if (Math.random() > 0.5) {
          // Círculo (flor)
          this.ctx.beginPath();
          this.ctx.arc(0, 0, leafSize, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          // Oval (folha)
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, leafSize, leafSize * 1.5, 0, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        this.ctx.restore();
      };
      
      this.drawParticles = function() {
        for (const particle of this.animations.particles) {
          this.ctx.save();
          this.ctx.translate(particle.x, particle.y);
          this.ctx.rotate(particle.rotation);
          
          this.ctx.fillStyle = particle.color;
          this.ctx.globalAlpha = particle.life / 200;
          
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, particle.size, particle.size * 1.5, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          this.ctx.restore();
        }
        
        this.ctx.globalAlpha = 1;
      };
      
      this.updateParticles = function() {
        // Remover partículas mortas
        this.animations.particles = this.animations.particles.filter(p => p.life > 0);
        
        // Adicionar novas partículas
        if (this.params.particleAmount > 0 && this.animations.growthProgress > 0.5) {
          const newParticlesCount = Math.floor(this.params.particleAmount / 20);
          
          for (let i = 0; i < newParticlesCount; i++) {
            if (this.animations.particles.length < this.params.particleAmount && Math.random() > 0.7) {
              this.animations.particles.push(this.createParticle());
            }
          }
        }
        
        // Atualizar partículas existentes
        for (const particle of this.animations.particles) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.01;
          particle.vx *= 0.99;
          particle.vy *= 0.99;
          particle.life -= 1;
          particle.size *= 0.99;
        }
      };
      
      this.createParticle = function() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.params.initialLength * 0.7;
        
        const x = this.width / 2 + Math.cos(angle) * distance;
        const y = this.height - this.params.initialLength * 0.2 + Math.sin(angle) * distance;
        
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * -1 - 0.5,
          color: this.getLeafColor(Math.random()),
          size: 2 + Math.random() * 3,
          life: 100 + Math.random() * 100,
          rotation: Math.random() * Math.PI * 2
        };
      };
      
      // Função de animação
      this.animate = function() {
        // Atualizar crescimento
        if (this.params.animateGrowth && this.animations.growthProgress < 1) {
          this.animations.growthProgress += 0.01 * this.params.growthSpeed;
          if (this.animations.growthProgress >= 1) {
            this.animations.growthProgress = 1;
            this.isGrowthComplete = true;
          }
        }
        
        // Atualizar vento
        if ((this.params.windStrength > 0 || this.params.postGrowthMovement) && 
            (this.params.curvature > 0 || this.params.windStrength > 0)) {
          this.animations.windTime += 0.01 * this.params.windSpeed;
        }
        
        // Atualizar partículas
        this.updateParticles();
        
        // Renderizar
        this.render();
        
        // Continuar animação
        if (this.isAnimating) {
          animationRef.current = requestAnimationFrame(() => this.animate());
        }
      };
      
      // Iniciar animação
      this.isAnimating = true;
      this.animate();
      
      // Retornar referência para controle externo
      return this;
    };

    // Instanciar a árvore com a função construtora
    fractalTreeRef.current = new (FractalTree as any)();
    
    // Adicionar listener para redimensionamento
    const handleResize = () => {
      if (fractalTreeRef.current) {
        const container = canvas.parentElement;
        if (container) {
          const { width, height } = container.getBoundingClientRect();
          canvas.width = width;
          canvas.height = height;
          fractalTreeRef.current.width = width;
          fractalTreeRef.current.height = height;
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // Limpar animação
      if (fractalTreeRef.current && fractalTreeRef.current.isAnimating) {
        fractalTreeRef.current.isAnimating = false;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [params, tokenId, hashString]);

  // Initialize the canvas
  useEffect(() => {
    // Limpar qualquer animação existente
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Definir seed aleatório
    randomSeedRef.current = hashString(tokenId);
    
    // Inicializar diretamente, sem script injetado
    const cleanup = initializeCanvas();
    
    // Atualizar score de complexidade
    updateComplexityScore();
    
    return cleanup;
  }, [hashString, params, tokenId, updateComplexityScore, initializeCanvas]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-light text-center text-emerald-400 mb-6">Fractal Tree NFT Generator</h1>
      
      <div className="bg-opacity-10 bg-emerald-500 p-4 rounded-lg border border-emerald-500 border-opacity-30 flex justify-between mb-6">
        <div>
          <span className="text-emerald-400 font-bold">Token ID: <span>{tokenId}</span></span>
        </div>
        <div>
          <span>Complexity Score: <span>{complexityScore}</span></span>
        </div>
      </div>
   <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden shadow-2xl mb-6 canvas-container">
  <canvas id="treeCanvas" ref={canvasRef} className="w-full h-full"></canvas>
  
  {/* Botão de tela cheia */}
  <button 
    onClick={toggleFullScreen}
    className="absolute top-2 right-2 z-10 bg-emerald-500 bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full text-white transition-all"
    title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
  >
    {isFullScreen ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    )}
  </button>
</div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Tree Structure Controls */}
        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-xl text-emerald-400 mb-4">Tree Structure</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Branch Count</label>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="1" 
                value={params.branches}
                onChange={(e) => handleParamChange('branches', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.branches} branches per node</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Recursion Depth</label>
              <input 
                type="range" 
                min="2" 
                max={getMaxRecursionDepth(params.branches)} 
                step="1" 
                value={params.maxDepth}
                onChange={(e) => handleParamChange('maxDepth', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.maxDepth} levels deep (max: {getMaxRecursionDepth(params.branches)})</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Length Ratio</label>
              <input 
                type="range" 
                min="0.5" 
                max="0.9" 
                step="0.01" 
                value={params.lengthRatio}
                onChange={(e) => handleParamChange('lengthRatio', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.lengthRatio}</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Branch Angle</label>
              <input 
                type="range" 
                min="10" 
                max="90" 
                step="1" 
                value={params.branchAngle}
                onChange={(e) => handleParamChange('branchAngle', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.branchAngle}°</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Initial Size</label>
              <input 
                type="range" 
                min="50" 
                max="200" 
                step="1" 
                value={params.initialLength}
                onChange={(e) => handleParamChange('initialLength', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.initialLength}px</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Branch Width</label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="0.5" 
                value={params.branchWidth}
                onChange={(e) => handleParamChange('branchWidth', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.branchWidth}px</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Randomness</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={params.randomness}
                onChange={(e) => handleParamChange('randomness', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.randomness}</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Branch Curvature</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={params.curvature}
                onChange={(e) => handleParamChange('curvature', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.curvature}</div>
            </div>
          </div>
          
          <div className="flex items-center mt-4">
            <label className="mr-2 text-gray-400">Symmetrical Tree</label>
            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
              <input 
                type="checkbox" 
                className="opacity-0 w-0 h-0" 
                checked={params.symmetrical}
                onChange={(e) => handleParamChange('symmetrical', e.target.checked)}
              />
              <span className={`absolute top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-in-out ${params.symmetrical ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${params.symmetrical ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Appearance Controls */}
        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-xl text-emerald-400 mb-4">Appearance</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Color Scheme</label>
              <select 
                value={params.colorScheme}
                onChange={(e) => handleParamChange('colorScheme', e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
              >
                <option value="gradient">Natural Gradient</option>
                <option value="rainbow">Rainbow</option>
                <option value="autumn">Autumn</option>
                <option value="monochrome">Monochrome</option>
                <option value="neon">Neon</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Base Hue</label>
              <input 
                type="range" 
                min="0" 
                max="360" 
                step="1" 
                value={params.hueStart}
                onChange={(e) => handleParamChange('hueStart', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.hueStart}° ({getHueName(params.hueStart)})</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Hue Range</label>
              <input 
                type="range" 
                min="0" 
                max="180" 
                step="1" 
                value={params.hueRange}
                onChange={(e) => handleParamChange('hueRange', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.hueRange}°</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Saturation</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1" 
                value={params.saturation}
                onChange={(e) => handleParamChange('saturation', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.saturation}%</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Lightness</label>
              <input 
                type="range" 
                min="20" 
                max="80" 
                step="1" 
                value={params.lightness}
                onChange={(e) => handleParamChange('lightness', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.lightness}%</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Background Type</label>
              <select 
                value={params.backgroundColor}
                onChange={(e) => handleParamChange('backgroundColor', e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="gradient">Gradient</option>
                <option value="starfield">Starfield</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center mt-4">
            <label className="mr-2 text-gray-400">Add Leaves/Blossoms</label>
            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
              <input 
                type="checkbox" 
                className="opacity-0 w-0 h-0" 
                checked={params.drawLeaves}
                onChange={(e) => handleParamChange('drawLeaves', e.target.checked)}
              />
              <span className={`absolute top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-in-out ${params.drawLeaves ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${params.drawLeaves ? 'translate-x-6' : 'translate-x-0'}`}></span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Animation & Effects Controls */}
        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-xl text-emerald-400 mb-4">Animation & Effects</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wind Strength</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={params.windStrength}
                onChange={(e) => handleParamChange('windStrength', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.windStrength}</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wind Speed</label>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.1" 
                value={params.windSpeed}
                onChange={(e) => handleParamChange('windSpeed', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.windSpeed}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Growth Animation Speed</label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.01" 
                value={params.growthSpeed}
                onChange={(e) => handleParamChange('growthSpeed', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.growthSpeed}</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Particle Effects</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1" 
                value={params.particleAmount}
                onChange={(e) => handleParamChange('particleAmount', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-emerald-400 mt-1">{params.particleAmount} particles</div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <label className="mr-2 text-gray-400">Animate Growth</label>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                <input 
                  type="checkbox" 
                  className="opacity-0 w-0 h-0" 
                  checked={params.animateGrowth}
                  onChange={(e) => handleParamChange('animateGrowth', e.target.checked)}
                />
                <span className={`absolute top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-in-out ${params.animateGrowth ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${params.animateGrowth ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              <label className="mr-2 text-gray-400">Post-Growth Movement</label>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                <input 
                  type="checkbox" 
                  className="opacity-0 w-0 h-0" 
                  checked={params.postGrowthMovement}
                  onChange={(e) => handleParamChange('postGrowthMovement', e.target.checked)}
                />
                <span className={`absolute top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-in-out ${params.postGrowthMovement ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${params.postGrowthMovement ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Presets and Buttons */}
      <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 mb-6">
        <h3 className="text-xl text-emerald-400 mb-4">Presets</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1 rounded-full text-sm"
            onClick={() => applyPreset('classic')}
          >
            Classic Tree
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1 rounded-full text-sm"
            onClick={() => applyPreset('bonsai')}
          >
            Bonsai
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1 rounded-full text-sm"
            onClick={() => applyPreset('winter')}
          >
            Winter Tree
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1 rounded-full text-sm"
            onClick={() => applyPreset('cherry-blossom')}
          >
            Cherry Blossom
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1 rounded-full text-sm"
            onClick={() => applyPreset('alien')}
          >
            Alien Plant
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1 rounded-full text-sm"
            onClick={() => applyPreset('fractal')}
          >
            Pure Fractal
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1 rounded-full text-sm"
            onClick={() => applyPreset('willow')}
          >
            Weeping Willow
          </button>
          <button 
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 px-3 py-1 rounded-full text-sm"
            onClick={() => applyPreset('palm')}
          >
            Palm Tree
          </button>
        </div>
        
        <div className="flex gap-4">
          <button 
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-full text-lg transition-all hover:shadow-lg hover:-translate-y-1"
            onClick={generateNewTree}
          >
            Generate New Tree
          </button>
          <button 
            className="flex-1 bg-transparent border border-emerald-500 text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-20 py-3 px-4 rounded-full text-lg"
            onClick={downloadAsPNG}
          >
            Download as PNG
          </button>
          <button 
            className="flex-1 bg-transparent border border-emerald-500 text-emerald-400 hover:bg-emerald-900 hover:bg-opacity-20 py-3 px-4 rounded-full text-lg"
            onClick={generateHTMLFromCurrentParams}
          >
            Download as HTML
          </button>
        </div>
       <MintButton params={params} captureTreeImage={captureTreeImage} />
      </div>
      
      <div className="text-center text-gray-400 text-sm">
        Every tree is unique and deterministic based on its Token ID.
        <br />
        Create, customize, and mint your own fractal tree as an NFT.
      </div>
    </div>
  );
};

export default FractalTreeGenerator;