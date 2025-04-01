export interface BuildingConfig {
    name: string;
    modelPath: string;
    scale?: [number, number, number]; // Optional default scale
}

// Map building names used in the store to their config
export const buildingConfigs: Record<string, BuildingConfig> = {
    'Living Dome': {
        name: 'Living Dome',
        // Verify: Is the actual file named exactly this?
        modelPath: 'models/mars_building_living(placeholder).glb',
        scale: [0.06, 0.06, 0.06],
    },
    'Production Dome': {
        name: 'Production Dome',
        // Verify: Is the actual file named exactly this? (This one was mentioned in the error)
        modelPath: 'models/mars_building_production(placeholder).glb',
        scale: [0.06, 0.06, 0.06],
    },
    'Research Dome': {
        name: 'Research Dome',
        // Verify: Is the actual file named exactly this?
        modelPath: 'models/mars_building_research.glb',
        scale: [0.06, 0.06, 0.06],
    },
    // Add 'Farm' if it corresponds to a building type you plan to use
    // 'Farm': {
    //     name: 'Farm',
    //     modelPath: '/models/mars_building_farm.glb',
    //     scale: [0.4, 0.4, 0.4],
    // },
};

// Function to get config by name
export const getBuildingConfig = (buildingName: string): BuildingConfig | undefined => {
    return buildingConfigs[buildingName];
}; 