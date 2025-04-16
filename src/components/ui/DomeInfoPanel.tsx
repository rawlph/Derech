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
    colonyGoods,
    completedProductionProjects
  } = useGameStore(state => ({
    domeGeneration: state.domeGeneration,
    population: state.population,
    water: state.water,
    colonyGoods: state.colonyGoods,
    completedProductionProjects: state.completedProductionProjects
  }));

  const {
    colonyGoodsCycle,
    colonyGoodsBaseAmount,
    researchCycle,
    researchBaseAmount,
    populationCycle,
    populationGrowthThreshold,
    waterPositive,
    colonyGoodsSufficient,
    storedMinerals
  } = domeGeneration;

  // Calculate colony goods generation rate with bonuses
  const calculateColonyGoodsGeneration = () => {
    let baseAmount = colonyGoodsBaseAmount;
    let bonusPercentage = 0;
    
    // Check for production projects that affect colony goods generation
    if (completedProductionProjects.includes('optimize-assembly')) {
      bonusPercentage += 15; // 15% bonus from Optimized Assembly Line
    }
    
    // Apply bonus if any
    const totalAmount = bonusPercentage > 0 
      ? Math.round((baseAmount * (1 + bonusPercentage / 100)) * 100) / 100 
      : baseAmount;
      
    return { baseAmount, bonusPercentage, totalAmount };
  };

  const renderLivingDomeInfo = () => {
    const growthRequirement = population * 2;
    const baseConsumption = Math.ceil(population / 10);
    const totalRequired = baseConsumption + growthRequirement;
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
                backgroundColor: (!waterPositive || !colonyGoodsSufficient) ? '#a5514f' : '#4fa57b' 
              }} 
            />
          </div>
          <div className={styles.cycleValue}>
            {cyclesRemaining > 0 ? `${cyclesRemaining} rounds` : "Ready!"}
          </div>
        </div>
        
        <div className={styles.mineralsInfo}>
          <div className={styles.consumptionLabel}>
            Colony Goods Requirements:
          </div>
          <div className={styles.consumptionBreakdown}>
            <div>Base consumption: {baseConsumption} per round</div>
            <div>Growth requirement: {growthRequirement}</div>
            <div className={styles.totalRequirement}>
              Total required: {totalRequired} {totalRequired > colonyGoods ? '❌' : '✓'}
            </div>
          </div>
        </div>
        
        <div className={styles.generationInfo}>
          Water status: {waterPositive ? 'Positive ✓' : 'Negative ❌'}
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
          <div className={styles.resourceLabel}>Research:</div>
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
    const { baseAmount, bonusPercentage, totalAmount } = calculateColonyGoodsGeneration();
    
    // Calculate mineral conversion to colony goods
    const mineralConversion = storedMinerals / 10;
    const totalGoodsWithMinerals = Math.round((totalAmount + mineralConversion) * 100) / 100;
    
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
        
        <div className={styles.mineralsInfo}>
          <div className={styles.mineralLabel}>
            ⛏️ Stored Minerals: <span className={styles.mineralValue}>{storedMinerals.toFixed(2)}</span>
          </div>
          {storedMinerals > 0 && (
            <div className={styles.conversionInfo}>
              Will convert to +{mineralConversion.toFixed(2)} colony goods
            </div>
          )}
        </div>
        
        <div className={styles.generationInfo}>
          Base generation: +{baseAmount} goods every 5 rounds
          {bonusPercentage > 0 && (
            <>
              <br/>
              <span className={styles.bonusText}>
                Project bonus: +{bonusPercentage}%
              </span>
            </>
          )}
          {storedMinerals > 0 && (
            <>
              <br/>
              <span className={styles.bonusText}>
                Mineral boost: +{mineralConversion.toFixed(2)}
              </span>
            </>
          )}
          <br/>
          <span className={styles.totalText}>
            Total next harvest: +{totalGoodsWithMinerals} goods
          </span>
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