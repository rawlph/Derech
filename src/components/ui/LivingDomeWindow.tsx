import React, { useState } from 'react';
import styles from '@styles/LivingDomeWindow.module.css'; // Use the new CSS module
import { LivingAreaProject, getAvailableLivingAreaProjects, checkPrerequisites } from '@config/livingAreaProjects'; // Import living area config
import { useGameStore } from '@store/store';

interface LivingDomeWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path (replace with your actual image in /public)
const headerImagePath = '/Derech/placeholders/living_dome_header.png'; // Needs creation

const LivingDomeWindow: React.FC<LivingDomeWindowProps> = ({ isVisible, onClose }) => {
    const { 
        completedLivingProjects, 
        activeLivingProject, 
        startLivingProject, 
        power,
        minerals,
        colonyGoods,
        researchPoints,
        completedResearch
    } = useGameStore(state => ({
        completedLivingProjects: state.completedLivingProjects,
        activeLivingProject: state.activeLivingProject,
        startLivingProject: state.startLivingProject,
        power: state.power,
        minerals: state.minerals,
        colonyGoods: state.colonyGoods,
        researchPoints: state.researchPoints,
        completedResearch: state.completedResearch
    }));
    
    // Add state for the current tier
    const [currentTier, setCurrentTier] = useState<number>(1);
    
    // Get available projects for the current tier
    const availableProjects = getAvailableLivingAreaProjects(completedLivingProjects, currentTier, completedResearch);

    // Debug logging
    console.log("[LivingDomeWindow] completedResearch:", completedResearch);
    console.log("[LivingDomeWindow] isTier2Unlocked:", completedResearch.length >= 3);
    
    // Function to toggle between tiers
    const toggleTier = () => {
        console.log("[LivingDomeWindow] Toggling tier from", currentTier, "to", currentTier === 1 ? 2 : 1);
        setCurrentTier(currentTier === 1 ? 2 : 1);
    };

    const handleStartProject = (project: LivingAreaProject) => {
        console.log("Attempting to start living area project:", project.name);
        if (startLivingProject(project.id)) {
            // Success - project started
            console.log("Living area project started successfully:", project.name);
        } else {
            // Failed to start project
            console.log("Failed to start living area project:", project.name);
        }
    };
    
    const canAffordProject = (project: LivingAreaProject): boolean => {
        if (!project.cost) return true;
        
        return (
            (project.cost.power === undefined || power >= project.cost.power) &&
            (project.cost.minerals === undefined || minerals >= project.cost.minerals) &&
            (project.cost.colonyGoods === undefined || colonyGoods >= project.cost.colonyGoods) &&
            (project.cost.researchPoints === undefined || researchPoints >= project.cost.researchPoints)
        );
    };

    if (!isVisible) {
        return null;
    }

    // Check if tier 2 is unlocked (requires at least 3 completed research projects OR 3 completed living projects)
    const isTier2Unlocked = completedResearch.length >= 3 || completedLivingProjects.length >= 3;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.windowContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>X</button>

                {/* Wrap header image and title in a section div for landscape layout */}
                <div className={styles.headerSection}>
                    <div className={styles.headerImageContainer}>
                        <img src={headerImagePath} alt="Living Dome Banner" className={styles.headerImage} />
                    </div>

                    <h2 className={styles.title}>Living Area Projects</h2>
                </div>
                
                {/* Add tier toggle button */}
                <div className={styles.tierToggle}>
                    {currentTier === 1 ? (
                        <>
                            <button 
                                onClick={toggleTier}
                                className={`${styles.tierButton} ${styles.activeTier}`}
                                disabled={!isTier2Unlocked}
                            >
                                TIER 1
                            </button>
                            {!isTier2Unlocked && (
                                <span className={styles.tierLockHint}>
                                    Complete 3 research or living projects to unlock Tier 2
                                </span>
                            )}
                            {isTier2Unlocked && (
                                <button 
                                    onClick={toggleTier}
                                    className={`${styles.tierButton} ${styles.tier2Button}`}
                                >
                                    View Tier 2
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={toggleTier}
                                className={`${styles.returnButton}`}
                            >
                                ← Return to Tier 1
                            </button>
                            <span className={styles.currentTierIndicator}>
                                Currently viewing: Tier 2 Projects
                            </span>
                        </>
                    )}
                </div>
                
                {/* Main content container for mobile layout control */}
                <div className={styles.mainContentContainer}>
                    {/* Show active project if any */}
                    {activeLivingProject && (
                        <div className={styles.activeProjectSection}>
                            <h3>Current Project: {activeLivingProject.name}</h3>
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressFill} 
                                    style={{ width: `${Math.floor(activeLivingProject.progress)}%` }}
                                />
                            </div>
                            <p>Progress: {Math.floor(activeLivingProject.progress)}% (Started on round {activeLivingProject.startedRound})</p>
                        </div>
                    )}

                    <ul className={styles.projectList}>
                        {availableProjects.length > 0 ? (
                            availableProjects.map((project) => (
                                <li key={project.id} className={styles.projectItem}>
                                    <div className={styles.projectContent}>
                                        <div className={styles.projectDetails}>
                                            <h3 className={styles.projectName}>{project.name}</h3>
                                            <p className={styles.projectDescription}>{project.description}</p>
                                            <p className={styles.projectCost}>
                                                Cost: 
                                                {Object.entries(project.cost).map(([resource, amount], index, arr) => (
                                                    <span key={resource}>
                                                        {` ${amount} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`}
                                                        {index < arr.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                                {project.duration && `, Duration: ${project.duration} Rounds`}
                                            </p>
                                            <p className={styles.effectDescription}>
                                                <strong>Effect:</strong> {project.effectDescription}
                                            </p>
                                            {project.prerequisites && project.prerequisites.length > 0 && (
                                                <p className={styles.prerequisitesNote}>
                                                    <strong>Prerequisites:</strong> {
                                                        project.prerequisites.includes('__ANY_THREE_RESEARCH__')
                                                            ? 'Any three completed research or living projects'
                                                            : project.prerequisites.map(prereq => {
                                                                // Find the prerequisite project (either in living or other project types)
                                                                const livingProject = Object.values(getAvailableLivingAreaProjects([], 1)).find(p => p.id === prereq) ||
                                                                                  Object.values(getAvailableLivingAreaProjects([], 2)).find(p => p.id === prereq);
                                                                return livingProject ? livingProject.name : prereq;
                                                            }).join(', ')
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className={styles.buttonContainer}>
                                            <button
                                                className={styles.startButton}
                                                onClick={() => handleStartProject(project)}
                                                disabled={
                                                    activeLivingProject !== null || 
                                                    !canAffordProject(project) ||
                                                    (project.prerequisites && project.prerequisites.length > 0 && !checkPrerequisites(project, completedLivingProjects, completedResearch))
                                                }
                                            >
                                                Start Project
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <p className={styles.noProjectsMessage}>
                                {currentTier === 1 
                                    ? "No living area projects currently available." 
                                    : (isTier2Unlocked 
                                        ? "No Tier 2 living area projects currently available." 
                                        : "Complete 3 research or living projects to unlock Tier 2 projects.")}
                            </p>
                        )}
                    </ul>
                    
                    {/* Display completed projects */}
                    {completedLivingProjects.length > 0 && (
                        <div className={styles.completedProjectsSection}>
                            <h3>Completed Projects</h3>
                            <ul className={styles.completedList}>
                                {completedLivingProjects.map(id => {
                                    // Get the project from all tiers
                                    const project = Object.values(getAvailableLivingAreaProjects([], 1)).find(p => p.id === id) ||
                                                  Object.values(getAvailableLivingAreaProjects([], 2)).find(p => p.id === id);
                                    if (!project) return null;
                                    return (
                                        <li key={id} className={styles.completedItem}>
                                            <div className={styles.projectContent}>
                                                <div className={styles.projectDetails}>
                                                    <h3 className={styles.projectName}>{project.name}</h3>
                                                    <p className={styles.effectDescription}>
                                                        <strong>Effect:</strong> {project.effectDescription}
                                                    </p>
                                                </div>
                                                <div className={styles.buttonContainer}>
                                                    <button className={styles.completedButton}>Finished!</button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LivingDomeWindow; 