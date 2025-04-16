import { useGameStore, TaskState } from '@store/store';
import styles from '@styles/ManagementUI.module.css'; // Create this CSS module
import { taskConfigs, getTaskConfig } from '@config/tasks'; // Import task configs
import { useMemo, useState } from 'react'; // Import useMemo and useState
import ConfirmationDialog from './ConfirmationDialog'; // Import the new component
import EmergencyDecisions from './EmergencyDecisions'; // Import the emergency component
import DomeInfoPanel from './DomeInfoPanel'; // Import the dome info component
import FlowProjectInfoPanel from './FlowProjectInfoPanel'; // Import the flow project info component
import VolumeControl from './VolumeControl'; // Import the volume control component

// Helper function to calculate resource generation with bonuses
const calculateResourceGeneration = (taskType: string, resourceType: string, baseAmount: number, completedResearch: string[], completedProduction: string[], mountain?: {type: string, height: number}) => {
    let amount = baseAmount;
    
    // Apply research and production project bonuses
    if (resourceType === 'water' && taskType === 'build-waterwell') {
        if (completedResearch.includes('water-reclamation-1')) {
            amount *= 1.20; // +20%
        }
        if (completedProduction.includes('thermal-extractors')) {
            amount *= 1.10; // +10% (multiplicative)
        }
    } else if (resourceType === 'minerals' && taskType === 'deploy-mining') {
        if (completedResearch.includes('improved-extraction')) {
            amount *= 1.25; // +25%
        }
        // Apply mountain height bonus if applicable
        if (mountain?.type === 'Mountain') {
            const heightBonus = mountain.height * 0.5;
            amount *= (1 + heightBonus);
        }
    } else if (resourceType === 'researchPoints' && taskType === 'deploy-scout') {
        if (completedResearch.includes('embodiment-prelim')) {
            amount *= 1.15; // +15%
        }
    } else if (resourceType === 'power' && taskType === 'build-geothermal') {
        if (completedResearch.includes('seismic-mapping')) {
            amount *= 1.30; // +30%
        }
    }
    
    return Math.floor(amount);
};

// Helper function to calculate power consumption with bonuses
const calculatePowerConsumption = (taskType: string, basePowerConsumption: number, completedProduction: string[], mountain?: {type: string, height: number}) => {
    let consumption = basePowerConsumption;
    
    // Apply production project bonuses
    if (taskType === 'build-waterwell' && completedProduction.includes('thermal-extractors')) {
        consumption *= 0.75; // -25% power consumption for water wells
    }
    
    // Add mountain height power consumption
    if (taskType === 'deploy-mining' && mountain?.type === 'Mountain') {
        consumption += mountain.height; // +1 power per mountain height level
    }
    
    return Math.floor(consumption);
};

// Status Display Component
const StatusDisplay = () => {
    const { 
        flowPoints, 
        activeFlowTier, 
        population, 
        totalWorkforce, 
        availableWorkforce 
    } = useGameStore();
    
    // Determine flow icon and class based on active tier
    const getFlowDisplay = () => {
        let iconContent;
        let tierClass;
        let displayFormat;
        
        switch (activeFlowTier) {
            case 'basic':
                iconContent = '🌀';
                tierClass = styles.basicFlow;
                displayFormat = `${iconContent}: ${flowPoints}`;
                break;
            case 'strong':
                iconContent = '🌀🌀';
                tierClass = styles.strongFlow;
                displayFormat = `${iconContent}: ${flowPoints}`;
                break;
            case 'master':
                iconContent = '🌀🌀🌀';
                tierClass = styles.masterFlow;
                displayFormat = `${iconContent}: ${flowPoints}`;
                break;
            default:
                iconContent = '🌀';
                tierClass = styles.noFlow;
                displayFormat = `No-${iconContent}: ${flowPoints}`;
                break;
        }
        
        return (
            <span className={`${styles.flowDisplay} ${tierClass}`}>
                {displayFormat}
            </span>
        );
    };
    
    return (
        <div className={styles.statusDisplay}>
            <div className={styles.statusItem}>
                {getFlowDisplay()}
            </div>
            <div className={styles.statusItem}>
                <span className={styles.populationDisplay}>
                    🧑‍🤝‍🧑: {population}
                </span>
            </div>
            <div className={styles.statusItem}>
                <span className={styles.workforceDisplay}>
                    👷: {availableWorkforce}/{totalWorkforce}
                </span>
            </div>
        </div>
    );
};

const ManagementUI = () => {
    const {
        power,
        water,
        population,
        researchPoints,
        colonyGoods,
        minerals, // Get minerals
        totalWorkforce, // Get workforce
        availableWorkforce, // Get workforce
        currentRound,
        endRound,
        selectedTile,
        deselectTile,
        assignWorkforceToTask, // Get task action - NOTE: We will update its return type later
        recallWorkforce, // Get task action
        activeTasks, // Get active tasks state
        setGameView, // To switch to puzzle view
        showResearchWindow,
        // --- NEW: Import window actions --- 
        showLivingDomeWindow,
        showProductionDomeWindow,
        showTutorialWindow, // Import tutorial window action
        showFlowWindow, // Import flow window action
        // --- NEW: Import issue actions ---
        // --- NEW: Import resource trends ---
        resourceTrends,
        // --- --- 
        completedResearch,
        isAudioPuzzleCompleted,
        // --- NEW: Import resource sidebar state and action ---
        isResourceSidebarOpen,
        setResourceSidebarOpen,
        completedProductionProjects,
    } = useGameStore();

    // --- State for button feedback ---
    const [feedbackState, setFeedbackState] = useState<{
        shakingButton: string | null; // Task type ID (e.g., 'deploy-mining')
        warningMessage: { type: string; message: string } | null;
    }>({ shakingButton: null, warningMessage: null });
    // --- ---

    // --- State for Portal Room Confirmation ---
    const [showPortalConfirm, setShowPortalConfirm] = useState(false);
    // --- ---
    
    // --- State for Resources Sidebar removed since it's now in the store ---

    // Helper to render resource trend indicators
    const renderTrendIndicator = (trend: 'up' | 'down' | 'same' | null) => {
        if (trend === 'up') {
            return <span className={`${styles.resourceTrend} ${styles.trendUp}`}>▲</span>;
        } else if (trend === 'down') {
            return <span className={`${styles.resourceTrend} ${styles.trendDown}`}>▼</span>;
        } else if (trend === 'same') {
            return <span className={`${styles.resourceTrend} ${styles.trendSame}`}>●</span>;
        }
        return null;
    };

    const handleEndRound = () => {
        endRound();
    };

    const handleGoToWelcome = () => {
        // Show the custom confirmation dialog instead of window.confirm
        setShowPortalConfirm(true);
    };

    const handleConfirmPortal = () => {
        setShowPortalConfirm(false); // Hide dialog
        setGameView('welcome');      // Go to welcome view
    };

    const handleCancelPortal = () => {
        setShowPortalConfirm(false); // Just hide the dialog
    };

    const handleDeselect = () => {
        deselectTile();
    }
    
    const toggleResourceSidebar = () => {
        setResourceSidebarOpen(!isResourceSidebarOpen);
    };

    // --- Task Handling Logic ---
    const handleDeployTask = (taskType: TaskState['type']) => {
        if (selectedTile) {
            const config = getTaskConfig(taskType);
            if (config) {
                // Calculate actual workforce required (reduced for mining operations if tool-fabrication is completed)
                const actualWorkforceRequired = 
                    taskType === 'deploy-mining' && completedProductionProjects.includes('tool-fabrication')
                    ? 2 // Reduced workforce for mining with Advanced Tool Fabrication
                    : config.workforceRequired;
                
                // Immediately deselect the tile to prevent multiple assignments visually
                const tileCopy = { ...selectedTile }; // Create a copy for use in callback/checks
                deselectTile(); // Immediately deselect to prevent further actions on this click

                // Call the store action which now returns a detailed status
                const assignmentResult = assignWorkforceToTask(taskType, tileCopy, actualWorkforceRequired);

                if (assignmentResult === true) {
                    console.log(`Successfully initiated task: ${config.name}`);
                    // Task assigned, UI updated due to deselection
                } else {
                    console.warn(`Failed to initiate task: ${config.name} - Reason: ${assignmentResult}`);
                    let message = 'Cannot start task.';
                    if (assignmentResult === 'insufficient_resources') {
                        message = 'Insufficient resources!';
                    } else if (assignmentResult === 'insufficient_workforce') {
                        message = 'Insufficient workforce!';
                    } else if (assignmentResult === 'tile_occupied' || assignmentResult === 'building_present') {
                        message = 'Location occupied!';
                    } else if (assignmentResult === 'task_type_deploying') {
                        message = 'Task type already deploying!';
                    }

                    // Trigger feedback
                    setFeedbackState({
                        shakingButton: taskType,
                        warningMessage: { type: taskType, message: message }
                    });

                    // Clear feedback after a short duration
                    setTimeout(() => {
                        setFeedbackState({ shakingButton: null, warningMessage: null });
                    }, 1200); // Duration for shake + fade

                    // Re-select the tile since the action failed, use timeout for state consistency
                    if (tileCopy) {
                        setTimeout(() => {
                            useGameStore.getState().selectTile(tileCopy.q, tileCopy.r);
                        }, 50);
                    }
                }
            }
        }
    };

    const handleRecallWorkforce = (taskId: string) => {
        recallWorkforce(taskId);
        // Optional: Give feedback
    };

    const handleInvestigateEvent = (task: TaskState) => {
        console.log("Investigating event for task:", task.id, task.eventDetails);
        // TODO: Set active puzzle state based on eventDetails
        // useGameStore.setState({ activePuzzle: task.eventDetails }); // Example
        setGameView('puzzle');
    }

    // Handle Embodiment Phase 0 button click
    const handleInitiateEmbodiment = () => {
        const showDialogue = useGameStore.getState().showDialogue;
        const hideDialogue = useGameStore.getState().hideDialogue;
        
        // Show the dialogue with mission control avatar
        showDialogue(
            "Initialize Embodiment Phase 0",
            "/Derech/avatars/mission-control.jpg",
            "Mission Control",
            [
                {
                    text: "Postpone",
                    action: () => {
                        hideDialogue();
                    }
                },
                {
                    text: "Enter Now",
                    action: () => {
                        hideDialogue();
                        // Transition to the audio puzzle scene
                        setGameView('puzzle');
                    }
                }
            ]
        );
    };

    // Determine available actions for the selected tile
    const tileActions = useMemo(() => {
        if (!selectedTile) return null;

        // --- Check for Living Dome Action ---
        if (selectedTile.building === 'Living Dome') {
            return (
                <div>
                    <p><strong>Living Area Actions:</strong></p>
                    <button
                        onClick={showLivingDomeWindow} // Call the action from store
                        className={styles.actionButtonSmall}
                    >
                        View Living Projects
                    </button>
                    
                    {/* Display Living Dome Info Panel */}
                    <DomeInfoPanel domeType="living" />
                </div>
            );
        }
        // --- Check for Production Dome Action ---
        if (selectedTile.building === 'Production Dome') {
            return (
                <div>
                    <p><strong>Production Facility Actions:</strong></p>
                    <button
                        onClick={showProductionDomeWindow} // Call the action from store
                        className={styles.actionButtonSmall}
                    >
                        View Production Projects
                    </button>
                    
                    {/* Display Production Dome Info Panel */}
                    <DomeInfoPanel domeType="production" />
                </div>
            );
        }

        // --- Check for Research Dome Action ---
        if (selectedTile.building === 'Research Dome') {
            return (
                <div>
                    <p><strong>Research Facility Actions:</strong></p>
                    <button
                        onClick={showResearchWindow}
                        className={styles.actionButtonSmall}
                    >
                        View Projects
                    </button>
                    
                    {/* Display Research Dome Info Panel */}
                    <DomeInfoPanel domeType="research" />
                </div>
            );
        }
        
        // --- Check for Flow Project Site ---
        if (selectedTile.building === 'Flow Project Site') {
            return (
                <div>
                    <p><strong>Flow Project Site</strong></p>
                    <FlowProjectInfoPanel />
                </div>
            );
        }
        // --- --- 

        const currentTask = selectedTile.taskId ? activeTasks[selectedTile.taskId] : null;

        // If a task is active on this tile
        if (currentTask) {
            let statusDisplay = `Status: ${currentTask.status}`;
            if (currentTask.status === 'deploying') {
                statusDisplay += ` (${Math.floor(currentTask.progress)}%)`;
            } else if (currentTask.status === 'deconstructing') {
                statusDisplay += ` (${Math.floor(currentTask.deconstructProgress || 0)}%)`;
            }

            // Get task configuration to display resource info
            const taskConfig = getTaskConfig(currentTask.type);
            
            // Resource summary for operational buildings
            let resourceSummary = null;
            if (currentTask.status === 'operational' && taskConfig) {
                if (taskConfig.resourceYield) {
                    const resourceType = taskConfig.resourceYield.resource;
                    const baseAmount = taskConfig.resourceYield.baseAmount;
                    
                    // Calculate the actual resource generation with bonuses
                    const generatedAmount = calculateResourceGeneration(
                        currentTask.type, 
                        resourceType, 
                        baseAmount, 
                        completedResearch, 
                        useGameStore.getState().completedProductionProjects,
                        selectedTile.type === 'Mountain' ? { type: selectedTile.type, height: selectedTile.height } : undefined
                    );
                    
                    // Calculate power consumption if any
                    let powerConsumption = 0;
                    if (taskConfig.powerConsumption) {
                        powerConsumption = calculatePowerConsumption(
                            currentTask.type,
                            taskConfig.powerConsumption,
                            useGameStore.getState().completedProductionProjects,
                            selectedTile.type === 'Mountain' ? { type: selectedTile.type, height: selectedTile.height } : undefined
                        );
                    }
                    
                    // Create resource icon based on type
                    let resourceIcon = '';
                    switch (resourceType) {
                        case 'power': resourceIcon = '⚡'; break;
                        case 'water': resourceIcon = '💧'; break;
                        case 'minerals': resourceIcon = '⛏️'; break;
                        case 'researchPoints': resourceIcon = '🔬'; break;
                        case 'colonyGoods': resourceIcon = '📦'; break;
                    }
                    
                    resourceSummary = (
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            <p style={{ margin: '0 0 4px 0' }}><strong>Resource Summary:</strong></p>
                            <p style={{ margin: '0 0 4px 0' }}>Generates: +{generatedAmount} {resourceIcon}</p>
                            {powerConsumption > 0 && (
                                <p style={{ margin: '0' }}>Costs: {powerConsumption} ⚡</p>
                            )}
                        </div>
                    );
                }
            }

            return (
                <div className={styles.actionsContainer}>
                    <p><strong>Active Task:</strong> {
                        currentTask.status === 'operational' || currentTask.status === 'shutdown' || currentTask.status === 'deconstructing'
                            ? `Working in ${getTaskConfig(currentTask.type)?.name.replace(/(Deploy|Establish|Construct)\s+/, '')}`
                            : getTaskConfig(currentTask.type)?.name
                    }</p>
                    <p>{statusDisplay}</p>
                    {resourceSummary}
                    {currentTask.status === 'event-pending' && (
                         <button onClick={() => handleInvestigateEvent(currentTask)} className={styles.actionButtonSmall}>
                            Investigate Event
                         </button>
                    )}
                    {(currentTask.status === 'operational' || currentTask.status === 'deploying' || currentTask.status === 'event-pending') && (
                        <button onClick={() => handleRecallWorkforce(currentTask.id)} className={`${styles.actionButtonSmall} ${styles.deselectButton}`}>
                            <div className={styles.taskButtonContent}>
                                <span className={styles.taskButtonName}>Deconstruct</span>
                                <span className={styles.taskButtonCost}>
                                    {currentTask.type === 'deploy-mining' && completedProductionProjects.includes('tool-fabrication')
                                        ? '👷'.repeat(2) // Show 2 workers for mining operations with Advanced Tool Fabrication
                                        : '👷'.repeat(currentTask.assignedWorkforce)
                                    }
                                </span>
                            </div>
                        </button>
                    )}
                    {currentTask.status === 'deconstructing' && (
                        <p className={styles.infoText}>
                            Deconstructing... ({Math.floor(currentTask.deconstructProgress || 0)}% complete)
                        </p>
                    )}
                </div>
            );
        }

        // If no task active, check for possible tasks
        const possibleTasks = Object.values(taskConfigs).filter(config =>
            config.targetTileType.includes(selectedTile.type)
        );

        if (possibleTasks.length > 0) {
            return (
                <div className={styles.actionsContainer}> {/* Wrap actions */}
                    <p><strong>Available Actions:</strong></p>
                    {possibleTasks.map(config => {
                         const canAffordWorkforce = availableWorkforce >= config.workforceRequired;
                         const canAffordResources =
                            (config.cost.power === undefined || power >= config.cost.power) &&
                            (config.cost.minerals === undefined || minerals >= config.cost.minerals) &&
                            (config.cost.colonyGoods === undefined || colonyGoods >= config.cost.colonyGoods);
                         const hasExistingTask = selectedTile.taskId !== null;
                         const isTaskTypeDeploying = Object.values(activeTasks).some(task =>
                            task.type === config.type &&
                            task.status === 'deploying'
                         );

                         const disabled = !canAffordWorkforce || !canAffordResources || hasExistingTask || isTaskTypeDeploying;
                         let tooltip = '';
                         if (!canAffordWorkforce) tooltip += 'Insufficient workforce. ';
                         if (!canAffordResources) tooltip += 'Insufficient resources. ';
                         if (hasExistingTask) tooltip += 'Tile already has an active task/building. ';
                         if (isTaskTypeDeploying) tooltip += 'Task type deployment already in progress. ';

                        // Check if this button should be shaking
                        const isShaking = feedbackState.shakingButton === config.type;
                        const showWarning = feedbackState.warningMessage?.type === config.type;

                        // Simplified name mapping
                        let simplifiedName = '';
                        switch (config.type) {
                            case 'deploy-scout':
                                simplifiedName = 'Scout Post';
                                break;
                            case 'build-solar':
                                simplifiedName = 'Solar Array';
                                break;
                            case 'build-geothermal':
                                simplifiedName = 'Geothermal';
                                break;
                            case 'deploy-mining':
                                simplifiedName = 'Mining Op.';
                                break;
                            case 'build-waterwell':
                                simplifiedName = 'Ice Mine';
                                break;
                            default:
                                simplifiedName = config.name.replace(/(Deploy|Establish|Construct)\s+/, '');
                        }

                        // Generate workforce emoji string
                        const workforceEmoji = config.type === 'deploy-mining' && completedProductionProjects.includes('tool-fabrication') 
                            ? '👷'.repeat(2) // Reduced workforce (2) for mining when project is completed
                            : '👷'.repeat(config.workforceRequired);
                        
                        // Generate cost emojis
                        let costIcons = [];
                        if (config.cost.power) costIcons.push(`⚡${config.cost.power}`);
                        if (config.cost.minerals) costIcons.push(`⛏️${config.cost.minerals}`);
                        if (config.cost.colonyGoods) costIcons.push(`📦${config.cost.colonyGoods}`);
                        const costString = costIcons.join(' ');

                        return (
                            <button
                                key={config.type}
                                onClick={() => handleDeployTask(config.type as TaskState['type'])}
                                className={`${styles.actionButtonSmall} ${isShaking ? styles.shake : ''}`}
                                disabled={disabled}
                                title={`${config.name}: ${workforceEmoji} ${costString}\n${tooltip.trim()}`} // Enhanced tooltip
                            >
                                <div className={styles.taskButtonContent}>
                                    <span className={styles.taskButtonName}>{simplifiedName}</span>
                                    <span className={styles.taskButtonCost}>
                                        {workforceEmoji} {costString}
                                    </span>
                                </div>
                                {/* Render warning message */}
                                {showWarning && (
                                    <span className={`${styles.resourceWarning} ${styles.resourceWarningVisible}`}>
                                        {feedbackState.warningMessage?.message}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            );
        }

        return <p>No specific actions available for this tile type.</p>; // No actions

    }, [selectedTile, activeTasks, availableWorkforce, power, minerals, colonyGoods, assignWorkforceToTask, recallWorkforce, setGameView, showResearchWindow, showLivingDomeWindow, showProductionDomeWindow, deselectTile, feedbackState, completedResearch, isAudioPuzzleCompleted, completedProductionProjects]); // Added new dependencies


    return (
        <div className={styles.uiOverlay}>
            {/* Top Bar: Round & Controls Only */}
            <div className={styles.topBar}>
                <div className={styles.roundDisplay}>
                    <span className={styles.roundCounter}>Round: {currentRound}</span>
                    <div className={styles.roundButtonsContainer}>
                        {/* Left Group: Game Controls */}
                        <div className={styles.buttonGroup}>
                            <button onClick={handleEndRound} className={`${styles.actionButton} ${styles.mainActionButton}`}>
                                End Round
                            </button>
                            <button
                                onClick={() => (window as any).toggleFlowWindow?.()}
                                className={`${styles.actionButton} ${styles.flowButton}`}
                                title="View Resource Flow Analytics"
                            >
                                Flow
                            </button>
                        </div>
                        
                        {/* Separator */}
                        <div className={styles.buttonSeparator}></div>
                        
                        {/* Middle Group: Special Actions */}
                        <div className={styles.buttonGroup}>
                            <button 
                                onClick={() => {
                                    // Show confirmation dialogue instead of directly adding resources
                                    useGameStore.getState().showDialogue(
                                        "Add +500 to each of your working resources for testing? This will help you test more advanced colony configurations without waiting for resource accumulation.",
                                        '/Derech/avatars/AiHelper.jpg',
                                        "TEST MODE",
                                        [
                                            {
                                                text: "Cancel",
                                                action: () => {
                                                    useGameStore.getState().hideDialogue();
                                                }
                                            },
                                            {
                                                text: "Proceed",
                                                action: () => {
                                                    // Add resources for testing
                                                    useGameStore.getState().addPower(500);
                                                    useGameStore.getState().addWater(500);
                                                    useGameStore.getState().addMinerals(500);
                                                    // Add more resources
                                                    useGameStore.setState(state => ({
                                                        colonyGoods: state.colonyGoods + 500,
                                                        researchPoints: state.researchPoints + 500
                                                    }));
                                                    
                                                    // Close the dialogue
                                                    useGameStore.getState().hideDialogue();
                                                    
                                                    // Show confirmation message
                                                    setTimeout(() => {
                                                        useGameStore.getState().showDialogue(
                                                            "+500 resources added to each category. Use these resources wisely for your experiment.", 
                                                            '/Derech/avatars/AiHelper.jpg',
                                                            "TEST MODE"
                                                        );
                                                    }, 100);
                                                    
                                                    console.log("TEST MODE: Added 500 of each resource");
                                                }
                                            }
                                        ]
                                    );
                                }} 
                                className={`${styles.actionButton} ${styles.testButton}`}
                            >
                                TEST MODE
                            </button>
                            <button onClick={handleGoToWelcome} className={`${styles.actionButton} ${styles.portalButton}`}>
                                PORTAL ROOM
                            </button>
                        </div>
                        
                        {/* Separator */}
                        <div className={styles.buttonSeparator}></div>
                        
                        {/* Right Group: Help and Settings */}
                        <div className={styles.buttonGroup}>
                            <button
                                onClick={showTutorialWindow}
                                className={`${styles.actionButton} ${styles.tutorialButton}`}
                                title="Open Tutorial"
                            >
                                ?
                            </button>
                            <VolumeControl />
                        </div>
                    </div>
                </div>
                
                {/* Resource sidebar toggle button */}
                <button 
                    onClick={toggleResourceSidebar} 
                    className={styles.resourceToggleButton}
                    aria-label="Toggle resource display"
                    style={{ pointerEvents: 'auto' }}
                >
                    {isResourceSidebarOpen ? '→' : '←'} Resources
                </button>
            </div>
            
            {/* Status Display */}
            <StatusDisplay />
            
            {/* Collapsible Resource Sidebar */}
            <div 
                className={`${styles.resourceSidebar} ${isResourceSidebarOpen ? styles.resourceSidebarOpen : ''}`}
                style={{ pointerEvents: 'auto' }}
            >
                <div className={styles.resourceDisplay}>
                    <div className={styles.resourceItem}>
                        <span className={styles.resourceIcon}>⚡</span>
                        <span className={styles.resourceLabel}>Power:</span>
                        <span className={styles.resourceValue}>{Math.floor(power)}</span>
                        {renderTrendIndicator(resourceTrends.power)}
                    </div>
                    
                    <div className={styles.resourceItem}>
                        <span className={styles.resourceIcon}>💧</span>
                        <span className={styles.resourceLabel}>Water:</span>
                        <span className={styles.resourceValue}>{Math.floor(water)}</span>
                        {renderTrendIndicator(resourceTrends.water)}
                    </div>
                    
                    <div className={styles.resourceItem}>
                        <span className={styles.resourceIcon}>⛏️</span>
                        <span className={styles.resourceLabel}>Minerals:</span>
                        <span className={styles.resourceValue}>{Math.floor(minerals)}</span>
                        {renderTrendIndicator(resourceTrends.minerals)}
                    </div>
                    
                    <div className={styles.resourceItem}>
                        <span className={styles.resourceIcon}>📦</span>
                        <span className={styles.resourceLabel}>Goods:</span>
                        <span className={styles.resourceValue}>{Math.floor(colonyGoods)}</span>
                        {renderTrendIndicator(resourceTrends.colonyGoods)}
                    </div>
                    
                    <div className={styles.resourceItem}>
                        <span className={styles.resourceIcon}>🔬</span>
                        <span className={styles.resourceLabel}>RP:</span>
                        <span className={styles.resourceValue}>{Math.floor(researchPoints)}</span>
                        {renderTrendIndicator(resourceTrends.researchPoints)}
                    </div>
                    
                    <div className={styles.resourceDivider}></div>
                    
                    <div className={styles.resourceItem}>
                        <span className={styles.resourceIcon}>🧑‍🤝‍🧑</span>
                        <span className={styles.resourceLabel}>Population:</span>
                        <span className={styles.resourceValue}>{population}</span>
                    </div>
                    
                    <div className={styles.resourceItem}>
                        <span className={styles.resourceIcon}>👷</span>
                        <span className={styles.resourceLabel}>Workforce:</span>
                        <span className={styles.resourceValue}>{availableWorkforce} / {totalWorkforce}</span>
                    </div>
                </div>
            </div>

            {/* Bottom/Side Panel: Selected Tile Info & Actions */}
            {selectedTile && (
                <div className={styles.selectedTileInfo}>
                    <h4>Selected Tile ({selectedTile.q}, {selectedTile.r})</h4>
                    <p>Type: {selectedTile.type} {selectedTile.type === 'Mountain' ? `(H: ${selectedTile.height})` : ''}</p>
                    <p>Building: {selectedTile.building || 'None'}</p>
                    {/* --- Render Tile Actions --- */}
                    {tileActions}
                    {/* --- --- */}
                    <hr style={{margin: '1rem 0 0.75rem', borderColor: '#555'}}/> {/* Separator */}
                    <button onClick={handleDeselect} className={`${styles.actionButtonSmall} ${styles.deselectButton}`}>
                        <div className={styles.taskButtonContent}>
                            <span className={styles.taskButtonName}>Deselect</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Render Confirmation Dialog Conditionally */}
            <ConfirmationDialog
                isVisible={showPortalConfirm}
                message="Want to enter the Portal Room?"
                onConfirm={handleConfirmPortal}
                onCancel={handleCancelPortal}
            />

            {/* Emergency Decisions Component */}
            <EmergencyDecisions />

            {/* Other UI elements like event popups can go here */}
        </div>
    );
};

export default ManagementUI; 