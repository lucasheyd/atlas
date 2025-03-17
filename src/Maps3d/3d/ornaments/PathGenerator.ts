// src/Maps3d/3d/ornaments/PathGenerator.ts
import * as THREE from 'three';
import { ColorScheme } from '../../utils/ColorGenetics';

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
    
    // Calcular rotação
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    
    // Criar geometria do caminho
    const pathGeometry = new THREE.PlaneGeometry(width, length);
    const pathMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      specular: new THREE.Color(colors.specular),
      shininess: 10
    });
    
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.quaternion.copy(quaternion);
    
    // Posicionar o caminho
    path.position.copy(startPoint).add(direction.multiplyScalar(length / 2));
    path.rotation.x = -Math.PI / 2; // Rotacionar para ficar horizontal
    
    path.receiveShadow = true;
    
    pathGroup.add(path);
    
    // Adicionar bordas ao caminho
    const edgeGeometry = new THREE.BoxGeometry(width * 1.1, length * 0.02, width * 0.1);
    const edgeMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 20
    });
    
    // Borda superior
    const topEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    topEdge.position.copy(startPoint).add(direction.multiplyScalar(length / 2));
    topEdge.position.y += 0.01;
    topEdge.quaternion.copy(quaternion);
    topEdge.rotation.x = -Math.PI / 2;
    
    // Bordas laterais
    const sideEdgeGeometry = new THREE.BoxGeometry(width * 0.05, length, width * 0.05);
    
    const leftEdge = new THREE.Mesh(sideEdgeGeometry, edgeMaterial);
    leftEdge.position.copy(startPoint).add(direction.multiplyScalar(length / 2));
    leftEdge.position.set(
      leftEdge.position.x - width / 2,
      leftEdge.position.y + 0.025,
      leftEdge.position.z
    );
    leftEdge.quaternion.copy(quaternion);
    
    const rightEdge = new THREE.Mesh(sideEdgeGeometry, edgeMaterial);
    rightEdge.position.copy(startPoint).add(direction.multiplyScalar(length / 2));
    rightEdge.position.set(
      rightEdge.position.x + width / 2,
      rightEdge.position.y + 0.025,
      rightEdge.position.z
    );
    rightEdge.quaternion.copy(quaternion);
    
    pathGroup.add(topEdge);
    pathGroup.add(leftEdge);
    pathGroup.add(rightEdge);
    
    return pathGroup;
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
    
    // Calcular rotação
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    
    // Criar geometria da ponte
    const bridgeGeometry = new THREE.BoxGeometry(width, 0.1, length);
    const bridgeMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513, // Marrom (madeira)
      specular: 0x333333,
      shininess: 20
    });
    
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.copy(startPoint).add(direction.multiplyScalar(length / 2));
    bridge.position.y += 0.05;
    bridge.quaternion.copy(quaternion);
    
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    
    bridgeGroup.add(bridge);
    
    // Adicionar corrimãos
    const railingGeometry = new THREE.BoxGeometry(width, 0.2, 0.1);
    const railingMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513,
      specular: 0x333333,
      shininess: 20
    });
    
    // Corrimão frontal
    const frontRailing = new THREE.Mesh(railingGeometry, railingMaterial);
    frontRailing.position.copy(startPoint).add(direction.multiplyScalar(0));
    frontRailing.position.y += 0.2;
    frontRailing.quaternion.copy(quaternion);
    
    // Corrimão traseiro
    const backRailing = new THREE.Mesh(railingGeometry, railingMaterial);
    backRailing.position.copy(startPoint).add(direction.multiplyScalar(length));
    backRailing.position.y += 0.2;
    backRailing.quaternion.copy(quaternion);
    
    // Corrimãos laterais
    const sideRailingGeometry = new THREE.BoxGeometry(0.1, 0.2, length);
    
    const leftRailing = new THREE.Mesh(sideRailingGeometry, railingMaterial);
    leftRailing.position.copy(startPoint).add(direction.multiplyScalar(length / 2));
    leftRailing.position.set(
      leftRailing.position.x - width / 2,
      leftRailing.position.y + 0.2,
      leftRailing.position.z
    );
    leftRailing.quaternion.copy(quaternion);
    
    const rightRailing = new THREE.Mesh(sideRailingGeometry, railingMaterial);
    rightRailing.position.copy(startPoint).add(direction.multiplyScalar(length / 2));
    rightRailing.position.set(
      rightRailing.position.x + width / 2,
      rightRailing.position.y + 0.2,
      rightRailing.position.z
    );
    rightRailing.quaternion.copy(quaternion);
    
    bridgeGroup.add(frontRailing);
    bridgeGroup.add(backRailing);
    bridgeGroup.add(leftRailing);
    bridgeGroup.add(rightRailing);
    
    // Adicionar pilares
    const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const pillarMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513,
      specular: 0x333333,
      shininess: 20
    });
    
    const pillarCount = Math.floor(length / (width * 0.8)) + 1;
    for (let i = 0; i < pillarCount; i++) {
      const t = i / (pillarCount - 1);
      const position = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
      
      const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      leftPillar.position.copy(position);
      leftPillar.position.set(
        leftPillar.position.x - width / 2.2,
        leftPillar.position.y - 0.2,
        leftPillar.position.z
      );
      
      const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      rightPillar.position.copy(position);
      rightPillar.position.set(
        rightPillar.position.x + width / 2.2,
        rightPillar.position.y - 0.2,
        rightPillar.position.z
      );
      
      bridgeGroup.add(leftPillar);
      bridgeGroup.add(rightPillar);
    }
    
    return bridgeGroup;
  }
}
