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
    base.position.y = height / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    
    buildingGroup.add(base);
    
    // Para níveis mais altos, adicionar elementos decorativos
    if (level >= 2) {
      // Telhado
      const roofHeight = 0.3;
      const roofGeometry = new THREE.ConeGeometry(width * 0.8, roofHeight, 4);
      const roofMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(colors.accent),
        shininess: 20
      });
      
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = height + (roofHeight / 2);
      roof.castShadow = true;
      
      buildingGroup.add(roof);
    }
    
    // Para níveis ainda mais altos, adicionar detalhes
    if (level >= 3) {
      // Janelas
      const windowSize = 0.15;
      const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
      const windowMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffaa, // Amarelo claro para janelas iluminadas
        emissive: 0x555533,
        specular: 0xffffff,
        shininess: 100
      });
      
      // Adicionar várias janelas nas laterais
      for (let i = 0; i < level; i++) {
        const y = 0.3 + i * 0.4;
        
        // Janela frontal
        const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow.position.set(0, y, width / 2 + 0.01);
        frontWindow.rotateY(Math.PI);
        
        // Janela traseira
        const backWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        backWindow.position.set(0, y, -width / 2 - 0.01);
        
        // Janelas laterais
        const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        leftWindow.position.set(-width / 2 - 0.01, y, 0);
        leftWindow.rotateY(-Math.PI / 2);
        
        const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        rightWindow.position.set(width / 2 + 0.01, y, 0);
        rightWindow.rotateY(Math.PI / 2);
        
        buildingGroup.add(frontWindow);
        buildingGroup.add(backWindow);
        buildingGroup.add(leftWindow);
        buildingGroup.add(rightWindow);
      }
    }
    
    // Características adicionais para níveis de fusão altos
    if (fusionLevel >= 3 && level >= 4) {
      // Torre
      const towerWidth = width * 0.4;
      const towerHeight = height * 0.6;
      
      const towerGeometry = new THREE.CylinderGeometry(
        towerWidth / 2,
        towerWidth / 2,
        towerHeight,
        8
      );
      
      const towerMaterial = new THREE.MeshPhongMaterial({
        color: buildingColor,
        specular: new THREE.Color(colors.specular),
        shininess: 30
      });
      
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(width / 2, height + (towerHeight / 2), width / 2);
      tower.castShadow = true;
      
      // Topo da torre
      const towerRoofGeometry = new THREE.ConeGeometry(
        towerWidth / 2,
        0.3,
        8
      );
      
      const towerRoof = new THREE.Mesh(towerRoofGeometry, roofMaterial);
      towerRoof.position.y = towerHeight / 2 + 0.15;
      towerRoof.castShadow = true;
      
      tower.add(towerRoof);
      buildingGroup.add(tower);
      
      // Bandeira para os muito importantes
      if (level >= 5) {
        const flagpoleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
        const flagpoleMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const flagpole = new THREE.Mesh(flagpoleGeometry, flagpoleMaterial);
        flagpole.position.y = 0.25;
        
        const flagGeometry = new THREE.PlaneGeometry(0.3, 0.2);
        const flagMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colors.accent),
          side: THREE.DoubleSide
        });
        
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0.15, 0, 0);
        flag.rotation.y = Math.PI / 2;
        
        flagpole.add(flag);
        towerRoof.add(flagpole);
      }
    }
    
    return buildingGroup;
  }
  
  /**
   * Cria uma torre grande
   */
  public createTower(
    height: number,
    width: number,
    colors: ColorScheme
  ): THREE.Group {
    const towerGroup = new THREE.Group();
    
    // Base da torre
    const baseGeometry = new THREE.CylinderGeometry(
      width * 0.6,
      width,
      height * 0.2,
      16
    );
    
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 30
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = height * 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    
    towerGroup.add(base);
    
    // Corpo da torre
    const bodyGeometry = new THREE.CylinderGeometry(
      width * 0.5,
      width * 0.6,
      height * 0.7,
      16
    );
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      specular: new THREE.Color(colors.specular),
      shininess: 30
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height * 0.5;
    body.castShadow = true;
    
    towerGroup.add(body);
    
    // Topo da torre
    const topGeometry = new THREE.CylinderGeometry(
      width * 0.3,
      width * 0.5,
      height * 0.1,
      16
    );
    
    const top = new THREE.Mesh(topGeometry, baseMaterial);
    top.position.y = height * 0.9;
    top.castShadow = true;
    
    towerGroup.add(top);
    
    // Telhado pontiagudo
    const roofGeometry = new THREE.ConeGeometry(
      width * 0.35,
      height * 0.2,
      16
    );
    
    const roofMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      shininess: 50
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height * 1.05;
    roof.castShadow = true;
    
    towerGroup.add(roof);
    
    // Janelas
    const windowMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffaa,
      emissive: 0x555533,
      specular: 0xffffff,
      shininess: 100
    });
    
    // Adicionar janelas ao redor da torre
    const windowCount = 8;
    for (let i = 0; i < windowCount; i++) {
      const angle = (i / windowCount) * Math.PI * 2;
      const windowRadius = width * 0.55;
      
      const windowGeometry = new THREE.PlaneGeometry(0.2, 0.3);
      const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      
      windowMesh.position.set(
        Math.cos(angle) * windowRadius,
        height * 0.5,
        Math.sin(angle) * windowRadius
      );
      
      windowMesh.rotation.y = angle + Math.PI / 2;
      
      towerGroup.add(windowMesh);
    }
    
    return towerGroup;
  }
  
  /**
   * Cria um monumento baseado no estilo
   */
  public createMonument(
    height: number,
    style: string,
    colors: ColorScheme
  ): THREE.Group {
    const monumentGroup = new THREE.Group();
    
    switch (style) {
      case 'obelisk':
        return this.createObelisk(height, colors);
      case 'statue':
        return this.createStatue(height, colors);
      case 'arch':
        return this.createArch(height, colors);
      default:
        return this.createObelisk(height, colors);
    }
  }
  
  // Métodos privados para criar tipos específicos de monumentos
  
  private createObelisk(height: number, colors: ColorScheme): THREE.Group {
    const obeliskGroup = new THREE.Group();
    
    // Base
    const baseGeometry = new THREE.BoxGeometry(height * 0.4, height * 0.1, height * 0.4);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 30
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = height * 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    
    obeliskGroup.add(base);
    
    // Corpo
    const bodyGeometry = new THREE.BoxGeometry(
      height * 0.15,
      height * 0.8,
      height * 0.15
    );
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      specular: new THREE.Color(colors.specular),
      shininess: 40
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height * 0.5;
    body.castShadow = true;
    
    obeliskGroup.add(body);
    
    // Ponta
    const tipGeometry = new THREE.ConeGeometry(
      height * 0.08,
      height * 0.2,
      4
    );
    
    const tipMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      specular: new THREE.Color(colors.specular),
      shininess: 80
    });
    
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.y = height * 1.0;
    tip.castShadow = true;
    
    obeliskGroup.add(tip);
    
    return obeliskGroup;
  }
  
  private createStatue(height: number, colors: ColorScheme): THREE.Group {
    const statueGroup = new THREE.Group();
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(
      height * 0.3,
      height * 0.4,
      height * 0.15,
      16
    );
    
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 30
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = height * 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    
    statueGroup.add(base);
    
    // Forma humanoide simplificada (para manter baixa poligonagem)
    // Torso
    const torsoGeometry = new THREE.CylinderGeometry(
      height * 0.1,
      height * 0.15,
      height * 0.4,
      8
    );
    
    const statueMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.accent),
      specular: new THREE.Color(colors.specular),
      shininess: 50
    });
    
    const torso = new THREE.Mesh(torsoGeometry, statueMaterial);
    torso.position.y = height * 0.35;
    torso.castShadow = true;
    
    statueGroup.add(torso);
    
    // Cabeça
    const headGeometry = new THREE.SphereGeometry(height * 0.08, 8, 8);
    const head = new THREE.Mesh(headGeometry, statueMaterial);
    head.position.y = height * 0.6;
    head.castShadow = true;
    
    statueGroup.add(head);
    
    // Braços
    const armGeometry = new THREE.CylinderGeometry(
      height * 0.03,
      height * 0.03,
      height * 0.25,
      8
    );
    
    // Braço esquerdo
    const leftArm = new THREE.Mesh(armGeometry, statueMaterial);
    leftArm.position.set(height * 0.15, height * 0.4, 0);
    leftArm.rotation.z = Math.PI / 3;
    leftArm.castShadow = true;
    
    statueGroup.add(leftArm);
    
    // Braço direito
    const rightArm = new THREE.Mesh(armGeometry, statueMaterial);
    rightArm.position.set(-height * 0.15, height * 0.4, 0);
    rightArm.rotation.z = -Math.PI / 3;
    rightArm.castShadow = true;
    
    statueGroup.add(rightArm);
    
    return statueGroup;
  }
  
// src/Maps3d/3d/ornaments/BuildingGenerator.ts (continuação)
  private createArch(height: number, colors: ColorScheme): THREE.Group {
    const archGroup = new THREE.Group();
    
    // Material para o arco
    const archMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.primary),
      specular: new THREE.Color(colors.specular),
      shininess: 30
    });
    
    // Pilares
    const pillarGeometry = new THREE.BoxGeometry(
      height * 0.2,
      height * 0.7,
      height * 0.2
    );
    
    const leftPillar = new THREE.Mesh(pillarGeometry, archMaterial);
    leftPillar.position.set(-height * 0.4, height * 0.35, 0);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    
    const rightPillar = new THREE.Mesh(pillarGeometry, archMaterial);
    rightPillar.position.set(height * 0.4, height * 0.35, 0);
    rightPillar.castShadow = true;
    rightPillar.receiveShadow = true;
    
    archGroup.add(leftPillar);
    archGroup.add(rightPillar);
    
    // Parte superior do arco (abordagem simplificada)
    const topArchGeometry = new THREE.BoxGeometry(
      height * 0.9,
      height * 0.1,
      height * 0.2
    );
    
    const topArch = new THREE.Mesh(topArchGeometry, archMaterial);
    topArch.position.set(0, height * 0.8, 0);
    topArch.castShadow = true;
    
    archGroup.add(topArch);
    
    // Decoração no topo
    const decorationGeometry = new THREE.BoxGeometry(
      height * 1.0,
      height * 0.2,
      height * 0.25
    );
    
    const decorationMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colors.secondary),
      specular: new THREE.Color(colors.specular),
      shininess: 30
    });
    
    const decoration = new THREE.Mesh(decorationGeometry, decorationMaterial);
    decoration.position.set(0, height * 0.95, 0);
    decoration.castShadow = true;
    
    archGroup.add(decoration);
    
    return archGroup;
  }
}
