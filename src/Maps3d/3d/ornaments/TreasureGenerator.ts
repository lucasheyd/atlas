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
    
    // Base do baú
    const baseGeometry = new THREE.BoxGeometry(size, size * 0.7, size * 0.7);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513, // Marrom (madeira)
      specular: 0x333333,
      shininess: 30
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = size * 0.35;
    base.castShadow = true;
    base.receiveShadow = true;
    
    chestGroup.add(base);
    
    // Tampa do baú
    const lidGeometry = new THREE.BoxGeometry(size * 1.1, size * 0.3, size * 0.8);
    const lid = new THREE.Mesh(lidGeometry, baseMaterial);
    lid.position.set(0, size * 0.9, -size * 0.05);
    lid.rotation.x = -Math.PI / 6; // Ligeiramente aberto
    lid.castShadow = true;
    
    chestGroup.add(lid);
    
    // Alça e fechadura
    const handleGeometry = new THREE.TorusGeometry(size * 0.1, size * 0.02, 8, 16);
    const metalMaterial = new THREE.MeshPhongMaterial({
      color: 0xB8860B, // Dourado
      specular: 0xFFD700,
      shininess: 100
    });
    
    const handle = new THREE.Mesh(handleGeometry, metalMaterial);
    handle.position.set(0, size * 0.9, size * 0.3);
    handle.rotation.x = Math.PI / 2;
    handle.castShadow = true;
    
    chestGroup.add(handle);
    
    // Detalhe de metal nas bordas
    const edgeGeometry = new THREE.BoxGeometry(size * 1.05, size * 0.05, size * 0.05);
    
    // Borda frontal inferior
    const frontEdge = new THREE.Mesh(edgeGeometry, metalMaterial);
    frontEdge.position.set(0, size * 0.1, size * 0.35);
    frontEdge.castShadow = true;
    
    // Borda traseira inferior
    const backEdge = new THREE.Mesh(edgeGeometry, metalMaterial);
    backEdge.position.set(0, size * 0.1, -size * 0.35);
    backEdge.castShadow = true;
    
    // Bordas laterais inferiores
    const leftEdgeGeometry = new THREE.BoxGeometry(size * 0.05, size * 0.05, size * 0.8);
    const leftEdge = new THREE.Mesh(leftEdgeGeometry, metalMaterial);
    leftEdge.position.set(-size * 0.5, size * 0.1, 0);
    leftEdge.castShadow = true;
    
    const rightEdge = new THREE.Mesh(leftEdgeGeometry, metalMaterial);
    rightEdge.position.set(size * 0.5, size * 0.1, 0);
    rightEdge.castShadow = true;
    
    chestGroup.add(frontEdge);
    chestGroup.add(backEdge);
    chestGroup.add(leftEdge);
    chestGroup.add(rightEdge);
    
    // Ouro saindo do baú
    const goldGeometry = new THREE.SphereGeometry(size * 0.15, 8, 8);
    const goldMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFD700, // Dourado
      specular: 0xFFFFFF,
      shininess: 100
    });
    
    // Adicionar algumas moedas/pepitas de ouro
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
      shininess: 100
    });
    
    // Base da pilha
    const baseGeometry = new THREE.CircleGeometry(size * 0.8, 16);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      shininess: 10
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.01;
    base.receiveShadow = true;
    
    goldGroup.add(base);
    
    // Criar várias moedas/pepitas
    const coinCount = Math.floor(size * 20);
    const coinGeometry = new THREE.CylinderGeometry(size * 0.15, size * 0.15, size * 0.05, 16);
    
    for (let i = 0; i < coinCount; i++) {
      const coin = new THREE.Mesh(coinGeometry, goldMaterial);
      
      // Posicionar aleatoriamente na pilha
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size * 0.7;
      
      coin.position.set(
        Math.cos(angle) * radius,
        size * 0.025 + (Math.random() * size * 0.2),
        Math.sin(angle) * radius
      );
      
      // Rotacionar aleatoriamente
      coin.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      coin.castShadow = true;
      goldGroup.add(coin);
    }
    
    return goldGroup;
  }
  
  /**
   * Cria uma gema/cristal
   */
  private createGem(size: number, colors: ColorScheme): THREE.Group {
    const gemGroup = new THREE.Group();
    
    // Material para a gema (baseado nas cores do território)
    const gemMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      specular: 0xFFFFFF,
      shininess: 100,
      transparent: true,
      opacity: 0.8
    });
    
    // Geometria para a gema (diamante simplificado)
    const gemGeometry = new THREE.OctahedronGeometry(size * 0.5);
    const gem = new THREE.Mesh(gemGeometry, gemMaterial);
    gem.position.y = size * 0.5;
    gem.castShadow = true;
    
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
    
    return gemGroup;
  }
}
