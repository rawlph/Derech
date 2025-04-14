import React, { useState } from 'react';
import styles from '@styles/TutorialWindow.module.css';
import { useGameStore } from '@store/store';

interface TutorialWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path (replace with your actual image in /public)
const headerImagePath = '/Derech/placeholders/tutorial_header.png';

// Define tutorial sections for organization
const tutorialSections = [
    {
        id: 'basics',
        title: 'Game Basics',
        content: 'Welcome to Derech! This game is a colony management simulation where you need to balance resources and make strategic decisions to help your colony thrive on Mars. Each round represents a day in your colony\'s life.'
    },
    {
        id: 'resources',
        title: 'Resource Management',
        content: 'Your colony needs three main resources to survive: Power, Water, and Minerals. Monitor your resource trends carefully - if any resource falls to zero, your colony will face serious issues.'
    },
    {
        id: 'domes',
        title: 'Dome Management',
        content: 'Your colony consists of three types of domes: Living Domes (where your colonists live), Production Domes (where resources are generated), and Research Facilities (where new technologies are developed).'
    },
    {
        id: 'research',
        title: 'Research & Development',
        content: 'Research new technologies to improve your colony\'s efficiency and capabilities. Each research project requires research points and takes time to complete, but provides valuable benefits.'
    },
    {
        id: 'workforce',
        title: 'Workforce Management',
        content: 'Assign your colonists to different jobs to optimize resource production. Balance is key - you need workers in all areas to maintain a functioning colony.'
    }
];

const TutorialWindow: React.FC<TutorialWindowProps> = ({ isVisible, onClose }) => {
    const [activeSection, setActiveSection] = useState('basics');
    
    if (!isVisible) {
        return null;
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.windowContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>X</button>

                {/* Header section with image and title */}
                <div className={styles.headerSection}>
                    <div className={styles.headerImageContainer}>
                        <img src={headerImagePath} alt="Tutorial Banner" className={styles.headerImage} />
                    </div>

                    <h2 className={styles.title}>Tutorial Guide</h2>
                </div>
                
                {/* Navigation tabs for tutorial sections */}
                <div className={styles.tabsContainer}>
                    {tutorialSections.map(section => (
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
                    {tutorialSections.map(section => (
                        <div 
                            key={section.id} 
                            className={`${styles.tutorialSection} ${activeSection === section.id ? styles.activeSection : ''}`}
                        >
                            <h3 className={styles.sectionTitle}>{section.title}</h3>
                            <div className={styles.sectionContent}>
                                <p>{section.content}</p>
                                
                                {/* Example UI elements for each section - customize as needed */}
                                {section.id === 'resources' && (
                                    <div className={styles.exampleBox}>
                                        <div className={styles.resourceExample}>
                                            <span className={styles.resourceIcon}>⚡</span> Power: Used by all domes and systems
                                        </div>
                                        <div className={styles.resourceExample}>
                                            <span className={styles.resourceIcon}>💧</span> Water: Essential for colonists and farming
                                        </div>
                                        <div className={styles.resourceExample}>
                                            <span className={styles.resourceIcon}>⛏️</span> Minerals: Used for construction and upgrades
                                        </div>
                                    </div>
                                )}
                                
                                {section.id === 'domes' && (
                                    <div className={styles.exampleBox}>
                                        <div className={styles.domeExample}>
                                            <span className={styles.domeIcon}>🏠</span> Living Dome: Houses colonists
                                        </div>
                                        <div className={styles.domeExample}>
                                            <span className={styles.domeIcon}>🏭</span> Production Dome: Generates resources
                                        </div>
                                        <div className={styles.domeExample}>
                                            <span className={styles.domeIcon}>🔬</span> Research Facility: Develops new technologies
                                        </div>
                                    </div>
                                )}

                                {section.id === 'workforce' && (
                                    <div className={styles.exampleBox}>
                                        <p>Colonists can work in these areas:</p>
                                        <ul className={styles.workforceList}>
                                            <li>Power Technicians: Maintain power generation</li>
                                            <li>Water Specialists: Handle water purification and distribution</li>
                                            <li>Miners: Extract and process minerals</li>
                                            <li>Researchers: Work on technological advancements</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TutorialWindow; 