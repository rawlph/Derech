// Issue type system
export interface IssueChoice {
    id: string;
    text: string;
    cost?: {
        researchPoints?: number;
        power?: number;
        water?: number;
        minerals?: number;
        colonyGoods?: number;
    };
    outcomes: {
        text: string;
        shutdown?: boolean; // Add the shutdown property to flag if this choice should shut down the facility
        effects: {
            researchPoints?: number;
            power?: number;
            water?: number;
            minerals?: number;
            colonyGoods?: number;
            workforce?: number;
        };
    };
}

export interface Issue {
    id: string;
    title: string;
    description: string;
    buildingType: string | string[]; // Can be specific to one or multiple building types
    image?: string; // Path to header image, if any
    repeatable: boolean; // Whether this issue can occur multiple times
    requiresResearch?: string; // Optional research project ID that must be completed
    choices: IssueChoice[];
}

// Define building issue generation rates (in rounds)
export const buildingIssueRates: Record<string, number> = {
    'Mining Operation': 6,
    'Water Well': 8,
    'Scout Outpost': 2,
    'Geothermal Plant': 16,
    'Solar Array': 4,
};

// Define initial issues
export const issues: Issue[] = [
    {
        id: 'duststorm-basic',
        title: 'Dust Storm Warning',
        description: 'A massive dust storm is approaching your facility. The fine Martian dust particles can damage equipment and reduce efficiency if not addressed properly. Your sensors indicate it will hit in approximately 12 hours.',
        buildingType: ['Mining Operation', 'Solar Array', 'Geothermal Plant', 'Water Well', 'Scout Outpost'], // Affects all buildings
        image: '/Derech/images/duststorm.jpg', // Path already correct
        repeatable: true,
        choices: [
            {
                id: 'dust-shutdown',
                text: 'Temporarily shut down systems and seal all equipment',
                outcomes: {
                    text: 'You shut down all non-essential systems and seal vulnerable equipment. The facility loses some production time, but equipment remains protected.',
                    shutdown: true, // This choice shuts down the facility temporarily
                    effects: {
                        // Loss of resources due to downtime
                        power: -4, // Reduced loss from -5 to -4
                        minerals: -2, // Reduced loss from -3 to -2
                    }
                }
            },
            {
                id: 'dust-shields',
                text: 'Deploy emergency dust shields and keep operating',
                cost: {
                    power: 8, // Reduced cost from 10 to 8
                },
                outcomes: {
                    text: 'The emergency shields consume additional power but allow operations to continue at reduced capacity. Some dust still manages to infiltrate sensitive systems.',
                    shutdown: false, // Facility keeps operating
                    effects: {
                        power: -3, // Reduced loss from -5 to -3
                        minerals: -1, // Minor loss due to reduced efficiency
                    }
                }
            },
            {
                id: 'dust-research',
                text: 'Apply experimental nanotechnology coating (Costs 8 Power, 5 Minerals)',
                cost: {
                    power: 8,
                    minerals: 5
                },
                outcomes: {
                    text: 'The nanomaterial-based coating works better than expected! Not only does it protect against the current storm, but it also yields valuable research data (+12 RP). Your facility continues to operate efficiently despite the dust storm.',
                    shutdown: false, // Facility keeps operating and is actually enhanced
                    effects: {
                        researchPoints: 12, // Gain research points from the experiment
                        minerals: 3, // Added small minerals bonus
                    }
                }
            }
        ]
    },
    
    // New punishing issue - Radiation Surge
    {
        id: 'radiation-surge',
        title: 'Solar Radiation Surge',
        description: 'Long-range sensors have detected a massive solar flare heading toward Mars. Without Earth\'s protective magnetosphere, this facility will be exposed to dangerous radiation levels that could damage sensitive equipment and pose health risks to the crew.',
        buildingType: ['Mining Operation', 'Solar Array', 'Water Well', 'Scout Outpost'], // Affects most buildings except Geothermal
        image: '/Derech/images/duststorm.jpg', // Changed from radiation.jpg
        repeatable: true,
        choices: [
            {
                id: 'radiation-shutdown',
                text: 'Evacuate personnel and power down sensitive systems',
                outcomes: {
                    text: 'You order an immediate evacuation and activate radiation-hardened backup systems. The facility suffers downtime, but critical equipment is preserved and workforce remains safe. Scientists analyze the radiation data afterward (+2 RP).',
                    shutdown: true,
                    effects: {
                        power: -6, // Reduced loss from -8 to -6
                        colonyGoods: -4, // Reduced loss from -5 to -4
                        researchPoints: 2, // Added small research bonus for learning from the event
                    }
                }
            },
            {
                id: 'radiation-shield',
                text: 'Divert power to emergency radiation shielding',
                cost: {
                    power: 12, // Reduced cost from 15 to 12
                    water: 4, // Reduced cost from 5 to 4
                },
                outcomes: {
                    text: 'You boost power to the facility\'s radiation shields and use water reserves to create additional protection layers. Operations continue at reduced capacity, but the facility remains online through the radiation storm.',
                    shutdown: false,
                    effects: {
                        power: -3, // Reduced loss from -5 to -3
                        colonyGoods: -1, // Reduced loss from -2 to -1
                        minerals: 2, // Added small minerals bonus
                    }
                }
            },
            {
                id: 'radiation-research',
                text: 'Deploy experimental ionospheric deflector (Costs 15 Power, 10 Colony Goods)',
                cost: {
                    power: 15,
                    colonyGoods: 10
                },
                outcomes: {
                    text: 'The experimental deflector technology creates a localized magnetic field that mimics Earth\'s natural protection. The radiation is successfully diverted, and your research team collects invaluable scientific data on the technology\'s performance (+25 RP).',
                    shutdown: false,
                    effects: {
                        researchPoints: 25, // Significant research gain from the experiment
                        power: 5, // Added power bonus
                        colonyGoods: 5, // Added colony goods bonus
                    }
                }
            }
        ]
    },
    
    // New beneficial issue - Phobos Alignment
    {
        id: 'phobos-alignment',
        title: 'Phobos Power Alignment',
        description: 'A rare orbital alignment of Phobos has created unusual gravitational conditions that are amplifying your facility\'s power systems. Engineers report the potential to harness this natural phenomenon for increased output.',
        buildingType: ['Solar Array', 'Geothermal Plant'], // Only affects power-generating buildings
        image: '/Derech/images/duststorm.jpg', // Changed from phobos.jpg
        repeatable: true,
        choices: [
            {
                id: 'phobos-standard',
                text: 'Maintain standard operations and safety protocols',
                outcomes: {
                    text: 'You decide to play it safe, maintaining normal power levels while benefiting from a moderate but stable boost in efficiency.',
                    shutdown: false,
                    effects: {
                        power: 15, // Increased from 10 to 15
                        colonyGoods: 2, // Added small colony goods bonus
                    }
                }
            },
            {
                id: 'phobos-overclock',
                text: 'Temporarily overclock power systems for maximum gain',
                outcomes: {
                    text: 'Engineers push the systems to their limits, capturing the gravitational resonance at its peak. Power output surges dramatically, though the strain on equipment is significant. The unusual conditions yield some research benefits (+3 RP).',
                    shutdown: false,
                    effects: {
                        power: 30, // Increased from 25 to 30
                        minerals: -3, // Increased cost from -2 to -3, more wear and tear
                        researchPoints: 3, // Added small research bonus
                    }
                }
            },
            {
                id: 'phobos-research',
                text: 'Deploy sensors to study the phenomenon (Costs 5 Research Points)',
                cost: {
                    researchPoints: 5,
                },
                outcomes: {
                    text: 'Your research team captures detailed data on the alignment effect. Not only do you gain a power boost, but the collected data significantly advances your understanding of efficient power generation on Mars (+18 RP).',
                    shutdown: false,
                    effects: {
                        power: 20, // Increased from 15 to 20
                        researchPoints: 18, // Increased from 15 to 18
                        colonyGoods: 3, // Added colony goods bonus
                    }
                }
            }
        ]
    },
    
    // New beneficial issue - Martian Discovery
    {
        id: 'martian-discovery',
        title: 'Ancient Martian Discovery',
        description: 'Workers have uncovered what appears to be preserved microfossils in a nearby rock formation. This extraordinary find has sparked excitement throughout the facility as it may represent the first concrete evidence of ancient life on Mars.',
        buildingType: ['Mining Operation', 'Scout Outpost'], // Only affects exploration-type buildings
        image: '/Derech/images/duststorm.jpg', // Changed from discovery.jpg
        repeatable: false, // This is a rare, one-time event
        choices: [
            {
                id: 'discovery-study',
                text: 'Dedicate staff to carefully study the find',
                outcomes: {
                    text: 'The careful, methodical approach yields valuable scientific insights. The discovery boosts morale and generates significant research data (+25 RP), though production is temporarily slowed as workers are distracted by excitement.',
                    shutdown: false,
                    effects: {
                        researchPoints: 25, // Increased from 20 to 25
                        minerals: -1, // Reduced from -2 to -1
                        colonyGoods: 3, // Added colony goods bonus
                    }
                }
            },
            {
                id: 'discovery-press',
                text: 'Announce the discovery to boost colony morale',
                outcomes: {
                    text: 'News of the discovery spreads rapidly, becoming a symbol of hope and purpose for the entire colony. Workforce efficiency increases across all sectors as colonists feel they\'re part of something truly historic.',
                    shutdown: false,
                    effects: {
                        colonyGoods: 15, // Increased from 10 to 15
                        minerals: 8, // Increased from 5 to 8
                        water: 5, // Added water bonus
                    }
                }
            },
            {
                id: 'discovery-catalog',
                text: 'Deploy advanced analysis equipment (Costs 12 Power, 10 Colony Goods)',
                cost: {
                    power: 12,
                    colonyGoods: 10
                },
                outcomes: {
                    text: 'Your thorough scientific documentation creates a treasure trove of data. The site becomes a nexus of inspiration, with teams working extra shifts voluntarily. The discovery may be the breakthrough that transforms our understanding of Martian history (+40 RP).',
                    shutdown: false,
                    effects: {
                        researchPoints: 40, // Increased from 35 to 40
                        colonyGoods: 8, // Increased from 5 to 8
                        minerals: 10, // Increased from 8 to 10
                        power: 5, // Added power bonus
                    }
                }
            }
        ]
    },
    
    // CATEGORY-SPECIFIC RESEARCH-LOCKED ISSUES
    
    // 1. Scout Outpost Special Issue - Locked behind "Enhanced Rover Optics" research
    {
        id: 'ancient-structure-discovered',
        title: 'Ancient Structure Detected',
        description: 'Your enhanced scout drones have detected an unusual geometric formation beyond the Acidalia Planitia. The high-resolution imagery from the new optics system reveals what appears to be an artificial structure, possibly an abandoned early expedition shelter or equipment cache.',
        buildingType: ['Scout Outpost'], // Only for Scout Outposts
        image: '/Derech/images/duststorm.jpg', // Changed from ancient-structure.jpg
        repeatable: false, // One-time event
        requiresResearch: 'basic-scouting', // Locked behind Enhanced Rover Optics research
        choices: [
            {
                id: 'dispatch-expedition',
                text: 'Dispatch a manned expedition team to investigate',
                cost: {
                    power: 8,  // Reduced from 10 to 8
                    water: 4,  // Reduced from 5 to 4
                    colonyGoods: 4  // Reduced from 5 to 4
                },
                outcomes: {
                    text: 'Your expedition team successfully reaches the anomaly, discovering it to be remnants of a failed Chinese mission from the 2030s. The team recovers valuable equipment, mineral samples, and data drives containing research that was presumed lost (+20 RP).',
                    shutdown: false,
                    effects: {
                        minerals: 25, // Increased from 20 to 25
                        researchPoints: 20, // Increased from 15 to 20
                        colonyGoods: 15 // Increased from 10 to 15
                    }
                }
            },
            {
                id: 'remote-survey',
                text: 'Deploy autonomous rover with scanning equipment (Costs 10 Power, 5 Colony Goods)',
                cost: {
                    power: 10,
                    colonyGoods: 5
                },
                outcomes: {
                    text: 'The autonomous rover completes a thorough survey using advanced imaging and sampling techniques. While the physical materials remain at the site, the scientific data gathered provides significant insights and coordinates for future recovery missions (+30 RP).',
                    shutdown: false,
                    effects: {
                        researchPoints: 30, // Increased from 25 to 30
                        minerals: 8, // Increased from 5 to 8
                        power: 5 // Added power bonus
                    }
                }
            },
            {
                id: 'mark-coordinates',
                text: 'Mark coordinates in database for future investigation',
                outcomes: {
                    text: 'You log the coordinates for later exploration when resources permit. The scouting team continues their regular patrol pattern, focusing on more immediate priorities. The data remains valuable for future reference (+8 RP).',
                    shutdown: false,
                    effects: {
                        researchPoints: 8, // Increased from 5 to 8
                        colonyGoods: 3  // Added colony goods bonus
                    }
                }
            }
        ]
    },
    
    // 2. Mining/Production Special Issue - Locked behind "Efficient Mining Drills" research
    {
        id: 'subsurface-mineral-vein',
        title: 'Rich Subsurface Mineral Vein',
        description: 'The improved seismic sensors from your advanced drilling equipment have detected an unusual formation beneath your mining operation. Analysis suggests a concentrated vein of rare minerals that would typically go undetected with standard equipment. This could be a significant opportunity for resource extraction.',
        buildingType: ['Mining Operation'], // Only for Mining Operations
        image: '/Derech/images/duststorm.jpg', // Changed from mineral-vein.jpg
        repeatable: false, // One-time event
        requiresResearch: 'improved-extraction', // Locked behind Efficient Mining Drills research
        choices: [
            {
                id: 'comprehensive-excavation',
                text: 'Launch comprehensive excavation project',
                cost: {
                    power: 18, // Reduced from 20 to 18
                    colonyGoods: 12 // Reduced from 15 to 12
                },
                outcomes: {
                    text: 'Your team executes a carefully planned excavation, revealing a substantial deposit of high-grade minerals. The extraction is labor-intensive but extremely productive, yielding materials that will benefit the colony for months to come. The unique mineral composition provides some research value (+5 RP).',
                    shutdown: false,
                    effects: {
                        minerals: 60, // Increased from 50 to 60
                        power: -4, // Reduced from -5 to -4
                        researchPoints: 5 // Added research bonus
                    }
                }
            },
            {
                id: 'targeted-drilling',
                text: 'Implement targeted drilling at key points',
                cost: {
                    power: 8, // Reduced from 10 to 8
                    colonyGoods: 4 // Reduced from 5 to 4
                },
                outcomes: {
                    text: 'Using precision drilling techniques, your team extracts the most accessible portions of the mineral vein. This balanced approach yields good results while minimizing disruption to regular operations. The discovered geological patterns offer scientific interest (+8 RP).',
                    shutdown: false,
                    effects: {
                        minerals: 35, // Increased from 30 to 35
                        researchPoints: 8, // Increased from 5 to 8
                        water: 5 // Added water bonus
                    }
                }
            },
            {
                id: 'train-specialized-team',
                text: 'Implement research-driven extraction protocol (Costs 10 Power, 8 Colony Goods)',
                cost: {
                    power: 10,
                    colonyGoods: 8
                },
                outcomes: {
                    text: 'By applying the latest research techniques, your specialized team develops novel extraction methods that maximize both mineral yield and scientific data. This approach not only delivers exceptional resources but also generates valuable research insights (+20 RP).',
                    shutdown: false,
                    effects: {
                        minerals: 45, // Increased from 40
                        researchPoints: 20, // Higher research gain
                        colonyGoods: 5, 
                        power: 5 // Added power bonus
                    }
                }
            }
        ]
    },
    
    // 3. Water/Living Special Issue - Locked behind "Atmospheric Water Capture" research
    {
        id: 'subterranean-ice-chamber',
        title: 'Subterranean Ice Chamber Discovered',
        description: 'While expanding your water extraction system with the new atmospheric condensation technology, workers have discovered a sealed underground chamber containing a substantial deposit of pristine ice. Initial analysis indicates unusual purity and potential scientific significance due to trapped gases and sediment layers.',
        buildingType: ['Water Well'], // Only for Water Wells
        image: '/Derech/images/duststorm.jpg', // Changed from ice-chamber.jpg
        repeatable: false, // One-time event
        requiresResearch: 'water-reclamation-1', // Locked behind Atmospheric Water Capture research
        choices: [
            {
                id: 'scientific-preservation',
                text: 'Preserve most of the ice for scientific study (Costs 8 Power, 5 Colony Goods)',
                cost: {
                    power: 8,
                    colonyGoods: 5
                },
                outcomes: {
                    text: 'Your research team carefully documents and preserves the ice chamber, extracting cores for detailed analysis. The preserved gases and sediment layers provide unprecedented insights into Mars\' climate history (+30 RP), while still allowing for measured water extraction.',
                    shutdown: false,
                    effects: {
                        water: 18, // Increased from 15 to 18
                        researchPoints: 30, // Increased from 25 to 30
                        colonyGoods: 5 // Added colony goods bonus
                    }
                }
            },
            {
                id: 'communal-celebration',
                text: 'Extract water for a colony-wide celebration',
                outcomes: {
                    text: 'You authorize a special water ration for the entire colony. The modest luxury of additional fresh water for personal use creates a tangible boost to morale. Colonists report improved well-being and renewed commitment to the Mars mission.',
                    shutdown: false,
                    effects: {
                        water: 30, // Increased from 25 to 30
                        colonyGoods: 20, // Increased from 15 to 20
                        minerals: 5 // Added minerals bonus
                    }
                }
            },
            {
                id: 'hydroponic-expansion',
                text: 'Direct water to expanded hydroponic systems',
                cost: {
                    colonyGoods: 8, // Reduced from 10 to 8
                    power: 4 // Reduced from 5 to 4
                },
                outcomes: {
                    text: 'The pure ice is carefully melted and integrated into an expanded hydroponic growing system. The increased crop yield substantially improves food variety and nutrition for all colonists, creating lasting health benefits and resource diversity. Agricultural experiments yield modest research findings (+8 RP).',
                    shutdown: false,
                    effects: {
                        water: 25, // Increased from 20 to 25
                        colonyGoods: 25, // Increased from 20 to 25
                        researchPoints: 8, // Increased from 5 to 8
                        power: 5 // Added power bonus
                    }
                }
            }
        ]
    }
];

// Helper functions
export const getIssueById = (id: string): Issue | undefined => {
    return issues.find(issue => issue.id === id);
};

export const getRandomIssueForBuilding = (buildingType: string): Issue | undefined => {
    // Filter issues applicable to this building type
    const applicableIssues = issues.filter(issue => 
        typeof issue.buildingType === 'string' 
            ? issue.buildingType === buildingType
            : issue.buildingType.includes(buildingType)
    );
    
    if (!applicableIssues.length) return undefined;
    
    // Select random issue
    return applicableIssues[Math.floor(Math.random() * applicableIssues.length)];
}; 