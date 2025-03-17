// src/Maps3d/3d/ornaments/BuildingGenerator.ts
import * as THREE from 'three';
import { RandomGenerator } from '../../utils/RandomGenerator';
import { ColorScheme } from '../../utils/ColorGenetics';

export class BuildingGenerator {
  /**
   * Cria um edifício com base no nível
   */
  public createBuilding(
    level: number,
    fusionLevel: number,
    colors: ColorScheme
  ): THREE.Group {
    const buildingGroup = new THREE.Group();
    
    // Altura e largura baseadas no nível
    const height = 0.5 + level * 0.4;
    const width = 0.5 + level * 0.2;
    
    // Cor base do edifício
    const buildingColor = new THREE.Color(colors.secondary);
    
    // Base do edifício (sempre presente)
    const baseGeometry = new THREE.BoxGeometry(width, height, width);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: buildingColor,
      specular: new THREE.Color(colors.specular),
      shininess: 30
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = height / 2; // Centralizar verticalmente
    base.castShadow = true;
    base.receiveShadow = true;
    
    buildingGroup.add(base);
    
    // Para níveis mais altos, adicionar elementos decorativos
    if (level >= 2) {
      // Telhado - corrigido para evitar distorções
      this.addRoof(buildingGroup, width, height, level, colors);
    }
    
    // Para níveis ainda mais altos, adicionar detalhes
    if (level >= 3) {
      // Janelas
      this.addWindows(buildingGroup, width, height, level);
    }
    
    // Adicionar escadas ou entrada
    if (level >= 2) {
      // Escadas ou plataforma na frente do edifício
      const stairsWidth = width * 0.6;
      const stairsDepth = width * 0.3;
      const stairsHeight = 0.05;
      
      const stairsGeometry = new THREE.BoxGeometry(stairsWidth, stairsHeight, stairsDepth);
      const stairsMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.primary),
        shininess: 20
      });
      
      const stairs = new THREE.Mesh(stairsGeometry, stairsMaterial);
      stairs.position.set(0, stairsHeight / 2, width / 2 + stairsDepth / 2);
      stairs.receiveShadow = true;
      
      buildingGroup.add(stairs);
    }
    
    // Características adicionais para níveis de fusão altos
    if (fusionLevel >= 3 && level >= 4) {
      // Torre
      this.addTower(buildingGroup, width, height, level, colors, fusionLevel);
      
      // Detalhes adicionais - cercas, jardim, etc.
      if (level >= 5) {
        this.addExtraDetails(buildingGroup, width, height, colors);
      }
    }
    
    // Ajuste a posição Y do grupo inteiro para garantir que fique acima do terreno
    buildingGroup.position.y += 0.05;
    
    return buildingGroup;
  }
  
  /**
   * Adiciona detalhes extras ao redor do edifício
   */
  private addExtraDetails(
    buildingGroup: THREE.Group,
    width: number,
    height: number,
    colors: ColorScheme
  ): void {
    const random = new RandomGenerator(Math.random() * 1000);
    
    // Adicionar cercas decorativas ou muros baixos
    const fenceLength = width * 1.5;
    const fenceHeight = 0.15;
    const fenceThickness = 0.03;
    
    const fenceGeometry = new THREE.BoxGeometry(fenceLength, fenceHeight, fenceThickness);
    const fenceMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      shininess: 30
    });
    
    // Posicionar cercas nos lados do edifício
    for (let i = 0; i < 2; i++) {
      const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
      fence.position.set(0, fenceHeight / 2, (i === 0 ? 1 : -1) * (width / 2 + fenceLength / 4));
      fence.castShadow = true;
      fence.receiveShadow = true;
      
      buildingGroup.add(fence);
      
      // Cerca lateral (perpendicular)
      const sideFence = new THREE.Mesh(
        new THREE.BoxGeometry(fenceThickness, fenceHeight, fenceLength / 2),
        fenceMaterial
      );
      sideFence.position.set(
        fenceLength / 2,
        fenceHeight / 2,
        (i === 0 ? 1 : -1) * (width / 4)
      );
      sideFence.castShadow = true;
      sideFence.receiveShadow = true;
      
      buildingGroup.add(sideFence);
    }
    
    // Adicionar alguns arbustos decorativos
    for (let i = 0; i < 4; i++) {
      const bushSize = 0.15 + random.next() * 0.1;
      const bushGeometry = new THREE.SphereGeometry(bushSize, 8, 8);
      const bushMaterial = new THREE.MeshPhongMaterial({
        color: 0x2E8B57, // Verde
        shininess: 15
      });
      
      const bush = new THREE.Mesh(bushGeometry, bushMaterial);
      
      // Posicionar em locais estratégicos
      const angle = (i / 4) * Math.PI * 2;
      const distance = width * 0.8;
      
      bush.position.set(
        Math.sin(angle) * distance,
        bushSize,
        Math.cos(angle) * distance
      );
      
      bush.castShadow = true;
      bush.receiveShadow = true;
      
      buildingGroup.add(bush);
    }
  }
  
  /**
   * Adiciona um telhado corrigido ao edifício
   */
  private addRoof(
    buildingGroup: THREE.Group,
    width: number,
    height: number,
    level: number,
    colors: ColorScheme
  ): void {
    // Escolher estilo de telhado baseado no level
    if (level % 3 === 0) {
      // Telhado plano com borda
      this.addFlatRoof(buildingGroup, width, height, colors);
    } else if (level % 3 === 1) {
      // Telhado piramidal
      this.addPyramidalRoof(buildingGroup, width, height, colors);
    } else {
      // Telhado de duas águas
      this.addGableRoof(buildingGroup, width, height, colors);
    }
  }
  
  /**
   * Adiciona um telhado plano com borda
   */
  private addFlatRoof(
    buildingGroup: THREE.Group,
    width: number,
    height: number,
    colors: ColorScheme
  ): void {
    // Base do telhado (plano)
    const roofBaseGeometry = new THREE.BoxGeometry(width, 0.1, width);
    const roofBaseMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      shininess: 20
    });
    
    const roofBase = new THREE.Mesh(roofBaseGeometry, roofBaseMaterial);
    roofBase.position.y = height + 0.05; // Posicionar acima do edifício
    roofBase.castShadow = true;
    
    buildingGroup.add(roofBase);
    
    // Borda do telhado (4 segmentos)
    const borderWidth = 0.05;
    const borderHeight = 0.1;
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const borderLength = width;
      
      const borderGeometry = new THREE.BoxGeometry(borderLength, borderHeight, borderWidth);
      const borderMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.primary),
        shininess: 30
      });
      
      const border = new THREE.Mesh(borderGeometry, borderMaterial);
      
      // Posicionar nas bordas do telhado
      const halfWidth = width / 2;
      const xOffset = Math.cos(angle) * halfWidth;
      const zOffset = Math.sin(angle) * halfWidth;
      
      border.position.set(xOffset, height + 0.15, zOffset);
      border.rotation.y = angle + Math.PI / 2; // Rotacionar para alinhar com a borda
      
      border.castShadow = true;
      
      buildingGroup.add(border);
    }
  }
  
  /**
   * Adiciona um telhado piramidal
   */
  private addPyramidalRoof(
    buildingGroup: THREE.Group,
    width: number,
    height: number,
    colors: ColorScheme
  ): void {
    const roofHeight = 0.4; // Altura do telhado fixada para evitar distorções
    
    // Geometria piramidal = base quadrada
    const roofGeometry = new THREE.ConeGeometry(width * 0.75, roofHeight, 4);
    const roofMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      shininess: 20
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height + (roofHeight / 2);
    roof.rotation.y = Math.PI / 4; // Rotacionar 45 graus para alinhar com a base
    roof.castShadow = true;
    
    buildingGroup.add(roof);
  }
  
  /**
   * Adiciona um telhado de duas águas (gable roof)
   */
  private addGableRoof(
    buildingGroup: THREE.Group,
    width: number,
    height: number,
    colors: ColorScheme
  ): void {
    // Altura do telhado proporcional à largura, mas fixa para evitar distorções
    const roofHeight = width * 0.6;
    
    // Criar forma personalizada para telhado de duas águas
    const shape = new THREE.Shape();
    shape.moveTo(-width/2, 0);
    shape.lineTo(0, roofHeight);
    shape.lineTo(width/2, 0);
    shape.lineTo(-width/2, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: width,
      bevelEnabled: false
    };
    
    const roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const roofMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      shininess: 20
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height;
    roof.position.z = -width / 2;
    roof.castShadow = true;
    
    buildingGroup.add(roof);
  }
  
  /**
   * Adiciona janelas ao edifício
   */
  private addWindows(
    buildingGroup: THREE.Group,
    width: number,
    height: number,
    level: number
  ): void {
    const windowSize = 0.15;
    const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
    const windowMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffaa, // Amarelo claro para janelas iluminadas
      emissive: 0x555533,
      emissiveIntensity: 0.5, // Aumentado para maior visibilidade
      specular: 0xffffff,
      shininess: 100
    });
    
    // Número de andares baseado no nível
    const floors = Math.max(1, Math.min(level, 4));
    
    // Janelas em cada lado do edifício
    for (let floor = 0; floor < floors; floor++) {
      const y = 0.3 + floor * 0.4; // Altura da janela
      
      // 4 lados do edifício
      for (let side = 0; side < 4; side++) {
        // Rotação para cada lado
        const rotation = (side / 4) * Math.PI * 2;
        
        // Deslocamento para frente do respectivo lado
        const xOffset = Math.sin(rotation) * (width / 2 + 0.01);
        const zOffset = Math.cos(rotation) * (width / 2 + 0.01);
        
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(xOffset, y, zOffset);
        window.rotation.y = rotation;
        
        buildingGroup.add(window);
      }
    }
    
    // Para edifícios mais altos, adicionar porta na frente
    if (level >= 4) {
      const doorGeometry = new THREE.PlaneGeometry(windowSize * 1.2, windowSize * 2);
      const doorMaterial = new THREE.MeshPhongMaterial({
        color: 0x4d2926, // Cor de madeira escura
        shininess: 50
      });
      
      const door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(0, windowSize, width / 2 + 0.01);
      door.rotation.y = Math.PI;
      
      buildingGroup.add(door);
    }
  }
  
  /**
   * Adiciona uma torre ao edifício
   */
  private addTower(
    buildingGroup: THREE.Group,
    width: number,
    height: number,
    level: number,
    colors: ColorScheme,
    fusionLevel: number
  ): void {
    const towerWidth = width * 0.4;
    const towerHeight = height * 0.6;
    
    // Posição da torre (canto do edifício)
    const towerX = width / 2 - towerWidth / 2;
    const towerZ = width / 2 - towerWidth / 2;
    
    // Corpo da torre
    const towerGeometry = new THREE.CylinderGeometry(
      towerWidth / 2,
      towerWidth / 2,
      towerHeight,
      8
    );
    
    const towerMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      specular: new THREE.Color(colors.specular),
      shininess: 30
    });
    
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(towerX, height + (towerHeight / 2), towerZ);
    tower.castShadow = true;
    
    // Telhado cônico para a torre
    const towerRoofGeometry = new THREE.ConeGeometry(
      towerWidth / 2 + 0.05, // Ligeiramente maior que a torre para um efeito de beiral
      0.3,
      8
    );
    
    const towerRoofMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      shininess: 20
    });
    
    const towerRoof = new THREE.Mesh(towerRoofGeometry, towerRoofMaterial);
    towerRoof.position.y = towerHeight / 2 + 0.15;
    towerRoof.castShadow = true;
    
    tower.add(towerRoof);
    buildingGroup.add(tower);
    
    // Adicionar janela na torre
    const towerWindowGeometry = new THREE.PlaneGeometry(0.1, 0.1);
    const towerWindowMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffaa,
      emissive: 0x555533,
      emissiveIntensity: 0.5,
      specular: 0xffffff,
      shininess: 100
    });
    
    // Adicionar pequenas janelas ao redor da torre (4 lados)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const windowX = Math.sin(angle) * (towerWidth / 2 + 0.01);
      const windowZ = Math.cos(angle) * (towerWidth / 2 + 0.01);
      
      const towerWindow = new THREE.Mesh(towerWindowGeometry, towerWindowMaterial);
      towerWindow.position.set(windowX, towerHeight * 0.3, windowZ);
      towerWindow.rotation.y = angle;
      
      tower.add(towerWindow);
    }
    
    // Adicionar bandeira no topo para níveis altos
    if (level >= 5) {
      // Mastro da bandeira
      const flagpoleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
      const flagpoleMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const flagpole = new THREE.Mesh(flagpoleGeometry, flagpoleMaterial);
      flagpole.position.y = 0.25; // Posição relativa ao telhado
      flagpole.castShadow = true;
      
      // Bandeira
      const flagGeometry = new THREE.PlaneGeometry(0.2, 0.15);
      const flagMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.accent),
        side: THREE.DoubleSide,
        shininess: 30
      });
      
      const flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(0.12, 0.05, 0); // Deslocado do mastro
      flag.rotation.y = Math.PI / 2;
      flag.castShadow = true;
      
      // Adicionar a bandeira ao mastro
      flagpole.add(flag);
      
      // Adicionar o mastro ao telhado da torre
      towerRoof.add(flagpole);
    }
  }
}