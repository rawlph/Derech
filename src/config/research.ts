export interface ResearchProject {
    id: string; // Unique identifier
    name: string;
    description: string;
    cost: { researchPoints?: number; /* other resources? */ };
    duration: number; // Rounds to complete
    prerequisites?: string[]; // Optional: IDs of required completed research
    effectDescription: string; // Description of the gameplay effect when research is completed
    // Later: linkToPuzzle?: string; // Identifier for a puzzle game
}

// Initial list of potential research projects based on documentation
export const researchProjects: Record<string, ResearchProject> = {
    'basic-scouting': {
        id: 'basic-scouting',
        name: "Enhanced Rover Optics",
        description: "Improve scouting drone sensors to reveal terrain details from further away.",
        cost: { researchPoints: 15 },
        duration: 9, // 3 + 6
        effectDescription: "Increases Scout Outpost exploration range by 25%. Unlocks Ancient Structure detection capability.",
    },
    'improved-extraction': {
        id: 'improved-extraction',
        name: "Efficient Mining Drills",
        description: "Develop better drilling techniques to increase mineral yield from mining operations.",
        cost: { researchPoints: 25 },
        duration: 10, // 4 + 6
        prerequisites: [], // None for now
        effectDescription: "Increases mineral yield from Mining Operations by 20%. Unlocks detection of Rich Subsurface Mineral Veins.",
    },
    'water-reclamation-1': {
        id: 'water-reclamation-1',
        name: "Atmospheric Water Capture",
        description: "Prototype technology to extract trace amounts of water vapor from the thin Martian atmosphere.",
        cost: { researchPoints: 30 },
        duration: 11, // 5 + 6
        effectDescription: "Increases water production from Water Wells by 15%. Unlocks detection of Subterranean Ice Chambers.",
    },
    'embodiment-prelim': {
        id: 'embodiment-prelim',
        name: "Project Embodiment: Phase 0",
        description: "Begin preliminary studies into bio-digital interfacing. Requires significant computational resources and ethical review.",
        cost: { researchPoints: 50 },
        duration: 12, // 6 + 6
        effectDescription: "Increases Research Point generation by 10%. Lays groundwork for advanced human-machine interface technologies.",
        // linkToPuzzle: 'intro-puzzle-1' // Example for future integration
    },
    'detoxifying-bacteria': {
        id: 'detoxifying-bacteria',
        name: "Regolith Detoxifying Bacteria",
        description: "Develop genetically engineered bacteria capable of neutralizing perchlorates and other toxic compounds in Martian soil, creating safer growing medium for hydroponic systems.",
        cost: { researchPoints: 35 },
        duration: 11, // 5 + 6
        prerequisites: [], // None for now
        effectDescription: "Reduces water consumption by 10%. Makes Martian soil safer for growing food and increases overall colony health.",
    },
    'seismic-mapping': {
        id: 'seismic-mapping',
        name: "Seismic Mapping Accuracy",
        description: "Investigate precise mapping of our colony region's volcanic regions, since its thinner crust and weaker tectonic activity make geothermal hotspots harder to locate. Enables construction of geothermal reactors.",
        cost: { researchPoints: 40 },
        duration: 11, // 5 + 6
        prerequisites: [], // None for now
        effectDescription: "Increases power output from Geothermal Plants by 25%. Allows precise placement for maximum energy efficiency.",
    },
    // Add more projects as needed
};

// Function to get all available projects, filtering out completed ones
export const getAvailableResearch = (completedResearchIds: string[]): ResearchProject[] => {
    // Filter out completed projects
    return Object.values(researchProjects).filter(project => 
        !completedResearchIds.includes(project.id)
    );

    // Example of future filtering with prerequisites:
    // return Object.values(researchProjects).filter(project =>
    //     !completedResearchIds.includes(project.id) &&
    //     (project.prerequisites ?? []).every(prereqId => completedResearchIds.includes(prereqId))
    // );
}; 