export interface LivingAreaProject {
    id: string; // Unique identifier
    name: string;
    description: string;
    cost: { colonyGoods?: number; power?: number; minerals?: number; /* other resources? */ };
    duration: number; // Rounds to complete
    effectDescription: string; // Description of the gameplay effect when completed
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
        effectDescription: "Reduces power consumption of the Living Dome by 10%. Improves overall colony health.",
    },
    'expand-housing': {
        id: 'expand-housing',
        name: "Modular Housing Unit",
        description: "Construct an additional standardized housing module, increasing maximum population capacity.",
        cost: { colonyGoods: 35, minerals: 15 },
        duration: 10, // 4 + 6
        effectDescription: "Increases colony population capacity by 5. Enables more workforce for critical tasks.",
    },
    'recreation-center': {
        id: 'recreation-center',
        name: "Communal Recreation Hub",
        description: "Build a small recreational facility to boost colony morale during off-duty hours.",
        cost: { colonyGoods: 25, power: 8 },
        duration: 9, // 3 + 6
        effectDescription: "Increases workforce efficiency by 10%. Colonists are happier and more productive.",
    },
    'youth-farming-program': {
        id: 'youth-farming-program',
        name: "Youth Hydroponic Education Initiative",
        description: "Establish a hands-on educational program teaching young colonists sustainable farming techniques through small-scale hydroponic gardens. Creates stronger community bonds and practical skills.",
        cost: { colonyGoods: 15, power: 3 },
        duration: 8, // 2 + 6
        effectDescription: "Reduces food-related Colony Goods consumption by 15%. Teaches the next generation of Martian farmers.",
    },
    'signal-shielding': {
        id: 'signal-shielding',
        name: "Solar Radiation Interference",
        description: "Research shielding and error-correction protocols to counter signal disruptions from solar flares, which are more intense with Mars' thin atmosphere. Improves colony morale by maintaining more reliable communication with Earth.",
        cost: { colonyGoods: 18, power: 12, minerals: 8 },
        duration: 9, // 3 + 6
        effectDescription: "Reduces negative effects of solar radiation events by 30%. Keeps communication lines open during solar storms.",
    },
    // Add more projects as needed
};

// Function to get all available projects, filtering out completed ones
export const getAvailableLivingAreaProjects = (completedProjectIds: string[] = []): LivingAreaProject[] => {
    return Object.values(livingAreaProjects).filter(project =>
        !completedProjectIds.includes(project.id)
    );
}; 