import { useEffect, useRef } from 'react'
import nipplejs, { JoystickManager, JoystickOutputData } from 'nipplejs'
import styles from '../styles/MobileControls.module.css'

interface MobileControlsProps {
  onMove?: (data: { x: number; y: number }) => void;
  onLook?: (data: { x: number; y: number }) => void;
  debug?: boolean; // Optional debug mode for logging
  invertLook?: boolean; // Add invert look prop
}

const MobileControls = ({ onMove, onLook, debug = false, invertLook = false }: MobileControlsProps) => {
  const moveZoneRef = useRef<HTMLDivElement>(null);
  const lookZoneRef = useRef<HTMLDivElement>(null);
  const moveJoystickManagerRef = useRef<JoystickManager | null>(null);
  const lookJoystickManagerRef = useRef<JoystickManager | null>(null);
  const moveActiveRef = useRef(false);
  const lookActiveRef = useRef(false);
  const lastMoveDataRef = useRef({ x: 0, y: 0 });
  const lastLookDataRef = useRef({ x: 0, y: 0 });
  // Track accumulated vertical rotation to implement clamping
  const accumulatedLookY = useRef(0);
  // Define max vertical rotation similar to the Player component
  const maxVerticalRotation = Math.PI / 2 - 0.15; // About 75 degrees
  // Reduce sensitivity for mobile to make it less likely to hit the limits too quickly
  const mobileSensitivityDamping = 0.5; // This makes mobile controls less sensitive than desktop

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
        
        // Apply vertical look constraints to prevent flips
        // Dampen the input for better control - this makes the mobile behavior more like desktop
        const verticalInput = data.vector.y * mobileSensitivityDamping;
        const horizontalInput = data.vector.x * mobileSensitivityDamping;
        
        // Update accumulated vertical rotation - for tracking purposes only
        // The actual rotation is handled by the Player component
        const previousAccumulated = accumulatedLookY.current;
        accumulatedLookY.current += verticalInput * 0.05; // Using same factor as lookSensitivity
        
        // Clamp the accumulated vertical rotation more strictly
        const preClampValue = accumulatedLookY.current;
        accumulatedLookY.current = Math.max(-maxVerticalRotation * 0.95, 
                                    Math.min(maxVerticalRotation * 0.95, accumulatedLookY.current));
        
        // Calculate how much of the input to actually apply based on clamping
        let adjustedY = verticalInput;
        let wasConstrained = false;
        
        // If we're at limits and still trying to move further, cancel vertical movement
        if ((accumulatedLookY.current >= maxVerticalRotation * 0.95 && verticalInput > 0) ||
            (accumulatedLookY.current <= -maxVerticalRotation * 0.95 && verticalInput < 0)) {
          adjustedY = 0;
          wasConstrained = true;
        }
        
        // For extreme movements, scale down input to prevent flipping even more
        const yAbsValue = Math.abs(data.vector.y);
        if (yAbsValue > 0.8) {
          // Scale down fast/extreme movements to prevent overshooting
          adjustedY *= (1 - ((yAbsValue - 0.8) * 0.5));
        }
        
        // Debug logging
        if (debug) {
          if (wasConstrained) {
            console.log(`Mobile look constrained: input ${verticalInput.toFixed(2)}, accumulated ${accumulatedLookY.current.toFixed(2)}, max ${maxVerticalRotation.toFixed(2)}`);
          }
          
          // Log when we're getting close to constraints
          if (Math.abs(accumulatedLookY.current) > maxVerticalRotation * 0.8 && 
              Math.abs(previousAccumulated) !== Math.abs(accumulatedLookY.current)) {
            console.log(`Near limits: ${(accumulatedLookY.current / maxVerticalRotation * 100).toFixed(0)}% of max rotation`);
          }
          
          // Log if clamping actually changed the value
          if (preClampValue !== accumulatedLookY.current) {
            console.log(`Clamping applied: ${preClampValue.toFixed(2)} → ${accumulatedLookY.current.toFixed(2)}`);
          }

          // Log invert status
          if (invertLook) {
            console.log(`Using inverted look: Y=${adjustedY.toFixed(2)}`);
          }
        }
        
        // Update and send the constrained look data
        lastLookDataRef.current = { x: horizontalInput, y: adjustedY };
        onLook(lastLookDataRef.current);
      }
    };
    
    const handleLookEnd = () => {
      lookActiveRef.current = false;
      lastLookDataRef.current = { x: 0, y: 0 };
      
      if (debug) {
        console.log(`Look ended: Final accumulated Y: ${accumulatedLookY.current.toFixed(2)}`);
      }
      
      // Reset accumulated value when touch ends to match the auto-leveling behavior
      accumulatedLookY.current = 0;
      
      // Reset on release - this allows the Player's auto-leveling to take effect
      if (onLook) onLook({ x: 0, y: 0 });
    };

    // Set up interval to continuously send the last joystick data - at a controlled rate
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
  }, [onMove, onLook, debug, invertLook]); // Add invertLook to dependencies

  return (
    <div className={styles.joystickContainer}>
      <div ref={moveZoneRef} className={`${styles.joystickZone} ${styles.moveZone}`}></div>
      <div ref={lookZoneRef} className={`${styles.joystickZone} ${styles.lookZone}`}></div>
    </div>
  );
};

export default MobileControls; 