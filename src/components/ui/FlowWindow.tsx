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
        getConsecutivePositiveTrends
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
                    <p>Flow Points can be spent on colony enhancements in the Research Dome. Higher tiers take precedence: Master &gt; Strong &gt; Basic. Focus on maintaining stable, positive resource flows to maximize your Flow Points.</p>
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
    
    if (!isVisible) {
        return null;
    }

    return (
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
                            className={`${styles.tabButton} ${activeSection === section.id ? styles.activeTab : ''}`}
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
                </div>
            </div>
        </div>
    );
};

export default FlowWindow; 