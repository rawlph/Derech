import React from 'react';
import styles from '@styles/ResearchWindow.module.css'; // Create this CSS module next
import { ResearchProject, getAvailableResearch } from '@config/research';
import { useGameStore } from '@store/store';

interface ResearchWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path (replace with your actual image in /public)
const headerImagePath = '/placeholders/research_header.png';

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
    
    // Filter out completed research projects
    const availableProjects = getAvailableResearch(completedResearch);

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
                </div>

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
                                </div>
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
                            </li>
                        ))
                    ) : (
                        <p>No research projects currently available.</p>
                    )}
                </ul>

                {/* Display completed research */}
                {completedResearch.length > 0 && (
                    <div className={styles.completedResearchSection}>
                        <h3>Completed Research</h3>
                        <ul className={styles.completedList}>
                            {completedResearch.map(id => {
                                const project = getAvailableResearch([]).find(p => p.id === id);
                                if (!project) return null;
                                return (
                                    <li key={id} className={styles.completedItem}>
                                        <div className={styles.projectDetails}>
                                            <h3 className={styles.projectName}>{project.name}</h3>
                                            <p className={styles.effectDescription}>
                                                <strong>Effect:</strong> {project.effectDescription}
                                            </p>
                                        </div>
                                        <button className={styles.completedButton}>Finished!</button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResearchWindow; 