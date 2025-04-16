export interface ProductionProject {
    id: string; // Unique identifier
    name: string;
    description: string;
    cost: { colonyGoods?: number; power?: number; minerals?: number; researchPoints?: number; /* other resources? */ };
    duration: number; // Rounds to complete
    effectDescription: string; // Description of the gameplay effect when completed
    tier: number; // Add tier property
    prerequisites?: string[]; // Add prerequisites
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
        tier: 1,
    },
    'tool-fabrication': {
        id: 'tool-fabrication',
        name: "Advanced Tool Fabrication",
        description: "Produce higher quality tools, slightly increasing workforce efficiency across various tasks.",
        cost: { minerals: 40, colonyGoods: 15 },
        duration: 11, // 5 + 6
        effectDescription: "Reduces workforce requirements for all production tasks by 10%. Better tools mean fewer workers needed.",
        tier: 1,
    },
    'power-efficiency': {
        id: 'power-efficiency',
        name: "Production Power Rerouting",
        description: "Improve power distribution within the dome, reducing the energy cost of production processes.",
        cost: { colonyGoods: 30, power: 5 }, // Requires goods to implement
        duration: 10, // 4 + 6
        effectDescription: "Reduces power consumption of Production Dome operations by 20%. More efficient energy distribution.",
        tier: 1,
    },
    'hydroponic-equipment': {
        id: 'hydroponic-equipment',
        name: "Modular Hydroponic Systems",
        description: "Manufacture specialized vertical growing chambers with integrated nutrient delivery systems, allowing for more efficient use of space and water in colony farm operations.",
        cost: { minerals: 30, colonyGoods: 20, power: 8 },
        duration: 10, // 4 + 6
        effectDescription: "Increases food production by 25%. Reduces water consumption in hydroponics by 15%.",
        tier: 1,
    },
    'thermal-extractors': {
        id: 'thermal-extractors',
        name: "Thermal Vapor Extractors",
        description: "Equipment that applies controlled heat to ice deposits, converting them to vapor for collection, optimized to work with Mars' scarce power resources. Reduces the power cost of ice mining operations.",
        cost: { minerals: 35, colonyGoods: 15, power: 10 },
        duration: 10, // 4 + 6
        effectDescription: "Reduces power consumption of Water Wells by 25%. Increases water extraction efficiency by 10%.",
        tier: 1,
    },
    // Add Tier 2 Production Projects
    'upgrade-production-dome': {
        id: 'upgrade-production-dome',
        name: "Production Dome Upgrade",
        description: "Expand the Production Dome with advanced manufacturing equipment and automation systems.",
        cost: { minerals: 35, colonyGoods: 30, researchPoints: 50 },
        duration: 14,
        prerequisites: ['__ANY_THREE_RESEARCH__'],
        effectDescription: "Adds advanced manufacturing model to Production Dome. Decreases power consumption of Mining Operations by 20%. Reduces workforce requirements for Geothermal Reactors and Solar Arrays by 1.",
        tier: 2,
    },
    'transporter-mkii': {
        id: 'transporter-mkii',
        name: "Transport Vehicle MKII",
        description: "Upgrade the colony's transport vehicles with improved suspension systems, enhanced power cells, and reinforced chassis for Martian terrain.",
        cost: { minerals: 40, colonyGoods: 25, power: 15 },
        duration: 10,
        prerequisites: ['upgrade-production-dome'],
        effectDescription: "Replaces standard transport vehicles with MKII models. Adds 10 Tool resources for future projects.",
        tier: 2,
    },
    // Add more projects as needed
};

// Function to get all available projects, filtering out completed ones
export const getAvailableProductionProjects = (completedProjectIds: string[] = [], tier: number = 1, completedResearch: string[] = []): ProductionProject[] => {
    return Object.values(productionProjects).filter(project => 
        !completedProjectIds.includes(project.id) &&
        project.tier === tier &&
        checkPrerequisites(project, completedProjectIds, completedResearch)
    );
};

// Helper function to check prerequisites
export const checkPrerequisites = (project: ProductionProject, completedProjects: string[], completedResearch: string[]): boolean => {
    // If no prerequisites, always available
    if (!project.prerequisites || project.prerequisites.length === 0) {
        return true;
    }
    
    // Special case: Any three research projects
    if (project.prerequisites.includes('__ANY_THREE_RESEARCH__')) {
        // Filter out embodiment research projects to prevent them from counting towards dome upgrades
        const filteredResearch = completedResearch.filter(research => 
            !['embodiment-prelim', 'embodiment-phase-1', 'embodiment-phase-2', 'embodiment-phase-3'].includes(research)
        );
        
        return filteredResearch.length >= 3 || completedProjects.length >= 3;
    }
    
    // Standard prerequisite check
    return project.prerequisites.every(prereqId => completedProjects.includes(prereqId));
}; 