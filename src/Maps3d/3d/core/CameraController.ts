// src/Maps3d/3d/core/CameraController.ts
import * as THREE from 'three';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  
  // Estados da câmera
  private isRotating: boolean = false;
  private isPanning: boolean = false;
  private isZooming: boolean = false;
  
  // Velocidades de movimento
  private rotateVelocity: THREE.Vector2 = new THREE.Vector2();
  private zoomVelocity: number = 0;
  private panVelocity: THREE.Vector2 = new THREE.Vector2();
  
  // Configurações da câmera
  private dampingFactor: number = 0.92;
  private minDistance: number = 5;
  private maxDistance: number = 100;
  private minPolarAngle: number = Math.PI * 0.1; // 18 graus do zênite
  private maxPolarAngle: number = Math.PI * 0.45; // 81 graus do zênite
  
  // Animação
  private isAnimating: boolean = false;
  private animationStartPosition: THREE.Vector3 = new THREE.Vector3();
  private animationEndPosition: THREE.Vector3 = new THREE.Vector3();
  private animationStartTarget: THREE.Vector3 = new THREE.Vector3();
  private animationEndTarget: THREE.Vector3 = new THREE.Vector3();
  private animationProgress: number = 0;
  private animationDuration: number = 1000; // ms
  private animationStartTime: number = 0;
  
  /**
   * Cria um controlador de câmera para navegação 3D
   * @param aspect Razão de aspecto inicial da câmera
   */
  constructor(aspect: number) {
    // Criar câmera
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.resetToDefault();
  }
  
  /**
   * Obtém a câmera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  /**
   * Atualiza a razão de aspecto da câmera
   * @param aspect Nova razão de aspecto
   */
  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Inicia a rotação da câmera
   * @param velocity Velocidade inicial de rotação
   */
  public startRotate(velocity: THREE.Vector2): void {
    this.isRotating = true;
    this.rotateVelocity.copy(velocity);
  }
  
  /**
   * Para a rotação da câmera
   */
  public stopRotate(): void {
    this.isRotating = false;
  }
  
  /**
   * Aplica velocidade adicional à rotação
   * @param velocity Velocidade adicional de rotação
   */
  public addRotateVelocity(velocity: THREE.Vector2): void {
    this.rotateVelocity.add(velocity);
  }
  
  /**
   * Inicia o zoom da câmera
   * @param velocity Velocidade inicial de zoom
   */
  public startZoom(velocity: number): void {
    this.isZooming = true;
    this.zoomVelocity = velocity;
  }
  
  /**
   * Para o zoom da câmera
   */
  public stopZoom(): void {
    this.isZooming = false;
  }
  
  /**
   * Aplica velocidade adicional ao zoom
   * @param velocity Velocidade adicional de zoom
   */
  public addZoomVelocity(velocity: number): void {
    this.zoomVelocity += velocity;
  }
  
  /**
   * Inicia o pan da câmera
   * @param velocity Velocidade inicial de pan
   */
  public startPan(velocity: THREE.Vector2): void {
    this.isPanning = true;
    this.panVelocity.copy(velocity);
  }
  
  /**
   * Para o pan da câmera
   */
  public stopPan(): void {
    this.isPanning = false;
  }
  
  /**
   * Aplica velocidade adicional ao pan
   * @param velocity Velocidade adicional de pan
   */
  public addPanVelocity(velocity: THREE.Vector2): void {
    this.panVelocity.add(velocity);
  }
  
  /**
   * Reseta a câmera para a posição inicial padrão
   */
  public resetToDefault(): void {
    this.camera.position.set(0, 40, 35);
    this.target.set(0, 0, 0);
    this.camera.lookAt(this.target);
  }
  
  /**
   * Foca a câmera em um objeto específico
   * @param position Posição para focar
   * @param object Objeto para calcular distância apropriada
   */
  public focusOn(position: THREE.Vector3, object?: THREE.Object3D): void {
    this.stopAnimation();
    
    // Calcular tamanho do objeto se fornecido
    let objectSize = 10;
    if (object) {
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      objectSize = Math.max(size.x, size.y, size.z);
    }
    
    // Calcular posição da câmera
    const distance = objectSize * 2;
    const cameraPosition = new THREE.Vector3(
      position.x, 
      position.y + distance * 0.5, 
      position.z + distance
    );
    
    // Animar para a nova posição
    this.animateTo(cameraPosition, position);
  }
  
  /**
   * Ajusta a câmera para mostrar todos os objetos em vista
   * @param center Centro da vista
   * @param size Tamanho do volume a ser visualizado
   */
  public fitToView(center: THREE.Vector3, size: THREE.Vector3): void {
    this.stopAnimation();
    
    // Calcular tamanho máximo
    const maxSize = Math.max(size.x, size.y, size.z);
    
    // Calcular distância para enquadrar o objeto
    const fov = this.camera.fov * Math.PI / 180;
    const distance = maxSize / (2 * Math.tan(fov / 2));
    
    // Calcular nova posição da câmera
    const cameraPosition = new THREE.Vector3(
      center.x, 
      center.y + distance * 0.5, 
      center.z + distance * 1.2
    );
    
    // Animar para a nova posição
    this.animateTo(cameraPosition, center);
  }
  
  /**
   * Anima a câmera de sua posição atual para uma nova posição
   * @param newPosition Nova posição da câmera
   * @param newTarget Novo alvo da câmera
   */
  public animateTo(newPosition: THREE.Vector3, newTarget: THREE.Vector3): void {
    this.isAnimating = true;
    
    // Armazenar posições inicial e final
    this.animationStartPosition.copy(this.camera.position);
    this.animationEndPosition.copy(newPosition);
    
    this.animationStartTarget.copy(this.target);
    this.animationEndTarget.copy(newTarget);
    
    // Inicializar animação
    this.animationProgress = 0;
    this.animationStartTime = Date.now();
  }
  
  /**
   * Para qualquer animação em andamento
   */
  public stopAnimation(): void {
    this.isAnimating = false;
  }
  
  /**
   * Atualiza a posição e orientação da câmera
   */
  public update(): void {
    if (this.isAnimating) {
      this.updateAnimation();
      return;
    }
    
    // Calcular nova posição da câmera a partir das velocidades
    if (this.isRotating) {
      this.updateRotation();
    }
    
    if (this.isZooming) {
      this.updateZoom();
    }
    
    if (this.isPanning) {
      this.updatePan();
    }
    
    // Aplicar amortecimento às velocidades
    this.rotateVelocity.multiplyScalar(this.dampingFactor);
    this.zoomVelocity *= this.dampingFactor;
    this.panVelocity.multiplyScalar(this.dampingFactor);
    
    // Atualizar posição da câmera para olhar para o alvo
    this.camera.lookAt(this.target);
  }
  
  /**
   * Atualiza a animação da câmera
   */
  private updateAnimation(): void {
    const currentTime = Date.now();
    const elapsed = currentTime - this.animationStartTime;
    
    if (elapsed >= this.animationDuration) {
      // Animação completa, definir valores finais
      this.camera.position.copy(this.animationEndPosition);
      this.target.copy(this.animationEndTarget);
      this.camera.lookAt(this.target);
      
      this.isAnimating = false;
      return;
    }
    
    // Calcular progresso da animação (0 a 1) com easing
    const t = elapsed / this.animationDuration;
    const easedT = this.easeInOutCubic(t);
    
    // Interpolar posição e alvo
    this.camera.position.lerpVectors(
      this.animationStartPosition,
      this.animationEndPosition,
      easedT
    );
    
    this.target.lerpVectors(
      this.animationStartTarget,
      this.animationEndTarget,
      easedT
    );
    
    // Atualizar câmera
    this.camera.lookAt(this.target);
  }
  
  /**
   * Função de easing cubic in-out
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ?
      4 * t * t * t :
      1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Atualiza a rotação da câmera
   */
  private updateRotation(): void {
    // Converter posição para coordenadas esféricas
    const offset = new THREE.Vector3().subVectors(
      this.camera.position,
      this.target
    );
    
    // Obter valores atuais
    const radius = offset.length();
    const theta = Math.atan2(offset.x, offset.z); // Longitude
    const phi = Math.acos(Math.min(Math.max(offset.y / radius, -1), 1)); // Latitude
    
    // Aplicar rotação
    const newTheta = theta + this.rotateVelocity.x * 0.01;
    const newPhi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, phi + this.rotateVelocity.y * 0.01)
    );
    
    // Converter de volta para coordenadas cartesianas
    offset.x = radius * Math.sin(newPhi) * Math.sin(newTheta);
    offset.y = radius * Math.cos(newPhi);
    offset.z = radius * Math.sin(newPhi) * Math.cos(newTheta);
    
    // Atualizar posição da câmera
    this.camera.position.copy(this.target).add(offset);
  }
  
  /**
   * Atualiza o zoom da câmera
   */
  private updateZoom(): void {
    // Calcular direção de zoom
    const zoomDirection = new THREE.Vector3().subVectors(
      this.camera.position,
      this.target
    ).normalize();
    
    // Calcular nova distância
    const currentDistance = this.camera.position.distanceTo(this.target);
    const newDistance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, currentDistance - this.zoomVelocity)
    );
    
    // Ajustar posição da câmera
    this.camera.position.copy(this.target).add(
      zoomDirection.multiplyScalar(newDistance)
    );
  }
  
  /**
   * Atualiza o pan da câmera
   */
  private updatePan(): void {
    // Vetores da câmera
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    
    // Obter vetores right e up da câmera
    right.copy(this.camera.right).normalize();
    up.copy(this.camera.up).normalize();
    
    // Calcular movimento
    const panOffset = new THREE.Vector3();
    panOffset.add(right.multiplyScalar(-this.panVelocity.x));
    panOffset.add(up.multiplyScalar(this.panVelocity.y));
    
    // Aplicar movimento à câmera e alvo
    this.camera.position.add(panOffset);
    this.target.add(panOffset);
  }
}