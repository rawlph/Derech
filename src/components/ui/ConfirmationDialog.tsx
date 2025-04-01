import React from 'react';
import styles from '@styles/ConfirmationDialog.module.css'; // We'll create this next

interface ConfirmationDialogProps {
  isVisible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isVisible,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isVisible) {
    return null;
  }

  // Prevent clicks inside the dialog from propagating to the overlay
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.overlay} onClick={onCancel}> {/* Cancel on overlay click */}
      <div className={styles.dialogBox} onClick={handleDialogClick}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttonContainer}>
          <button onClick={onConfirm} className={`${styles.button} ${styles.confirmButton}`}>
            Yes
          </button>
          <button onClick={onCancel} className={`${styles.button} ${styles.cancelButton}`}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 