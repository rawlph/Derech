import React, { useState } from 'react';
import styles from '@styles/TutorialWindow.module.css';
import { useGameStore } from '@store/store';

interface TutorialWindowProps {
    isVisible: boolean;
    onClose: () => void;
}

// Placeholder image path (replace with your actual image in /public)
const headerImagePath = '/Derech/placeholders/research_header.png';

// Define tutorial sections for organization
const tutorialSections = [
    {
        id: 'basics',
        title: 'Game Basics',
        content: 'Welcome to Derech! This game is a colony management simulation where you need to balance resources and make strategic decisions to help your colony thrive on Mars. Each round represents a day in your colony\'s life. You accumulate Flow Points throughout the game, which are used in the Flow Project site. Complete the four Embodiment quests to finish the game, after which your performance will be evaluated (not yet implemented).'
    },
    {
        id: 'resources',
        title: 'Resource Management',
        content: 'Your colony needs four main resources to survive: Power, Water, Minerals, and Colony Goods. Monitor your resource trends carefully - if any resource falls to zero, your colony will face serious issues. Colony Goods are consumed every round based on your population size, so ensure you have sufficient production to meet the needs of your growing colony.'
    },
    {
        id: 'domes',
        title: 'Dome Management',
        content: 'Your colony consists of three types of domes: Living Domes (where your colonists live), Production Domes (where resources are generated), and Research Facilities (where new technologies are developed).'
    },
    {
        id: 'research',
        title: 'Research & Development',
        content: 'Research new technologies to improve your colony\'s efficiency and capabilities. You can browse through Living Dome research projects, Research Dome projects, and Production Building projects. Each project category offers unique research rewards and can help re-balance your resources immensely. Projects require research points and take time to complete, but provide valuable benefits that can transform your colony\'s capabilities.'
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
                                        <div className={styles.resourceExample}>
                                            <span className={styles.resourceIcon}>📦</span> Colony Goods: Consumed by colonists each round
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
                                            <li>Power Technicians: Maintain power generation (solar array, geothermal)</li>
                                            <li>Water Specialists: Handle water purification and distribution</li>
                                            <li>Miners: Extract and process minerals</li>
                                            <li>Researchers: Work on technological advancements (scout post)</li>
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