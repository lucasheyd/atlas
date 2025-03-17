// src/Maps3d/3d/core/LightingSetup.ts
import * as THREE from 'three';

export interface LightingOptions {
  ambientIntensity?: number;
  ambientColor?: number;
  directionalIntensity?: number;
  directionalColor?: number;
  directionalPosition?: THREE.Vector3;
  includeFill?: boolean;
  fillIntensity?: number;
  fillColor?: number;
  fillPosition?: THREE.Vector3;
  shadows?: boolean;
  shadowMapSize?: number;
}

export class LightingSetup {
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private fillLight?: THREE.DirectionalLight;
  
  constructor(
    scene: THREE.Scene,
    options?: LightingOptions
  ) {
    this.scene = scene;
    
    // Configurar luz ambiente
    this.ambientLight = new THREE.AmbientLight(
      options?.ambientColor ?? 0xf7ecd5,
      options?.ambientIntensity ?? 0.7
    );
    this.scene.add(this.ambientLight);
    
    // Configurar luz direcional (sol)
    this.directionalLight = new THREE.DirectionalLight(
      options?.directionalColor ?? 0xffffff,
      options?.directionalIntensity ?? 0.8
    );
    
    const directionalPosition = options?.directionalPosition ?? new THREE.Vector3(50, 80, 50);
    this.directionalLight.position.copy(directionalPosition);
    
    // Configurar sombras
    if (options?.shadows !== false) {
      this.directionalLight.castShadow = true;
      this.directionalLight.shadow.mapSize.width = options?.shadowMapSize ?? 2048;
      this.directionalLight.shadow.mapSize.height = options?.shadowMapSize ?? 2048;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = 200;
      this.directionalLight.shadow.camera.left = -50;
      this.directionalLight.shadow.camera.right = 50;
      this.directionalLight.shadow.camera.top = 50;
      this.directionalLight.shadow.camera.bottom = -50;
    }
    
    this.scene.add(this.directionalLight);
    
    // Adicionar luz de preenchimento opcional
    if (options?.includeFill !== false) {
      this.fillLight = new THREE.DirectionalLight(
        options?.fillColor ?? 0xfff6e5,
        options?.fillIntensity ?? 0.3
      );
      
      const fillPosition = options?.fillPosition ?? new THREE.Vector3(-30, 40, -30);
      this.fillLight.position.copy(fillPosition);
      
      this.scene.add(this.fillLight);
    }
  }
  
  public setIntensity(
    ambient?: number,
    directional?: number,
    fill?: number
  ): void {
    if (ambient !== undefined) {
      this.ambientLight.intensity = ambient;
    }
    
    if (directional !== undefined) {
      this.directionalLight.intensity = directional;
    }
    
    if (fill !== undefined && this.fillLight) {
      this.fillLight.intensity = fill;
    }
  }
  
  public setDirectionalPosition(position: THREE.Vector3): void {
    this.directionalLight.position.copy(position);
  }
  
  public createLightHelper(): THREE.DirectionalLightHelper {
    return new THREE.DirectionalLightHelper(this.directionalLight, 10);
  }
}
