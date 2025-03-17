// src/Maps3d/3d/territories/LandscapeGenerator.ts
import {
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
  Color,
  DoubleSide,
  BufferGeometry,
  Float32BufferAttribute,
  Box3,
  Vector3
} from 'three';
import { PRNG } from '../../utils/PRNG';

// Default options for landscape creation
const DEFAULT_OPTIONS = {
  type: 'mainland',
  size: 100,
  color: '#4285F4',
  height: 10,
  detail: 32,
  roughness: 0.7,
  metalness: 0.1
};

/**
 * Creates a landscape mesh based on provided options
 * @param options - Configuration options for the landscape
 * @returns A mesh representing the base landscape
 */
export function createLandscape(options: any = {}): Mesh {
  try {
    // Ensure options is an object with defaults for missing properties
    options = { ...DEFAULT_OPTIONS, ...(options || {}) };
    
    const { 
      type, 
      size, 
      color, 
      height = 10, 
      detail = 32, 
      roughness = 0.7, 
      metalness = 0.1 
    } = options;
    
    const random = options.random || new PRNG(12345);
    
    // Create different geometries based on territory type
    let geometry;
    
    switch (type) {
      case 'island':
        geometry = createIslandGeometry(size, height, detail, random);
        break;
      case 'mountains':
        geometry = createMountainousGeometry(size, height * 2, detail, random);
        break;
      case 'desert':
        geometry = createDesertGeometry(size, height * 0.5, detail, random);
        break;
      case 'peninsula':
        geometry = createPeninsulaGeometry(size, height, detail, random);
        break;
      case 'forest':
        geometry = createForestBaseGeometry(size, height, detail, random);
        break;
      case 'archipelago':
        geometry = createArchipelagoGeometry(size, height, detail, random);
        break;
      case 'mainland':
      default:
        geometry = createMainlandGeometry(size, height, detail, random);
        break;
    }
    
    // Create material
    const material = new MeshStandardMaterial({
      color: new Color(color),
      roughness: roughness,
      metalness: metalness,
      side: DoubleSide
    });
    
    // Create mesh
    const mesh = new Mesh(geometry, material);
    mesh.name = 'landscape-base';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Center the mesh
    centerGeometry(mesh);
    
    return mesh;
  } catch (error) {
    console.error("Error creating landscape:", error);
    
    // Fallback to a simple plane if something goes wrong
    const fallbackGeometry = new PlaneGeometry(100, 100, 1, 1);
    const fallbackMaterial = new MeshStandardMaterial({
      color: new Color('#4285F4'),
      roughness: 0.7,
      metalness: 0.1,
      side: DoubleSide
    });
    
    const fallbackMesh = new Mesh(fallbackGeometry, fallbackMaterial);
    fallbackMesh.name = 'landscape-fallback';
    fallbackMesh.rotation.x = -Math.PI / 2; // Make it horizontal
    
    return fallbackMesh;
  }
}

/**
 * Creates a mainland terrain geometry
 */
function createMainlandGeometry(size: number, height: number, detail: number, random: PRNG): BufferGeometry {
  const geometry = new PlaneGeometry(size, size, detail, detail);
  
  // Apply height variations
  const positions = geometry.getAttribute('position').array;
  
  for (let i = 0; i < positions.length; i += 3) {
    // Skip edges to create a slight plateau effect
    const x = positions[i];
    const z = positions[i + 2];
    const distanceFromCenter = Math.sqrt(x * x + z * z) / (size / 2);
    
    if (distanceFromCenter < 0.8) {
      // Apply perlin-like noise pattern for natural heights
      const noiseVal = (
        Math.sin(x * 0.05 + random.next() * 0.1) * 
        Math.cos(z * 0.05 + random.next() * 0.1)
      ) * height * 0.5;
      
      positions[i + 1] = noiseVal * (1 - distanceFromCenter * 0.75);
    } else {
      // Gradually decrease height toward edges
      const falloff = Math.max(0, 1 - ((distanceFromCenter - 0.8) / 0.2));
      positions[i + 1] = random.next() * height * 0.2 * falloff;
    }
  }
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2); // Make it horizontal
  
  return geometry;
}

/**
 * Creates an island terrain geometry
 */
function createIslandGeometry(size: number, height: number, detail: number, random: PRNG): BufferGeometry {
  const geometry = new PlaneGeometry(size, size, detail, detail);
  
  // Apply height variations to create an island
  const positions = geometry.getAttribute('position').array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    
    // Calculate distance from center (0-1)
    const distanceFromCenter = Math.sqrt(x * x + z * z) / (size / 2);
    
    // Island shape: higher in the middle, falling to zero at the edges
    const islandShape = Math.max(0, 1 - Math.pow(distanceFromCenter, 2));
    
    // Add some noise for a natural look
    const noise = (
      Math.sin(x * 0.1 + random.next()) * 
      Math.cos(z * 0.1 + random.next())
    ) * height * 0.3;
    
    positions[i + 1] = islandShape * height + noise * islandShape;
  }
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  
  return geometry;
}

/**
 * Creates a mountainous terrain geometry
 */
function createMountainousGeometry(size: number, height: number, detail: number, random: PRNG): BufferGeometry {
  const geometry = new PlaneGeometry(size, size, detail, detail);
  
  // Apply height variations to create mountains
  const positions = geometry.getAttribute('position').array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    
    // Calculate distance from center (0-1)
    const distanceFromCenter = Math.sqrt(x * x + z * z) / (size / 2);
    
    // Edge falloff
    const edgeFalloff = Math.max(0, 1 - Math.pow(distanceFromCenter, 3));
    
    // Create several mountain peaks
    let mountainHeight = 0;
    const peakCount = 5;
    
    for (let p = 0; p < peakCount; p++) {
      const peakX = (random.next() - 0.5) * size * 0.7;
      const peakZ = (random.next() - 0.5) * size * 0.7;
      const peakHeight = random.next() * height * 0.8 + height * 0.2;
      const peakWidth = random.next() * size * 0.3 + size * 0.1;
      
      // Distance to this peak
      const dx = x - peakX;
      const dz = z - peakZ;
      const distanceToPeak = Math.sqrt(dx * dx + dz * dz);
      
      // Add this peak's contribution (bell curve)
      mountainHeight += peakHeight * Math.exp(-(distanceToPeak * distanceToPeak) / (2 * peakWidth * peakWidth));
    }
    
    // Add noise for roughness
    const noise = (
      Math.sin(x * 0.1 + random.next() * 10) * 
      Math.cos(z * 0.1 + random.next() * 10)
    ) * height * 0.1;
    
    positions[i + 1] = mountainHeight * edgeFalloff + noise;
  }
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  
  return geometry;
}

/**
 * Creates a desert terrain geometry
 */
function createDesertGeometry(size: number, height: number, detail: number, random: PRNG): BufferGeometry {
  const geometry = new PlaneGeometry(size, size, detail, detail);
  
  // Apply height variations to create desert dunes
  const positions = geometry.getAttribute('position').array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    
    // Dune pattern - sine waves in different directions
    const dune1 = Math.sin(x * 0.05 + z * 0.03) * height * 0.5;
    const dune2 = Math.sin(x * 0.02 - z * 0.05) * height * 0.7;
    const dune3 = Math.sin(z * 0.04) * height * 0.3;
    
    // Small noise for sand texture
    const sandNoise = (random.next() - 0.5) * height * 0.1;
    
    // Combine dunes and add distance falloff
    const distanceFromCenter = Math.sqrt(x * x + z * z) / (size / 2);
    const falloff = Math.max(0, 1 - Math.pow(distanceFromCenter, 4));
    
    positions[i + 1] = (dune1 + dune2 + dune3) * falloff + sandNoise;
  }
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  
  return geometry;
}

/**
 * Creates a peninsula terrain geometry
 */
function createPeninsulaGeometry(size: number, height: number, detail: number, random: PRNG): BufferGeometry {
  const geometry = new PlaneGeometry(size, size, detail, detail);
  
  // Apply height variations to create a peninsula
  const positions = geometry.getAttribute('position').array;
  
  // Randomly choose a side for the peninsula to extend from
  const direction = random.nextInt(0, 3); // 0: north, 1: east, 2: south, 3: west
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    
    // Normalize x and z to -1 to 1 range
    const nx = x / (size / 2);
    const nz = z / (size / 2);
    
    // Calculate the basic land shape based on direction
    let landMask = 0;
    switch (direction) {
      case 0: // north
        landMask = Math.max(0, 1 - nz); // Higher in the north
        break;
      case 1: // east
        landMask = Math.max(0, 1 - (-nx)); // Higher in the east
        break;
      case 2: // south
        landMask = Math.max(0, 1 - (-nz)); // Higher in the south
        break;
      case 3: // west
        landMask = Math.max(0, 1 - nx); // Higher in the west
        break;
    }
    
    // Add a circular center landmass
    const distanceFromCenter = Math.sqrt(nx * nx + nz * nz);
    const centralLand = Math.max(0, 1 - distanceFromCenter * 1.2);
    
    // Combine the shapes
    const landShape = Math.max(landMask, centralLand);
    
    // Add noise for natural look
    const noise = (
      Math.sin(x * 0.05 + random.next()) * 
      Math.cos(z * 0.05 + random.next())
    ) * height * 0.3;
    
    positions[i + 1] = landShape * height + noise * landShape;
  }
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  
  return geometry;
}

/**
 * Creates a base geometry for forested terrain
 */
function createForestBaseGeometry(size: number, height: number, detail: number, random: PRNG): BufferGeometry {
  const geometry = new PlaneGeometry(size, size, detail, detail);
  
  // Apply gentle rolling hills for forest terrain
  const positions = geometry.getAttribute('position').array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    
    // Rolling hills with a longer wavelength
    const hill1 = Math.sin(x * 0.02 + z * 0.02) * height * 0.4;
    const hill2 = Math.cos(x * 0.03 - z * 0.01) * height * 0.3;
    
    // Small noise for forest floor
    const forestFloorNoise = (random.next() - 0.5) * height * 0.1;
    
    // Distance falloff
    const distanceFromCenter = Math.sqrt(x * x + z * z) / (size / 2);
    const falloff = Math.max(0, 1 - Math.pow(distanceFromCenter, 4));
    
    positions[i + 1] = (hill1 + hill2) * falloff + forestFloorNoise;
  }
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  
  return geometry;
}

/**
 * Creates an archipelago terrain geometry (multiple small islands)
 */
function createArchipelagoGeometry(size: number, height: number, detail: number, random: PRNG): BufferGeometry {
  const geometry = new PlaneGeometry(size, size, detail, detail);
  
  // Apply height variations to create multiple islands
  const positions = geometry.getAttribute('position').array;
  
  // Create several island peaks
  const islandCount = random.nextInt(3, 7);
  const islands = [];
  
  for (let i = 0; i < islandCount; i++) {
    islands.push({
      x: (random.next() - 0.5) * size * 0.7,
      z: (random.next() - 0.5) * size * 0.7,
      radius: random.next() * size * 0.2 + size * 0.05,
      height: random.next() * height * 0.7 + height * 0.3
    });
  }
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    
    // Calculate height from each island's contribution
    let totalHeight = 0;
    
    for (const island of islands) {
      const dx = x - island.x;
      const dz = z - island.z;
      const distanceToIsland = Math.sqrt(dx * dx + dz * dz);
      
      // Island shape function (inverse quadratic falloff)
      const islandFactor = Math.max(0, 1 - Math.pow(distanceToIsland / island.radius, 2));
      totalHeight += island.height * islandFactor;
    }
    
    // Add small noise
    const noise = (random.next() - 0.5) * height * 0.1;
    
    positions[i + 1] = totalHeight + noise * (totalHeight > 0 ? 1 : 0.1);
  }
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  
  return geometry;
}

/**
 * Centers a mesh's geometry around the origin
 */
function centerGeometry(mesh: Mesh): void {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  
  if (!box) return;
  
  const center = new Vector3();
  box.getCenter(center);
  
  mesh.geometry.translate(-center.x, -center.y, -center.z);
  mesh.position.copy(center);
}
