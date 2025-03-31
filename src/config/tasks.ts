import { TileData } from "@store/store"; // Need TileData type for targetTileType

// --- Task Configuration Interface ---
export interface TaskConfig {
  type: string; // e.g., 'deploy-mining'
  name: string; // e.g., 'Deploy Mining Operation'
  description: string;
  targetTileType: TileData['type'][]; // Array of valid tile types
  cost: { power?: number; minerals?: number; colonyGoods?: number }; // Resource cost to start
  workforceRequired: number;
  duration: number; // Rounds for deployment/construction
  operationalModelPath?: string; // Path to model shown when operational
  resourceYield?: { resource: string; baseAmount: number }; // Resource generated per round when operational
  scale?: [number, number, number]; // Optional scale for the 3D model
  yOffset?: number; // Vertical position adjustment above tile surface
}

// --- Specific Task Definitions ---
export const taskConfigs: Record<string, TaskConfig> = {
  'deploy-mining': {
    type: 'deploy-mining',
    name: 'Deploy Mining Operation',
    description: 'Establish a mining site to extract raw minerals.',
    targetTileType: ['Mountain'], // Can only be built on Mountains
    cost: { power: 20, colonyGoods: 10 }, // Cost to deploy
    workforceRequired: 3, // Number of workers needed
    duration: 2, // Takes 2 rounds to set up
    operationalModelPath: '/models/mars_workforce_mining.glb', // Model to show when running
    resourceYield: { resource: 'minerals', baseAmount: 5 }, // Yields 5 minerals per round base
    scale: [0.06, 0.06, 0.06], // Updated scale to match starter buildings
    yOffset: 0.2, // Updated to match starter buildings
  },
  // --- Future Task Examples (Add later) ---
  'deploy-scout': {
    type: 'deploy-scout',
    name: 'Establish Scouting Post',
    description: 'Sets up an outpost to reveal nearby tiles.',
    targetTileType: ['Plains', 'Mountain'], // Can be built anywhere except Ice
    cost: { power: 10, colonyGoods: 5 },
    workforceRequired: 1,
    duration: 1,
    operationalModelPath: '/models/mars_building_scout.glb',
    resourceYield: { resource: 'researchPoints', baseAmount: 2 }, // Increased from 1 to 2
    scale: [0.04, 0.04, 0.04], // Scout outpost scale
    yOffset: 0.2, // Base position, will be adjusted in TaskVisuals
  },
  'build-solar': {
    type: 'build-solar',
    name: 'Construct Solar Panel',
    description: 'Builds a solar panel array to generate Power.',
    targetTileType: ['Plains'], // Typically built on flat ground
    cost: { minerals: 15, colonyGoods: 5 },
    workforceRequired: 2,
    duration: 3,
    operationalModelPath: '/models/mars_solar.glb',
    resourceYield: { resource: 'power', baseAmount: 10 }, // Example: Generates power
    scale: [0.15, 0.15, 0.15], // Solar panel scale
    yOffset: 0.01, // Lowered from 0.2 to sit closer to the tile
  },
  'build-geothermal': {
    type: 'build-geothermal',
    name: 'Construct Geothermal Plant',
    description: 'Constructs a high-output geothermal power plant, tapping into Mars\' thermal energy.',
    targetTileType: ['Plains'], // Can only be built on Plains
    cost: { minerals: 25, colonyGoods: 10 }, // Higher cost than solar
    workforceRequired: 5, // Takes 5 workforce as requested
    duration: 4, // Longer build time than solar
    operationalModelPath: '/models/mars_thermal.glb', // New model
    resourceYield: { resource: 'power', baseAmount: 25 }, // Generates more power than solar
    scale: [0.08, 0.08, 0.08], // Reduced by 20% from original 0.1
    yOffset: 0.05, // Moderate position above tile
  },
  'build-waterwell': {
    type: 'build-waterwell',
    name: 'Construct Water Well',
    description: 'Drills into ice deposits to extract water essential for colony operations.',
    targetTileType: ['Ice Deposit'], // Can only be built on Ice Deposit tiles
    cost: { power: 15, minerals: 20 }, // Cost to build
    workforceRequired: 3, // Medium workforce requirement
    duration: 3, // Takes 3 rounds to set up
    operationalModelPath: '/models/mars_waterwell.glb', // Water well model
    resourceYield: { resource: 'water', baseAmount: 15 }, // Generates water resource
    scale: [0.08, 0.08, 0.08], // Similar scale to geothermal
    yOffset: 0.15, // Slightly lower than geothermal
  },
};

// --- Helper Function to Get Config ---
export const getTaskConfig = (type: string): TaskConfig | undefined => {
    return taskConfigs[type];
}; 