import { useEffect, useRef } from 'react'
import nipplejs, { JoystickManager, JoystickOutputData } from 'nipplejs'
import styles from '../styles/EnhancedMobileControls.module.css'

interface EnhancedMobileControlsProps {
  onMove?: (data: { x: number; y: number }) => void;
  onLookStart?: (e: React.TouchEvent) => void;
  onLookMove?: (e: React.TouchEvent) => void;
  onLookEnd?: (e: React.TouchEvent) => void;
  debug?: boolean;
}

const EnhancedMobileControls = ({ 
  onMove, 
  onLookStart,
  onLookMove,
  onLookEnd,
  debug = false
}: EnhancedMobileControlsProps) => {
  const moveZoneRef = useRef<HTMLDivElement>(null);
  const lookZoneRef = useRef<HTMLDivElement>(null);
  const moveJoystickManagerRef = useRef<JoystickManager | null>(null);
  const lastMoveDataRef = useRef({ x: 0, y: 0 });
  
  // Set up the joystick for movement
  useEffect(() => {
    if (!moveZoneRef.current) return;

    // --- Define handlers ---
    const handleMove = (_: any, data: JoystickOutputData) => {
      if (onMove && data.vector) {
        lastMoveDataRef.current = { x: data.vector.x, y: data.vector.y };
        onMove(lastMoveDataRef.current);
        
        if (debug) {
          console.log(`Mobile Move Input: x=${data.vector.x.toFixed(2)}, y=${data.vector.y.toFixed(2)}`);
        }
      }
    };
    
    const handleMoveEnd = () => {
      lastMoveDataRef.current = { x: 0, y: 0 };
      if (onMove) onMove({ x: 0, y: 0 });
      
      if (debug) {
        console.log("Move ended.");
      }
    };

    // Create Move Joystick (Left)
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

    // Clean up
    return () => {
      if (moveJoystickManagerRef.current) {
        moveJoystickManagerRef.current.off('move', handleMove);
        moveJoystickManagerRef.current.off('end', handleMoveEnd);
        moveJoystickManagerRef.current.destroy();
        moveJoystickManagerRef.current = null;
      }
    };
  }, [onMove, debug]);

  // Handle look zone touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (debug) {
      console.log("Touch start on look zone");
    }
    
    if (onLookStart) {
      onLookStart(e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (debug) {
      console.log("Touch move on look zone", e.touches[0].clientX, e.touches[0].clientY);
    }
    
    if (onLookMove) {
      onLookMove(e);
    }
    
    // Prevent default to avoid scrolling
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (debug) {
      console.log("Touch end on look zone");
    }
    
    if (onLookEnd) {
      onLookEnd(e);
    }
  };

  return (
    <div className={styles.controlsContainer}>
      {/* Movement joystick on the left */}
      <div ref={moveZoneRef} className={`${styles.joystickZone} ${styles.moveZone}`}></div>
      
      {/* Look zone (touch area) on the right */}
      <div 
        ref={lookZoneRef} 
        className={`${styles.lookZone}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      ></div>
    </div>
  );
};

export default EnhancedMobileControls; 