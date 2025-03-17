// src/Maps3d/3d/territories/ForestGenerator.ts
import {
  Group,
  Mesh,
  CylinderGeometry,
  ConeGeometry,
  MeshStandardMaterial,
  Color,
  Object3D,
  SphereGeometry,
  Vector3,
  Box3
} from 'three';
import { PRNG } from '../../utils/PRNG';

/**
 * Adds forest elements (trees, vegetation) to a territory
 * @param target - The parent object to add forest elements to
 * @param options - Configuration options
 * @returns The target object with forest elements added
 */
export function addForestElements(target: Object3D, options: any = {}): Object3D {
  try {
    // Default options
    const {
      density = 0.3,
      color = '#2E7D32',
      treeCount = 20,
      random = new PRNG(12345)
    } = options || {};
    
    // Create a container for all forest elements
    const forestGroup = new Group();
    forestGroup.name = 'forest-elements';
    
    // Calculate actual tree count based on density
    const actualTreeCount = Math.floor(treeCount * density);
    
    // Get target bounds
    const targetBounds = new Box3().setFromObject(target);
    const targetSize = new Vector3();
    targetBounds.getSize(targetSize);
    
    // Add trees
    for (let i = 0; i < actualTreeCount; i++) {
      // Create a tree at a random position
      const tree = createTree({
        color,
        height: 5 + random.next() * 5,
        trunkRadius: 0.5 + random.next() * 0.5,
        random
      });
      
      // Position within the target area
      tree.position.set(
        (random.next() - 0.5) * targetSize.x * 0.8,
        0, // Trees should be on the ground
        (random.next() - 0.5) * targetSize.z * 0.8
      );
      
      // Random rotation
      tree.rotation.y = random.next() * Math.PI * 2;
      
      // Random scale variation
      const scale = 0.8 + random.next() * 0.4;
      tree.scale.set(scale, scale, scale);
      
      forestGroup.add(tree);
    }
    
    // Add bushes and ground vegetation
    const bushCount = Math.floor(actualTreeCount * 1.5);
    for (let i = 0; i < bushCount; i++) {
      const bush = createBush({
        color,
        scale: 0.5 + random.next() * 0.5,
        random
      });
      
      // Position within the target area
      bush.position.set(
        (random.next() - 0.5) * targetSize.x * 0.9,
        0,
        (random.next() - 0.5) * targetSize.z * 0.9
      );
      
      forestGroup.add(bush);
    }
    
    target.add(forestGroup);
    return target;
  } catch (error) {
    console.error("Error adding forest elements:", error);
    return target; // Return the original target without changes
  }
}

/**
 * Creates a tree object
 */
function createTree(options: any = {}): Object3D {
  const {
    color = '#2E7D32',
    height = 10,
    trunkRadius = 0.8,
    random = new PRNG(12345)
  } = options;
  
  const tree = new Group();
  tree.name = 'tree';
  
  // Create trunk
  const trunkHeight = height * 0.4;
  const trunkGeometry = new CylinderGeometry(
    trunkRadius * 0.7, // Top radius (slightly narrower at top)
    trunkRadius,       // Bottom radius
    trunkHeight,       // Height
    8,                 // Radial segments
    3                  // Height segments
  );
  
  const trunkMaterial = new MeshStandardMaterial({
    color: new Color('#8B4513'), // Brown color for trunk
    roughness: 0.9,
    metalness: 0.1
  });
  
  const trunk = new Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);
  
  // Create tree type based on random
  const treeType = random.nextInt(0, 2);
  
  if (treeType === 0) {
    // Conical tree (pine/evergreen)
    addConiferFoliage(tree, {
      color,
      height: height * 0.6,
      radius: height * 0.25,
      segments: 3,
      random
    });
  } else if (treeType === 1) {
    // Deciduous tree (round top)
    addDeciduousFoliage(tree, {
      color,
      height: height * 0.6,
      radius: height * 0.3,
      random
    });
  } else {
    // Hybrid type
    addHybridFoliage(tree, {
      color,
      height: height * 0.6,
      radius: height * 0.25,
      random
    });
  }
  
  return tree;
}

/**
 * Adds conifer-style foliage to a tree (pine tree)
 */
function addConiferFoliage(tree: Group, options: any): void {
  const {
    color = '#2E7D32',
    height = 6,
    radius = 2,
    segments = 3,
    random = new PRNG(12345)
  } = options;
  
  const baseMaterial = new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.8,
    metalness: 0.1
  });
  
  // Calculate trunk position to place foliage on top
  const trunkTop = new Vector3();
  tree.children[0].getWorldPosition(trunkTop);
  const baseY = tree.children[0].position.y + tree.children[0].geometry.parameters.height / 2;
  
  // Create multiple cone segments
  const segmentHeight = height / segments;
  
  for (let i = 0; i < segments; i++) {
    // Each segment gets narrower as we go up
    const segmentRadius = radius * (1 - (i / segments) * 0.4);
    
    const coneGeometry = new ConeGeometry(
      segmentRadius,
      segmentHeight,
      8  // Radial segments
    );
    
    // Slightly vary the color of each segment
    const segmentMaterial = baseMaterial.clone();
    segmentMaterial.color.offsetHSL(0, 0, (random.next() - 0.5) * 0.1);
    
    const cone = new Mesh(coneGeometry, segmentMaterial);
    cone.position.y = baseY + i * segmentHeight + segmentHeight / 2;
    cone.castShadow = true;
    
    tree.add(cone);
  }
}

/**
 * Adds deciduous-style foliage to a tree (round top)
 */
function addDeciduousFoliage(tree: Group, options: any): void {
  const {
    color = '#2E7D32',
    height = 6,
    radius = 3,
    random = new PRNG(12345)
  } = options;
  
  const baseMaterial = new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.8,
    metalness: 0.1
  });
  
  // Calculate trunk position to place foliage on top
  const baseY = tree.children[0].position.y + tree.children[0].geometry.parameters.height / 2;
  
  // Create a main large sphere for the bulk of the foliage
  const mainSphereGeometry = new SphereGeometry(radius, 8, 8);
  const mainSphereMaterial = baseMaterial.clone();
  
  const mainSphere = new Mesh(mainSphereGeometry, mainSphereMaterial);
  mainSphere.position.y = baseY + height * 0.6;
  mainSphere.castShadow = true;
  tree.add(mainSphere);
  
  // Add a few smaller spheres to create a more complex crown
  const smallSphereCount = random.nextInt(2, 5);
  
  for (let i = 0; i < smallSphereCount; i++) {
    const smallRadius = radius * (0.5 + random.next() * 0.4);
    const smallSphereGeometry = new SphereGeometry(smallRadius, 8, 8);
    
    // Slightly vary the color
    const smallSphereMaterial = baseMaterial.clone();
    smallSphereMaterial.color.offsetHSL(0, 0, (random.next() - 0.5) * 0.15);
    
    const smallSphere = new Mesh(smallSphereGeometry, smallSphereMaterial);
    
    // Position relative to main sphere
    const angle = random.next() * Math.PI * 2;
    const distance = radius * 0.7;
    
    smallSphere.position.set(
      Math.cos(angle) * distance,
      baseY + height * (0.4 + random.next() * 0.4),
      Math.sin(angle) * distance
    );
    
    smallSphere.castShadow = true;
    tree.add(smallSphere);
  }
}

/**
 * Adds hybrid foliage to a tree (mix of styles)
 */
function addHybridFoliage(tree: Group, options: any): void {
  const {
    color = '#2E7D32',
    height = 6,
    radius = 2.5,
    random = new PRNG(12345)
  } = options;
  
  const baseMaterial = new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.8,
    metalness: 0.1
  });
  
  // Calculate trunk position to place foliage on top
  const baseY = tree.children[0].position.y + tree.children[0].geometry.parameters.height / 2;
  
  // Create an elongated cone for the base shape
  const coneGeometry = new ConeGeometry(
    radius,
    height,
    8  // Radial segments
  );
  
  const cone = new Mesh(coneGeometry, baseMaterial);
  cone.position.y = baseY + height / 2;
  cone.castShadow = true;
  tree.add(cone);
  
  // Add a few spheres to make it more interesting
  const sphereCount = random.nextInt(3, 6);
  
  for (let i = 0; i < sphereCount; i++) {
    const sphereRadius = radius * (0.4 + random.next() * 0.3);
    const sphereGeometry = new SphereGeometry(sphereRadius, 8, 8);
    
    // Slightly vary the color
    const sphereMaterial = baseMaterial.clone();
    sphereMaterial.color.offsetHSL(0, (random.next() - 0.5) * 0.1, (random.next() - 0.5) * 0.1);
    
    const sphere = new Mesh(sphereGeometry, sphereMaterial);
    
    // Position within the cone shape
    const angle = random.next() * Math.PI * 2;
    const heightRatio = random.next() * 0.8 + 0.2; // 0.2 to 1.0
    const distanceFromCenter = radius * (1 - heightRatio) * 0.8;
    
    sphere.position.set(
      Math.cos(angle) * distanceFromCenter,
      baseY + height * heightRatio,
      Math.sin(angle) * distanceFromCenter
    );
    
    sphere.castShadow = true;
    tree.add(sphere);
  }
}

/**
 * Creates a bush object
 */
function createBush(options: any = {}): Object3D {
  const {
    color = '#2E7D32',
    scale = 1,
    random = new PRNG(12345)
  } = options;
  
  const bush = new Group();
  bush.name = 'bush';
  
  // Create multiple spheres for the bush
  const sphereCount = random.nextInt(2, 5);
  
  const baseMaterial = new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.8,
    metalness: 0.1
  });
  
  // Main sphere
  const mainSphereRadius = 1 * scale;
  const mainSphereGeometry = new SphereGeometry(mainSphereRadius, 8, 8);
  const mainSphere = new Mesh(mainSphereGeometry, baseMaterial);
  mainSphere.position.y = mainSphereRadius;
  mainSphere.castShadow = true;
  bush.add(mainSphere);
  
  // Additional spheres
  for (let i = 0; i < sphereCount; i++) {
    const sphereRadius = mainSphereRadius * (0.6 + random.next() * 0.4);
    const sphereGeometry = new SphereGeometry(sphereRadius, 8, 8);
    
    // Slightly vary the color
    const sphereMaterial = baseMaterial.clone();
    sphereMaterial.color.offsetHSL(0, 0, (random.next() - 0.5) * 0.2);
    
    const sphere = new Mesh(sphereGeometry, sphereMaterial);
    
    // Position relative to main sphere
    const angle = random.next() * Math.PI * 2;
    const distance = mainSphereRadius * 0.6;
    
    sphere.position.set(
      Math.cos(angle) * distance,
      mainSphereRadius * (0.8 + random.next() * 0.4),
      Math.sin(angle) * distance
    );
    
    sphere.castShadow = true;
    bush.add(sphere);
  }
  
  return bush;
}
