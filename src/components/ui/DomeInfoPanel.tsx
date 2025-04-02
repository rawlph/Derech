import React from 'react';
import { useGameStore } from '@store/store';
import styles from '@styles/DomeInfoPanel.module.css';

interface DomeInfoPanelProps {
  domeType: 'living' | 'research' | 'production';
}

const DomeInfoPanel: React.FC<DomeInfoPanelProps> = ({ domeType }) => {
  const { 
    domeGeneration, 
    population,
    water,
    colonyGoods
  } = useGameStore(state => ({
    domeGeneration: state.domeGeneration,
    population: state.population,
    water: state.water,
    colonyGoods: state.colonyGoods
  }));

  const {
    colonyGoodsCycle,
    colonyGoodsBaseAmount,
    researchCycle,
    researchBaseAmount,
    populationCycle,
    populationGrowthThreshold,
    waterPositive,
    colonyGoodsSufficient
  } = domeGeneration;

  const renderLivingDomeInfo = () => {
    const requiredGoods = population * 2;
    const cyclesRemaining = populationGrowthThreshold - populationCycle;
    
    return (
      <div>
        <h4>Living Dome</h4>
        <div className={styles.infoRow}>
          <div className={styles.resourceLabel}>Population Growth:</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${(populationCycle / populationGrowthThreshold) * 100}%`,
                backgroundColor: (!waterPositive || !colonyGoodsSufficient) ? '#a5514f' : '#4f8ea5' 
              }} 
            />
          </div>
          <div className={styles.cycleValue}>
            {cyclesRemaining > 0 ? `${cyclesRemaining} rounds` : "Ready!"}
          </div>
        </div>
        <div className={styles.conditions}>
          <div className={waterPositive ? styles.conditionMet : styles.conditionFailed}>
            <span className={styles.indicator}>
              {waterPositive ? '✓' : '✗'}
            </span> 
            Water positive: {water > 0 ? 'Yes' : 'No'}
          </div>
          <div className={colonyGoodsSufficient ? styles.conditionMet : styles.conditionFailed}>
            <span className={styles.indicator}>
              {colonyGoodsSufficient ? '✓' : '✗'}
            </span> 
            Colony goods: {colonyGoods} / {requiredGoods} required
          </div>
        </div>
      </div>
    );
  };

  const renderResearchDomeInfo = () => {
    const cyclesRemaining = 4 - researchCycle;
    
    return (
      <div>
        <h4>Research Dome</h4>
        <div className={styles.infoRow}>
          <div className={styles.resourceLabel}>Research Points:</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(researchCycle / 4) * 100}%` }}
            />
          </div>
          <div className={styles.cycleValue}>
            {cyclesRemaining > 0 ? `${cyclesRemaining} rounds` : "Ready!"}
          </div>
        </div>
        <div className={styles.generationInfo}>
          Base generation: +{researchBaseAmount} RP every 4 rounds
        </div>
      </div>
    );
  };

  const renderProductionDomeInfo = () => {
    const cyclesRemaining = 5 - colonyGoodsCycle;
    
    return (
      <div>
        <h4>Production Dome</h4>
        <div className={styles.infoRow}>
          <div className={styles.resourceLabel}>Colony Goods:</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(colonyGoodsCycle / 5) * 100}%` }}
            />
          </div>
          <div className={styles.cycleValue}>
            {cyclesRemaining > 0 ? `${cyclesRemaining} rounds` : "Ready!"}
          </div>
        </div>
        <div className={styles.generationInfo}>
          Base generation: +{colonyGoodsBaseAmount} goods every 5 rounds
        </div>
      </div>
    );
  };

  return (
    <div className={styles.domeInfoPanel}>
      {domeType === 'living' && renderLivingDomeInfo()}
      {domeType === 'research' && renderResearchDomeInfo()}
      {domeType === 'production' && renderProductionDomeInfo()}
    </div>
  );
};

export default DomeInfoPanel; 