import React, { useState } from 'react';
import styles from '@styles/ResearchWindow.module.css'; // Create this CSS module next
import { ResearchProject, getAvailableResearch } from '@config/research';
import { useGameStore } from '@store/store';

interface ResearchWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path (replace with your actual image in /public)
const headerImagePath = '/Derech/placeholders/research_header.png';

const ResearchWindow: React.FC<ResearchWindowProps> = ({ isVisible, onClose }) => {
    const { 
        completedResearch, 
        activeResearch, 
        startResearch, 
        researchPoints 
    } = useGameStore(state => ({
        completedResearch: state.completedResearch,
        activeResearch: state.activeResearch,
        startResearch: state.startResearch,
        researchPoints: state.researchPoints
    }));
    
    // Add state for the current tier
    const [currentTier, setCurrentTier] = useState<number>(1);
    
    // Get available projects for the current tier
    const availableProjects = getAvailableResearch(completedResearch, currentTier);

    // Debug logging
    console.log("[ResearchWindow] completedResearch:", completedResearch);
    console.log("[ResearchWindow] isTier2Unlocked:", completedResearch.length >= 3);
    
    // Function to toggle between tiers
    const toggleTier = () => {
        console.log("[ResearchWindow] Toggling tier from", currentTier, "to", currentTier === 1 ? 2 : 1);
        setCurrentTier(currentTier === 1 ? 2 : 1);
    };

    const handleStartResearch = (project: ResearchProject) => {
        console.log("Attempting to start research:", project.name);
        if (startResearch(project.id)) {
            // Success - research started
            console.log("Research started successfully:", project.name);
        } else {
            // Failed to start research
            console.log("Failed to start research:", project.name);
        }
    };

    if (!isVisible) {
        return null;
    }

    // Check if tier 2 is unlocked (requires at least 3 completed research)
    const isTier2Unlocked = completedResearch.length >= 3;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.windowContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>X</button>

                {/* Wrap header image and title in a section div for landscape layout */}
                <div className={styles.headerSection}>
                    <div className={styles.headerImageContainer}>
                        {/* You'll need to create this placeholder image */}
                        <img src={headerImagePath} alt="Research Banner" className={styles.headerImage} />
                    </div>

                    <h2 className={styles.title}>Research Projects</h2>
                    
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
                                        Complete 3 research projects first
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
                    {/* Show active research if any */}
                    {activeResearch && (
                        <div className={styles.activeResearchSection}>
                            <h3>Current Research: {activeResearch.name}</h3>
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressFill} 
                                    style={{ width: `${Math.floor(activeResearch.progress)}%` }}
                                />
                            </div>
                            <p>Progress: {Math.floor(activeResearch.progress)}% (Started on round {activeResearch.startedRound})</p>
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
                                                Cost: {project.cost.researchPoints || 0} RP
                                                {project.duration && `, Duration: ${project.duration} Rounds`}
                                            </p>
                                            <p className={styles.effectDescription}>
                                                <strong>Effect:</strong> {project.effectDescription}
                                            </p>
                                            {project.prerequisites && project.prerequisites.length > 0 && (
                                                <p className={styles.prerequisitesNote}>
                                                    <strong>Prerequisites:</strong> {
                                                        project.prerequisites.includes('__ANY_THREE_RESEARCH__')
                                                            ? 'Any three completed research projects'
                                                            : project.prerequisites.map(prereq => {
                                                                const prereqProject = Object.values(getAvailableResearch([])).find(p => p.id === prereq);
                                                                return prereqProject ? prereqProject.name : prereq;
                                                            }).join(', ')
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className={styles.buttonContainer}>
                                            <button
                                                className={styles.startButton}
                                                onClick={() => handleStartResearch(project)}
                                                disabled={
                                                    activeResearch !== null || 
                                                    (project.cost.researchPoints || 0) > researchPoints
                                                }
                                            >
                                                Start Research
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <p className={styles.noProjectsMessage}>
                                {currentTier === 1 
                                    ? "No research projects currently available." 
                                    : (isTier2Unlocked 
                                        ? "No Tier 2 research projects currently available." 
                                        : "Complete 3 research projects to unlock Tier 2 research.")}
                            </p>
                        )}
                    </ul>

                    {/* Display completed research */}
                    {completedResearch.length > 0 && (
                        <div className={styles.completedResearchSection}>
                            <h3>Completed Research</h3>
                            <ul className={styles.completedList}>
                                {completedResearch.map(id => {
                                    const project = Object.values(getAvailableResearch([])).find(p => p.id === id);
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

export default ResearchWindow; 