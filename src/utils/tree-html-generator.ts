// tree-html-generator.ts
export const generateOptimizedTreeHTML = (params: any, tokenId: string) => {
  // Garantir que o tokenId esteja incluído nos parâmetros
  const exportParams = {
    ...params,
    tokenId: tokenId,
    fullScreen: true // Adicionando opção de tela cheia
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
            overflow: hidden;
            background-color: #0c1016;
        }
        canvas { 
            display: block;
            width: 100vw;
            height: 100vh;
            touch-action: none;
        }
    </style>
</head>
<body>
    <canvas id="treeCanvas"></canvas>

    <script>
    class FractalTreeNFT {
      constructor(canvasId) {
        // Inicializar canvas
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Parâmetros da árvore
        this.params = ${JSON.stringify(exportParams)};
        
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
        
        // Adicionar evento de redimensionamento
        window.addEventListener('resize', () => this.resizeCanvas());
      }
      
      // Inicializar seed aleatório com base no token
      initRandomSeed() {
        this.randomSeed = this.hashString('${tokenId || "FT-" + Math.floor(Math.random() * 1000000)}');
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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Re-renderizar após redimensionamento
        if (this.isAnimating) {
          this.render();
        }
      }
      
      // Loop de animação principal
      animate() {
        if (this.isAnimating) {
          // Atualizar progressão de crescimento
          if (this.params.animateGrowth && this.animations.growthProgress < 1) {
            this.animations.growthProgress += 0.01 * (this.params.growthSpeed || 1);
            if (this.animations.growthProgress >= 1) {
              this.animations.growthProgress = 1;
              this.isGrowthComplete = true;
            }
          }
          
          // Atualizar animação de vento - APENAS se houver força de vento ou movimento pós-crescimento ativado
          if ((this.params.windStrength > 0 || this.params.postGrowthMovement) && 
              (this.params.curvature > 0 || this.params.windStrength > 0)) {
            this.animations.windTime += 0.01 * (this.params.windSpeed || 1);
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
    
    // Inicializar a árvore fractal imediatamente
    window.onload = () => {
      const fractalTree = new FractalTreeNFT('treeCanvas');
      
      // Expor a instância globalmente para depuração, se necessário
      window.fractalTree = fractalTree;
    };
    </script>
</body>
</html>`;

  return htmlContent;
};