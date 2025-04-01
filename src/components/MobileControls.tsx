import { useEffect, useRef } from 'react'
import nipplejs, { JoystickManager, JoystickOutputData } from 'nipplejs'
import styles from '../styles/MobileControls.module.css'

interface MobileControlsProps {
  onMove?: (data: { x: number; y: number }) => void;
  onLook?: (data: { x: number; y: number }) => void;
}

const MobileControls = ({ onMove, onLook }: MobileControlsProps) => {
  const moveZoneRef = useRef<HTMLDivElement>(null);
  const lookZoneRef = useRef<HTMLDivElement>(null);
  const moveJoystickManagerRef = useRef<JoystickManager | null>(null);
  const lookJoystickManagerRef = useRef<JoystickManager | null>(null);

  useEffect(() => {
    if (!moveZoneRef.current || !lookZoneRef.current) return;

    // --- Define handlers ---
    const handleMove = (_: any, data: JoystickOutputData) => {
      if (onMove && data.vector) {
        onMove({ x: data.vector.x, y: data.vector.y });
      }
    };
    // Store the end handler in a variable
    const handleMoveEnd = () => {
      if (onMove) onMove({ x: 0, y: 0 });
    };

    const handleLook = (_: any, data: JoystickOutputData) => {
      if (onLook && data.vector) {
        onLook({ x: data.vector.x, y: data.vector.y });
      }
    };
    // Store the end handler in a variable
    const handleLookEnd = () => {
      if (onLook) onLook({ x: 0, y: 0 });
    };

    // --- Create Move Joystick (Left) ---
    moveJoystickManagerRef.current = nipplejs.create({
      zone: moveZoneRef.current,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'lightblue',
      size: 100,
      restOpacity: 0.7,
    });

    moveJoystickManagerRef.current.on('move', handleMove);
    moveJoystickManagerRef.current.on('end', handleMoveEnd); // Use stored handler

    // --- Create Look Joystick (Right) ---
    lookJoystickManagerRef.current = nipplejs.create({
      zone: lookZoneRef.current,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'lightcoral',
      size: 100,
      restOpacity: 0.7,
    });

    lookJoystickManagerRef.current.on('move', handleLook);
    lookJoystickManagerRef.current.on('end', handleLookEnd); // Use stored handler

    // --- Clean up ---
    return () => {
      if (moveJoystickManagerRef.current) {
        // Unbind specific handlers first
        moveJoystickManagerRef.current.off('move', handleMove);
        moveJoystickManagerRef.current.off('end', handleMoveEnd); // Correctly unbind using stored handler
        moveJoystickManagerRef.current.destroy();
        moveJoystickManagerRef.current = null; // Clear ref
      }
      if (lookJoystickManagerRef.current) {
        lookJoystickManagerRef.current.off('move', handleLook);
        lookJoystickManagerRef.current.off('end', handleLookEnd); // Correctly unbind using stored handler
        lookJoystickManagerRef.current.destroy();
        lookJoystickManagerRef.current = null; // Clear ref
      }
    };
  }, [onMove, onLook]);

  return (
    <div className={styles.joystickContainer}>
      <div ref={moveZoneRef} className={`${styles.joystickZone} ${styles.moveZone}`}></div>
      <div ref={lookZoneRef} className={`${styles.joystickZone} ${styles.lookZone}`}></div>
    </div>
  );
};

export default MobileControls; 