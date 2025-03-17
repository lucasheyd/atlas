// src/Maps3d/3d/territories/BuildingGenerator.ts
import { 
  BoxGeometry, 
  MeshStandardMaterial, 
  Mesh, 
  Group, 
  Color, 
  CylinderGeometry,
  Vector3,
  SphereGeometry,
  Object3D
} from 'three';

/**
 * Add building elements to a territory
 * @param {Object3D} territory - The territory to add buildings to
 * @param {Object} options - Configuration options
 * @returns {Object3D} - The territory with buildings added
 */
export function addBuildingElements(territory, options = {}) {
  const { 
    count = 3, 
    scale = 1, 
    baseColor = '#37474F', 
    accentColor = '#2979FF', 
    random 
  } = options;
  
  // Create a buildings group
  const buildingsGroup = new Group();
  buildingsGroup.name = 'buildings';
  
  // Generate random positions for buildings
  const positions = generateBuildingPositions(territory, count, random);
  
  // Create buildings
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const buildingType = determineBuildingType(i, random);
    const building = createBuilding(buildingType, {
      scale: scale * (0.7 + random.next() * 0.6), // Vary scale slightly
      baseColor,
      accentColor,
      random
    });
    
    // Position the building
    building.position.set(pos.x, pos.y, pos.z);
    
    // Random rotation around Y axis
    building.rotation.y = random.next() * Math.PI * 2;
    
    buildingsGroup.add(building);
  }
  
  territory.add(buildingsGroup);
  return territory;
}

/**
 * Generate positions for buildings
 */
function generateBuildingPositions(territory, count, random) {
  const positions = [];
  const territorySize = 100; // Default territory size
  const margin = territorySize * 0.2; // Keep away from edges
  
  // Try to generate positions that don't overlap
  const minDistance = territorySize * 0.15; // Minimum distance between buildings
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let valid = false;
    let pos;
    
    while (!valid && attempts < 20) {
      // Generate random position within territory bounds
      pos = {
        x: -territorySize/2 + margin + random.next() * (territorySize - 2 * margin),
        y: 0, // Buildings sit on ground
        z: -territorySize/2 + margin + random.next() * (territorySize - 2 * margin)
      };
      
      // Check distance from other buildings
      valid = true;
      for (let j = 0; j < positions.length; j++) {
        const otherPos = positions[j];
        const distance = Math.sqrt(
          Math.pow(pos.x - otherPos.x, 2) + 
          Math.pow(pos.z - otherPos.z, 2)
        );
        
        if (distance < minDistance) {
          valid = false;
          break;
        }
      }
      
      attempts++;
    }
    
    if (valid) {
      positions.push(pos);
    }
  }
  
  return positions;
}

/**
 * Determine building type based on index and random
 */
function determineBuildingType(index, random) {
  // More important buildings (lower index) get fancier types
  if (index === 0) {
    // Main building is always a tower or headquarters
    return random.next() > 0.5 ? 'tower' : 'headquarters';
  } else if (index < 3) {
    // Secondary buildings are office buildings or community centers
    return random.next() > 0.5 ? 'office' : 'community';
  } else {
    // Remaining buildings are houses or shops
    return random.next() > 0.5 ? 'house' : 'shop';
  }
}

/**
 * Create a building based on type
 */
function createBuilding(type, options) {
  const { scale = 1, baseColor = '#37474F', accentColor = '#2979FF', random } = options;
  
  switch (type) {
    case 'tower':
      return createTower(scale, baseColor, accentColor, random);
    case 'headquarters':
      return createHeadquarters(scale, baseColor, accentColor, random);
    case 'office':
      return createOfficeBuilding(scale, baseColor, accentColor, random);
    case 'community':
      return createCommunityCenter(scale, baseColor, accentColor, random);
    case 'house':
      return createHouse(scale, baseColor, accentColor, random);
    case 'shop':
      return createShop(scale, baseColor, accentColor, random);
    default:
      return createGenericBuilding(scale, baseColor, accentColor, random);
  }
}

/**
 * Create a tower building
 */
function createTower(scale, baseColor, accentColor, random) {
  const building = new Group();
  building.name = 'tower';
  
  // Base
  const baseHeight = 5 * scale;
  const baseWidth = 15 * scale;
  const baseGeometry = new BoxGeometry(baseWidth, baseHeight, baseWidth);
  const baseMaterial = new MeshStandardMaterial({ 
    color: new Color(baseColor),
    roughness: 0.7,
    metalness: 0.2
  });
  const base = new Mesh(baseGeometry, baseMaterial);
  base.position.y = baseHeight / 2;
  building.add(base);
  
  // Tower
  const towerHeight = 40 * scale;
  const towerWidth = 10 * scale;
  const towerGeometry = new BoxGeometry(towerWidth, towerHeight, towerWidth);
  const towerMaterial = new MeshStandardMaterial({ 
    color: new Color(baseColor),
    roughness: 0.7,
    metalness: 0.3
  });
  const tower = new Mesh(towerGeometry, towerMaterial);
  tower.position.y = baseHeight + towerHeight / 2;
  building.add(tower);
  
  // Top accent
  const topHeight = 5 * scale;
  const topWidth = 12 * scale;
  const topGeometry = new BoxGeometry(topWidth, topHeight, topWidth);
  const topMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.5,
    metalness: 0.5
  });
  const top = new Mesh(topGeometry, topMaterial);
  top.position.y = baseHeight + towerHeight + topHeight / 2;
  building.add(top);
  
  // Antenna
  const antennaHeight = 10 * scale;
  const antennaRadius = 0.5 * scale;
  const antennaGeometry = new CylinderGeometry(antennaRadius, antennaRadius, antennaHeight);
  const antennaMaterial = new MeshStandardMaterial({ 
    color: new Color('#BBBBBB'),
    roughness: 0.3,
    metalness: 0.8
  });
  const antenna = new Mesh(antennaGeometry, antennaMaterial);
  antenna.position.y = baseHeight + towerHeight + topHeight + antennaHeight / 2;
  building.add(antenna);
  
  return building;
}

/**
 * Create a headquarters building
 */
function createHeadquarters(scale, baseColor, accentColor, random) {
  const building = new Group();
  building.name = 'headquarters';
  
  // Main building
  const mainHeight = 20 * scale;
  const mainWidth = 25 * scale;
  const mainDepth = 25 * scale;
  const mainGeometry = new BoxGeometry(mainWidth, mainHeight, mainDepth);
  const mainMaterial = new MeshStandardMaterial({ 
    color: new Color(baseColor),
    roughness: 0.7,
    metalness: 0.2
  });
  const main = new Mesh(mainGeometry, mainMaterial);
  main.position.y = mainHeight / 2;
  building.add(main);
  
  // Accent top
  const topHeight = 5 * scale;
  const topWidth = 28 * scale;
  const topDepth = 28 * scale;
  const topGeometry = new BoxGeometry(topWidth, topHeight, topDepth);
  const topMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.6,
    metalness: 0.3
  });
  const top = new Mesh(topGeometry, topMaterial);
  top.position.y = mainHeight + topHeight / 2;
  building.add(top);
  
  // Center dome
  const domeRadius = 8 * scale;
  const domeGeometry = new SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMaterial = new MeshStandardMaterial({ 
    color: new Color('#9CBBFF'),
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.8
  });
  const dome = new Mesh(domeGeometry, domeMaterial);
  dome.position.y = mainHeight + topHeight;
  building.add(dome);
  
  return building;
}

/**
 * Create an office building
 */
function createOfficeBuilding(scale, baseColor, accentColor, random) {
  const building = new Group();
  building.name = 'office';
  
  // Main building
  const mainHeight = 30 * scale;
  const mainWidth = 15 * scale;
  const mainDepth = 15 * scale;
  const mainGeometry = new BoxGeometry(mainWidth, mainHeight, mainDepth);
  const mainMaterial = new MeshStandardMaterial({ 
    color: new Color(baseColor),
    roughness: 0.7,
    metalness: 0.2
  });
  const main = new Mesh(mainGeometry, mainMaterial);
  main.position.y = mainHeight / 2;
  building.add(main);
  
  // Accent bands
  const bandHeight = 0.5 * scale;
  const bandGeometry = new BoxGeometry(mainWidth + 0.2, bandHeight, mainDepth + 0.2);
  const bandMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.6,
    metalness: 0.4
  });
  
  // Add accent bands every few floors
  for (let i = 1; i <= 5; i++) {
    const band = new Mesh(bandGeometry, bandMaterial);
    band.position.y = (i * mainHeight / 6);
    building.add(band);
  }
  
  // Top accent
  const topHeight = 2 * scale;
  const topGeometry = new BoxGeometry(mainWidth, topHeight, mainDepth);
  const topMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.6,
    metalness: 0.4
  });
  const top = new Mesh(topGeometry, topMaterial);
  top.position.y = mainHeight + topHeight / 2;
  building.add(top);
  
  return building;
}

/**
 * Create a community center
 */
function createCommunityCenter(scale, baseColor, accentColor, random) {
  const building = new Group();
  building.name = 'community-center';
  
  // Main building (wider, shorter)
  const mainHeight = 12 * scale;
  const mainWidth = 30 * scale;
  const mainDepth = 20 * scale;
  const mainGeometry = new BoxGeometry(mainWidth, mainHeight, mainDepth);
  const mainMaterial = new MeshStandardMaterial({ 
    color: new Color(baseColor),
    roughness: 0.7,
    metalness: 0.2
  });
  const main = new Mesh(mainGeometry, mainMaterial);
  main.position.y = mainHeight / 2;
  building.add(main);
  
  // Entrance
  const entranceHeight = 8 * scale;
  const entranceWidth = 12 * scale;
  const entranceDepth = 6 * scale;
  const entranceGeometry = new BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
  const entranceMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.6,
    metalness: 0.3
  });
  const entrance = new Mesh(entranceGeometry, entranceMaterial);
  entrance.position.set(0, entranceHeight / 2, mainDepth / 2 + entranceDepth / 2);
  building.add(entrance);
  
  // Dome on top
  const domeRadius = 6 * scale;
  const domeGeometry = new SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.5,
    metalness: 0.4
  });
  const dome = new Mesh(domeGeometry, domeMaterial);
  dome.position.y = mainHeight;
  building.add(dome);
  
  return building;
}

/**
 * Create a house
 */
function createHouse(scale, baseColor, accentColor, random) {
  const building = new Group();
  building.name = 'house';
  
  // Main house
  const mainHeight = 6 * scale;
  const mainWidth = 10 * scale;
  const mainDepth = 12 * scale;
  const mainGeometry = new BoxGeometry(mainWidth, mainHeight, mainDepth);
  const mainMaterial = new MeshStandardMaterial({ 
    color: new Color(baseColor),
    roughness: 0.8,
    metalness: 0.1
  });
  const main = new Mesh(mainGeometry, mainMaterial);
  main.position.y = mainHeight / 2;
  building.add(main);
  
  // Roof (triangular prism)
  const roofHeight = 4 * scale;
  const roofWidth = 11 * scale;
  const roofDepth = 14 * scale;
  
  // Create custom roof geometry
  const roofVertices = [
    // Bottom face
    new Vector3(-roofWidth/2, 0, -roofDepth/2),
    new Vector3(roofWidth/2, 0, -roofDepth/2),
    new Vector3(roofWidth/2, 0, roofDepth/2),
    new Vector3(-roofWidth/2, 0, roofDepth/2),
    // Top ridge
    new Vector3(0, roofHeight, -roofDepth/2),
    new Vector3(0, roofHeight, roofDepth/2)
  ];
  
  // Simple triangular roof
  const roof = new Group();
  
  // Left side
  const leftRoofGeometry = new BoxGeometry(roofWidth/2, roofHeight, roofDepth);
  leftRoofGeometry.translate(-roofWidth/4, roofHeight/2, 0);
  leftRoofGeometry.rotateZ(Math.PI/4);
  
  // Right side
  const rightRoofGeometry = new BoxGeometry(roofWidth/2, roofHeight, roofDepth);
  rightRoofGeometry.translate(roofWidth/4, roofHeight/2, 0);
  rightRoofGeometry.rotateZ(-Math.PI/4);
  
  const roofMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.7,
    metalness: 0.2
  });
  
  const leftRoof = new Mesh(leftRoofGeometry, roofMaterial);
  const rightRoof = new Mesh(rightRoofGeometry, roofMaterial);
  
  roof.add(leftRoof);
  roof.add(rightRoof);
  roof.position.y = mainHeight;
  
  building.add(roof);
  
  return building;
}

/**
 * Create a shop
 */
function createShop(scale, baseColor, accentColor, random) {
  const building = new Group();
  building.name = 'shop';
  
  // Main building
  const mainHeight = 8 * scale;
  const mainWidth = 14 * scale;
  const mainDepth = 10 * scale;
  const mainGeometry = new BoxGeometry(mainWidth, mainHeight, mainDepth);
  const mainMaterial = new MeshStandardMaterial({ 
    color: new Color(baseColor),
    roughness: 0.7,
    metalness: 0.2
  });
  const main = new Mesh(mainGeometry, mainMaterial);
  main.position.y = mainHeight / 2;
  building.add(main);
  
  // Shop awning
  const awningHeight = 1 * scale;
  const awningWidth = 16 * scale;
  const awningDepth = 3 * scale;
  const awningGeometry = new BoxGeometry(awningWidth, awningHeight, awningDepth);
  const awningMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.6,
    metalness: 0.2
  });
  const awning = new Mesh(awningGeometry, awningMaterial);
  awning.position.set(0, mainHeight / 3, mainDepth / 2 + awningDepth / 2);
  building.add(awning);
  
  // Flat roof with accent
  const roofHeight = 1 * scale;
  const roofWidth = mainWidth + 1 * scale;
  const roofDepth = mainDepth + 1 * scale;
  const roofGeometry = new BoxGeometry(roofWidth, roofHeight, roofDepth);
  const roofMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.7,
    metalness: 0.3
  });
  const roof = new Mesh(roofGeometry, roofMaterial);
  roof.position.y = mainHeight + roofHeight / 2;
  building.add(roof);
  
  // Sign on top
  const signHeight = 3 * scale;
  const signWidth = 2 * scale;
  const signDepth = 6 * scale;
  const signGeometry = new BoxGeometry(signWidth, signHeight, signDepth);
  const signMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.6,
    metalness: 0.3,
    emissive: new Color(accentColor),
    emissiveIntensity: 0.3
  });
  const sign = new Mesh(signGeometry, signMaterial);
  sign.position.set(0, mainHeight + roofHeight + signHeight / 2, 0);
  building.add(sign);
  
  return building;
}

/**
 * Create a generic building
 */
function createGenericBuilding(scale, baseColor, accentColor, random) {
  const building = new Group();
  building.name = 'generic-building';
  
  // Main building
  const mainHeight = 10 * scale;
  const mainWidth = 12 * scale;
  const mainDepth = 12 * scale;
  const mainGeometry = new BoxGeometry(mainWidth, mainHeight, mainDepth);
  const mainMaterial = new MeshStandardMaterial({ 
    color: new Color(baseColor),
    roughness: 0.7,
    metalness: 0.2
  });
  const main = new Mesh(mainGeometry, mainMaterial);
  main.position.y = mainHeight / 2;
  building.add(main);
  
  // Roof
  const roofHeight = 2 * scale;
  const roofWidth = mainWidth;
  const roofDepth = mainDepth;
  const roofGeometry = new BoxGeometry(roofWidth, roofHeight, roofDepth);
  const roofMaterial = new MeshStandardMaterial({ 
    color: new Color(accentColor),
    roughness: 0.7,
    metalness: 0.2
  });
  const roof = new Mesh(roofGeometry, roofMaterial);
  roof.position.y = mainHeight + roofHeight / 2;
  building.add(roof);
  
  return building;
}
