import * as THREE from 'three';
import { TileData } from '@store/store'; // Import TileData type

// --- Configuration ---
export const HEX_SIZE = 1; // Distance from center to corner
export const HEX_ORIENTATION = 'flat-top'; // 'pointy-top' or 'flat-top'
export const TILE_THICKNESS = 0.2;

const SQRT3 = Math.sqrt(3);

// --- Texture Loading ---
// Create a single texture loader instance
const textureLoader = new THREE.TextureLoader();

// Load normal maps
const plainsNormalMap = textureLoader.load('textures/mars_normal.png');
const mountainNormalMap = textureLoader.load('textures/mount_normal.png');

// --- Enhanced Procedural Textures ---

// 1. Base Noise Texture (for terrain height variation)
const SIZE = 128;
const data = new Uint8Array(SIZE * SIZE * 4);

// Helper functions for better noise generation
function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

function noise2D(x: number, y: number): number {
    return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
}

// Create improved noise pattern with smoother transitions
for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
        const i = (y * SIZE + x) * 4;
        
        // Enhanced noise with multiple frequencies (fractal noise)
        let noise = 0;
        noise += noise2D(x / SIZE * 2, y / SIZE * 2) * 0.5;
        noise += noise2D(x / SIZE * 4, y / SIZE * 4) * 0.25;
        noise += noise2D(x / SIZE * 8, y / SIZE * 8) * 0.125;
        
        // Create dust in ~40% of pixels with smoother transitions
        const isDust = smoothstep(0.6, 0.7, noise) > 0.5;
        const value = isDust ? Math.random() * 50 : 0;
        
        data[i] = value;     // r
        data[i + 1] = value; // g
        data[i + 2] = value; // b
        data[i + 3] = 255;   // a
    }
}

const noiseTexture = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
noiseTexture.repeat.set(3, 3);
noiseTexture.needsUpdate = true;

// 2. Crater Texture (for crater pattern)
const CRATER_SIZE = 256; // Higher resolution for craters
const craterData = new Uint8Array(CRATER_SIZE * CRATER_SIZE * 4);

// Generate a few random craters
const NUM_CRATERS = 8;
const craters = [];
for (let i = 0; i < NUM_CRATERS; i++) {
    craters.push({
        x: Math.random() * CRATER_SIZE,
        y: Math.random() * CRATER_SIZE,
        radius: 5 + Math.random() * 25, // Random crater sizes
        depth: 0.3 + Math.random() * 0.7, // Random crater depths
        rim: 0.1 + Math.random() * 0.3 // Random rim heights
    });
}

// Create the crater map
for (let y = 0; y < CRATER_SIZE; y++) {
    for (let x = 0; x < CRATER_SIZE; x++) {
        const i = (y * CRATER_SIZE + x) * 4;
        
        // Start with no crater
        let craterDepth = 0;
        
        // Check all craters to see if this pixel is affected
        for (const crater of craters) {
            const dx = x - crater.x;
            const dy = y - crater.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // If within crater radius
            if (distance < crater.radius) {
                // Calculate normalized distance (0 at center, 1 at edge)
                const normalizedDist = distance / crater.radius;
                
                // Crater profile: depression in the middle, elevated rim
                let profile;
                if (normalizedDist < 0.8) {
                    // Inside crater - depression
                    profile = -crater.depth * (1 - normalizedDist/0.8);
                } else {
                    // Rim - elevation
                    profile = crater.rim * (1 - (normalizedDist - 0.8) / 0.2);
                }
                
                // Add this crater's contribution
                craterDepth += profile;
            }
        }
        
        // Map to 0-255 range, with 128 being neutral (no displacement)
        const value = Math.floor(128 + craterDepth * 127);
        craterData[i] = value;
        craterData[i + 1] = value;
        craterData[i + 2] = value;
        craterData[i + 3] = 255;
    }
}

const craterTexture = new THREE.DataTexture(craterData, CRATER_SIZE, CRATER_SIZE, THREE.RGBAFormat);
craterTexture.wrapS = craterTexture.wrapT = THREE.RepeatWrapping;
craterTexture.repeat.set(1, 1); // Larger repeat to make craters more visible
craterTexture.needsUpdate = true;

// 3. Enhanced Color Variation Texture
const colorNoiseData = new Uint8Array(SIZE * SIZE * 4);

// Improved dust and color variety
for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
        const i = (y * SIZE + x) * 4;
        
        // Create a perlin-like noise value for this pixel
        const noiseVal = (
            noise2D(x / SIZE * 2, y / SIZE * 2) * 0.5 +
            noise2D(x / SIZE * 4, y / SIZE * 4) * 0.3 +
            noise2D(x / SIZE * 8, y / SIZE * 8) * 0.2
        );
        
        // Decide if this is a dust speckle with improved distribution
        // Create more dust clusters by using the noise value
        const isDust = noiseVal > 0.65;
        
        if (isDust) {
            // Generate more varied dust colors with better distribution
            const dustType = noiseVal * 2 % 1; // Derive dust type from noise for better patterns
            
            if (dustType < 0.25) {
                // Reddish-orange dust
                colorNoiseData[i] = 210 + Math.random() * 45;
                colorNoiseData[i + 1] = 100 + Math.random() * 30;
                colorNoiseData[i + 2] = 50 + Math.random() * 20;
            } else if (dustType < 0.5) {
                // Reddish-brown dust
                colorNoiseData[i] = 160 + Math.random() * 30;
                colorNoiseData[i + 1] = 80 + Math.random() * 20;
                colorNoiseData[i + 2] = 40 + Math.random() * 15;
            } else if (dustType < 0.75) {
                // Pale tan dust
                colorNoiseData[i] = 190 + Math.random() * 40;
                colorNoiseData[i + 1] = 170 + Math.random() * 30;
                colorNoiseData[i + 2] = 140 + Math.random() * 20;
            } else {
                // Dark reddish dust (new variant)
                colorNoiseData[i] = 140 + Math.random() * 25;
                colorNoiseData[i + 1] = 70 + Math.random() * 15;
                colorNoiseData[i + 2] = 60 + Math.random() * 10;
            }
            
            // Add some random variation to alpha for more natural look
            colorNoiseData[i + 3] = 180 + Math.random() * 75;
        } else {
            // Transparent for non-dust areas
            colorNoiseData[i] = 0;
            colorNoiseData[i + 1] = 0;
            colorNoiseData[i + 2] = 0;
            colorNoiseData[i + 3] = 0;
        }
    }
}

const colorNoiseTexture = new THREE.DataTexture(colorNoiseData, SIZE, SIZE, THREE.RGBAFormat);
colorNoiseTexture.wrapS = colorNoiseTexture.wrapT = THREE.RepeatWrapping;
colorNoiseTexture.repeat.set(4, 4);
colorNoiseTexture.rotation = Math.PI / 3.5;
colorNoiseTexture.center.set(0.5, 0.5);
colorNoiseTexture.needsUpdate = true;

// Configure textures to minimize repetition
// Apply higher repeat values to make the texture smaller/more detailed
plainsNormalMap.repeat.set(1.5, 1.5);
plainsNormalMap.wrapS = plainsNormalMap.wrapT = THREE.RepeatWrapping;
// Add some rotation to break up repetition patterns
plainsNormalMap.rotation = Math.PI / 6; // 30 degrees rotation
plainsNormalMap.center.set(0.5, 0.5); // Set rotation center to middle of texture

// Configure mountain texture similarly
mountainNormalMap.repeat.set(1.0, 1.0); // Less repeat for mountains to preserve detail
mountainNormalMap.wrapS = mountainNormalMap.wrapT = THREE.RepeatWrapping;
// Different rotation to create variance
mountainNormalMap.rotation = -Math.PI / 4; // -45 degrees rotation
mountainNormalMap.center.set(0.5, 0.5); // Set rotation center to middle of texture

// --- Coordinate Conversion ---

/**
 * Converts axial hex coordinates (q, r) to 3D world coordinates (x, y, z).
 * Assumes y is the vertical axis (up).
 */
export function axialToWorld(q: number, r: number, hexSize: number = HEX_SIZE): THREE.Vector3 {
    const x = hexSize * (3 / 2 * q);
    const z = hexSize * (SQRT3 / 2 * q + SQRT3 * r);
    const y = 0;
    return new THREE.Vector3(x, y, z);
}

/**
 * Converts 3D world coordinates (x, y, z) back to axial hex coordinates (q, r).
 * (Less commonly needed for rendering, but useful for interaction)
 */
export function worldToAxial(worldPos: THREE.Vector3, hexSize: number = HEX_SIZE): { q: number; r: number } {
    const x = worldPos.x;
    const z = worldPos.z;
    const q = (2/3 * x) / hexSize;
    const r = (-1/3 * x + SQRT3/3 * z) / hexSize;
    return hexRound(q, r);
}

// --- Helper Functions (from RedBlobGames) ---

function cubeRound(x: number, y: number, z: number): { x: number; y: number; z: number } {
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);

    const xDiff = Math.abs(rx - x);
    const yDiff = Math.abs(ry - y);
    const zDiff = Math.abs(rz - z);

    if (xDiff > yDiff && xDiff > zDiff) {
        rx = -ry - rz;
    } else if (yDiff > zDiff) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }
    return { x: rx, y: ry, z: rz };
}

function hexRound(q: number, r: number): { q: number; r: number } {
    const s = -q - r;
    const roundedCube = cubeRound(q, r, s);
    return { q: roundedCube.x, r: roundedCube.y };
}

// --- Geometry Definition ---
// Go back to single geometry definition
export const hexGeometry = new THREE.CylinderGeometry(
    HEX_SIZE,       // radiusTop
    HEX_SIZE,       // radiusBottom
    TILE_THICKNESS, // height
    6,              // radialSegments
    1,              // heightSegments
    false           // openEnded
);
if (HEX_ORIENTATION === 'flat-top') {
    hexGeometry.rotateY(Math.PI / 6);
}

// Apply texture coordinates to the geometry for proper normal map mapping
hexGeometry.computeVertexNormals();
// Generate proper UVs for the hexagonal top and bottom faces
// This helps prevent texture distortion on hexagonal surfaces
hexGeometry.attributes.uv.needsUpdate = true;

// Create a plains-specific geometry with more segments for better displacement
export const plainsHexGeometry = new THREE.CylinderGeometry(
    HEX_SIZE,       // radiusTop
    HEX_SIZE,       // radiusBottom
    TILE_THICKNESS, // height
    6,              // radialSegments
    3,              // more heightSegments for better displacement
    false           // openEnded
);
if (HEX_ORIENTATION === 'flat-top') {
    plainsHexGeometry.rotateY(Math.PI / 6);
}
plainsHexGeometry.computeVertexNormals();
plainsHexGeometry.attributes.uv.needsUpdate = true;

// --- Material Definitions ---
// Remove baseLineMaterial

// Create an improved custom shader material for plains that combines all our effects
const plansCustomMaterial = new THREE.MeshStandardMaterial({
    color: 0xD9775D, // Base color
    roughness: 0.9,
    metalness: 0.05,
    normalMap: plainsNormalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    displacementMap: noiseTexture, // Base terrain noise for small variations
    displacementScale: 0.02,
    displacementBias: 0,
    name: 'PlainsMaterial',
});

// Timer to animate subtle terrain features
let time = 0;
const updateTime = () => {
    time += 1;
    if (plansCustomMaterial.userData.shader) {
        plansCustomMaterial.userData.shader.uniforms.time.value = time;
    }
    requestAnimationFrame(updateTime);
};
requestAnimationFrame(updateTime);

// Store the shader when it's compiled
plansCustomMaterial.onBeforeCompile = (shader) => {
    // Add all our custom uniforms
    shader.uniforms.colorNoise = { value: colorNoiseTexture };
    shader.uniforms.craterMap = { value: craterTexture };
    shader.uniforms.time = { value: time };
    
    // Store the shader for updates
    plansCustomMaterial.userData.shader = shader;
    
    // Add unique tile variation based on instance matrix
    // This will use the instance's position to create unique variations
    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D craterMap;
        uniform float time;
        varying vec2 vUv;
        // Add varying to pass the unique tile coordinates
        varying vec3 vInstancePosition;
        varying vec3 vRandomValues;`
    );
    
    // Extract unique per-instance position for variation
    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        // Extract the instance position from the instance matrix
        vInstancePosition = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        
        // Generate unique random values based on instance position
        vRandomValues = vec3(
            sin(vInstancePosition.x * 3.1415 + vInstancePosition.z * 2.7183),
            cos(vInstancePosition.z * 2.3283 + vInstancePosition.x * 1.6180),
            sin(vInstancePosition.x * vInstancePosition.z * 0.1)
        );
        
        // Pass proper UVs
        vUv = uv;`
    );
    
    // Add crater displacement in the vertex shader
    shader.vertexShader = shader.vertexShader.replace(
        '#include <displacementmap_vertex>',
        `#include <displacementmap_vertex>
        
        // Use instance position to modify UV coordinates for unique crater patterns
        // Each tile will sample from a different part of the crater texture
        vec2 craterUV = uv * 0.5 + vec2(
            sin(time*0.0001 + vRandomValues.x) * 0.01 + vRandomValues.x * 0.2,
            cos(time*0.0001 + vRandomValues.y) * 0.01 + vRandomValues.y * 0.2
        );
        
        // Apply crater displacement
        vec4 craterDisp = texture2D(craterMap, craterUV);
        // Map from [0,1] to [-1,1]
        float craterFactor = (craterDisp.r * 2.0 - 1.0) * 0.05;
        // Only apply craters to top face (y close to 1.0)
        if(abs(normal.y) > 0.5) {
            transformed += normalize(normal) * craterFactor;
        }`
    );
    
    // Inject in the fragment shader for color effects
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D colorNoise;
        uniform sampler2D craterMap;
        varying vec2 vUv;
        varying vec3 vInstancePosition;
        varying vec3 vRandomValues;`
    );
    
    // Enhanced color mixing with more sophisticated effects
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        
        // Create unique dust pattern offsets for each tile
        vec2 dustUV = vUv + vec2(
            vRandomValues.x * 0.5,
            vRandomValues.y * 0.5
        );
        
        // Get dust color variation
        vec4 dustColor = texture2D(colorNoise, dustUV);
        
        // Create unique crater pattern offsets for each tile
        vec2 craterUV = vUv * 0.5 + vec2(
            vRandomValues.x * 0.2,
            vRandomValues.y * 0.2
        );
        
        // Get crater information for color adjustment
        vec4 craterInfo = texture2D(craterMap, craterUV);
        float craterFactor = (craterInfo.r * 2.0 - 1.0);
        
        // Darken inside craters, lighten on rims
        vec3 craterColor = diffuseColor.rgb;
        if(craterFactor < -0.05) {
            // Inside crater - darker
            craterColor *= mix(1.0, 0.7, min(1.0, abs(craterFactor) * 10.0));
        } else if(craterFactor > 0.05) {
            // Crater rim - lighter
            craterColor *= mix(1.0, 1.2, min(1.0, craterFactor * 5.0));
        }
        
        // Apply base crater coloration
        diffuseColor.rgb = craterColor;
        
        // Then apply dust on top if present
        if(dustColor.a > 0.1) {
            // Mix the base diffuse color with the dust color
            diffuseColor.rgb = mix(diffuseColor.rgb, dustColor.rgb/255.0, dustColor.a * 0.4);
        }
        
        // Add unique color variations based on tile position
        // This creates subtle differences in base color between tiles
        float tileVariation = sin(vInstancePosition.x * 1.2) * cos(vInstancePosition.z * 1.3) * 0.07;
        diffuseColor.rgb += vec3(
            tileVariation * (0.5 + vRandomValues.x * 0.5),
            tileVariation * 0.8 * (0.5 + vRandomValues.y * 0.5),
            tileVariation * 0.6 * (0.5 + vRandomValues.z * 0.5)
        );
        
        // Finally, add a subtle variation based on position for more variety
        float posVariation = sin(vUv.x * 20.0) * cos(vUv.y * 20.0) * 0.03;
        diffuseColor.rgb += vec3(posVariation);`
    );
};

// Create a second mountain material for taller mountains
const mountainLevel2Material = new THREE.MeshStandardMaterial({
    color: 0x825342, // Darker brown for level 2 mountains
    roughness: 0.9,
    metalness: 0.1, // Less metallic
    normalMap: mountainNormalMap,
    normalScale: new THREE.Vector2(1.7, 1.7), // Stronger normal effect for more rugged appearance
    name: 'MountainLevel2Material',
});

// Keep the snow material definition for compatibility but we won't use it
const mountainSnowMaterial = new THREE.MeshStandardMaterial({
    color: 0xEEEEE5, // Off-white snow color
    roughness: 0.7,
    metalness: 0.1,
    name: 'MountainSnowMaterial',
});

export const tileMaterials: Record<TileData['type'], THREE.Material> = {
    // Use the enhanced custom material for Plains
    Plains: plansCustomMaterial,
    
    // Replace Water with Ice Deposit - make it glittery and icy
    'Ice Deposit': new THREE.MeshStandardMaterial({
        color: 0xA5E8FF, // Light blue 
        emissive: 0x3B8EAA, // Subtle glow
        transparent: true,
        opacity: 0.75,
        roughness: 0.1, // Very smooth
        metalness: 0.8, // High metallicity for shine
        envMapIntensity: 1.5, // Enhance reflections
        name: 'IceDepositMaterial',
    }),
    
    // Update Mountain with a lighter color for tier 1 mountains
    Mountain: new THREE.MeshStandardMaterial({
        color: 0xB48D71, // Lighter brown with reddish tint
        roughness: 0.9, // Slightly reduced roughness
        metalness: 0.1, // Low metalness
        normalMap: mountainNormalMap, // Apply the mountain normal map
        normalScale: new THREE.Vector2(1.2, 1.2), // Normal effect for mountains
        name: 'MountainMaterial',
    }),
};

// Export our level 2 mountain materials for use in HexTileInstances
export const mountainLevel2Materials = {
    main: mountainLevel2Material,
    snow: mountainSnowMaterial
};

// Update selectedMaterial for better visibility
export const selectedMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFE366, // Brighter yellow
    emissive: 0x665F10, // Subtle emissive for better visibility
    transparent: true,
    opacity: 0.85,
    roughness: 0.5,
    metalness: 0.3,
    name: 'SelectedMaterial',
});

// --- Status Indicator Materials & Constants ---
// Visual cue size and position relative to tile
export const STATUS_INDICATOR_SIZE = 0.13; // Reduced from 0.15 (13% reduction)
export const STATUS_INDICATOR_Y_OFFSET = 0.5; // Increased from 0.35 for better visibility

// Event indicator (purple color)
export const eventIndicatorMaterial = new THREE.MeshStandardMaterial({
    color: 0xAA66FF, // Purple
    emissive: 0x7733CC, // Slight glow
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.5,
    name: 'EventIndicatorMaterial',
});

// Operational indicator (green color)
export const operationalIndicatorMaterial = new THREE.MeshStandardMaterial({
    color: 0x66DD88, // Green
    emissive: 0x33AA55, // Slight glow
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.5,
    name: 'OperationalIndicatorMaterial',
});

// Shutdown indicator (red color)
export const shutdownIndicatorMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF3333, // Red
    emissive: 0xCC1111, // Slight glow
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.5,
    name: 'ShutdownIndicatorMaterial',
});

// Create shared geometry for all status indicators
export const statusIndicatorGeometry = new THREE.SphereGeometry(
    STATUS_INDICATOR_SIZE, // radius
    8,  // widthSegments
    6   // heightSegments
);

// Function to determine status indicator position on a tile
export function getStatusIndicatorPosition(
    tilePosition: THREE.Vector3, 
    indicatorType: 'event' | 'operational' | 'shutdown' | 'none'
): THREE.Vector3 {
    // Base position is slightly above the tile surface
    const position = new THREE.Vector3(
        tilePosition.x, 
        tilePosition.y + TILE_THICKNESS/2 + STATUS_INDICATOR_Y_OFFSET,
        tilePosition.z
    );
    
    // Adjust the positions to spread multiple indicators around the tile
    // This creates a small offset based on indicator type
    switch (indicatorType) {
        case 'event':
            // Position event indicator slightly right (x+)
            position.x += 0.15;
            break;
        case 'shutdown':
            // Position shutdown indicator slightly back (z+)
            position.z += 0.15;
            break;
        case 'operational':
            // Position operational indicator slightly left (x-)
            position.x -= 0.15;
            break;
    }
    
    return position;
}

// Function to determine the material based on status
export function getStatusIndicatorMaterial(
    indicatorType: 'event' | 'operational' | 'shutdown' | 'none'
): THREE.Material | null {
    switch (indicatorType) {
        case 'event':
            return eventIndicatorMaterial;
        case 'operational':
            return operationalIndicatorMaterial;
        case 'shutdown':
            return shutdownIndicatorMaterial;
        case 'none':
        default:
            return null;
    }
} 