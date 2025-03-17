// src/Maps3d/3d/ornaments/PathGenerator.ts (Correção para rotação)
import * as THREE from 'three';
import { ColorScheme } from '../../utils/ColorGenetics';
import { RandomGenerator } from '../../utils/RandomGenerator';

export class PathGenerator {
  /**
   * Cria um caminho entre dois pontos
   */
  public createPath(
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    width: number,
    colors: ColorScheme
  ): THREE.Object3D {
    const pathGroup = new THREE.Group();
    
    // Calcular direção e comprimento
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const length = direction.length();
    direction.normalize();
    
    // CORREÇÃO CRÍTICA: Use o plano xz em vez de xy para o caminho
    // Isso garante que o caminho esteja no "chão" e não na vertical
    
    // Criar geometria do caminho
    const pathGeometry = new THREE.PlaneGeometry(width, length);
    const pathMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      specular: new THREE.Color(colors.specular),
      shininess: 10,
      side: THREE.DoubleSide // Garantir que o caminho seja visível de ambos os lados
    });
    
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    
    // Rotação específica para garantir que o caminho fique no plano horizontal (chão)
    path.rotation.x = -Math.PI / 2;
    
    // Ajustar a orientação para apontar na direção correta
    const angle = Math.atan2(direction.z, direction.x);
    path.rotation.z = -angle - Math.PI / 2;
    
    // Posicionar o caminho no meio entre os pontos
    path.position.set(
      (startPoint.x + endPoint.x) / 2,
      Math.min(startPoint.y, endPoint.y) + 0.02, // Ligeiramente acima do chão
      (startPoint.z + endPoint.z) / 2
    );
    
    path.receiveShadow = true;
    
    pathGroup.add(path);
    
    // Adicionar bordas ao caminho
    this.addPathBorders(pathGroup, startPoint, endPoint, width, length, colors);
    
    return pathGroup;
  }
  
  /**
   * Adiciona bordas ao caminho
   */
  private addPathBorders(
    pathGroup: THREE.Group,
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    width: number,
    length: number,
    colors: ColorScheme
  ): void {
    // Simplificando as bordas para garantir que apareçam corretamente
    const borderHeight = 0.03;
    const borderWidth = 0.05;
    
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
    const angle = Math.atan2(direction.z, direction.x);
    
    // Criar uma borda simplificada que seja apenas uma elevação no caminho
    const borderGeometry = new THREE.BoxGeometry(width + 0.1, borderHeight, length);
    const borderMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 20
    });
    
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    
    // Posicionar no centro do caminho, ligeiramente abaixo para aparecer como uma elevação
    border.position.set(
      (startPoint.x + endPoint.x) / 2,
      Math.min(startPoint.y, endPoint.y), // No nível do chão
      (startPoint.z + endPoint.z) / 2
    );
    
    // Rotacionar para alinhar com o caminho
    border.rotation.y = angle;
    
    border.receiveShadow = true;
    
    pathGroup.add(border);
  }
  
  /**
   * Cria uma ponte entre dois pontos
   */
  public createBridge(
    startPoint: THREE.Vector3,
    endPoint: THREE.Vector3,
    width: number,
    colors: ColorScheme
  ): THREE.Object3D {
    const bridgeGroup = new THREE.Group();
    
    // Calcular direção e comprimento
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const length = direction.length();
    direction.normalize();
    
    // Calcular ângulo para rotação
    const angle = Math.atan2(direction.z, direction.x);
    
    // Versão simplificada da ponte para garantir que seja renderizada corretamente
    // Tabuleiro da ponte
    const deckGeometry = new THREE.BoxGeometry(length, 0.1, width);
    const deckMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513, // Marrom madeira escura
      specular: 0x333333,
      shininess: 20
    });
    
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    
    // Posicionar corretamente
    deck.position.set(
      (startPoint.x + endPoint.x) / 2,
      Math.max(startPoint.y, endPoint.y) + 0.05, // Ligeiramente acima
      (startPoint.z + endPoint.z) / 2
    );
    
    // Rotacionar para alinhar com a direção
    deck.rotation.y = angle;
    
    deck.castShadow = true;
    deck.receiveShadow = true;
    
    bridgeGroup.add(deck);
    
    // Adicionar corrimões simplificados
    const railHeight = 0.3;
    const railGeometry = new THREE.BoxGeometry(length, railHeight, 0.05);
    const railMaterial = new THREE.MeshPhongMaterial({
      color: 0x6e4a31, // Marrom escuro
      shininess: 10
    });
    
    // Corrimão esquerdo
    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    leftRail.position.set(
      (startPoint.x + endPoint.x) / 2,
      Math.max(startPoint.y, endPoint.y) + 0.05 + railHeight/2,
      (startPoint.z + endPoint.z) / 2 + (width/2) - 0.05
    );
    leftRail.rotation.y = angle;
    leftRail.castShadow = true;
    
    // Corrimão direito
    const rightRail = new THREE.Mesh(railGeometry, railMaterial);
    rightRail.position.set(
      (startPoint.x + endPoint.x) / 2,
      Math.max(startPoint.y, endPoint.y) + 0.05 + railHeight/2,
      (startPoint.z + endPoint.z) / 2 - (width/2) + 0.05
    );
    rightRail.rotation.y = angle;
    rightRail.castShadow = true;
    
    bridgeGroup.add(leftRail);
    bridgeGroup.add(rightRail);
    
    return bridgeGroup;
  }
}