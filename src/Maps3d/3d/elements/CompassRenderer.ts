// src/Maps3d/3d/elements/CompassRenderer.ts
import * as THREE from 'three';

export class CompassRenderer {
  public create(options?: {
    radius?: number;
    color?: number;
    borderColor?: number;
    textColor?: number;
  }): THREE.Object3D {
    const compassGroup = new THREE.Group();
    
    const radius = options?.radius ?? 10;
    const color = options?.color ?? 0xf7ecd5;
    const borderColor = options?.borderColor ?? 0xb98b56;
    const textColor = options?.textColor ?? 0xb98b56;
    
    // Círculo base
    const circleGeometry = new THREE.CircleGeometry(radius, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });
    
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.rotation.x = -Math.PI / 2;
    
    // Borda
    const borderGeometry = new THREE.RingGeometry(radius - 0.5, radius, 32);
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: borderColor,
      side: THREE.DoubleSide
    });
    
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.01;
    
    // Linhas direcionais
    const linesGroup = new THREE.Group();
    
    // Linha Norte-Sul
    const nsGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -radius + 1),
      new THREE.Vector3(0, 0, radius - 1)
    ]);
    
    const nsMaterial = new THREE.LineBasicMaterial({
      color: borderColor,
      linewidth: 2
    });
    
    const nsLine = new THREE.Line(nsGeometry, nsMaterial);
    
    // Linha Leste-Oeste
    const ewGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-radius + 1, 0, 0),
      new THREE.Vector3(radius - 1, 0, 0)
    ]);
    
    const ewLine = new THREE.Line(ewGeometry, nsMaterial);
    
    linesGroup.add(nsLine);
    linesGroup.add(ewLine);
    linesGroup.position.y = 0.02;
    
    // Ponto central
    const centerGeometry = new THREE.CircleGeometry(1, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: borderColor,
      side: THREE.DoubleSide
    });
    
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = -Math.PI / 2;
    center.position.y = 0.03;
    
    // Adicionar textos de direção
    const createDirectionLabel = (text: string, x: number, z: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#f7ecd5';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.font = 'bold 40px Georgia';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = `#${textColor.toString(16).padStart(6, '0')}`;
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const geometry = new THREE.PlaneGeometry(2, 2);
      const label = new THREE.Mesh(geometry, material);
      
      label.position.set(x, 0.04, z);
      label.rotation.x = -Math.PI / 2;
      
      return label;
    };
    
    // Adicionar as quatro direções
    const north = createDirectionLabel('N', 0, -radius + 3);
    const south = createDirectionLabel('S', 0, radius - 3);
    const east = createDirectionLabel('E', radius - 3, 0);
    const west = createDirectionLabel('W', -radius + 3, 0);
    
    // Montar grupo da bússola
    compassGroup.add(circle);
    compassGroup.add(border);
    compassGroup.add(linesGroup);
    compassGroup.add(center);
    compassGroup.add(north);
    compassGroup.add(south);
    compassGroup.add(east);
    compassGroup.add(west);
    
    // Bússola deve ficar no nível do oceano
    compassGroup.position.y = 0.1;
    
    return compassGroup;
  }
}
