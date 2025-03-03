export const getTreeRenderingScript = (p) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fractal Tree - ${p.tokenId}</title>
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
            overflow: hidden;
        }
        .container {
            width: 100%;
            max-width: 800px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .canvas-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 100%;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="canvas-container">
            <canvas id="treeCanvas" width="800" height="800"></canvas>
        </div>
    </div>

    <script>
    class FractalTreeNFT {
        constructor(canvasId) {
            // Canvas initialization
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.width = this.canvas.width;
            this.height = this.canvas.height;

            // Tree parameters
            this.params = ${JSON.stringify(p)};
            
            // Animation state
            this.animations = {
                growthProgress: this.params.animateGrowth ? 0 : 1,
                windTime: 0,
                particles: []
            };
            
            // Growth and animation flags
            this.isGrowthComplete = !this.params.animateGrowth;
            this.isAnimating = true;

            // Random seed initialization
            this.randomSeed = this.hashString(this.params.tokenId || 'default');

            // Start animation
            this.animate();
        }

        // Simple hash function for consistent randomness
        hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash;
        }

        // Pseudo-random number generator
        random() {
            this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
            return this.randomSeed / 233280;
        }

        // Main animation loop
        animate() {
            if (this.isAnimating) {
                // Update growth progress
                if (this.params.animateGrowth && this.animations.growthProgress < 1) {
                    this.animations.growthProgress += 0.01 * (this.params.growthSpeed || 1);
                    if (this.animations.growthProgress >= 1) {
                        this.animations.growthProgress = 1;
                        this.isGrowthComplete = true;
                    }
                }

                // Update wind animation
                if (this.params.postGrowthMovement || this.params.windStrength > 0) {
                    this.animations.windTime += 0.01 * (this.params.windSpeed || 1);
                }

                // Update and render
                this.updateParticles();
                this.render();

                // Continue animation
                requestAnimationFrame(() => this.animate());
            }
        }

        // Rendering method
        render() {
            const ctx = this.ctx;
            
            // Clear canvas
            ctx.clearRect(0, 0, this.width, this.height);
            
            // Draw background
            this.drawBackground();
            
            // Set drawing context
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Draw the tree
            const startX = this.width / 2;
            const startY = this.height;
            const startAngle = -Math.PI / 2;
            
            this.drawBranch(
                startX, 
                startY, 
                this.params.initialLength * this.animations.growthProgress, 
                startAngle, 
                this.params.branchWidth,
                0,
                0
            );
            
            // Draw particles
            this.drawParticles();
        }

        // Background drawing method
        drawBackground() {
            const ctx = this.ctx;
            ctx.fillStyle = '#0c1016';
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // Branch drawing method (full implementation from previous script)
        drawBranch(x, y, length, angle, width, depth, branchIndex) {
            if (depth >= this.params.maxDepth || length < 1) return;
            
            const ctx = this.ctx;
            const params = this.params;
            
            // Consistent seed for curvature
            const curveSeed = this.hashString(\`\${x}-\${y}-\${depth}-\${branchIndex}\`);
            
            // Wind effect
            let windEffect = 0;
            if (this.isGrowthComplete && (params.postGrowthMovement || params.windStrength > 0.01)) {
                const windForce = Math.sin(this.animations.windTime + x * 0.01) * params.windStrength;
                windEffect = windForce * (depth / params.maxDepth);
            }
            
            let endX, endY;
            
            if (params.curvature > 0) {
                const curveDirection = curveSeed % 2 === 0 ? 1 : -1;
                const curveControl = params.curvature * curveDirection * 50;
                const controlX = x + Math.cos(angle + Math.PI/2 * curveDirection) * curveControl + Math.cos(angle) * length * 0.5;
                const controlY = y + Math.sin(angle + Math.PI/2 * curveDirection) * curveControl + Math.sin(angle) * length * 0.5;
                
                endX = x + Math.cos(angle + windEffect) * length;
                endY = y + Math.sin(angle + windEffect) * length;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                ctx.strokeStyle = this.getBranchColor(depth);
                ctx.lineWidth = Math.max(1, width * (1 - depth / params.maxDepth * 0.7));
                ctx.stroke();
            } else {
                endX = x + Math.cos(angle + windEffect) * length;
                endY = y + Math.sin(angle + windEffect) * length;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = this.getBranchColor(depth);
                ctx.lineWidth = Math.max(1, width * (1 - depth / params.maxDepth * 0.7));
                ctx.stroke();
            }
            
            // Draw leaves
            if (params.drawLeaves && depth >= params.maxDepth - 2) {
                const leafCount = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < leafCount; i++) {
                    this.drawLeaf(endX, endY, depth);
                }
            }
            
            // Calculate next branch parameters
            const nextLength = length * params.lengthRatio;
            const nextWidth = width * 0.7;
            
            // Draw child branches
            for (let i = 0; i < params.branches; i++) {
                let branchAngle;
                
                if (params.symmetrical) {
                    const angleStep = Math.PI * params.branchAngle / 180;
                    const baseAngle = angle - (angleStep * (params.branches - 1)) / 2;
                    branchAngle = baseAngle + i * angleStep;
                } else {
                    const angleStep = Math.PI * params.branchAngle / 180;
                    const baseAngle = angle - (angleStep * (params.branches - 1)) / 2;
                    const randomFactor = params.randomness * (this.random() * 2 - 1);
                    const randomVariation = baseAngle * randomFactor * 0.3;
                    branchAngle = baseAngle + i * angleStep + randomVariation;
                }
                
                // Length variation
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

        // Leaf drawing method
        drawLeaf(x, y, depth) {
            const ctx = this.ctx;
            const leafSize = 4 + Math.random() * 3;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI * 2);
            ctx.fillStyle = this.getLeafColor(depth / this.params.maxDepth);
            
            if (Math.random() > 0.5) {
                ctx.beginPath();
                ctx.arc(0, 0, leafSize, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.ellipse(0, 0, leafSize, leafSize * 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }

        // Branch color method
        getBranchColor(depth) {
            const normalizedDepth = depth / this.params.maxDepth;
            const colorScheme = this.params.colorScheme || 'gradient';
            
            switch (colorScheme) {
                case 'gradient':
                    const hue = this.params.hueStart - normalizedDepth * this.params.hueRange;
                    const saturation = this.params.saturation;
                    const lightness = this.params.lightness - normalizedDepth * 20;
                    return \`hsl(\${hue}, \${saturation}%, \${lightness}%)\`;
                
                case 'rainbow':
                    const rainbowHue = (this.params.hueStart + normalizedDepth * 360) % 360;
                    return \`hsl(\${rainbowHue}, \${this.params.saturation}%, \${this.params.lightness}%)\`;
                
                case 'autumn':
                    const autumnHue = 30 + normalizedDepth * 30;
                    return \`hsl(\${autumnHue}, \${this.params.saturation}%, \${this.params.lightness}%)\`;
                
                case 'monochrome':
                    const shade = 100 - normalizedDepth * 60;
                    return \`hsl(0, 0%, \${shade}%)\`;
                
                case 'neon':
                    const neonHue = (this.params.hueStart + normalizedDepth * this.params.hueRange) % 360;
                    return \`hsl(\${neonHue}, \${this.params.saturation + 20}%, \${this.params.lightness + 10}%)\`;
                
                default:
                    return '#4ecca3';
            }
        }

        // Leaf color method
        getLeafColor(depthFactor) {
            const colorScheme = this.params.colorScheme || 'gradient';
            
            switch (colorScheme) {
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

        // Particle update method
        updateParticles() {
            this.animations.particles = this.animations.particles.filter(p => p.life > 0);
            
            if (this.params.particleAmount > 0 && this.animations.growthProgress > 0.5) {
                const newParticlesCount = Math.floor(this.params.particleAmount / 20);
                
                for (let i = 0; i < newParticlesCount; i++) {
                    if (this.animations.particles.length < this.params.particleAmount && Math.random() > 0.7) {
                        this.animations.particles.push(this.createParticle());
                    }
                }
            }
            
            for (const particle of this.animations.particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.01;
                particle.vx *= 0.99;
                particle.vy *= 0.99;
                particle.life -= 1;
                particle.size *= 0.99;
            }
        }

        // Particle creation method
        createParticle() {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.params.initialLength * 0.7;
            
            const x = this.width / 2 + Math.cos(angle) * distance;
            const y = this.height - this.params.initialLength * 0.2 + Math.sin(angle) * distance;
            
            return {x,
                y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: Math.random() * -1 - 0.5,
                color: this.getLeafColor(Math.random()),
                size: 2 + Math.random() * 3,
                life: 100 + Math.random() * 100,
                rotation: Math.random() * Math.PI * 2
            };
        }

        // Particle drawing method
        drawParticles() {
            const ctx = this.ctx;
            
            for (const particle of this.animations.particles) {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.life / 200;
                
                ctx.beginPath();
                ctx.ellipse(0, 0, particle.size, particle.size * 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
            
            ctx.globalAlpha = 1;
        }
    }

    // Initialize the fractal tree when the document loads
    document.addEventListener('DOMContentLoaded', () => {
        const fractalTree = new FractalTreeNFT('treeCanvas');
        
        // Expose the instance globally for debugging if needed
        window.fractalTree = fractalTree;
    });
    </script>
</body>
</html>`;
};