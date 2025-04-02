import React, { useState } from 'react';
import { useGameStore } from '@store/store';
import styles from '@styles/EmergencyDecisions.module.css';

const EmergencyDecisions: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { power, water, emergencyResetColony } = useGameStore(state => ({
    power: state.power,
    water: state.water,
    emergencyResetColony: state.emergencyResetColony
  }));

  // Only show if both power and water are negative
  const shouldShow = power < 0 && water < 0;
  
  if (!shouldShow) return null;

  const handleToggleMenu = () => {
    setIsExpanded(prev => !prev);
  };

  const handleEmergencyReset = () => {
    if (window.confirm('WARNING: This will dismantle all buildings and reset your resources. Continue?')) {
      emergencyResetColony();
      setIsExpanded(false);
    }
  };

  return (
    <div className={styles.emergencyContainer}>
      {!isExpanded ? (
        <button 
          className={styles.emergencyButton}
          onClick={handleToggleMenu}
        >
          Emergency Decisions
        </button>
      ) : (
        <div className={styles.emergencyMenu}>
          <div className={styles.emergencyHeader}>
            <h3>Emergency Decisions</h3>
            <button 
              className={styles.closeButton} 
              onClick={handleToggleMenu}
            >
              ×
            </button>
          </div>
          <div className={styles.emergencyOptions}>
            <div className={styles.emergencyOption}>
              <div className={styles.optionText}>
                <h4>Colony Reset</h4>
                <p>Deconstruct all buildings, resetting minerals to 20, power to 100, water to 100, colony goods to 20.</p>
              </div>
              <button 
                className={styles.resetButton}
                onClick={handleEmergencyReset}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyDecisions; 