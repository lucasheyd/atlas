// src/Maps3d/3d/territories/WaterGenerator.ts
import {
  Group,
  Mesh,
  CircleGeometry,
  MeshStandardMaterial,
  Color,
  Object3D,
  Vector3,
  CylinderGeometry,
  Box3,
  CurveUtils,
  Path,
  Shape,
  ShapeGeometry,
  CurvePath,
  CubicBezierCurve3
} from 'three';
import { PRNG } from '../../utils/PRNG';

/**
 * Adds water elements (lakes, rivers) to a territory
 * @param target - The parent object to add water elements to
 * @param options - Configuration options
 * @returns The target object with water elements added
 */
export function addWaterElements(target: Object3D, options: any = {}): Object3D {
  try {
    // Default options
    const {
      coverage = 0.3,
      color = '#1565C0',
      partial = false,
      random = new PRNG(12345)
    } = options || {};
    
    // Create a container for all water elements
    const waterGroup = new Group();
    waterGroup.name = 'water-elements';
    
    // Get target bounds
    const targetBounds = new Box3().setFromObject(target);
    const targetSize = new Vector3();
    targetBounds.getSize(targetSize);
    
    // Determine what water features to add based on coverage and randomness
    const hasCentralLake = random.chance(0.7);
    const hasRiver = random.chance(0.6) && coverage > 0.2;
    const hasSmallPonds = random.chance(0.8) && coverage > 0.1;
    
    // If this is a partial water area (like for a peninsula), create water on one side
    if (partial) {
      addPartialWater(waterGroup, targetSize, {
        color,
        random
      });
    } else {
      // Add a central lake if applicable
      if (hasCentralLake) {
        addLake(waterGroup, targetSize, {
          radius: targetSize.x * 0.3 * coverage,
          color,
          random,
          isMain: true
        });
      }
      
      // Add small ponds
      if (hasSmallPonds) {
        const pondCount = Math.floor(random.next() * 5 * coverage) + 1;
        for (let i = 0; i < pondCount; i++) {
          addLake(waterGroup, targetSize, {
            radius: targetSize.x * (0.05 + 0.1 * random.next()) * coverage,
            color,
            random
          });
        }
      }
      
      // Add a river
      if (hasRiver) {
        addRiver(waterGroup, targetSize, {
          width: targetSize.x * 0.03 * (coverage + 0.5),
          color,
          random
        });
      }
    }
    
    target.add(waterGroup);
    return target;
  } catch (error) {
    console.error("Error adding water elements:", error);
    return target; // Return the original target without changes
  }
}

/**
 * Adds a lake to the water group
 */
function addLake(waterGroup: Group, targetSize: Vector3, options: any = {}): void {
  const {
    radius = 10,
    color = '#1565C0',
    random = new PRNG(12345),
    isMain = false
  } = options;
  
  // Create a slightly irregular circular shape for the lake
  const lakeShape = new Shape();
  const segments = 16;
  const baseRadius = radius;
  
  // Start at a random angle
  const startAngle = random.next() * Math.PI * 2;
  
  // Create starting point
  const startRadius = baseRadius * (0.9 + random.next() * 0.2);
  lakeShape.moveTo(
    Math.cos(startAngle) * startRadius,
    Math.sin(startAngle) * startRadius
  );
  
  // Create a curvy, irregular circle
  for (let i = 1; i <= segments; i++) {
    const angle = startAngle + (i / segments) * Math.PI * 2;
    
    // Vary the radius slightly for each point to create an irregular shape
    const variation = isMain 
      ? 0.85 + random.next() * 0.3 // More irregular for main lake
      : 0.9 + random.next() * 0.2;  // More circular for small ponds
      
    const pointRadius = baseRadius * variation;
    
    // Use quadratic curves for smoother edges
    const prevAngle = startAngle + ((i - 1) / segments) * Math.PI * 2;
    const controlAngle = prevAngle + (angle - prevAngle) / 2;
    const controlRadius = baseRadius * (0.9 + random.next() * 0.2);
    
    lakeShape.quadraticCurveTo(
      Math.cos(controlAngle) * controlRadius * 1.1, // Exaggerate control point slightly
      Math.sin(controlAngle) * controlRadius * 1.1,
      Math.cos(angle) * pointRadius,
      Math.sin(angle) * pointRadius
    );
  }
  
  lakeShape.closePath();
  
  // Create the lake mesh
  const lakeGeometry = new ShapeGeometry(lakeShape);
  
  const lakeMaterial = new MeshStandardMaterial({
    color: new Color(color),
    metalness: 0.2,
    roughness: 0.2,
    transparent: true,
    opacity: 0.8
  });
  
  const lake = new Mesh(lakeGeometry, lakeMaterial);
  lake.name = isMain ? 'main-lake' : 'pond';
  lake.rotation.x = -Math.PI / 2; // Lay flat
  
  // Position the lake
  if (isMain) {
    // Main lake is centrally positioned with a slight offset
    lake.position.set(
      (random.next() - 0.5) * targetSize.x * 0.2,
      0.1, // Slightly above ground to avoid z-fighting
      (random.next() - 0.5) * targetSize.z * 0.2
    );
  } else {
    // Random position for smaller ponds, avoiding the center
    const angle = random.next() * Math.PI * 2;
    const distance = targetSize.x * (0.3 + random.next() * 0.3);
    
    lake.position.set(
      Math.cos(angle) * distance,
      0.1, // Slightly above ground to avoid z-fighting
      Math.sin(angle) * distance
    );
  }
  
  lake.receiveShadow = true;
  waterGroup.add(lake);
}

/**
 * Adds a river to the water group
 */
function addRiver(waterGroup: Group, targetSize: Vector3, options: any = {}): void {
  const {
    width = 3,
    color = '#1565C0',
    random = new PRNG(12345)
  } = options;
  
  // Determine river path
  // We'll create a river that flows from one edge to another
  
  // Choose two random points on opposite sides
  const side1 = Math.floor(random.next() * 4); // 0: top, 1: right, 2: bottom, 3: left
  const side2 = (side1 + 2) % 4; // Opposite side
  
  // Find start and end points
  let start = new Vector3();
  let end = new Vector3();
  
  const halfWidth = targetSize.x / 2;
  const halfHeight = targetSize.z / 2;
  
  switch (side1) {
    case 0: // Top
      start.set((random.next() - 0.5) * targetSize.x, 0, -halfHeight);
      break;
    case 1: // Right
      start.set(halfWidth, 0, (random.next() - 0.5) * targetSize.z);
      break;
    case 2: // Bottom
      start.set((random.next() - 0.5) * targetSize.x, 0, halfHeight);
      break;
    case 3: // Left
      start.set(-halfWidth, 0, (random.next() - 0.5) * targetSize.z);
      break;
  }
  
  switch (side2) {
    case 0: // Top
      end.set((random.next() - 0.5) * targetSize.x, 0, -halfHeight);
      break;
    case 1: // Right
      end.set(halfWidth, 0, (random.next() - 0.5) * targetSize.z);
      break;
    case 2: // Bottom
      end.set((random.next() - 0.5) * targetSize.x, 0, halfHeight);
      break;
    case 3: // Left
      end.set(-halfWidth, 0, (random.next() - 0.5) * targetSize.z);
      break;
  }
  
  // Create a river shape
  const riverShape = new Shape();
  
  // Create 2 to 4 control points for the river
  const numControlPoints = random.nextInt(2, 4);
  const controlPoints = [];
  
  // First control point
  controlPoints.push(new Vector3(
    start.x + (end.x - start.x) * 0.3 + (random.next() - 0.5) * targetSize.x * 0.3,
    0,
    start.z + (end.z - start.z) * 0.3 + (random.next() - 0.5) * targetSize.z * 0.3
  ));
  
  // Middle control points
  for (let i = 1; i < numControlPoints - 1; i++) {
    const t = i / (numControlPoints - 1);
    controlPoints.push(new Vector3(
      start.x + (end.x - start.x) * t + (random.next() - 0.5) * targetSize.x * 0.4,
      0,
      start.z + (end.z - start.z) * t + (random.next() - 0.5) * targetSize.z * 0.4
    ));
  }
  
  // Last control point
  controlPoints.push(new Vector3(
    start.x + (end.x - start.x) * 0.7 + (random.next() - 0.5) * targetSize.x * 0.3,
    0,
    start.z + (end.z - start.z) * 0.7 + (random.next() - 0.5) * targetSize.z * 0.3
  ));
  
  // Create river path
  const riverPath = new Path();
  
  // Start path
  riverPath.moveTo(start.x, start.z);
  
  // Add curves through control points
  for (let i = 0; i < controlPoints.length; i++) {
    riverPath.quadraticCurveTo(
      controlPoints[i].x,
      controlPoints[i].z,
      i < controlPoints.length - 1 
        ? (controlPoints[i].x + controlPoints[i+1].x) / 2 
        : end.x,
      i < controlPoints.length - 1 
        ? (controlPoints[i].z + controlPoints[i+1].z) / 2 
        : end.z
    );
  }
  
  // Generate a variable width river by creating an expanded shape
  const expandedShape = new Shape();
  
  // Sample points along the river path
  const numPoints = 50;
  const points = riverPath.getPoints(numPoints);
  
  // Calculate tangents for each point
  const tangents = [];
  for (let i = 0; i < points.length; i++) {
    let tangent;
    if (i === 0) {
      tangent = new Vector3(
        points[i+1].x - points[i].x,
        0,
        points[i+1].y - points[i].y
      ).normalize();
    } else if (i === points.length - 1) {
      tangent = new Vector3(
        points[i].x - points[i-1].x,
        0,
        points[i].y - points[i-1].y
      ).normalize();
    } else {
      tangent = new Vector3(
        points[i+1].x - points[i-1].x,
        0,
        points[i+1].y - points[i-1].y
      ).normalize();
    }
    tangents.push(tangent);
  }
  
  // Calculate normals (perpendicular to tangents)
  const normals = tangents.map(t => new Vector3(-t.z, 0, t.x).normalize());
  
  // Calculate width at each point (varying for natural look)
  const widths = [];
  for (let i = 0; i < points.length; i++) {
    const t = i / (points.length - 1);
    // Width is maximum in the middle, narrower at ends
    const widthMultiplier = 0.6 + Math.sin(t * Math.PI) * 0.4 + random.next() * 0.2;
    widths.push(width * widthMultiplier);
  }
  
  // Create the left and right sides of the river
  const leftSide = [];
  const rightSide = [];
  
  for (let i = 0; i < points.length; i++) {
    leftSide.push({
      x: points[i].x + normals[i].x * widths[i],
      y: points[i].y + normals[i].z * widths[i]
    });
    
    rightSide.push({
      x: points[i].x - normals[i].x * widths[i],
      y: points[i].y - normals[i].z * widths[i]
    });
  }
  
  // Create the river shape using the calculated sides
  expandedShape.moveTo(leftSide[0].x, leftSide[0].y);
  
  // Left side
  for (let i = 1; i < leftSide.length; i++) {
    expandedShape.lineTo(leftSide[i].x, leftSide[i].y);
  }
  
  // Right side (in reverse)
  for (let i = rightSide.length - 1; i >= 0; i--) {
    expandedShape.lineTo(rightSide[i].x, rightSide[i].y);
  }
  
  expandedShape.closePath();
  
  // Create the river mesh
  const riverGeometry = new ShapeGeometry(expandedShape);
  
  const riverMaterial = new MeshStandardMaterial({
    color: new Color(color),
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.8
  });
  
  const river = new Mesh(riverGeometry, riverMaterial);
  river.name = 'river';
  river.rotation.x = -Math.PI / 2; // Lay flat
  river.position.y = 0.1; // Slightly above ground to avoid z-fighting
  
  river.receiveShadow = true;
  waterGroup.add(river);
}

/**
 * Adds water to part of the territory (for peninsulas, beaches, etc.)
 */
function addPartialWater(waterGroup: Group, targetSize: Vector3, options: any = {}): void {
  const {
    color = '#1565C0',
    random = new PRNG(12345)
  } = options;
  
  // Determine which side of the territory will have water
  const side = random.nextInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left
  
  const halfWidth = targetSize.x / 2;
  const halfHeight = targetSize.z / 2;
  
  // Create a shape for the water that covers about half the territory from one side
  const waterShape = new Shape();
  
  // Use different shapes depending on which side the water is on
  switch (side) {
    case 0: // Top
      waterShape.moveTo(-halfWidth, -halfHeight);
      waterShape.lineTo(halfWidth, -halfHeight);
      waterShape.lineTo(halfWidth, -halfHeight * 0.2);
      
      // Create a wavy coastline
      const steps = 15;
      for (let i = steps; i >= 0; i--) {
        const x = halfWidth - (halfWidth * 2) * (i / steps);
        const z = -halfHeight * 0.2 + Math.sin(i * 0.5) * halfHeight * 0.15 + random.next() * halfHeight * 0.1;
        waterShape.lineTo(x, z);
      }
      
      waterShape.lineTo(-halfWidth, -halfHeight * 0.2);
      break;
      
    case 1: // Right
      waterShape.moveTo(halfWidth, -halfHeight);
      waterShape.lineTo(halfWidth, halfHeight);
      waterShape.lineTo(halfWidth * 0.2, halfHeight);
      
      // Create a wavy coastline
      const stepsRight = 15;
      for (let i = stepsRight; i >= 0; i--) {
        const z = halfHeight - (halfHeight * 2) * (i / stepsRight);
        const x = halfWidth * 0.2 + Math.sin(i * 0.5) * halfWidth * 0.15 + random.next() * halfWidth * 0.1;
        waterShape.lineTo(x, z);
      }
      
      waterShape.lineTo(halfWidth * 0.2, -halfHeight);
      break;
      
    case 2: // Bottom
      waterShape.moveTo(-halfWidth, halfHeight);
      waterShape.lineTo(halfWidth, halfHeight);
      waterShape.lineTo(halfWidth, halfHeight * 0.2);
      
      // Create a wavy coastline
      const stepsBottom = 15;
      for (let i = stepsBottom; i >= 0; i--) {
        const x = halfWidth - (halfWidth * 2) * (i / stepsBottom);
        const z = halfHeight * 0.2 + Math.sin(i * 0.5) * halfHeight * 0.15 + random.next() * halfHeight * 0.1;
        waterShape.lineTo(x, z);
      }
      
      waterShape.lineTo(-halfWidth, halfHeight * 0.2);
      break;
      
    case 3: // Left
      waterShape.moveTo(-halfWidth, -halfHeight);
      waterShape.lineTo(-halfWidth, halfHeight);
      waterShape.lineTo(-halfWidth * 0.2, halfHeight);
      
      // Create a wavy coastline
      const stepsLeft = 15;
      for (let i = stepsLeft; i >= 0; i--) {
        const z = halfHeight - (halfHeight * 2) * (i / stepsLeft);
        const x = -halfWidth * 0.2 + Math.sin(i * 0.5) * halfWidth * 0.15 + random.next() * halfWidth * 0.1;
        waterShape.lineTo(x, z);
      }
      
      waterShape.lineTo(-halfWidth * 0.2, -halfHeight);
      break;
  }
  
  waterShape.closePath();
  
  // Create the water mesh
  const waterGeometry = new ShapeGeometry(waterShape);
  
  const waterMaterial = new MeshStandardMaterial({
    color: new Color(color),
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.8
  });
  
  const water = new Mesh(waterGeometry, waterMaterial);
  water.name = 'partial-water';
  water.rotation.x = -Math.PI / 2; // Lay flat
  water.position.y = 0.1; // Slightly above ground to avoid z-fighting
  
  water.receiveShadow = true;
  waterGroup.add(water);
}
