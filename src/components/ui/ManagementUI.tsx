import { useGameStore, TaskState } from '@store/store';
import styles from '@styles/ManagementUI.module.css'; // Create this CSS module
import { taskConfigs, getTaskConfig } from '@config/tasks'; // Import task configs
import { useMemo, useState } from 'react'; // Import useMemo and useState
import ConfirmationDialog from './ConfirmationDialog'; // Import the new component
import EmergencyDecisions from './EmergencyDecisions'; // Import the emergency component
import DomeInfoPanel from './DomeInfoPanel'; // Import the dome info component
import VolumeControl from './VolumeControl'; // Import the volume control component

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
        // --- NEW: Import issue actions ---
        buildingIssues,
        showIssueWindow,
        // --- NEW: Import resource trends ---
        resourceTrends,
        // --- --- 
        completedResearch,
        isAudioPuzzleCompleted,
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

    // --- Issue Handling Logic ---
    const handleShowIssue = (issueId: string) => {
        showIssueWindow(issueId);
    }

    // --- Task Handling Logic ---
    const handleDeployTask = (taskType: TaskState['type']) => {
        if (selectedTile) {
            const config = getTaskConfig(taskType);
            if (config) {
                // Immediately deselect the tile to prevent multiple assignments visually
                const tileCopy = { ...selectedTile }; // Create a copy for use in callback/checks
                deselectTile(); // Immediately deselect to prevent further actions on this click

                // Call the store action which now returns a detailed status
                const assignmentResult = assignWorkforceToTask(taskType, tileCopy, config.workforceRequired);

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
            const showEmbodimentButton = completedResearch.includes('embodiment-prelim') && !isAudioPuzzleCompleted;
            
            return (
                <div>
                    <p><strong>Research Facility Actions:</strong></p>
                    <button
                        onClick={showResearchWindow} // Call the action from store
                        className={styles.actionButtonSmall}
                    >
                        View Projects
                    </button>
                    
                    {/* Display Embodiment Phase 0 button when research is completed */}
                    {showEmbodimentButton && (
                        <button
                            onClick={handleInitiateEmbodiment}
                            className={`${styles.actionButtonSmall} ${styles.embodimentButton}`}
                        >
                            EMBODIMENT PHASE 0
                        </button>
                    )}
                    
                    {/* Display Research Dome Info Panel */}
                    <DomeInfoPanel domeType="research" />
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

            // Find any unresolved issues for this building/task
            const unresolved = Object.values(buildingIssues).find(
                issue => issue.buildingId === currentTask.id && !issue.resolved
            );

            return (
                <div className={styles.actionsContainer}>
                    <p><strong>Active Task:</strong> {
                        currentTask.status === 'operational' || currentTask.status === 'shutdown' || currentTask.status === 'deconstructing'
                            ? `Working in ${getTaskConfig(currentTask.type)?.name.replace(/(Deploy|Establish|Construct)\s+/, '')}`
                            : getTaskConfig(currentTask.type)?.name
                    }</p>
                    <p>{statusDisplay}</p>
                    {currentTask.status === 'event-pending' && (
                         <button onClick={() => handleInvestigateEvent(currentTask)} className={styles.actionButtonSmall}>
                            Investigate Event
                         </button>
                    )}
                    {unresolved && (
                        <button 
                            onClick={() => handleShowIssue(unresolved.id)} 
                            className={styles.actionButtonSmall}
                            style={{ backgroundColor: '#FF6B4A' }} // Orangish to highlight the issue
                        >
                            Issues
                        </button>
                    )}
                    {(currentTask.status === 'operational' || currentTask.status === 'deploying' || currentTask.status === 'event-pending') && (
                        <button onClick={() => handleRecallWorkforce(currentTask.id)} className={`${styles.actionButtonSmall} ${styles.deselectButton}`}>
                            Deconstruct ({currentTask.assignedWorkforce} W)
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

                        return (
                            <button
                                key={config.type}
                                onClick={() => handleDeployTask(config.type as TaskState['type'])}
                                className={`${styles.actionButtonSmall} ${isShaking ? styles.shake : ''}`}
                                disabled={disabled}
                                title={tooltip.trim()} // Show reason for disabling on hover
                            >
                                {config.name} ({config.workforceRequired} W)
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

    }, [selectedTile, activeTasks, availableWorkforce, power, minerals, colonyGoods, assignWorkforceToTask, recallWorkforce, setGameView, showResearchWindow, showLivingDomeWindow, showProductionDomeWindow, deselectTile, buildingIssues, showIssueWindow, feedbackState, completedResearch, isAudioPuzzleCompleted]); // Added new dependencies


    return (
        <div className={styles.uiOverlay}>
            {/* Top Bar: Resources & Round */}
            <div className={styles.topBar}>
                <div className={styles.resourceDisplay}>
                    <span>⚡ Power: {power}{renderTrendIndicator(resourceTrends.power)}</span>
                    <span>💧 Water: {water}{renderTrendIndicator(resourceTrends.water)}</span>
                    <span>⛏️ Minerals: {minerals}{renderTrendIndicator(resourceTrends.minerals)}</span>
                    <span>🧑‍🤝‍🧑 Pop: {population}</span>
                    <span>🔬 RP: {researchPoints}{renderTrendIndicator(resourceTrends.researchPoints)}</span>
                    <span>📦 Goods: {colonyGoods}{renderTrendIndicator(resourceTrends.colonyGoods)}</span>
                    {/* Added Workforce Display */}
                    <span>👷 Wkfc: {availableWorkforce} / {totalWorkforce}</span>
                </div>
                <div className={styles.roundDisplay}>
                    <span className={styles.roundCounter}>Round: {currentRound}</span>
                    <div className={styles.roundButtons}>
                        <button onClick={handleEndRound} className={styles.actionButton}>
                            End Round
                        </button>
                        <button onClick={handleGoToWelcome} className={`${styles.actionButton} ${styles.portalButton}`}>
                            PORTAL ROOM
                        </button>
                        <button 
                            onClick={() => {
                                // Add resources for testing
                                useGameStore.getState().addPower(500);
                                useGameStore.getState().addWater(500);
                                useGameStore.getState().addMinerals(500);
                                // Need to add these resources too
                                useGameStore.setState(state => ({
                                    colonyGoods: state.colonyGoods + 500,
                                    researchPoints: state.researchPoints + 500
                                }));
                                
                                // Show dialogue message
                                useGameStore.getState().showDialogue(
                                    "For your simulation, we've added +500 to each of your working resources. This should help you test more advanced colony configurations without waiting for resource accumulation.", 
                                    '/Derech/avatars/AiHelper.jpg'
                                );
                                
                                console.log("TEST MODE: Added 500 of each resource");
                            }} 
                            className={`${styles.actionButton} ${styles.testButton}`}
                        >
                            TEST MODE
                        </button>
                        <VolumeControl />
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
                        Deselect
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