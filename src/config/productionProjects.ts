export interface ProductionProject {
    id: string; // Unique identifier
    name: string;
    description: string;
    cost: { colonyGoods?: number; power?: number; minerals?: number; /* other resources? */ };
    duration: number; // Rounds to complete
    effectDescription: string; // Description of the gameplay effect when completed
    // Later: effect(): void; // Function to apply the project's effect
}

// Placeholder list of potential production projects
export const productionProjects: Record<string, ProductionProject> = {
    'optimize-assembly': {
        id: 'optimize-assembly',
        name: "Optimized Assembly Line",
        description: "Reconfigure assembly lines to increase the output efficiency of Colony Goods.",
        cost: { minerals: 25, power: 10 },
        duration: 9, // 3 + 6
        effectDescription: "Increases Colony Goods production efficiency by 15%. More output from the same raw materials.",
    },
    'tool-fabrication': {
        id: 'tool-fabrication',
        name: "Advanced Tool Fabrication",
        description: "Produce higher quality tools, slightly increasing workforce efficiency across various tasks.",
        cost: { minerals: 40, colonyGoods: 15 },
        duration: 11, // 5 + 6
        effectDescription: "Reduces workforce requirements for all production tasks by 10%. Better tools mean fewer workers needed.",
    },
    'power-efficiency': {
        id: 'power-efficiency',
        name: "Production Power Rerouting",
        description: "Improve power distribution within the dome, reducing the energy cost of production processes.",
        cost: { colonyGoods: 30, power: 5 }, // Requires goods to implement
        duration: 10, // 4 + 6
        effectDescription: "Reduces power consumption of Production Dome operations by 20%. More efficient energy distribution.",
    },
    'hydroponic-equipment': {
        id: 'hydroponic-equipment',
        name: "Modular Hydroponic Systems",
        description: "Manufacture specialized vertical growing chambers with integrated nutrient delivery systems, allowing for more efficient use of space and water in colony farm operations.",
        cost: { minerals: 30, colonyGoods: 20, power: 8 },
        duration: 10, // 4 + 6
        effectDescription: "Increases food production by 25%. Reduces water consumption in hydroponics by 15%.",
    },
    'thermal-extractors': {
        id: 'thermal-extractors',
        name: "Thermal Vapor Extractors",
        description: "Equipment that applies controlled heat to ice deposits, converting them to vapor for collection, optimized to work with Mars' scarce power resources. Reduces the power cost of ice mining operations.",
        cost: { minerals: 35, colonyGoods: 15, power: 10 },
        duration: 10, // 4 + 6
        effectDescription: "Reduces power consumption of Water Wells by 25%. Increases water extraction efficiency by 10%.",
    },
    // Add more projects as needed
};

// Function to get all available projects, filtering out completed ones
export const getAvailableProductionProjects = (completedProjectIds: string[] = []): ProductionProject[] => {
    return Object.values(productionProjects).filter(project => 
        !completedProjectIds.includes(project.id)
    );
}; 