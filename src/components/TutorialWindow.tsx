import React, { useState } from 'react';
import styles from '../styles/TutorialWindow.module.css';
import { useGameStore } from '../store/store';

export const TutorialWindow: React.FC = () => {
  const hideTutorialWindow = useGameStore((state) => state.hideTutorialWindow);
  const [activeTab, setActiveTab] = useState('basics');

  const handleClose = () => {
    hideTutorialWindow();
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'basics':
        return (
          <div className={`${styles.tutorialSection} ${styles.activeSection}`}>
            <h2 className={styles.sectionTitle}>Game Basics</h2>
            <div className={styles.sectionContent}>
              <p>Welcome to Derech, a Mars colony management simulation. Your goal is to establish and maintain a thriving colony on the Martian surface.</p>
              <p>The game operates on a turn-based system where each action you take advances time. Your decisions will affect the colony's growth, workforce happiness, and resource management.</p>
              
              <div className={styles.exampleBox}>
                <h3>Key Controls:</h3>
                <ul>
                  <li>Use the top navigation for primary controls</li>
                  <li>Click and drag to move around the map</li>
                  <li>Use the sidebar for detailed information and management</li>
                </ul>
              </div>
            </div>
          </div>
        );
      
      case 'resources':
        return (
          <div className={`${styles.tutorialSection} ${styles.activeSection}`}>
            <h2 className={styles.sectionTitle}>Resource Management</h2>
            <div className={styles.sectionContent}>
              <p>Managing resources effectively is crucial for your colony's survival and growth. The main resources to monitor are:</p>
              
              <div className={styles.exampleBox}>
                <div className={styles.resourceExample}>
                  <span className={styles.resourceIcon}>⚡</span>
                  <div>
                    <strong>Power</strong>: Generated from solar panels and used by all buildings and systems.
                  </div>
                </div>
                
                <div className={styles.resourceExample}>
                  <span className={styles.resourceIcon}>💧</span>
                  <div>
                    <strong>Water</strong>: Extracted from ice deposits and essential for life support and farming.
                  </div>
                </div>
                
                <div className={styles.resourceExample}>
                  <span className={styles.resourceIcon}>🔩</span>
                  <div>
                    <strong>Minerals</strong>: Mined from mountains and used for construction and research.
                  </div>
                </div>
              </div>
              
              <p>Each resource has a production and consumption rate. Maintain positive trends to ensure your colony thrives.</p>
            </div>
          </div>
        );
      
      case 'domes':
        return (
          <div className={`${styles.tutorialSection} ${styles.activeSection}`}>
            <h2 className={styles.sectionTitle}>Living Domes</h2>
            <div className={styles.sectionContent}>
              <p>Living Domes are the heart of your colony. They provide habitation for your workforce and contain various facilities.</p>
              
              <div className={styles.exampleBox}>
                <p>Each dome can house different types of workers:</p>
                <ul className={styles.workforceList}>
                  <li><strong>Engineers</strong>: Maintain systems and improve efficiency</li>
                  <li><strong>Scientists</strong>: Research new technologies and improvements</li>
                  <li><strong>Workers</strong>: Handle resource extraction and production</li>
                </ul>
              </div>
              
              <p>Balance your workforce allocation to optimize colony operations and research progress.</p>
            </div>
          </div>
        );
      
      case 'research':
        return (
          <div className={`${styles.tutorialSection} ${styles.activeSection}`}>
            <h2 className={styles.sectionTitle}>Research & Technology</h2>
            <div className={styles.sectionContent}>
              <p>Advancing technology is essential for overcoming Mars' harsh environment and improving colony efficiency.</p>
              
              <p>The research system allows you to:</p>
              <ul>
                <li>Unlock new building types and upgrades</li>
                <li>Improve resource production efficiency</li>
                <li>Enhance life support systems</li>
                <li>Develop automation technologies</li>
              </ul>
              
              <div className={styles.exampleBox}>
                <p>Research projects require:</p>
                <ul>
                  <li>Scientists assigned to the research task</li>
                  <li>Resource investment</li>
                  <li>Time to complete</li>
                </ul>
              </div>
              
              <p>Prioritize research that addresses your colony's most pressing needs.</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.windowContainer}>
        <button className={styles.closeButton} onClick={handleClose}>×</button>
        
        <div className={styles.headerSection}>
          <div className={styles.headerImageContainer}>
            <img 
              src="/Derech/avatars/AiHelper.jpg" 
              alt="Tutorial" 
              className={styles.headerImage}
            />
          </div>
          <h1 className={styles.title}>Tutorial Guide</h1>
        </div>
        
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'basics' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('basics')}
          >
            Game Basics
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'resources' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'domes' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('domes')}
          >
            Living Domes
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'research' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('research')}
          >
            Research
          </button>
        </div>
        
        <div className={styles.mainContentContainer}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}; 