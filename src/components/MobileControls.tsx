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
  const moveActiveRef = useRef(false);
  const lookActiveRef = useRef(false);
  const lastMoveDataRef = useRef({ x: 0, y: 0 });
  const lastLookDataRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!moveZoneRef.current || !lookZoneRef.current) return;

    // --- Define handlers ---
    const handleMove = (_: any, data: JoystickOutputData) => {
      if (onMove && data.vector) {
        moveActiveRef.current = true;
        lastMoveDataRef.current = { x: data.vector.x, y: data.vector.y };
        onMove(lastMoveDataRef.current);
      }
    };
    
    const handleMoveEnd = () => {
      moveActiveRef.current = false;
      lastMoveDataRef.current = { x: 0, y: 0 };
      if (onMove) onMove({ x: 0, y: 0 });
    };

    const handleLook = (_: any, data: JoystickOutputData) => {
      if (onLook && data.vector) {
        lookActiveRef.current = true;
        lastLookDataRef.current = { x: data.vector.x, y: data.vector.y };
        onLook(lastLookDataRef.current);
      }
    };
    
    const handleLookEnd = () => {
      lookActiveRef.current = false;
      lastLookDataRef.current = { x: 0, y: 0 };
      if (onLook) onLook({ x: 0, y: 0 });
    };

    // Set up interval to continuously send the last joystick data
    const moveInterval = setInterval(() => {
      if (moveActiveRef.current && onMove) {
        onMove(lastMoveDataRef.current);
      }
      if (lookActiveRef.current && onLook) {
        onLook(lastLookDataRef.current);
      }
    }, 16); // ~60fps update rate

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
    moveJoystickManagerRef.current.on('end', handleMoveEnd);

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
    lookJoystickManagerRef.current.on('end', handleLookEnd);

    // --- Clean up ---
    return () => {
      clearInterval(moveInterval);
      
      if (moveJoystickManagerRef.current) {
        moveJoystickManagerRef.current.off('move', handleMove);
        moveJoystickManagerRef.current.off('end', handleMoveEnd);
        moveJoystickManagerRef.current.destroy();
        moveJoystickManagerRef.current = null;
      }
      
      if (lookJoystickManagerRef.current) {
        lookJoystickManagerRef.current.off('move', handleLook);
        lookJoystickManagerRef.current.off('end', handleLookEnd);
        lookJoystickManagerRef.current.destroy();
        lookJoystickManagerRef.current = null;
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