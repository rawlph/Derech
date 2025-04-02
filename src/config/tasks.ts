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
  powerConsumption?: number; // NEW: Power consumed per round when operational
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
    cost: { power: 15, colonyGoods: 10 },
    workforceRequired: 3,
    duration: 9, // UPDATED: Was 2, factor 3 -> 6, user wants 9
    operationalModelPath: '/Derech/models/mars_workforce_mining.glb',
    resourceYield: { resource: 'minerals', baseAmount: 8 },
    powerConsumption: 5, // NEW
    scale: [0.06, 0.06, 0.06],
    yOffset: 0.2,
  },
  'deploy-scout': {
    type: 'deploy-scout',
    name: 'Establish Scouting Post',
    description: 'Sets up an outpost to reveal nearby tiles and generate research points.',
    targetTileType: ['Plains', 'Mountain'],
    cost: { power: 10, colonyGoods: 5 },
    workforceRequired: 1,
    duration: 3, // UPDATED: Was 1, factor 3 -> 3
    operationalModelPath: '/Derech/models/mars_building_scout.glb',
    resourceYield: { resource: 'researchPoints', baseAmount: 4 },
    powerConsumption: 2, // NEW
    scale: [0.04, 0.04, 0.04],
    yOffset: 0.2,
  },
  'build-solar': {
    type: 'build-solar',
    name: 'Construct Solar Array',
    description: 'Builds a solar panel array to generate Power.',
    targetTileType: ['Plains'],
    cost: { minerals: 20, colonyGoods: 5 },
    workforceRequired: 2,
    duration: 6, // UPDATED: Was 2, factor 3 -> 6
    operationalModelPath: '/Derech/models/mars_solar.glb',
    resourceYield: { resource: 'power', baseAmount: 15 },
    powerConsumption: 0, // Produces power
    scale: [0.15, 0.15, 0.15],
    yOffset: 0.01,
  },
  'build-geothermal': {
    type: 'build-geothermal',
    name: 'Construct Geothermal Plant',
    description: 'Constructs a high-output geothermal power plant.',
    targetTileType: ['Plains'],
    cost: { minerals: 30, colonyGoods: 15 },
    workforceRequired: 5,
    duration: 15, // UPDATED: Was 3, factor 3 -> 9, user wants 15
    operationalModelPath: '/Derech/models/mars_thermal.glb',
    resourceYield: { resource: 'power', baseAmount: 30 },
    powerConsumption: 0, // Produces power
    scale: [0.08, 0.08, 0.08],
    yOffset: 0.05,
  },
  'build-waterwell': {
    type: 'build-waterwell',
    name: 'Construct Water Well',
    description: 'Drills into ice deposits to extract water.',
    targetTileType: ['Ice Deposit'],
    cost: { power: 15, minerals: 20 },
    workforceRequired: 3,
    duration: 6, // UPDATED: Was 2, factor 3 -> 6
    operationalModelPath: '/Derech/models/mars_waterwell.glb',
    resourceYield: { resource: 'water', baseAmount: 12 },
    powerConsumption: 4, // NEW
    scale: [0.08, 0.08, 0.08],
    yOffset: 0.15,
  },
};

// --- Helper Function to Get Config ---
export const getTaskConfig = (type: string): TaskConfig | undefined => {
    return taskConfigs[type];
}; 