import React from 'react';
import { useGameStore } from '@store/store';
import styles from '@styles/DomeInfoPanel.module.css'; // Reuse dome info panel styles

interface FlowProjectInfoPanelProps {}

const FlowProjectInfoPanel: React.FC<FlowProjectInfoPanelProps> = () => {
  const { 
    flowPoints,
    embodimentInsight,
    completedResearch,
    isAudioPuzzleCompleted,
    completedLivingProjects,
    completedProductionProjects,
    setGameView
  } = useGameStore(state => ({
    flowPoints: state.flowPoints,
    embodimentInsight: state.embodimentInsight,
    completedResearch: state.completedResearch,
    isAudioPuzzleCompleted: state.isAudioPuzzleCompleted,
    completedLivingProjects: state.completedLivingProjects,
    completedProductionProjects: state.completedProductionProjects,
    setGameView: state.setGameView
  }));

  // Define flow point requirements for each phase (absolute values, not cumulative)
  const flowPointRequirements = [50, 100, 150, 200];
  
  // Max possible phase (0-3 for four phases)
  const maxPhase = 3;
  
  // Determine current phase based on embodiment insight level
  const currentPhase = embodimentInsight;
  
  // Calculate progress percentage for the current phase
  const calculateProgress = () => {
    // Special case: When phase 0 is completed via audio puzzle
    if (isAudioPuzzleCompleted) {
      // Phase 0 is 25% of total progress
      const baseProgress = 25;
      
      // Add progress from completed phases (embodimentInsight)
      // This handles the case where a user has completed phase 0 via the puzzle
      // but hasn't had embodimentInsight incremented yet
      const completedPhasesProgress = Math.max(0, embodimentInsight * 25);
      
      // Calculate progress from any flow points accumulated toward the next phase
      let nextPhaseProgress = 0;
      if (embodimentInsight < maxPhase) {
        const nextPhaseRequirement = flowPointRequirements[embodimentInsight];
        const progressTowardNextPhase = Math.min(flowPoints / nextPhaseRequirement, 1) * 25;
        nextPhaseProgress = progressTowardNextPhase;
      }
      
      // Return max of puzzle completion or phase completion
      return Math.max(baseProgress, completedPhasesProgress + nextPhaseProgress);
    }
    
    // Calculate progress from completed phases
    const completedPhasesProgress = embodimentInsight * 25;
    
    // Calculate progress in current phase
    let currentPhaseProgress = 0;
    if (embodimentInsight < maxPhase) {
      const currentPhaseRequirement = flowPointRequirements[embodimentInsight];
      
      // Calculate progress as a percentage (0-25%) of this phase
      currentPhaseProgress = Math.min(flowPoints / currentPhaseRequirement, 1) * 25;
      
      // Special case: If we have research for phase 0 but haven't run the puzzle yet,
      // limit progress to show we're waiting on the puzzle
      if (embodimentInsight === 0 && 
          completedResearch.includes('embodiment-prelim') && 
          flowPoints >= currentPhaseRequirement &&
          !isAudioPuzzleCompleted) {
        currentPhaseProgress = 24; // Show almost complete (pending puzzle)
      }
    }
    
    // Calculate total progress
    return completedPhasesProgress + currentPhaseProgress;
  };
  
  // Calculate total progress percentage
  const totalProgress = calculateProgress();
  
  // Check requirements for each phase
  const phase0Requirements = {
    hasResearch: completedResearch.includes('embodiment-prelim'),
    hasFlow: flowPoints >= flowPointRequirements[0],
    isCompleted: currentPhase >= 1 || isAudioPuzzleCompleted,
    canProgress: completedResearch.includes('embodiment-prelim') && 
                flowPoints >= flowPointRequirements[0] && 
                !isAudioPuzzleCompleted && 
                currentPhase === 0
  };
  
  const phase1Requirements = {
    hasResearch: completedResearch.includes('embodiment-phase-1'),
    hasFlow: flowPoints >= flowPointRequirements[1],
    isCompleted: currentPhase >= 2,
    canProgress: completedResearch.includes('embodiment-phase-1') && 
                flowPoints >= flowPointRequirements[1] && 
                currentPhase === 1
  };
  
  const phase2Requirements = {
    hasResearch: completedResearch.includes('embodiment-phase-2'),
    hasFlow: flowPoints >= flowPointRequirements[2],
    isCompleted: currentPhase >= 3,
    canProgress: completedResearch.includes('embodiment-phase-2') && 
                flowPoints >= flowPointRequirements[2] && 
                currentPhase === 2
  };
  
  const phase3Requirements = {
    hasResearch: completedResearch.includes('embodiment-phase-3'),
    hasLivingDomeUpgrade: completedLivingProjects.includes('upgrade-living-dome'),
    hasProductionDomeUpgrade: completedProductionProjects.includes('upgrade-production-dome'),
    hasResearchDomeUpgrade: completedResearch.includes('upgrade-research-dome'),
    hasFlow: flowPoints >= flowPointRequirements[3],
    isCompleted: currentPhase >= 4,
    canProgress: completedResearch.includes('embodiment-phase-3') && 
                completedLivingProjects.includes('upgrade-living-dome') &&
                completedProductionProjects.includes('upgrade-production-dome') &&
                completedResearch.includes('upgrade-research-dome') &&
                flowPoints >= flowPointRequirements[3] && 
                currentPhase === 3
  };

  // Custom styles for teal progress bar
  const tealProgressStyle = {
    backgroundColor: '#3cc0b5',
    boxShadow: '0 0 10px rgba(60, 192, 181, 0.5)',
    width: `${totalProgress}%`
  };

  const handlePhaseActivation = () => {
    // Show the dialogue with mission control avatar, just like in Research Dome
    const showDialogue = useGameStore.getState().showDialogue;
    const hideDialogue = useGameStore.getState().hideDialogue;
    
    showDialogue(
      "Initialize Embodiment Phase 0",
      "/Derech/avatars/mission-control.jpg",
      "Mission Control",
      [
        {
          text: "Postpone",
          action: () => {
            hideDialogue();
          }
        },
        {
          text: "Enter Now",
          action: () => {
            hideDialogue();
            // Transition to the audio puzzle scene
            setGameView('puzzle');
          }
        }
      ]
    );
  };

  // Define phase labels
  const getPhaseLabel = (phase: number) => `EMBODIMENT PHASE ${phase}`;
  
  // Get status text
  const getStatusText = () => {
    if (isAudioPuzzleCompleted && embodimentInsight === 0) {
      return `${getPhaseLabel(0)} completed`;
    }
    
    // Calculate the active phase based on flow points and research
    let activePhase = currentPhase;
    
    // If we have enough flow points for the next phase but haven't progressed yet
    // show that we're working on that phase
    for (let i = 0; i <= maxPhase; i++) {
      if (flowPoints >= flowPointRequirements[i]) {
        if (i > activePhase && (
            (i === 0 && completedResearch.includes('embodiment-prelim')) ||
            (i === 1 && completedResearch.includes('embodiment-phase-1')) ||
            (i === 2 && completedResearch.includes('embodiment-phase-2')) ||
            (i === 3 && completedResearch.includes('embodiment-phase-3'))
        )) {
          // We have enough points for a higher phase and its research is complete
          // but haven't activated it yet - show this as the active phase
          activePhase = i;
        }
      } else {
        // If we don't have enough flow points for this phase, stop checking
        break;
      }
    }
    
    // If we haven't officially advanced phases but have enough flow points
    if (activePhase === currentPhase) {
      return `Current Phase: ${getPhaseLabel(currentPhase)}`;
    } else {
      // Special case when we have flow points for next phase but haven't officially progressed
      return `Ready for: ${getPhaseLabel(activePhase)}`;
    }
  };

  return (
    <div className={styles.domeInfoPanel}>
      <h4>Flow Project Status</h4>
      <div className={styles.infoRow}>
        <div className={styles.resourceLabel}>Progress:</div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={tealProgressStyle}
          />
        </div>
        <div className={styles.cycleValue}>
          {Math.round(totalProgress)}%
        </div>
      </div>
      
      <div className={styles.generationInfo}>
        {getStatusText()}
      </div>
      
      <div className={styles.conditions}>
        {currentPhase === 0 && !phase0Requirements.isCompleted && (
          <>
            <div className={styles.flowPointsTracking}>
              <span className={styles.flowLabel}>Flow Accumulation:</span>
              <span className={styles.flowValue}>{flowPoints}/{flowPointRequirements[0]}</span>
            </div>
            <div className={phase0Requirements.hasResearch ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase0Requirements.hasResearch ? '✓' : '✗'}</span>
              <span>Embodiment Phase 0 Research</span>
            </div>
            <div className={phase0Requirements.hasFlow ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase0Requirements.hasFlow ? '✓' : '✗'}</span>
              <span>{flowPointRequirements[0]} Flow Points</span>
            </div>
            {phase0Requirements.canProgress && (
              <button 
                onClick={handlePhaseActivation}
                className={styles.flowPhaseButton}
              >
                {getPhaseLabel(0)}
              </button>
            )}
          </>
        )}
        
        {currentPhase === 1 && !phase1Requirements.isCompleted && (
          <>
            <div className={styles.flowPointsTracking}>
              <span className={styles.flowLabel}>Flow Accumulation:</span>
              <span className={styles.flowValue}>{flowPoints}/{flowPointRequirements[1]}</span>
            </div>
            <div className={phase1Requirements.hasResearch ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase1Requirements.hasResearch ? '✓' : '✗'}</span>
              <span>Embodiment Phase 1 Research</span>
            </div>
            <div className={phase1Requirements.hasFlow ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase1Requirements.hasFlow ? '✓' : '✗'}</span>
              <span>{flowPointRequirements[1]} Flow Points</span>
            </div>
            {phase1Requirements.canProgress && (
              <button 
                onClick={handlePhaseActivation}
                className={styles.flowPhaseButton}
              >
                {getPhaseLabel(1)}
              </button>
            )}
          </>
        )}
        
        {currentPhase === 2 && !phase2Requirements.isCompleted && (
          <>
            <div className={styles.flowPointsTracking}>
              <span className={styles.flowLabel}>Flow Accumulation:</span>
              <span className={styles.flowValue}>{flowPoints}/{flowPointRequirements[2]}</span>
            </div>
            <div className={phase2Requirements.hasResearch ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase2Requirements.hasResearch ? '✓' : '✗'}</span>
              <span>Embodiment Phase 2 Research</span>
            </div>
            <div className={phase2Requirements.hasFlow ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase2Requirements.hasFlow ? '✓' : '✗'}</span>
              <span>{flowPointRequirements[2]} Flow Points</span>
            </div>
            {phase2Requirements.canProgress && (
              <button 
                onClick={handlePhaseActivation}
                className={styles.flowPhaseButton}
              >
                {getPhaseLabel(2)}
              </button>
            )}
          </>
        )}
        
        {currentPhase === 3 && !phase3Requirements.isCompleted && (
          <>
            <div className={styles.flowPointsTracking}>
              <span className={styles.flowLabel}>Flow Accumulation:</span>
              <span className={styles.flowValue}>{flowPoints}/{flowPointRequirements[3]}</span>
            </div>
            <div className={phase3Requirements.hasResearch ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase3Requirements.hasResearch ? '✓' : '✗'}</span>
              <span>Embodiment Phase 3 Research</span>
            </div>
            <div className={phase3Requirements.hasLivingDomeUpgrade ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase3Requirements.hasLivingDomeUpgrade ? '✓' : '✗'}</span>
              <span>Living Dome Upgrade</span>
            </div>
            <div className={phase3Requirements.hasProductionDomeUpgrade ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase3Requirements.hasProductionDomeUpgrade ? '✓' : '✗'}</span>
              <span>Production Dome Upgrade</span>
            </div>
            <div className={phase3Requirements.hasResearchDomeUpgrade ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase3Requirements.hasResearchDomeUpgrade ? '✓' : '✗'}</span>
              <span>Research Dome Upgrade</span>
            </div>
            <div className={phase3Requirements.hasFlow ? styles.conditionMet : styles.conditionFailed}>
              <span className={styles.indicator}>{phase3Requirements.hasFlow ? '✓' : '✗'}</span>
              <span>{flowPointRequirements[3]} Flow Points</span>
            </div>
            {phase3Requirements.canProgress && (
              <button 
                onClick={handlePhaseActivation}
                className={styles.flowPhaseButton}
              >
                {getPhaseLabel(3)}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FlowProjectInfoPanel; 