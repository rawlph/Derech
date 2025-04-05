import React from 'react';
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
    if (!isVisible) {
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
    
    // Handle overlay click - only close if no choices are present
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (!hasCriticalChoices && onClose) {
            onClose();
        }
        // If choices are present, don't close on overlay click
        e.stopPropagation();
    };

    return (
        <div 
            className={isEngineer || isCC ? '' : (hasCriticalChoices ? styles.overlayProtected : styles.overlay)} 
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
                        <button className={styles.closeButton} onClick={onClose}>
                            &gt;
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DialoguePopup; 