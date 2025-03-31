import { useEffect, useRef } from 'react'
import nipplejs, { JoystickManager, JoystickOutputData } from 'nipplejs'
import styles from '../styles/MobileControls.module.css'

interface MobileControlsProps {
  onMove?: (data: { x: number; y: number }) => void;
}

const MobileControls = ({ onMove }: MobileControlsProps) => {
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const joystickManagerRef = useRef<JoystickManager | null>(null);

  useEffect(() => {
    if (!joystickContainerRef.current) return;

    // Create the joystick
    joystickManagerRef.current = nipplejs.create({
      zone: joystickContainerRef.current,
      mode: 'static',
      position: { left: '50%', bottom: '70px' },
      color: 'white',
      size: 100,
    });

    // Handle joystick movements
    const handleMove = (_: any, data: JoystickOutputData) => {
      if (onMove && data.vector) {
        // Normalize vector values
        onMove({
          x: data.vector.x,
          y: data.vector.y,
        });
      }
    };

    joystickManagerRef.current.on('move', handleMove);

    // Clean up
    return () => {
      if (joystickManagerRef.current) {
        joystickManagerRef.current.off('move', handleMove);
        joystickManagerRef.current.destroy();
      }
    };
  }, [onMove]);

  return <div ref={joystickContainerRef} className={styles.joystickContainer} />;
};

export default MobileControls; 