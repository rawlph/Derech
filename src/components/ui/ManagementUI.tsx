import { useGameStore, TaskState } from '@store/store';
import styles from '@styles/ManagementUI.module.css'; // Create this CSS module
import { taskConfigs, getTaskConfig } from '@config/tasks'; // Import task configs
import { useMemo } from 'react'; // Import useMemo

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
        assignWorkforceToTask, // Get task action
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
        // --- --- 
    } = useGameStore();

    const handleEndRound = () => {
        endRound();
    };

    const handleGoToWelcome = () => {
        setGameView('welcome');
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
                // Immediately deselect the tile to prevent multiple assignments
                const tileCopy = {...selectedTile}; // Create a copy for use in callback
                deselectTile(); // Immediately deselect to prevent further actions
                
                const success = assignWorkforceToTask(taskType, tileCopy, config.workforceRequired);
                if (success) {
                    console.log(`Successfully initiated task: ${config.name}`);
                    // Task assigned, UI will be updated due to deselection
                } else {
                    console.warn(`Failed to initiate task: ${config.name}`);
                    // Reselect the tile if the assignment failed
                    if (tileCopy) {
                        setTimeout(() => {
                            // Use a timeout to ensure state is consistent
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
                    {/* Add other Living Dome specific actions here later */}
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
                    {/* Add other Production Dome specific actions here later */}
                </div>
            );
        }

        // --- Restore Check for Research Dome Action ---
        if (selectedTile.building === 'Research Dome') {
            return (
                <div>
                    <p><strong>Research Facility Actions:</strong></p>
                    <button
                        onClick={showResearchWindow} // Call the action from store
                        className={styles.actionButtonSmall}
                    >
                        View Projects
                    </button>
                    {/* Add other Research Dome specific actions here later */}
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
                <div>
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
                        <button onClick={() => handleRecallWorkforce(currentTask.id)} className={styles.actionButtonSmall}>
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
                <div>
                    <p><strong>Available Actions:</strong></p>
                    {possibleTasks.map(config => {
                         const canAffordWorkforce = availableWorkforce >= config.workforceRequired;
                         // Basic resource check (can be more detailed)
                         const canAffordResources =
                            (config.cost.power === undefined || power >= config.cost.power) &&
                            (config.cost.minerals === undefined || minerals >= config.cost.minerals) &&
                            (config.cost.colonyGoods === undefined || colonyGoods >= config.cost.colonyGoods);

                         // Check if there's already a task on this tile
                         const hasExistingTask = selectedTile.taskId !== null;
                         
                         // Check if this type of task is already being deployed somewhere
                         const isTaskTypeDeploying = Object.values(activeTasks).some(task => 
                            task.type === config.type && 
                            task.status === 'deploying'
                         );

                         const disabled = !canAffordWorkforce || !canAffordResources || hasExistingTask || isTaskTypeDeploying;
                         let tooltip = '';
                         if (!canAffordWorkforce) tooltip += 'Insufficient workforce. ';
                         if (!canAffordResources) tooltip += 'Insufficient resources. ';
                         if (hasExistingTask) tooltip += 'Tile already has an active task. ';
                         if (isTaskTypeDeploying) tooltip += 'This type of task is already being deployed elsewhere. ';

                        return (
                            <button
                                key={config.type}
                                onClick={() => handleDeployTask(config.type as TaskState['type'])}
                                className={styles.actionButtonSmall}
                                disabled={disabled}
                                title={tooltip.trim()} // Show reason for disabling on hover
                            >
                                {config.name} ({config.workforceRequired} W)
                            </button>
                        );
                    })}
                </div>
            );
        }

        return <p>No specific actions available for this tile type.</p>; // No actions

    }, [selectedTile, activeTasks, availableWorkforce, power, minerals, colonyGoods, assignWorkforceToTask, recallWorkforce, setGameView, showResearchWindow, deselectTile, buildingIssues, showIssueWindow]); // Updated dependencies


    return (
        <div className={styles.uiOverlay}>
            {/* Top Bar: Resources & Round */}
            <div className={styles.topBar}>
                <div className={styles.resourceDisplay}>
                    <span>⚡ Power: {power}</span>
                    <span>💧 Water: {water}</span>
                     <span>⛏️ Minerals: {minerals}</span> {/* Added Minerals */}
                    <span>🧑‍🤝‍🧑 Pop: {population}</span>
                    <span>🔬 RP: {researchPoints}</span>
                    <span>📦 Goods: {colonyGoods}</span>
                    {/* Added Workforce Display */}
                    <span>👷 Wkfc: {availableWorkforce} / {totalWorkforce}</span>
                </div>
                <div className={styles.roundDisplay}>
                    <span>Round: {currentRound}</span>
                    <button onClick={handleEndRound} className={styles.actionButton}>
                        End Round
                    </button>
                    <button onClick={handleGoToWelcome} className={styles.actionButton}>
                        PORTAL ROOM
                    </button>
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
                    <hr style={{margin: '0.5rem 0', borderColor: '#555'}}/> {/* Separator */}
                    <button onClick={handleDeselect} className={styles.actionButtonSmall}>
                        Deselect
                    </button>
                </div>
            )}

            {/* Other UI elements like event popups can go here */}
        </div>
    );
};

export default ManagementUI; 