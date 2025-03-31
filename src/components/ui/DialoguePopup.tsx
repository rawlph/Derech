import React from 'react';
import styles from '@styles/DialoguePopup.module.css'; // We'll create this next

interface DialoguePopupProps {
    isVisible: boolean;
    message: string;
    avatarSrc?: string; // Optional image source for the avatar
    onClose?: () => void; // Optional callback for closing the popup
    avatarAlt?: string; // Alt text for avatar image
}

const DialoguePopup: React.FC<DialoguePopupProps> = ({
    isVisible,
    message,
    avatarSrc,
    onClose,
    avatarAlt = 'Avatar'
}) => {
    if (!isVisible) {
        return null; // Don't render anything if not visible
    }

    return (
        <div className={styles.overlay} onClick={onClose}> {/* Full screen overlay to handle clicks outside */}
            <div className={styles.popupContainer} onClick={(e) => e.stopPropagation()}> {/* Prevent click closing when clicking inside */}
                {avatarSrc && (
                    <div className={styles.avatarContainer}>
                        <img src={avatarSrc} alt={avatarAlt} className={styles.avatarImage} />
                    </div>
                )}
                {/* If no avatar, add a placeholder div to maintain layout consistency? Or adjust layout */}
                {!avatarSrc && <div className={styles.avatarPlaceholder}></div>}

                <div className={styles.messageContent}>
                    <p>{message}</p>
                    {/* Optionally add a small indicator or button for closing/continuing */}
                    {onClose && (
                         <button className={styles.closeButton} onClick={onClose}>
                            &gt; {/* Simple indicator */}
                         </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DialoguePopup; 