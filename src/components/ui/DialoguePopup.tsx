import React, { useState } from 'react';
import styles from '@styles/DialoguePopup.module.css';
import welcomeStyles from '@styles/WelcomeScene.module.css';

interface DialogueChoice {
  text: string;
  action: () => void;
}

interface DialoguePopupProps {
    isVisible: boolean;
    message: string;
    avatarSrc?: string; // Optional image source for the avatar
    onClose?: () => void; // Optional callback for closing the popup
    avatarAlt?: string; // Alt text for avatar image
    speakerName?: string; // Optional name of the speaker
    choices?: DialogueChoice[]; // Optional array of dialogue choices
}

const DialoguePopup: React.FC<DialoguePopupProps> = ({
    isVisible,
    message,
    avatarSrc,
    onClose,
    avatarAlt = 'Avatar',
    speakerName,
    choices
}) => {
    // Add state to track first click
    const [firstClickMade, setFirstClickMade] = useState(false);

    if (!isVisible) {
        // Reset the click state when the dialog is hidden
        if (firstClickMade) {
            setFirstClickMade(false);
        }
        return null; // Don't render anything if not visible
    }

    // Determine character based on avatar path
    const isEngineer = avatarSrc?.includes('engineer');
    const isCC = avatarSrc?.includes('cc');
    
    // Special styling for character dialogue
    let containerClassName = styles.popupContainer;
    let containerStyle = {};
    
    if (isEngineer) {
        containerClassName = `${styles.popupContainer} ${welcomeStyles.dialogueEngineer}`;
    } else if (isCC) {
        containerClassName = `${styles.popupContainer} ${welcomeStyles.dialogueCC}`;
    }

    // Determine if this is a critical dialogue (with choices)
    const hasCriticalChoices = choices && choices.length > 0;
    
    // Handle overlay click - implement two-click dismissal
    const handleOverlayClick = (e: React.MouseEvent) => {
        // If critical choices present, don't close on overlay click
        if (hasCriticalChoices) {
            e.stopPropagation();
            return;
        }
        
        // If no close handler, do nothing
        if (!onClose) {
            e.stopPropagation();
            return;
        }
        
        if (!firstClickMade) {
            // First click - just set the state
            setFirstClickMade(true);
        } else {
            // Second click - actually close
            setFirstClickMade(false);
            onClose();
        }
        
        // Prevent click from propagating
        e.stopPropagation();
    };

    // Handle direct close button click - always single click
    const handleCloseButtonClick = () => {
        if (onClose) {
            setFirstClickMade(false);
            onClose();
        }
    };

    // Calculate overlay class based on state
    const overlayClass = isEngineer || isCC 
        ? '' 
        : (hasCriticalChoices 
            ? styles.overlayProtected 
            : firstClickMade 
                ? styles.overlayFirstClick 
                : styles.overlay);

    return (
        <div 
            className={overlayClass} 
            onClick={handleOverlayClick}
            style={{position: 'fixed', zIndex: 1000, pointerEvents: 'auto'}}
        > 
            <div 
                className={containerClassName}
                onClick={(e) => e.stopPropagation()}
            >
                {avatarSrc && (
                    <div className={styles.avatarContainer}>
                        <img src={avatarSrc} alt={avatarAlt} className={styles.avatarImage} />
                    </div>
                )}
                {!avatarSrc && <div className={styles.avatarPlaceholder}></div>}

                <div className={styles.messageContent}>
                    {speakerName && (
                        <div className={styles.speakerName}>{speakerName}</div>
                    )}
                    <p>{message}</p>
                    
                    {choices && choices.length > 0 ? (
                        <div className={styles.choicesContainer}>
                            {choices.map((choice, index) => (
                                <button 
                                    key={index} 
                                    className={styles.choiceButton}
                                    onClick={choice.action}
                                >
                                    {choice.text}
                                </button>
                            ))}
                        </div>
                    ) : onClose && (
                        <button className={styles.closeButton} onClick={handleCloseButtonClick}>
                            &gt;
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DialoguePopup; 