import React, { useState } from 'react';
import styles from '@styles/ProductionDomeWindow.module.css'; // Use the new CSS module
import { ProductionProject, getAvailableProductionProjects, checkPrerequisites } from '@config/productionProjects'; // Import production config
import { useGameStore } from '@store/store';

interface ProductionDomeWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path (replace with your actual image in /public)
const headerImagePath = '/Derech/placeholders/production_header.png'; // Needs creation

const ProductionDomeWindow: React.FC<ProductionDomeWindowProps> = ({ isVisible, onClose }) => {
    const { 
        completedProductionProjects, 
        activeProductionProject, 
        startProductionProject, 
        power,
        minerals,
        colonyGoods,
        researchPoints,
        completedResearch
    } = useGameStore(state => ({
        completedProductionProjects: state.completedProductionProjects,
        activeProductionProject: state.activeProductionProject,
        startProductionProject: state.startProductionProject,
        power: state.power,
        minerals: state.minerals,
        colonyGoods: state.colonyGoods,
        researchPoints: state.researchPoints,
        completedResearch: state.completedResearch
    }));
    
    // Add state for the current tier
    const [currentTier, setCurrentTier] = useState<number>(1);
    
    // Get available projects for the current tier
    const availableProjects = getAvailableProductionProjects(completedProductionProjects, currentTier, completedResearch);

    // Debug logging
    console.log("[ProductionDomeWindow] completedResearch:", completedResearch);
    console.log("[ProductionDomeWindow] isTier2Unlocked:", completedResearch.length >= 3);
    
    // Function to toggle between tiers
    const toggleTier = () => {
        console.log("[ProductionDomeWindow] Toggling tier from", currentTier, "to", currentTier === 1 ? 2 : 1);
        setCurrentTier(currentTier === 1 ? 2 : 1);
    };

    const handleStartProject = (project: ProductionProject) => {
        console.log("Attempting to start production project:", project.name);
        if (startProductionProject(project.id)) {
            // Success - project started
            console.log("Production project started successfully:", project.name);
        } else {
            // Failed to start project
            console.log("Failed to start production project:", project.name);
        }
    };
    
    const canAffordProject = (project: ProductionProject): boolean => {
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

    // Check if tier 2 is unlocked (requires at least 3 completed research projects OR 3 completed production projects)
    const isTier2Unlocked = completedResearch.length >= 3 || completedProductionProjects.length >= 3;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.windowContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>X</button>

                {/* Wrap header image and title in a section div for landscape layout */}
                <div className={styles.headerSection}>
                    <div className={styles.headerImageContainer}>
                        <img src={headerImagePath} alt="Production Dome Banner" className={styles.headerImage} />
                    </div>

                    <h2 className={styles.title}>Production Projects</h2>
                    
                    {/* Tier toggle button now inside headerSection */}
                    <div className={styles.tierToggle}>
                        {currentTier === 1 ? (
                            <>
                                <button 
                                    onClick={toggleTier}
                                    className={`${styles.tierButton} ${styles.tier2Button}`}
                                    disabled={!isTier2Unlocked}
                                >
                                    View Tier 2 Projects
                                </button>
                                {!isTier2Unlocked && (
                                    <div className={styles.tierLockMessage}>
                                        Complete 3 projects first
                                    </div>
                                )}
                            </>
                        ) : (
                            <button 
                                onClick={toggleTier}
                                className={`${styles.returnButton}`}
                            >
                                ← Return to Tier 1
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Main content container for mobile layout control */}
                <div className={styles.mainContentContainer}>
                    {/* Show active project if any */}
                    {activeProductionProject && (
                        <div className={styles.activeProjectSection}>
                            <h3>Current Project: {activeProductionProject.name}</h3>
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressFill} 
                                    style={{ width: `${Math.floor(activeProductionProject.progress)}%` }}
                                />
                            </div>
                            <p>Progress: {Math.floor(activeProductionProject.progress)}% (Started on round {activeProductionProject.startedRound})</p>
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
                                                            ? 'Any three completed research or production projects'
                                                            : project.prerequisites.map(prereq => {
                                                                // Find the prerequisite project (either in production or other project types)
                                                                const productionProject = Object.values(getAvailableProductionProjects([], 1)).find(p => p.id === prereq) ||
                                                                                  Object.values(getAvailableProductionProjects([], 2)).find(p => p.id === prereq);
                                                                return productionProject ? productionProject.name : prereq;
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
                                                    activeProductionProject !== null || 
                                                    !canAffordProject(project) ||
                                                    (project.prerequisites && project.prerequisites.length > 0 && !checkPrerequisites(project, completedProductionProjects, completedResearch))
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
                                    ? "No production projects currently available." 
                                    : (isTier2Unlocked 
                                        ? "No Tier 2 production projects currently available." 
                                        : "Complete 3 research or production projects to unlock Tier 2 projects.")}
                            </p>
                        )}
                    </ul>
                    
                    {/* Display completed projects */}
                    {completedProductionProjects.length > 0 && (
                        <div className={styles.completedProjectsSection}>
                            <h3>Completed Projects</h3>
                            <ul className={styles.completedList}>
                                {completedProductionProjects.map(id => {
                                    // Get the project from all tiers
                                    const project = Object.values(getAvailableProductionProjects([], 1)).find(p => p.id === id) ||
                                                  Object.values(getAvailableProductionProjects([], 2)).find(p => p.id === id);
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

export default ProductionDomeWindow; 