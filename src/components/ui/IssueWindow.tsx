import React, { useState } from 'react';
import styles from '@styles/IssueWindow.module.css';
import { Issue, IssueChoice } from '@config/issues';
import { useGameStore } from '@store/store';

interface IssueWindowProps {
    isVisible: boolean;
    issue: Issue | null;
    onClose: () => void;
    onResolve: (choiceId: string) => void;
}

const IssueWindow: React.FC<IssueWindowProps> = ({ isVisible, issue, onClose, onResolve }) => {
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [showOutcome, setShowOutcome] = useState(false);
    const [outcomeText, setOutcomeText] = useState('');
    
    const { power, water, minerals, researchPoints, colonyGoods } = useGameStore();
    
    if (!isVisible || !issue) {
        return null;
    }
    
    const handleChoiceClick = (choice: IssueChoice) => {
        // Check if the player has enough resources for this choice
        if (choice.cost) {
            const hasEnoughResources = (
                (choice.cost.power === undefined || power >= choice.cost.power) &&
                (choice.cost.water === undefined || water >= choice.cost.water) &&
                (choice.cost.minerals === undefined || minerals >= choice.cost.minerals) &&
                (choice.cost.researchPoints === undefined || researchPoints >= choice.cost.researchPoints) &&
                (choice.cost.colonyGoods === undefined || colonyGoods >= choice.cost.colonyGoods)
            );
            
            if (!hasEnoughResources) {
                // Could show a tooltip or message about insufficient resources
                return;
            }
        }
        
        setSelectedChoice(choice.id);
        setOutcomeText(choice.outcomes.text);
        setShowOutcome(true);
    };
    
    const handleConfirmChoice = () => {
        if (selectedChoice) {
            onResolve(selectedChoice);
            setSelectedChoice(null);
            setShowOutcome(false);
        }
    };
    
    const canAffordChoice = (choice: IssueChoice): boolean => {
        if (!choice.cost) return true;
        
        return (
            (choice.cost.power === undefined || power >= choice.cost.power) &&
            (choice.cost.water === undefined || water >= choice.cost.water) &&
            (choice.cost.minerals === undefined || minerals >= choice.cost.minerals) &&
            (choice.cost.researchPoints === undefined || researchPoints >= choice.cost.researchPoints) &&
            (choice.cost.colonyGoods === undefined || colonyGoods >= choice.cost.colonyGoods)
        );
    };
    
    // Render cost indicator for a choice
    const renderCost = (choice: IssueChoice) => {
        if (!choice.cost) return null;
        
        const costs = [];
        if (choice.cost.power) costs.push(`⚡ ${choice.cost.power}`);
        if (choice.cost.water) costs.push(`💧 ${choice.cost.water}`);
        if (choice.cost.minerals) costs.push(`⛏️ ${choice.cost.minerals}`);
        if (choice.cost.researchPoints) costs.push(`🔬 ${choice.cost.researchPoints}`);
        if (choice.cost.colonyGoods) costs.push(`📦 ${choice.cost.colonyGoods}`);
        
        if (costs.length === 0) return null;
        
        return <span className={styles.choiceCost}>{costs.join(', ')}</span>;
    };
    
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.windowContainer} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>✕</button>
                
                {/* Mobile landscape mode needs different structure */}
                {window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches ? (
                    <>
                        <div className={styles.headerSection}>
                            <div className={styles.headerImageContainer}>
                                {issue.image ? (
                                    <img src={issue.image} alt={issue.title} className={styles.headerImage} />
                                ) : (
                                    <div className={styles.headerImage} style={{ backgroundColor: '#332211' }} />
                                )}
                            </div>
                            <h2 className={styles.title}>{issue.title}</h2>
                        </div>
                        
                        <div className={styles.issueContent}>
                            {!showOutcome ? (
                                <>
                                    <div className={styles.issueDescription}>
                                        {issue.description}
                                    </div>
                                    
                                    <div className={styles.choicesContainer}>
                                        {issue.choices.map((choice) => (
                                            <button
                                                key={choice.id}
                                                className={styles.choiceButton}
                                                onClick={() => handleChoiceClick(choice)}
                                                disabled={!canAffordChoice(choice)}
                                            >
                                                <span className={styles.choiceText}>{choice.text}</span>
                                                {renderCost(choice)}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.issueDescription}>
                                        {outcomeText}
                                    </div>
                                    <button
                                        className={styles.choiceButton}
                                        onClick={handleConfirmChoice}
                                        style={{ marginTop: '20px', textAlign: 'center' }}
                                    >
                                        <span className={styles.choiceText}>Confirm</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.headerImageContainer}>
                            {issue.image ? (
                                <img src={issue.image} alt={issue.title} className={styles.headerImage} />
                            ) : (
                                <div className={styles.headerImage} style={{ backgroundColor: '#332211' }} />
                            )}
                        </div>
                        
                        <h2 className={styles.title}>{issue.title}</h2>
                        
                        <div className={styles.issueContent}>
                            {!showOutcome ? (
                                <>
                                    <div className={styles.issueDescription}>
                                        {issue.description}
                                    </div>
                                    
                                    <div className={styles.choicesContainer}>
                                        {issue.choices.map((choice) => (
                                            <button
                                                key={choice.id}
                                                className={styles.choiceButton}
                                                onClick={() => handleChoiceClick(choice)}
                                                disabled={!canAffordChoice(choice)}
                                            >
                                                <span className={styles.choiceText}>{choice.text}</span>
                                                {renderCost(choice)}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.issueDescription}>
                                        {outcomeText}
                                    </div>
                                    <button
                                        className={styles.choiceButton}
                                        onClick={handleConfirmChoice}
                                        style={{ marginTop: '20px', textAlign: 'center' }}
                                    >
                                        <span className={styles.choiceText}>Confirm</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IssueWindow; 