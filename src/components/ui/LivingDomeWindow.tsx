import React from 'react';
import styles from '@styles/LivingDomeWindow.module.css'; // Use the new CSS module
import { LivingAreaProject, getAvailableLivingAreaProjects } from '@config/livingAreaProjects'; // Import living area config
import { useGameStore } from '@store/store';

interface LivingDomeWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path (replace with your actual image in /public)
const headerImagePath = '/placeholders/living_dome_header.png'; // Needs creation

const LivingDomeWindow: React.FC<LivingDomeWindowProps> = ({ isVisible, onClose }) => {
    const { 
        completedLivingProjects, 
        activeLivingProject, 
        startLivingProject, 
        power,
        minerals,
        colonyGoods
    } = useGameStore(state => ({
        completedLivingProjects: state.completedLivingProjects,
        activeLivingProject: state.activeLivingProject,
        startLivingProject: state.startLivingProject,
        power: state.power,
        minerals: state.minerals,
        colonyGoods: state.colonyGoods
    }));
    
    // Filter out completed projects
    const availableProjects = getAvailableLivingAreaProjects(completedLivingProjects);

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
            (project.cost.colonyGoods === undefined || colonyGoods >= project.cost.colonyGoods)
        );
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
                        <img src={headerImagePath} alt="Living Dome Banner" className={styles.headerImage} />
                    </div>

                    <h2 className={styles.title}>Living Area Projects</h2>
                </div>
                
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
                                </div>
                                <button
                                    className={styles.startButton}
                                    onClick={() => handleStartProject(project)}
                                    disabled={
                                        activeLivingProject !== null || 
                                        !canAffordProject(project)
                                    }
                                >
                                    Start Project
                                </button>
                            </li>
                        ))
                    ) : (
                        <p>No living area projects currently available.</p>
                    )}
                </ul>
                
                {/* Display completed projects */}
                {completedLivingProjects.length > 0 && (
                    <div className={styles.completedProjectsSection}>
                        <h3>Completed Projects</h3>
                        <ul className={styles.completedList}>
                            {completedLivingProjects.map(id => {
                                const project = getAvailableLivingAreaProjects([]).find(p => p.id === id);
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

export default LivingDomeWindow; 