// src/Maps3d/3d/ornaments/TreasureGenerator.ts
import * as THREE from 'three';
import { ColorScheme } from '../../utils/ColorGenetics';

export class TreasureGenerator {
  /**
   * Cria um tesouro com base no tamanho
   */
  public createTreasure(
    size: number,
    fusionLevel: number,
    colors: ColorScheme
  ): THREE.Group {
    const treasureGroup = new THREE.Group();
    
    // Decidir o tipo de tesouro baseado no nível de fusão
    if (fusionLevel >= 3) {
      return this.createTreasureChest(size, colors);
    } else if (fusionLevel >= 1) {
      return this.createGoldPile(size, colors);
    } else {
      return this.createGem(size, colors);
    }
  }
  
  /**
   * Cria um baú de tesouro
   */
  private createTreasureChest(size: number, colors: ColorScheme): THREE.Group {
    const chestGroup = new THREE.Group();
    
    // Base do baú (mais alta para evitar clipping com o terreno)
    const baseGeometry = new THREE.BoxGeometry(size, size * 0.7, size * 0.7);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513, // Marrom (madeira)
      specular: 0x333333,
      shininess: 30
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = size * 0.35; // Elevado para evitar ficar enterrado
    base.castShadow = true;
    base.receiveShadow = true;
    
    chestGroup.add(base);
    
    // Tampa do baú (ligeiramente aberta)
    const lidGeometry = new THREE.BoxGeometry(size * 1.1, size * 0.3, size * 0.8);
    const lid = new THREE.Mesh(lidGeometry, baseMaterial);
    lid.position.set(0, size * 0.9, -size * 0.05);
    lid.rotation.x = -Math.PI / 6; // Ângulo de abertura da tampa
    lid.castShadow = true;
    
    chestGroup.add(lid);
    
    // Alça e fechadura melhoradas
    const handleGeometry = new THREE.TorusGeometry(size * 0.1, size * 0.02, 8, 16);
    const metalMaterial = new THREE.MeshPhongMaterial({
      color: 0xD4AF37, // Dourado mais vibrante
      specular: 0xFFD700,
      shininess: 100
    });
    
    const handle = new THREE.Mesh(handleGeometry, metalMaterial);
    handle.position.set(0, size * 0.9, size * 0.3);
    handle.rotation.x = Math.PI / 2;
    handle.castShadow = true;
    
    chestGroup.add(handle);
    
    // Fechadura para o baú
    const lockGeometry = new THREE.BoxGeometry(size * 0.2, size * 0.15, size * 0.05);
    const lock = new THREE.Mesh(lockGeometry, metalMaterial);
    lock.position.set(0, size * 0.75, size * 0.38);
    lock.castShadow = true;
    
    chestGroup.add(lock);
    
    // Detalhes metálicos nas bordas e cantos
    const edgePositions = [
      // Bordas inferiores (frente, trás, lados)
      { pos: [0, size * 0.1, size * 0.35], rot: [0, 0, 0], scale: [size * 1.05, size * 0.05, size * 0.05] },
      { pos: [0, size * 0.1, -size * 0.35], rot: [0, 0, 0], scale: [size * 1.05, size * 0.05, size * 0.05] },
      { pos: [-size * 0.5, size * 0.1, 0], rot: [0, Math.PI/2, 0], scale: [size * 0.8, size * 0.05, size * 0.05] },
      { pos: [size * 0.5, size * 0.1, 0], rot: [0, Math.PI/2, 0], scale: [size * 0.8, size * 0.05, size * 0.05] },
      
      // Bordas verticais (cantos)
      { pos: [-size * 0.5, size * 0.4, size * 0.35], rot: [0, 0, Math.PI/2], scale: [size * 0.7, size * 0.05, size * 0.05] },
      { pos: [size * 0.5, size * 0.4, size * 0.35], rot: [0, 0, Math.PI/2], scale: [size * 0.7, size * 0.05, size * 0.05] },
      { pos: [-size * 0.5, size * 0.4, -size * 0.35], rot: [0, 0, Math.PI/2], scale: [size * 0.7, size * 0.05, size * 0.05] },
      { pos: [size * 0.5, size * 0.4, -size * 0.35], rot: [0, 0, Math.PI/2], scale: [size * 0.7, size * 0.05, size * 0.05] }
    ];
    
    edgePositions.forEach(edge => {
      const edgeGeometry = new THREE.BoxGeometry(1, 1, 1); // Escalaremos depois
      const edgeMesh = new THREE.Mesh(edgeGeometry, metalMaterial);
      edgeMesh.position.set(edge.pos[0], edge.pos[1], edge.pos[2]);
      edgeMesh.rotation.set(edge.rot[0], edge.rot[1], edge.rot[2]);
      edgeMesh.scale.set(edge.scale[0], edge.scale[1], edge.scale[2]);
      edgeMesh.castShadow = true;
      
      chestGroup.add(edgeMesh);
    });
    
    // Adicionar brilho ao ouro para destacar
    const goldGeometry = new THREE.SphereGeometry(size * 0.15, 8, 8);
    const goldMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFD700, // Dourado brilhante
      specular: 0xFFFFFF,
      shininess: 100,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.2
    });
    
    // Adicionar algumas moedas/pepitas de ouro saindo do baú
    for (let i = 0; i < 5; i++) {
      const gold = new THREE.Mesh(goldGeometry, goldMaterial);
      gold.position.set(
        (Math.random() - 0.5) * size * 0.8,
        size * 0.6 + (Math.random() * size * 0.2),
        (Math.random() - 0.5) * size * 0.6
      );
      gold.scale.set(
        0.7 + Math.random() * 0.6,
        0.4 + Math.random() * 0.3,
        0.7 + Math.random() * 0.6
      );
      gold.castShadow = true;
      
      chestGroup.add(gold);
    }
    
    // Ajuste de posição final do grupo para garantir que fique acima do terreno
    chestGroup.position.y += 0.1; // Elevação adicional
    
    return chestGroup;
  }
  
  /**
   * Cria uma pilha de ouro/moedas
   */
  private createGoldPile(size: number, colors: ColorScheme): THREE.Group {
    const goldGroup = new THREE.Group();
    
    // Material para o ouro
    const goldMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFD700, // Dourado
      specular: 0xFFFFFF,
      shininess: 100,
      emissive: 0xFFAA00, // Brilho sutil
      emissiveIntensity: 0.2
    });
    
    // Base da pilha (mais visível)
    const baseGeometry = new THREE.CircleGeometry(size * 0.8, 16);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0xDDA520, // Goldentrod (dourado mais escuro para a base)
      shininess: 50
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.02; // Ligeiramente acima do solo para evitar z-fighting
    base.receiveShadow = true;
    
    goldGroup.add(base);
    
    // Criar várias moedas/pepitas
    const coinCount = Math.max(5, Math.floor(size * 20)); // Garantir pelo menos 5 moedas
    
    // Alternância entre moedas (cilindros) e pepitas (esferas achatadas)
    for (let i = 0; i < coinCount; i++) {
      let coin;
      
      if (i % 3 === 0) {
        // Criar pepita (esfera achatada)
        const pepitaGeometry = new THREE.SphereGeometry(size * 0.2, 8, 8);
        coin = new THREE.Mesh(pepitaGeometry, goldMaterial);
        coin.scale.y = 0.4; // Achatar
      } else {
        // Criar moeda (cilindro fino)
        const coinGeometry = new THREE.CylinderGeometry(size * 0.15, size * 0.15, size * 0.05, 16);
        coin = new THREE.Mesh(coinGeometry, goldMaterial);
        coin.rotation.x = Math.PI / 2; // Moedas ficam deitadas
      }
      
      // Posicionar aleatoriamente na pilha, com mais densidade no centro
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.random() * size * 0.7; // Distribuição quadrática
      
      coin.position.set(
        Math.cos(angle) * radius,
        size * 0.025 + (Math.random() * Math.random() * size * 0.3), // Altura variável, mais ao centro
        Math.sin(angle) * radius
      );
      
      // Rotacionar aleatoriamente para variedade
      coin.rotation.set(
        coin.rotation.x + Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      coin.castShadow = true;
      goldGroup.add(coin);
    }
    
    // Adicionar alguns reflexos/destaques para melhorar a visibilidade
    for (let i = 0; i < 3; i++) {
      const highlightGeometry = new THREE.SphereGeometry(size * 0.05, 8, 8);
      const highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.6
      });
      
      const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      
      // Posicionar aleatoriamente sobre a pilha
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size * 0.5;
      
      highlight.position.set(
        Math.cos(angle) * radius,
        size * 0.2 + Math.random() * 0.1,
        Math.sin(angle) * radius
      );
      
      goldGroup.add(highlight);
    }
    
    // Ajuste de posição final do grupo
    goldGroup.position.y += 0.05; // Elevar ligeiramente
    
    return goldGroup;
  }
  
  /**
   * Cria uma gema/cristal
   */
  private createGem(size: number, colors: ColorScheme): THREE.Group {
    const gemGroup = new THREE.Group();
    
    // Material para a gema (baseado nas cores do território, com mais brilho)
    const gemMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      specular: 0xFFFFFF,
      shininess: 100,
      transparent: true,
      opacity: 0.8,
      emissive: new THREE.Color(colors.accent),
      emissiveIntensity: 0.2
    });
    
    // Geometria para a gema (diamante melhorado)
    // Usamos IcosahedronGeometry para um visual mais cristalino
    const gemGeometry = new THREE.IcosahedronGeometry(size * 0.5, 0);
    const gem = new THREE.Mesh(gemGeometry, gemMaterial);
    gem.position.y = size * 0.5;
    gem.castShadow = true;
    
    // Rotação para parecer mais interessante
    gem.rotation.y = Math.PI / 5;
    gem.rotation.x = Math.PI / 7;
    
    gemGroup.add(gem);
    
    // Base para a gema
    const baseGeometry = new THREE.CylinderGeometry(
      size * 0.3,
      size * 0.4,
      size * 0.1,
      8
    );
    
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333, // Escuro
      shininess: 50
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = size * 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    
    gemGroup.add(base);
    
    // Adicionar pequenos cristais ao redor da base
    for (let i = 0; i < 5; i++) {
      const smallGemGeometry = new THREE.TetrahedronGeometry(size * 0.1, 0);
      const smallGemMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.accent),
        transparent: true,
        opacity: 0.9,
        shininess: 80
      });
      
      const smallGem = new THREE.Mesh(smallGemGeometry, smallGemMaterial);
      
      // Posicionar ao redor da base
      const angle = (i / 5) * Math.PI * 2;
      const radius = size * 0.3;
      
      smallGem.position.set(
        Math.cos(angle) * radius,
        size * 0.15, // Altura reduzida
        Math.sin(angle) * radius
      );
      
      // Rotação aleatória
      smallGem.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      smallGem.castShadow = true;
      
      gemGroup.add(smallGem);
    }
    
    // Efeito de brilho (usando simples partículas/esferas)
    for (let i = 0; i < 8; i++) {
      const sparkleGeometry = new THREE.SphereGeometry(size * 0.03, 8, 8);
      const sparkleMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.7
      });
      
      const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
      
      // Posicionar aleatoriamente ao redor da gema
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = size * 0.6;
      
      sparkle.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        size * 0.5 + r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      
      gemGroup.add(sparkle);
    }
    
    // Ajuste de posição final do grupo
    gemGroup.position.y += 0.1; // Elevar para garantir visibilidade
    
    return gemGroup;
  }
}