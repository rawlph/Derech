import React from 'react';
import styles from '@styles/ProductionDomeWindow.module.css'; // Use the new CSS module
import { ProductionProject, getAvailableProductionProjects } from '@config/productionProjects'; // Import production config
import { useGameStore } from '@store/store';

interface ProductionDomeWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path (replace with your actual image in /public)
const headerImagePath = '/placeholders/production_header.png'; // Needs creation

const ProductionDomeWindow: React.FC<ProductionDomeWindowProps> = ({ isVisible, onClose }) => {
    const { 
        completedProductionProjects, 
        activeProductionProject, 
        startProductionProject, 
        power,
        minerals,
        colonyGoods
    } = useGameStore(state => ({
        completedProductionProjects: state.completedProductionProjects,
        activeProductionProject: state.activeProductionProject,
        startProductionProject: state.startProductionProject,
        power: state.power,
        minerals: state.minerals,
        colonyGoods: state.colonyGoods
    }));
    
    // Filter out completed projects
    const availableProjects = getAvailableProductionProjects(completedProductionProjects);

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
                        <img src={headerImagePath} alt="Production Dome Banner" className={styles.headerImage} />
                    </div>

                    <h2 className={styles.title}>Production Projects</h2>
                </div>
                
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
                                </div>
                                <button
                                    className={styles.startButton}
                                    onClick={() => handleStartProject(project)}
                                    // TODO: Add disabled logic based on resource check
                                    // disabled={!canAfford(project.cost)}
                                >
                                    Start Project
                                </button>
                            </li>
                        ))
                    ) : (
                        <p>No production projects currently available.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ProductionDomeWindow; 