export interface LivingAreaProject {
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

// Placeholder list of potential living area projects
export const livingAreaProjects: Record<string, LivingAreaProject> = {
    'improve-air': {
        id: 'improve-air',
        name: "Atmospheric Scrubbers Mk.II",
        description: "Upgrade air filtration systems to improve resident morale and reduce maintenance downtime.",
        cost: { colonyGoods: 20, power: 5 },
        duration: 8, // 2 + 6
        effectDescription: "Decreases colony goods consumption in living dome by 15%.",
        tier: 1,
    },
    'expand-housing': {
        id: 'expand-housing',
        name: "Modular Housing Unit",
        description: "Construct an additional standardized housing module, increasing maximum population capacity.",
        cost: { colonyGoods: 35, minerals: 15 },
        duration: 10, // 4 + 6
        effectDescription: "Adds +1 workforce (i.e. going from 0/8 to 1/9).",
        tier: 1,
    },
    'recreation-center': {
        id: 'recreation-center',
        name: "Communal Recreation Hub",
        description: "Build a small recreational facility to boost colony morale during off-duty hours.",
        cost: { colonyGoods: 25, power: 8 },
        duration: 9, // 3 + 6
        effectDescription: "Decreases colony goods consumption in living dome by 15%.",
        tier: 1,
    },
    'youth-farming-program': {
        id: 'youth-farming-program',
        name: "Youth Hydroponic Education Initiative",
        description: "Establish a hands-on educational program teaching young colonists sustainable farming techniques through small-scale hydroponic gardens. Creates stronger community bonds and practical skills.",
        cost: { colonyGoods: 15, power: 3 },
        duration: 8, // 2 + 6
        effectDescription: "Decreases water consumption in living dome by 15%.",
        tier: 1,
    },
    'signal-shielding': {
        id: 'signal-shielding',
        name: "Optimize Earth-Mars Protocols",
        description: "Improve communication protocols between Earth and Mars to maintain more reliable contact, boosting colony morale by maintaining better connection with home.",
        cost: { colonyGoods: 18, power: 12, minerals: 8 },
        duration: 9, // 3 + 6
        effectDescription: "Increases colonist morale by 20% (morale not yet implemented).",
        tier: 1,
    },
    // Add Tier 2 Living Area Projects
    'upgrade-living-dome': {
        id: 'upgrade-living-dome',
        name: "Living Dome Upgrade",
        description: "Expand and upgrade the Living Dome with advanced life support systems and better habitability features.",
        cost: { colonyGoods: 40, minerals: 25, researchPoints: 60 },
        duration: 16,
        prerequisites: ['__ANY_THREE_RESEARCH__'],
        effectDescription: "Adds +15 Flow points flat to accumulated flow points.",
        tier: 2,
    },
    'upgrade-living-quarters': {
        id: 'upgrade-living-quarters',
        name: "Advanced Living Quarters",
        description: "Implement modern comfort features in colonist living spaces, improving quality of life and work efficiency.",
        cost: { colonyGoods: 30, minerals: 15, power: 10 },
        duration: 12,
        prerequisites: ['upgrade-living-dome'],
        effectDescription: "Increases workforce by 1. Reduces resource strain from population growth.",
        tier: 2,
    },
    // Add more projects as needed
};

// Function to get all available projects, filtering out completed ones
export const getAvailableLivingAreaProjects = (completedProjectIds: string[] = [], tier: number = 1, completedResearch: string[] = []): LivingAreaProject[] => {
    return Object.values(livingAreaProjects).filter(project =>
        !completedProjectIds.includes(project.id) &&
        project.tier === tier &&
        checkPrerequisites(project, completedProjectIds, completedResearch)
    );
};

// Helper function to check prerequisites
export const checkPrerequisites = (project: LivingAreaProject, completedProjects: string[], completedResearch: string[]): boolean => {
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