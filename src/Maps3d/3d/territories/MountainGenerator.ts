// src/Maps3d/3d/territories/MountainGenerator.ts
import {
  Group,
  Mesh,
  ConeGeometry,
  MeshStandardMaterial,
  Color,
  Object3D,
  Vector3,
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  BoxGeometry,
  CylinderGeometry
} from 'three';
import { PRNG } from '../../utils/PRNG';

/**
 * Adds mountain elements to a territory
 * @param target - The parent object to add mountains to
 * @param options - Configuration options
 * @returns The target object with mountains added
 */
export function addMountainElements(target: Object3D, options: any = {}): Object3D {
  try {
    // Default options
    const {
      height = 15,
      count = 3,
      color = '#757575',
      random = new PRNG(12345)
    } = options || {};
    
    // Create a container for all mountain elements
    const mountainGroup = new Group();
    mountainGroup.name = 'mountain-elements';
    
    // Get target bounds
    const targetBounds = new Box3().setFromObject(target);
    const targetSize = new Vector3();
    targetBounds.getSize(targetSize);
    
    // Add various mountain formations
    addMountainRange(mountainGroup, targetSize, {
      height,
      count,
      color,
      random
    });
    
    // Add small hills if we have room
    if (count > 2 && random.chance(0.7)) {
      addHills(mountainGroup, targetSize, {
        height: height * 0.4,
        count: count * 2,
        color: color,
        random
      });
    }
    
    // Add rocky outcroppings
    if (random.chance(0.5)) {
      addRockyOutcroppings(mountainGroup, targetSize, {
        height: height * 0.3,
        count: Math.floor(count * 1.5),
        color: color,
        random
      });
    }
    
    target.add(mountainGroup);
    return target;
  } catch (error) {
    console.error("Error adding mountain elements:", error);
    return target; // Return the original target without changes
  }
}

/**
 * Adds a mountain range to the mountain group
 */
function addMountainRange(mountainGroup: Group, targetSize: Vector3, options: any = {}): void {
  const {
    height = 15,
    count = 3,
    color = '#757575',
    random = new PRNG(12345)
  } = options;
  
  // Create a mountain range by arranging mountains in a rough line or cluster
  const rangeType = random.nextInt(0, 2); // 0: line, 1: arc, 2: cluster
  
  // Base color
  const baseMaterial = new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.9,
    metalness: 0.1
  });
  
  if (rangeType === 0) {
    // Line arrangement
    const lineDirection = random.next() * Math.PI * 2; // Random direction
    const lineLength = targetSize.x * 0.6;
    
    for (let i = 0; i < count; i++) {
      // Determine position along the line
      const t = (i / (count - 1)) - 0.5; // -0.5 to 0.5
      
      const position = new Vector3(
        Math.cos(lineDirection) * t * lineLength,
        0,
        Math.sin(lineDirection) * t * lineLength
      );
      
      // Add some random offset
      position.x += (random.next() - 0.5) * targetSize.x * 0.15;
      position.z += (random.next() - 0.5) * targetSize.z * 0.15;
      
      // Create the mountain
      const mountainHeight = height * (0.7 + random.next() * 0.6);
      const mountain = createMountain({
        height: mountainHeight,
        color,
        material: baseMaterial.clone(),
        random
      });
      
      mountain.position.copy(position);
      mountainGroup.add(mountain);
    }
  } else if (rangeType === 1) {
    // Arc arrangement
    const centerX = (random.next() - 0.5) * targetSize.x * 0.3;
    const centerZ = (random.next() - 0.5) * targetSize.z * 0.3;
    const radius = targetSize.x * 0.3;
    const startAngle = random.next() * Math.PI * 2;
    const arcLength = Math.PI * (0.5 + random.next() * 0.5); // 90-180 degrees
    
    for (let i = 0; i < count; i++) {
      // Determine position along the arc
      const angle = startAngle + (i / (count - 1)) * arcLength;
      
      const position = new Vector3(
        centerX + Math.cos(angle) * radius,
        0,
        centerZ + Math.sin(angle) * radius
      );
      
      // Add some random offset
      position.x += (random.next() - 0.5) * targetSize.x * 0.1;
      position.z += (random.next() - 0.5) * targetSize.z * 0.1;
      
      // Create the mountain
      const mountainHeight = height * (0.7 + random.next() * 0.6);
      const mountain = createMountain({
        height: mountainHeight,
        color,
        material: baseMaterial.clone(),
        random
      });
      
      mountain.position.copy(position);
      mountainGroup.add(mountain);
    }
  } else {
    // Cluster arrangement
    const centerX = (random.next() - 0.5) * targetSize.x * 0.4;
    const centerZ = (random.next() - 0.5) * targetSize.z * 0.4;
    
    for (let i = 0; i < count; i++) {
      // Random position around the center
      const angle = random.next() * Math.PI * 2;
      const distance = random.next() * targetSize.x * 0.25;
      
      const position = new Vector3(
        centerX + Math.cos(angle) * distance,
        0,
        centerZ + Math.sin(angle) * distance
      );
      
      // Create the mountain
      const mountainHeight = height * (0.7 + random.next() * 0.6);
      const mountain = createMountain({
        height: mountainHeight,
        color,
        material: baseMaterial.clone(), 
        random
      });
      
      mountain.position.copy(position);
      mountainGroup.add(mountain);
    }
  }
}

/**
 * Creates a single mountain
 */
function createMountain(options: any = {}): Object3D {
  const {
    height = 15,
    color = '#757575',
    material = null,
    random = new PRNG(12345)
  } = options;
  
  // Choose a mountain type
  const mountainType = random.nextInt(0, 2); // 0: cone, 1: rugged cone, 2: complex
  
  const mountain = new Group();
  mountain.name = 'mountain';
  
  // Create material if not provided
  const mountainMaterial = material || new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.9,
    metalness: 0.1
  });
  
  if (mountainType === 0) {
    // Simple cone mountain
    const radius = height * 0.7;
    const coneGeometry = new ConeGeometry(
      radius,
      height,
      8, // Radial segments
      4  // Height segments
    );
    
    const cone = new Mesh(coneGeometry, mountainMaterial);
    cone.position.y = height / 2;
    cone.castShadow = true;
    mountain.add(cone);
    
  } else if (mountainType === 1) {
    // Rugged cone mountain (multiple layers)
    const numLayers = random.nextInt(3, 5);
    const baseRadius = height * 0.8;
    
    for (let i = 0; i < numLayers; i++) {
      const layerHeight = height * (1 - i / numLayers);
      const layerRadius = baseRadius * (1 - i / numLayers * 0.8);
      
      const layerGeometry = new ConeGeometry(
        layerRadius,
        layerHeight,
        8, // Radial segments
        1  // Height segment
      );
      
      // Vary the color slightly for each layer
      const layerMaterial = mountainMaterial.clone();
      layerMaterial.color.offsetHSL(0, 0, (random.next() - 0.5) * 0.1);
      
      const layer = new Mesh(layerGeometry, layerMaterial);
      layer.position.y = layerHeight / 2;
      layer.castShadow = true;
      mountain.add(layer);
    }
    
  } else {
    // Complex mountain (custom geometry with multiple peaks)
    // Start with a base
    const baseRadius = height * 0.9;
    const baseHeight = height * 0.3;
    
    const cylinderGeometry = new CylinderGeometry(
      baseRadius * 0.7,
      baseRadius,
      baseHeight,
      8, // Radial segments
      1  // Height segments
    );
    
    const base = new Mesh(cylinderGeometry, mountainMaterial);
    base.position.y = baseHeight / 2;
    base.castShadow = true;
    mountain.add(base);
    
    // Add multiple peaks
    const peakCount = random.nextInt(2, 4);
    
    for (let i = 0; i < peakCount; i++) {
      const peakHeight = height * (0.7 + random.next() * 0.5);
      const peakRadius = baseRadius * (0.2 + random.next() * 0.3);
      
      const peakGeometry = new ConeGeometry(
        peakRadius,
        peakHeight,
        7, // Radial segments
        3  // Height segments
      );
      
      // Slightly vary the color
      const peakMaterial = mountainMaterial.clone();
      peakMaterial.color.offsetHSL(0, 0, (random.next() - 0.5) * 0.15);
      
      const peak = new Mesh(peakGeometry, peakMaterial);
      
      // Position within the base
      const angle = (i / peakCount) * Math.PI * 2 + random.next() * 0.5;
      const distance = baseRadius * 0.5 * random.next();
      
      peak.position.set(
        Math.cos(angle) * distance,
        baseHeight + peakHeight / 2,
        Math.sin(angle) * distance
      );
      
      peak.castShadow = true;
      mountain.add(peak);
    }
  }
  
  return mountain;
}

/**
 * Adds small hills to the mountain group
 */
function addHills(mountainGroup: Group, targetSize: Vector3, options: any = {}): void {
  const {
    height = 6,
    count = 5,
    color = '#757575',
    random = new PRNG(12345)
  } = options;
  
  const hillMaterial = new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.8,
    metalness: 0.1
  });
  
  // Add hills around the edges of the territory
  for (let i = 0; i < count; i++) {
    // Position near the edges
    const angle = random.next() * Math.PI * 2;
    const distance = targetSize.x * (0.3 + random.next() * 0.2);
    
    const position = new Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    );
    
    // Create a hill (rounded cone)
    const hillHeight = height * (0.6 + random.next() * 0.8);
    const hillRadius = hillHeight * (0.8 + random.next() * 0.4);
    
    const hillGeometry = new ConeGeometry(
      hillRadius,
      hillHeight,
      8, // Radial segments
      4, // Height segments
      0, // Open ended
      Math.PI * 2, // Theta start
      Math.PI * 2  // Theta length
    );
    
    // Apply some rounding by pushing vertices out
    const positions = hillGeometry.getAttribute('position').array;
    for (let j = 0; j < positions.length; j += 3) {
      const y = positions[j + 1];
      // Gentle curve for the hill shape
      const normalizedY = y / hillHeight;
      const xzScale = 1 - Math.pow(normalizedY, 2) * 0.3;
      
      positions[j] *= xzScale;     // x
      positions[j + 2] *= xzScale; // z
    }
    
    hillGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    hillGeometry.computeVertexNormals();
    
    // Create the hill mesh
    const hillMeshMaterial = hillMaterial.clone();
    hillMeshMaterial.color.offsetHSL(0, 0, (random.next() - 0.5) * 0.2);
    
    const hill = new Mesh(hillGeometry, hillMeshMaterial);
    hill.position.copy(position);
    hill.position.y = hillHeight / 2;
    hill.castShadow = true;
    
    mountainGroup.add(hill);
  }
}

/**
 * Adds rocky outcroppings to the mountain group
 */
function addRockyOutcroppings(mountainGroup: Group, targetSize: Vector3, options: any = {}): void {
  const {
    height = 4,
    count = 8,
    color = '#757575',
    random = new PRNG(12345)
  } = options;
  
  // Create a material with a slight variation
  const rockMaterial = new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.9,
    metalness: 0.2
  });
  
  // Add rocky outcroppings scattered around
  for (let i = 0; i < count; i++) {
    // Random position, avoiding the very center
    const angle = random.next() * Math.PI * 2;
    const minDistance = targetSize.x * 0.15;
    const maxDistance = targetSize.x * 0.4;
    const distance = minDistance + random.next() * (maxDistance - minDistance);
    
    const position = new Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    );
    
    // Create a rock formation
    const rockGroup = new Group();
    rockGroup.name = 'rock-formation';
    
    // Add several rocks in a cluster
    const rockCount = random.nextInt(2, 5);
    
    for (let j = 0; j < rockCount; j++) {
      // Create a jagged rock
      const rockHeight = height * (0.5 + random.next() * 1.0);
      const rockWidth = rockHeight * (0.5 + random.next() * 0.5);
      const rockDepth = rockHeight * (0.5 + random.next() * 0.5);
      
      // Use a box as a base shape
      const rockGeometry = new BoxGeometry(
        rockWidth,
        rockHeight,
        rockDepth,
        1, // Width segments
        3, // Height segments
        1  // Depth segments
      );
      
      // Distort the box to make it look like a natural rock
      const positions = rockGeometry.getAttribute('position').array;
      for (let k = 0; k < positions.length; k += 3) {
        // Don't distort the bottom face to keep it flat on the ground
        if (positions[k + 1] > -rockHeight / 2 * 0.9) {
          positions[k] += (random.next() - 0.5) * rockWidth * 0.2;     // x
          positions[k + 1] += (random.next() - 0.5) * rockHeight * 0.1; // y
          positions[k + 2] += (random.next() - 0.5) * rockDepth * 0.2;  // z
        }
      }
      
      rockGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      rockGeometry.computeVertexNormals();
      
      // Create the rock mesh
      const rockMeshMaterial = rockMaterial.clone();
      rockMeshMaterial.color.offsetHSL(0, 0, (random.next() - 0.5) * 0.25);
      
      const rock = new Mesh(rockGeometry, rockMeshMaterial);
      
      // Position within the cluster
      if (j === 0) {
        // Main rock in the center
        rock.position.y = rockHeight / 2;
      } else {
        // Surrounding rocks
        const clusterAngle = random.next() * Math.PI * 2;
        const clusterDistance = rockWidth * 0.6;
        
        rock.position.set(
          Math.cos(clusterAngle) * clusterDistance,
          rockHeight / 2,
          Math.sin(clusterAngle) * clusterDistance
        );
        
        // Vary the rotation for a more natural look
        rock.rotation.y = random.next() * Math.PI * 2;
        rock.rotation.x = (random.next() - 0.5) * 0.2;
        rock.rotation.z = (random.next() - 0.5) * 0.2;
      }
      
      rock.castShadow = true;
      rockGroup.add(rock);
    }
    
    // Position the entire rock formation
    rockGroup.position.copy(position);
    mountainGroup.add(rockGroup);
  }
}
