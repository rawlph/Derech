import { useEffect, useRef } from 'react';
import nipplejs, { JoystickManager, JoystickOutputData } from 'nipplejs';

interface NippleState {
  forward: number;
  right: number;
  active: boolean;
}

/**
 * Hook to handle nipplejs joystick input for movement
 * @param containerId ID of the HTML element that will contain the joystick
 * @returns Object with normalized movement values
 */
export const useNippleInput = (containerId: string) => {
  // State ref with default values if joystick initialization fails
  const nippleState = useRef<NippleState>({
    forward: 0,
    right: 0,
    active: false
  });

  const joystickManager = useRef<JoystickManager | null>(null);
  const containerExistsRef = useRef(false);

  useEffect(() => {
    // Early container validation
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id '${containerId}' not found for nipplejs. Mobile joystick controls will be unavailable.`);
      containerExistsRef.current = false;
      return;
    }

    containerExistsRef.current = true;

    // Define event handlers outside try/catch for cleanup access
    // Handle joystick movement
    const handleMove = (evt: Event, data: JoystickOutputData) => {
      // Extract vector data - normalized values between -1 and 1
      const forward = data.vector.y; // This is correct for forward/backward
      const right = data.vector.x;   // This is correct for left/right
      
      // Update state
      nippleState.current = {
        forward,
        right,
        active: true
      };
    };

    // Handle joystick end event
    const handleEnd = () => {
      // Reset state when joystick is released
      nippleState.current = {
        forward: 0,
        right: 0,
        active: false
      };
    };

    try {
      // Initialize joystick
      joystickManager.current = nipplejs.create({
        zone: container,
        mode: 'static',
        position: { bottom: '90px', right: '90px' },
        color: 'rgba(255, 255, 255, 0.5)',
        size: 120,
        lockX: false,
        lockY: false,
        dynamicPage: true,
      });

      // Add event listeners
      joystickManager.current.on('move', handleMove);
      joystickManager.current.on('end', handleEnd);
    } catch (error) {
      // Handle nipplejs initialization errors
      console.error('Failed to initialize nipplejs joystick:', error);
      containerExistsRef.current = false;
      // State already has default values, so no additional fallback needed
    }

    // Cleanup
    return () => {
      if (joystickManager.current) {
        try {
          joystickManager.current.off('move', handleMove);
          joystickManager.current.off('end', handleEnd);
          joystickManager.current.destroy();
        } catch (error) {
          console.error('Error cleaning up nipplejs instance:', error);
        }
      }
    };
  }, [containerId]);

  return nippleState;
}; 