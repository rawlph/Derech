export interface ResearchProject {
    id: string; // Unique identifier
    name: string;
    description: string;
    cost: { researchPoints?: number; /* other resources? */ };
    duration: number; // Rounds to complete
    prerequisites?: string[]; // Optional: IDs of required completed research
    effectDescription: string; // Description of the gameplay effect when research is completed
    tier: number; // Add tier property
    // Later: linkToPuzzle?: string; // Identifier for a puzzle game
}

// Initial list of potential research projects based on documentation
export const researchProjects: Record<string, ResearchProject> = {
    'basic-scouting': {
        id: 'basic-scouting',
        name: "Enhanced Rover Optics",
        description: "Improve scouting drone sensors to reveal terrain details from further away.",
        cost: { researchPoints: 20 },
        duration: 7,
        effectDescription: "Increases Scout Outpost exploration range by 25%. Unlocks Ancient Structure detection capability.",
        tier: 1,
    },
    'improved-extraction': {
        id: 'improved-extraction',
        name: "Efficient Mining Drills",
        description: "Develop better drilling techniques to increase mineral yield from mining operations.",
        cost: { researchPoints: 30 },
        duration: 8,
        prerequisites: [],
        effectDescription: "Increases mineral yield from Mining Operations by 25%. Unlocks detection of Rich Subsurface Mineral Veins.",
        tier: 1,
    },
    'water-reclamation-1': {
        id: 'water-reclamation-1',
        name: "Atmospheric Water Capture",
        description: "Prototype technology to extract trace amounts of water vapor from the thin Martian atmosphere.",
        cost: { researchPoints: 35 },
        duration: 9,
        effectDescription: "Increases water production from Water Wells by 20%. Unlocks detection of Subterranean Ice Chambers.",
        tier: 1,
    },
    'embodiment-prelim': {
        id: 'embodiment-prelim',
        name: "Project Embodiment: Phase 0",
        description: "Begin preliminary studies into bio-digital interfacing. Requires significant computational resources and ethical review.",
        cost: { researchPoints: 60 },
        duration: 10,
        effectDescription: "Increases Research Point generation by 15%. Lays groundwork for advanced human-machine interface technologies.",
        tier: 1,
        // linkToPuzzle: 'intro-puzzle-1' // Example for future integration
    },
    'embodiment-phase-1': {
        id: 'embodiment-phase-1',
        name: "Project Embodiment: Phase 1",
        description: "Advance bio-digital interfacing by developing neural signal interpretation techniques and enhanced sensory feedback systems.",
        cost: { researchPoints: 70 },
        duration: 12,
        prerequisites: ['embodiment-prelim'],
        effectDescription: "Increases overall resource efficiency by 5%. Enables deeper integration with colony systems.",
        tier: 1,
    },
    'embodiment-phase-2': {
        id: 'embodiment-phase-2',
        name: "Project Embodiment: Phase 2",
        description: "Develop prototype embodiment chambers with advanced neural linkages and immersive feedback mechanisms.",
        cost: { researchPoints: 80 },
        duration: 14,
        prerequisites: ['embodiment-phase-1'],
        effectDescription: "Increases workforce efficiency by 10%. Creates foundation for direct operator-machine interfacing.",
        tier: 1,
    },
    'embodiment-phase-3': {
        id: 'embodiment-phase-3',
        name: "Project Embodiment: Phase 3",
        description: "Perfect full-immersion consciousness transfer techniques, enabling complete integration with colony systems and equipment.",
        cost: { researchPoints: 100 },
        duration: 16,
        prerequisites: ['embodiment-phase-2'],
        effectDescription: "Unlocks potential for complete human-machine integration. Final stage of Embodiment Project research.",
        tier: 1,
    },
    'detoxifying-bacteria': {
        id: 'detoxifying-bacteria',
        name: "Regolith Detoxifying Bacteria",
        description: "Develop genetically engineered bacteria capable of neutralizing perchlorates and other toxic compounds in Martian soil, creating safer growing medium for hydroponic systems.",
        cost: { researchPoints: 40 },
        duration: 8,
        prerequisites: [],
        effectDescription: "Reduces water consumption by 15%. Makes Martian soil safer for growing food and increases overall colony health.",
        tier: 1,
    },
    'seismic-mapping': {
        id: 'seismic-mapping',
        name: "Seismic Mapping Accuracy",
        description: "Investigate precise mapping of our colony region's volcanic regions, since its thinner crust and weaker tectonic activity make geothermal hotspots harder to locate. Enables construction of geothermal reactors.",
        cost: { researchPoints: 45 },
        duration: 9,
        prerequisites: [],
        effectDescription: "Increases power output from Geothermal Plants by 30%. Allows precise placement for maximum energy efficiency.",
        tier: 1,
    },
    // Add Tier 2 Research Projects
    'upgrade-research-dome': {
        id: 'upgrade-research-dome',
        name: "Research Dome Upgrade",
        description: "Enhance the Research Dome with advanced facilities and lab equipment to increase scientific productivity.",
        cost: { researchPoints: 40 },
        duration: 12,
        prerequisites: ['__ANY_THREE_RESEARCH__'], // Special marker for any 3 completed research
        effectDescription: "Geothermal Reactors produce 3 RP per round.",
        tier: 2,
    },
    'optimize-energy-grid': {
        id: 'optimize-energy-grid',
        name: "Energy Grid Optimization",
        description: "Implement cutting-edge energy management algorithms to the colony power grid, resulting in higher efficiency and output.",
        cost: { researchPoints: 55 },
        duration: 14,
        prerequisites: ['upgrade-research-dome'],
        effectDescription: "Increases overall Power production by 15%. Reduces power fluctuations during dust storms.",
        tier: 2,
    },
    // Add more projects as needed
};

// Function to get all available projects, filtering out completed ones
export const getAvailableResearch = (completedResearchIds: string[], tier: number = 1): ResearchProject[] => {
    // Filter out completed projects
    return Object.values(researchProjects).filter(project => 
        !completedResearchIds.includes(project.id) && 
        project.tier === tier &&
        checkPrerequisites(project, completedResearchIds)
    );
};

// Helper function to check prerequisites
export const checkPrerequisites = (project: ResearchProject, completedIds: string[]): boolean => {
    // If no prerequisites, always available
    if (!project.prerequisites || project.prerequisites.length === 0) {
        return true;
    }
    
    // Special case: Any three research projects
    if (project.prerequisites.includes('__ANY_THREE_RESEARCH__')) {
        return completedIds.length >= 3;
    }
    
    // Standard prerequisite check
    return project.prerequisites.every(prereqId => completedIds.includes(prereqId));
}; 