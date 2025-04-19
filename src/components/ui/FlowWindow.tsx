import React, { useState } from 'react';
import styles from '@styles/FlowWindow.module.css';
import { useGameStore, ResourceTrendHistory } from '@store/store';

interface FlowWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path
const headerImagePath = '/Derech/avatars/AiHelper.jpg';

// Define flow sections for organization
const flowSections = [
    {
        id: 'last10',
        title: 'Accumulation',
        roundCount: 10
    },
    {
        id: 'rewards',
        title: 'Flow Rewards',
        type: 'rewards'
    },
    {
        id: 'tutorial',
        title: 'Flow Tutorial',
        type: 'tutorial'
    },
    {
        id: 'balance',
        title: 'BALANCE',
        type: 'balance'
    }
];

const FlowWindow: React.FC<FlowWindowProps> = ({ isVisible, onClose }) => {
    const [activeSection, setActiveSection] = useState('last10');
    
    // Get current values from the store including trend history and flow points
    const { 
        resourceTrendHistory, 
        resourceTrends, 
        population, 
        totalWorkforce, 
        currentRound,
        availableWorkforce,
        domeGeneration,
        flowPoints,
        activeFlowTier,
        getConsecutivePositiveTrends,
        power,
        water,
        minerals,
        colonyGoods,
        researchPoints,
        activeTasks,
        completedResearch,
        completedProductionProjects,
        completedLivingProjects
    } = useGameStore();
    
    // Helper to calculate positive trend count
    const countPositiveTrends = (trends: ('up' | 'down' | 'same' | null)[], count: number) => {
        // If no trends history yet, return 0
        if (!trends || trends.length === 0) return 0;
        
        // Otherwise count positive trends
        return trends.slice(0, count).filter(trend => trend === 'up').length;
    };
    
    // Calculate flow points earned per round based on active tier
    const getFlowPointsPerRound = () => {
        switch (activeFlowTier) {
            case 'master':
                return 4;
            case 'strong':
                return 2;
            case 'basic':
                return 1;
            default:
                return 0;
        }
    };
    
    // Helper function to render the resource trend rows
    const renderResourceTrends = (roundCount: number) => {
        const resources = [
            { name: 'Power', icon: '⚡', key: 'power' },
            { name: 'Water', icon: '💧', key: 'water' },
            { name: 'Minerals', icon: '⛏️', key: 'minerals' },
            { name: 'Colony Goods', icon: '📦', key: 'colonyGoods' },
            { name: 'Research Points', icon: '🔬', key: 'researchPoints' }
        ] as const;
        
        return (
            <div className={styles.statsContainer}>
                {resources.map(resource => {
                    const key = resource.key as keyof ResourceTrendHistory;
                    const consecutiveCount = getConsecutivePositiveTrends(key);
                    
                    // Calculate the record - assuming we can infer this from the trend history
                    // This is a simple approximation - we would need a proper record tracking in the store
                    const trendHistory = resourceTrendHistory[key];
                    let recordConsecutive = consecutiveCount;
                    
                    // Look for the longest streak in history
                    if (trendHistory && trendHistory.length > 0) {
                        let maxStreak = 0;
                        let currentStreak = 0;
                        for (let i = 0; i < trendHistory.length; i++) {
                            if (trendHistory[i] === 'up') {
                                currentStreak++;
                                maxStreak = Math.max(maxStreak, currentStreak);
                            } else {
                                currentStreak = 0;
                            }
                        }
                        recordConsecutive = Math.max(recordConsecutive, maxStreak);
                    }
                    
                    return (
                        <div key={resource.key} className={styles.statsRow}>
                            <div className={styles.resourceName}>
                                <span className={styles.resourceIcon}>{resource.icon}</span>
                                {resource.name}
                            </div>
                            <div className={styles.resourceStats}>
                                <span className={styles.trendCount}>
                                    Record: <strong>{recordConsecutive >= 99 ? "99+" : recordConsecutive}</strong>
                                </span>
                                <span className={styles.consecutiveCount}>
                                    Current: <strong>{consecutiveCount >= 99 ? "99+" : consecutiveCount}</strong>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };
    
    // Helper function to render population information
    const renderPopulationGraph = (roundCount: number) => {
        // Calculate remaining rounds until next population gain
        const currentCycle = domeGeneration.populationCycle;
        const threshold = domeGeneration.populationGrowthThreshold;
        const roundsRemaining = Math.max(0, threshold - currentCycle);
        
        // Check if conditions for population growth are met
        const waterPositive = domeGeneration.waterPositive;
        const colonyGoodsSufficient = domeGeneration.colonyGoodsSufficient;
        const growthConditionsMet = waterPositive && colonyGoodsSufficient;
        
        return (
            <div className={styles.graphContainer}>
                <div className={styles.graphTitle}>Population Summary</div>
                <div className={styles.populationSummary}>
                    <div className={styles.populationStatRow}>
                        <span className={styles.populationStatLabel}>🧑‍🤝‍🧑 Current Population:</span>
                        <span className={styles.populationStatValue}>{population}</span>
                    </div>
                    <div className={styles.populationStatRow}>
                        <span className={styles.populationStatLabel}>👷 Total Workforce:</span>
                        <span className={styles.populationStatValue}>{totalWorkforce}</span>
                    </div>
                    <div className={styles.populationStatRow}>
                        <span className={styles.populationStatLabel}>👷 Available Workforce:</span>
                        <span className={styles.populationStatValue}>{availableWorkforce}</span>
                    </div>
                    
                    <div className={styles.populationDivider}></div>
                    
                    <div className={styles.populationGrowthInfo}>
                        <div className={styles.growthTitle}>Next Population Growth</div>
                        {growthConditionsMet ? (
                            <div className={styles.growthProgress}>
                                <div className={styles.growthCycle}>
                                    <span>Living Dome Cycle: </span>
                                    <strong>{currentCycle} / {threshold}</strong>
                                </div>
                                <div className={styles.growthEstimate}>
                                    {roundsRemaining === 0 ? (
                                        <span className={styles.growthReady}>Ready next round!</span>
                                    ) : (
                                        <span>Estimated: <strong>{roundsRemaining} more rounds</strong></span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.growthConditions}>
                                <div className={`${styles.growthCondition} ${waterPositive ? styles.conditionMet : styles.conditionUnmet}`}>
                                    <span>Water Positive: {waterPositive ? '✓' : '✗'}</span>
                                </div>
                                <div className={`${styles.growthCondition} ${colonyGoodsSufficient ? styles.conditionMet : styles.conditionUnmet}`}>
                                    <span>Colony Goods Sufficient: {colonyGoodsSufficient ? '✓' : '✗'}</span>
                                </div>
                                <div className={styles.growthNote}>
                                    Both conditions must be met for population growth
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };
    
    // Helper function to render Flow Rewards section
    const renderFlowRewards = () => {
        // Flow points earned per round
        const flowPointsPerRound = getFlowPointsPerRound();
        
        return (
            <div className={styles.rewardsContainer}>
                <div className={styles.flowPointsDisplay}>
                    <div className={styles.flowPointsIcon}>🌀</div>
                    <div className={styles.flowPointsValue}>{flowPoints}</div>
                    <div className={styles.flowPointsLabel}>Flow Points</div>
                    {flowPointsPerRound > 0 && (
                        <div className={styles.flowPointsRate}>
                            +{flowPointsPerRound} per round
                        </div>
                    )}
                </div>
                
                <div className={styles.rewardHeader}>
                    <h3>Flow Points System</h3>
                    <p className={styles.rewardHeaderDesc}>
                        Earn Flow Points (FP) by maintaining positive resource trends. Only one tier can be active at a time, with higher tiers taking precedence.
                    </p>
                </div>
                
                <div className={styles.rewardTiers}>
                    <div className={`${styles.rewardTier} ${activeFlowTier === 'basic' ? styles.activeTier : ''}`}>
                        <div className={styles.rewardTierTitle}>
                            <span className={styles.rewardTierIcon}>🌀</span>
                            <span>Basic Flow</span>
                            <span className={`${styles.tierStatus} ${activeFlowTier === 'basic' ? styles.statusActive : styles.statusInactive}`}>
                                {activeFlowTier === 'basic' ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                        <div className={styles.rewardTierContent}>
                            <div className={styles.rewardRequirements}>
                                <div className={styles.rewardRequirement}>
                                    <span className={styles.reqLabel}>Resources:</span>
                                    <span className={styles.reqValue}>Any 2 resources</span>
                                </div>
                                <div className={styles.rewardRequirement}>
                                    <span className={styles.reqLabel}>Duration:</span>
                                    <span className={styles.reqValue}>5 consecutive rounds</span>
                                </div>
                            </div>
                            <span className={styles.rewardDescription}>
                                Maintain positive resource trends in any 2 resources for 5 consecutive rounds
                            </span>
                            <span className={styles.rewardValue}>
                                <span className={styles.rewardFlowIcon}>🌀</span> 1 Flow Point per round
                            </span>
                        </div>
                    </div>
                    
                    <div className={`${styles.rewardTier} ${activeFlowTier === 'strong' ? styles.activeTier : ''}`}>
                        <div className={styles.rewardTierTitle}>
                            <span className={styles.rewardTierIcon}>🌀🌀</span>
                            <span>Strong Flow</span>
                            <span className={`${styles.tierStatus} ${activeFlowTier === 'strong' ? styles.statusActive : styles.statusInactive}`}>
                                {activeFlowTier === 'strong' ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                        <div className={styles.rewardTierContent}>
                            <div className={styles.rewardRequirements}>
                                <div className={styles.rewardRequirement}>
                                    <span className={styles.reqLabel}>Resources:</span>
                                    <span className={styles.reqValue}>Any 4 resources</span>
                                </div>
                                <div className={styles.rewardRequirement}>
                                    <span className={styles.reqLabel}>Duration:</span>
                                    <span className={styles.reqValue}>10 consecutive rounds</span>
                                </div>
                            </div>
                            <span className={styles.rewardDescription}>
                                Maintain positive resource trends in any 4 resources for 10 consecutive rounds
                            </span>
                            <span className={styles.rewardValue}>
                                <span className={styles.rewardFlowIcon}>🌀</span> 2 Flow Points per round
                            </span>
                        </div>
                    </div>
                    
                    <div className={`${styles.rewardTier} ${activeFlowTier === 'master' ? styles.activeTier : ''}`}>
                        <div className={styles.rewardTierTitle}>
                            <span className={styles.rewardTierIcon}>🌀🌀🌀</span>
                            <span>Master Flow</span>
                            <span className={`${styles.tierStatus} ${activeFlowTier === 'master' ? styles.statusActive : styles.statusInactive}`}>
                                {activeFlowTier === 'master' ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </div>
                        <div className={styles.rewardTierContent}>
                            <div className={styles.rewardRequirements}>
                                <div className={styles.rewardRequirement}>
                                    <span className={styles.reqLabel}>Resources:</span>
                                    <span className={styles.reqValue}>All 5 resources</span>
                                </div>
                                <div className={styles.rewardRequirement}>
                                    <span className={styles.reqLabel}>Duration:</span>
                                    <span className={styles.reqValue}>20 consecutive rounds</span>
                                </div>
                            </div>
                            <span className={styles.rewardDescription}>
                                Maintain positive resource trends in all resources for 20 consecutive rounds
                            </span>
                            <span className={styles.rewardValue}>
                                <span className={styles.rewardFlowIcon}>🌀</span> 4 Flow Points per round
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className={styles.rewardNote}>
                    <p>Flow Points only used for main progression (Embodiment Research on Tile 0,0, Flow Project Site). Coming Soon: ways to spend Flow Points. Higher tiers take precedence: Master &gt; Strong &gt; Basic. Focus on maintaining stable, positive resource flows to maximize your Flow Points.</p>
                </div>
            </div>
        );
    };
    
    // Helper function to render Flow Tutorial section
    const renderFlowTutorial = () => {
        return (
            <div className={styles.tutorialContainer}>
                <div className={styles.tutorialHeader}>
                    <h3>Understanding Resource Flow</h3>
                </div>
                
                <div className={styles.tutorialSection}>
                    <h4>What is Resource Flow?</h4>
                    <p>Resource Flow tracks the trends in your colony's resources over time. A positive flow indicates your resource production exceeds consumption, while a negative flow indicates consumption exceeds production.</p>
                </div>
                
                <div className={styles.tutorialSection}>
                    <h4>Tracking Resource Trends</h4>
                    <p>The Accumulation tab shows your resource trends over time:</p>
                    <ul className={styles.tutorialList}>
                        <li><span className={styles.trendUp}>▲</span> Positive trend: Resource increased compared to previous round</li>
                        <li><span className={styles.trendDown}>▼</span> Negative trend: Resource decreased compared to previous round</li>
                        <li><span className={styles.trendSame}>●</span> Stable trend: Resource remained the same</li>
                    </ul>
                    <p>Monitor these trends to identify potential issues before they become critical.</p>
                </div>
                
                <div className={styles.tutorialSection}>
                    <h4>Flow Points (FP) System</h4>
                    <p>Flow Points <span className={styles.flowPointsIconSmall}>🌀</span> are earned by maintaining positive resource trends:</p>
                    <ul className={styles.tutorialList}>
                        <li><strong>Basic Flow:</strong> 1 FP per round for positive trends in any 2 resources for 5+ rounds</li>
                        <li><strong>Strong Flow:</strong> 2 FP per round for positive trends in any 4 resources for 10+ rounds</li>
                        <li><strong>Master Flow:</strong> 4 FP per round for positive trends in all resources for 20+ rounds</li>
                    </ul>
                    <p>Only one tier can be active at a time, with higher tiers taking precedence. Flow Points can be spent on colony enhancements.</p>
                </div>
                
                <div className={styles.tutorialSection}>
                    <h4>Optimizing Your Colony</h4>
                    <p>For sustainable colony growth:</p>
                    <ul className={styles.tutorialList}>
                        <li>Balance resource production with consumption</li>
                        <li>Ensure water and colony goods remain positive for population growth</li>
                        <li>Strategically assign workforce to maintain positive trends in critical resources</li>
                        <li>Plan ahead for research and production milestones</li>
                    </ul>
                </div>
                
                <div className={styles.tutorialTip}>
                    <p><strong>Coming Soon:</strong> Spending Flow Points will soon be available</p>
                </div>
            </div>
        );
    };
    
    // Helper function to render Balance section
    const renderBalance = () => {
        // Calculate power production and consumption
        let powerProduction = 5; // Base power production
        let powerConsumption = 2; // Base colony consumption
        
        // Calculate water production and consumption
        let waterProduction = 0;
        let waterConsumption = population; // 1 per colonist
        
        // Calculate minerals production
        let mineralsProduction = 0;
        let mineralsPlayerPortion = 0;
        let mineralsToDome = 0;
        
        // Calculate colony goods production and consumption
        let colonyGoodsProduction = 0;
        let colonyGoodsFromBase = 0;
        let colonyGoodsFromMinerals = 0;
        let colonyGoodsConsumption = Math.floor(population / 10); // 1 per 10 population
        
        // Calculate research points production
        let researchPointsProduction = 0;
        
        // Check for water consumption reduction from research
        if (completedResearch.includes('detoxifying-bacteria')) {
            waterConsumption *= 0.85; // Apply 15% reduction
        }
        
        // Check for water consumption reduction from living dome projects
        if (completedLivingProjects.includes('youth-farming-program')) {
            waterConsumption *= 0.85; // Apply 15% reduction
        }
        
        // Calculate colony goods consumption with reductions
        if (completedLivingProjects.includes('improve-air')) {
            colonyGoodsConsumption *= 0.85; // Apply 15% reduction
        }
        
        if (completedLivingProjects.includes('recreation-center')) {
            colonyGoodsConsumption *= 0.85; // Apply 15% reduction
        }
        
        // Calculate resource production from buildings
        Object.values(activeTasks).forEach(task => {
            if (task.status === 'operational') {
                // Solar Arrays
                if (task.type === 'build-solar') {
                    powerProduction += 15;
                }
                
                // Geothermal Plants
                else if (task.type === 'build-geothermal') {
                    let geothermalOutput = 30;
                    if (completedResearch.includes('seismic-mapping')) {
                        geothermalOutput *= 1.3; // +30%
                    }
                    powerProduction += geothermalOutput;
                    
                    // Additional Research Points if Research Dome upgraded
                    if (completedResearch.includes('upgrade-research-dome')) {
                        researchPointsProduction += 3;
                    }
                }
                
                // Water Wells
                else if (task.type === 'build-waterwell') {
                    let waterOutput = 12;
                    if (completedResearch.includes('water-reclamation-1')) {
                        waterOutput *= 1.2; // +20%
                    }
                    if (completedProductionProjects.includes('thermal-extractors')) {
                        waterOutput *= 1.1; // +10%
                    }
                    waterProduction += waterOutput;
                    
                    // Power consumption for water wells
                    let waterWellPowerCost = task.type === 'build-waterwell' ? 5 : 0;
                    if (completedProductionProjects.includes('thermal-extractors')) {
                        waterWellPowerCost *= 0.75; // -25% power cost
                    }
                    powerConsumption += waterWellPowerCost;
                }
                
                // Mining Operations
                else if (task.type === 'deploy-mining') {
                    // Get the tile to check for mountain height
                    const targetTile = useGameStore.getState().gridTiles[task.targetTileKey];
                    let miningOutput = 5;
                    let mountainBonus = 1;
                    
                    if (completedResearch.includes('improved-extraction')) {
                        miningOutput *= 1.25; // +25%
                    }
                    
                    if (targetTile && targetTile.type === 'Mountain') {
                        mountainBonus = 1 + (targetTile.height * 0.5);
                        miningOutput *= mountainBonus;
                        powerConsumption += targetTile.height; // Additional power cost based on height
                    }
                    
                    // Split: 1/3 for player, 2/3 for Production Dome
                    mineralsProduction += miningOutput;
                    mineralsPlayerPortion += miningOutput / 3;
                    mineralsToDome += (miningOutput * 2) / 3; // 2/3 to Production Dome
                    
                    // Power consumption for mining operations
                    powerConsumption += 6; // Base mining power consumption
                }
                
                // Scout Outposts
                else if (task.type === 'deploy-scout') {
                    let scoutOutput = 4;
                    if (completedResearch.includes('embodiment-prelim')) {
                        scoutOutput *= 1.15; // +15%
                    }
                    researchPointsProduction += scoutOutput;
                    
                    // Power consumption for scout outposts
                    powerConsumption += 3; // Base scout power consumption
                }
            }
        });
        
        // Calculate research dome production
        const researchCycle = domeGeneration.researchCycle;
        const researchBaseAmount = domeGeneration.researchBaseAmount;
        if ((researchCycle + 1) % 4 === 0) {
            researchPointsProduction += researchBaseAmount;
        }
        
        // Calculate colony goods production from Production Dome
        const colonyGoodsCycle = domeGeneration.colonyGoodsCycle;
        const hasOptimizedAssembly = completedProductionProjects.includes('optimize-assembly');
        const conversionRate = completedProductionProjects.includes('power-efficiency') ? 9 : 10;
        
        if (hasOptimizedAssembly) {
            // Every round with Optimized Assembly
            colonyGoodsFromBase = 3; // Base production per round
            
            // Mineral conversion if minerals are stored
            // In reality this is more complex with stored minerals, but for this display
            // we'll show the conversion of currently produced minerals per round
            colonyGoodsFromMinerals = mineralsToDome / conversionRate;
        } else {
            // Every 5 rounds without Optimized Assembly
            if ((colonyGoodsCycle + 1) % 5 === 0) {
                colonyGoodsFromBase = domeGeneration.colonyGoodsBaseAmount / 5; // Base amount averaged per round
                
                // For display purposes, we'll average the goods from minerals over 5 rounds
                colonyGoodsFromMinerals = (mineralsToDome / conversionRate) / 5;
            } else {
                colonyGoodsFromBase = 0;
                colonyGoodsFromMinerals = 0;
            }
        }
        
        // Total colony goods production
        colonyGoodsProduction = colonyGoodsFromBase + colonyGoodsFromMinerals;
        
        // Round values to one decimal place for display
        powerProduction = Math.round(powerProduction * 10) / 10;
        powerConsumption = Math.round(powerConsumption * 10) / 10;
        waterProduction = Math.round(waterProduction * 10) / 10;
        waterConsumption = Math.round(waterConsumption * 10) / 10;
        mineralsProduction = Math.round(mineralsProduction * 10) / 10;
        mineralsPlayerPortion = Math.round(mineralsPlayerPortion * 10) / 10;
        mineralsToDome = Math.round(mineralsToDome * 10) / 10;
        colonyGoodsProduction = Math.round(colonyGoodsProduction * 10) / 10;
        colonyGoodsFromBase = Math.round(colonyGoodsFromBase * 10) / 10;
        colonyGoodsFromMinerals = Math.round(colonyGoodsFromMinerals * 10) / 10;
        colonyGoodsConsumption = Math.round(colonyGoodsConsumption * 10) / 10;
        researchPointsProduction = Math.round(researchPointsProduction * 10) / 10;
        
        // Calculate net values
        const powerNet = powerProduction - powerConsumption;
        const waterNet = waterProduction - waterConsumption;
        const mineralsNet = mineralsPlayerPortion;
        const colonyGoodsNet = colonyGoodsProduction - colonyGoodsConsumption;
        
        return (
            <div className={styles.balanceContainer}>
                <div className={styles.balanceHeader}>
                    <h3>Resource Balance</h3>
                    <p className={styles.balanceHeaderDesc}>
                        Current production and consumption rates per round. Positive balance indicates stable resource flow.
                    </p>
                </div>
                
                <div className={styles.balanceResourceContainer}>
                    {/* Power Balance */}
                    <div className={styles.balanceResource}>
                        <div className={styles.balanceResourceHeader}>
                            <span className={styles.balanceResourceIcon}>⚡</span>
                            <span className={styles.balanceResourceTitle}>Power</span>
                            <span className={`${styles.balanceNet} ${powerNet >= 0 ? styles.positiveNet : styles.negativeNet}`}>
                                {powerNet >= 0 ? '+' : ''}{powerNet.toFixed(1)}
                            </span>
                        </div>
                        <div className={styles.balanceDetails}>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Production</span>
                                <span className={styles.balanceValue}>+{powerProduction.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Consumption</span>
                                <span className={styles.balanceValue}>−{powerConsumption.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Water Balance */}
                    <div className={styles.balanceResource}>
                        <div className={styles.balanceResourceHeader}>
                            <span className={styles.balanceResourceIcon}>💧</span>
                            <span className={styles.balanceResourceTitle}>Water</span>
                            <span className={`${styles.balanceNet} ${waterNet >= 0 ? styles.positiveNet : styles.negativeNet}`}>
                                {waterNet >= 0 ? '+' : ''}{waterNet.toFixed(1)}
                            </span>
                        </div>
                        <div className={styles.balanceDetails}>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Production</span>
                                <span className={styles.balanceValue}>+{waterProduction.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Consumption</span>
                                <span className={styles.balanceValue}>−{waterConsumption.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Minerals Balance */}
                    <div className={styles.balanceResource}>
                        <div className={styles.balanceResourceHeader}>
                            <span className={styles.balanceResourceIcon}>⛏️</span>
                            <span className={styles.balanceResourceTitle}>Minerals</span>
                            <span className={`${styles.balanceNet} ${mineralsNet >= 0 ? styles.positiveNet : styles.negativeNet}`}>
                                {mineralsNet >= 0 ? '+' : ''}{mineralsNet.toFixed(1)}
                            </span>
                        </div>
                        <div className={styles.balanceDetails}>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Total Mining</span>
                                <span className={styles.balanceValue}>+{mineralsProduction.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Your Portion (1/3)</span>
                                <span className={styles.balanceValue}>+{mineralsPlayerPortion.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>To Production Dome (2/3)</span>
                                <span className={styles.balanceValue}>+{mineralsToDome.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceNote}>⚠️ 2/3 of minerals go to Production Dome</div>
                        </div>
                    </div>
                    
                    {/* Colony Goods Balance */}
                    <div className={styles.balanceResource}>
                        <div className={styles.balanceResourceHeader}>
                            <span className={styles.balanceResourceIcon}>📦</span>
                            <span className={styles.balanceResourceTitle}>Colony Goods</span>
                            <span className={`${styles.balanceNet} ${colonyGoodsNet >= 0 ? styles.positiveNet : styles.negativeNet}`}>
                                {colonyGoodsNet >= 0 ? '+' : ''}{colonyGoodsNet.toFixed(1)}
                            </span>
                        </div>
                        <div className={styles.balanceDetails}>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Base Production</span>
                                <span className={styles.balanceValue}>+{colonyGoodsFromBase.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>From Minerals (2/3 ÷ {conversionRate})</span>
                                <span className={styles.balanceValue}>+{colonyGoodsFromMinerals.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Total Production</span>
                                <span className={styles.balanceValue}>+{colonyGoodsProduction.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Consumption</span>
                                <span className={styles.balanceValue}>−{colonyGoodsConsumption.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceNote}>
                                {hasOptimizedAssembly 
                                    ? "Optimized Assembly: production every round" 
                                    : "Production Dome: goods every 5 rounds"}
                            </div>
                        </div>
                    </div>
                    
                    {/* Research Points Balance */}
                    <div className={styles.balanceResource}>
                        <div className={styles.balanceResourceHeader}>
                            <span className={styles.balanceResourceIcon}>🔬</span>
                            <span className={styles.balanceResourceTitle}>Research Points</span>
                            <span className={`${styles.balanceNet} ${styles.positiveNet}`}>
                                +{researchPointsProduction.toFixed(1)}
                            </span>
                        </div>
                        <div className={styles.balanceDetails}>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Production</span>
                                <span className={styles.balanceValue}>+{researchPointsProduction.toFixed(1)}</span>
                            </div>
                            <div className={styles.balanceRow}>
                                <span className={styles.balanceLabel}>Consumption</span>
                                <span className={styles.balanceValue}>−0.0</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className={styles.balanceTip}>
                    <p><em>Note: Production values are averages per round. Dome production cycles may occur every several rounds.</em></p>
                </div>
            </div>
        );
    };
    
    return (
        isVisible ? (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.windowContainer} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.closeButton} onClick={onClose}>×</button>

                    {/* Header section with image and title */}
                    <div className={styles.headerSection}>
                        <div className={styles.headerImageContainer}>
                            <img src={headerImagePath} alt="Flow Analytics" className={styles.headerImage} />
                        </div>

                        <h2 className={styles.title}>Flow Analytics</h2>
                    </div>
                    
                    {/* Navigation tabs for flow sections */}
                    <div className={styles.tabsContainer}>
                        {flowSections.map(section => (
                            <button 
                                key={section.id}
                                className={`${styles.tabButton} ${activeSection === section.id ? styles.activeTab : ''} ${section.id === 'balance' ? styles.balanceTab : ''}`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                {section.title}
                            </button>
                        ))}
                    </div>

                    {/* Main content container */}
                    <div className={styles.mainContentContainer}>
                        {/* Last 10 Rounds Section */}
                        <div 
                            className={`${styles.flowSection} ${activeSection === 'last10' ? styles.activeSection : ''}`}
                        >
                            <h3 className={styles.sectionTitle}>Accumulation</h3>
                            <div className={styles.sectionContent}>
                                <p>Resource trend analysis for consecutive positive rounds:</p>
                                
                                {/* Render resource trend statistics */}
                                {renderResourceTrends(10)}
                                
                                {/* Population information */}
                                {renderPopulationGraph(10)}
                            </div>
                        </div>
                        
                        {/* Flow Rewards Section */}
                        <div 
                            className={`${styles.flowSection} ${activeSection === 'rewards' ? styles.activeSection : ''}`}
                        >
                            <h3 className={styles.sectionTitle}>Flow Rewards</h3>
                            <div className={styles.sectionContent}>
                                {renderFlowRewards()}
                            </div>
                        </div>
                        
                        {/* Flow Tutorial Section */}
                        <div 
                            className={`${styles.flowSection} ${activeSection === 'tutorial' ? styles.activeSection : ''}`}
                        >
                            <h3 className={styles.sectionTitle}>Flow Tutorial</h3>
                            <div className={styles.sectionContent}>
                                {renderFlowTutorial()}
                            </div>
                        </div>
                        
                        {/* Balance Section */}
                        <div 
                            className={`${styles.flowSection} ${activeSection === 'balance' ? styles.activeSection : ''}`}
                        >
                            <h3 className={styles.sectionTitle}>Balance</h3>
                            <div className={styles.sectionContent}>
                                {renderBalance()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    );
};

export default FlowWindow; 