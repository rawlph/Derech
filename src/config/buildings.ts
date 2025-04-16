export interface BuildingConfig {
    name: string;
    modelPath: string;
    upgradeModelPath?: string; // Path to upgraded model
    scale?: [number, number, number]; // Optional default scale
    resourceYield?: { resource: string; baseAmount: number }; // Add resource generation
    customRender?: boolean; // Add flag for custom rendered buildings
}

// Map building names used in the store to their config
export const buildingConfigs: Record<string, BuildingConfig> = {
    'Living Dome': {
        name: 'Living Dome',
        // Verify: Is the actual file named exactly this?
        modelPath: '/Derech/models/mars_building_living(placeholder).glb',
        upgradeModelPath: '/Derech/models/mars_livupgrade.glb',
        scale: [0.06, 0.06, 0.06],
    },
    'Production Dome': {
        name: 'Production Dome',
        // Verify: Is the actual file named exactly this? (This one was mentioned in the error)
        modelPath: '/Derech/models/mars_building_production(placeholder).glb',
        upgradeModelPath: '/Derech/models/mars_produpgrade.glb',
        scale: [0.06, 0.06, 0.06],
        resourceYield: { resource: 'colonyGoods', baseAmount: 5 }, // Generate 5 colony goods per round
    },
    'Research Dome': {
        name: 'Research Dome',
        // Verify: Is the actual file named exactly this?
        modelPath: '/Derech/models/mars_building_research.glb',
        upgradeModelPath: '/Derech/models/mars_resupgrade.glb',
        scale: [0.06, 0.06, 0.06],
        resourceYield: { resource: 'researchPoints', baseAmount: 1 }, // Generate 1 research point per round
    },
    'Flow Project Site': {
        name: 'Flow Project Site',
        modelPath: '', // Empty since this is a special custom-rendered building
        customRender: true, // Flag to indicate this is a custom rendered building
        // No scale needed since it's custom rendered via FlowProjectSite component
    },
    // Add 'Farm' if it corresponds to a building type you plan to use
    // 'Farm': {
    //     name: 'Farm',
    //     modelPath: '/Derech/models/mars_building_farm.glb',
    //     scale: [0.4, 0.4, 0.4],
    // },
};

// Function to get config by name
export const getBuildingConfig = (buildingName: string): BuildingConfig | undefined => {
    return buildingConfigs[buildingName];
}; 