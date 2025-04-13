import { useEffect, useRef } from 'react';
import nipplejs, { JoystickManager, JoystickOutputData } from 'nipplejs';

interface NippleState {
  forward: number;
  right: number;
  up: number;
  active: boolean;
  verticalActive: boolean;
}

/**
 * Hook to handle nipplejs joystick input for movement
 * @param containerId ID of the HTML element that will contain the joystick
 * @param verticalContainerId ID of the HTML element that will contain the vertical joystick
 * @returns Object with normalized movement values
 */
export const useNippleInput = (containerId: string, verticalContainerId?: string) => {
  // State ref with default values if joystick initialization fails
  const nippleState = useRef<NippleState>({
    forward: 0,
    right: 0,
    up: 0,
    active: false,
    verticalActive: false
  });

  const joystickManager = useRef<JoystickManager | null>(null);
  const verticalJoystickManager = useRef<JoystickManager | null>(null);
  const containerExistsRef = useRef(false);
  const verticalContainerExistsRef = useRef(false);

  useEffect(() => {
    // Early container validation
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id '${containerId}' not found for nipplejs. Mobile joystick controls will be unavailable.`);
      containerExistsRef.current = false;
      return;
    }

    containerExistsRef.current = true;

    // Check for vertical joystick container
    const verticalContainer = verticalContainerId ? document.getElementById(verticalContainerId) : null;
    if (verticalContainerId && !verticalContainer) {
      console.error(`Container with id '${verticalContainerId}' not found for vertical nipplejs. Vertical joystick controls will be unavailable.`);
      verticalContainerExistsRef.current = false;
    } else if (verticalContainer) {
      verticalContainerExistsRef.current = true;
    }

    // Define event handlers outside try/catch for cleanup access
    // Handle joystick movement
    const handleMove = (evt: Event, data: JoystickOutputData) => {
      // Extract vector data - normalized values between -1 and 1
      const forward = data.vector.y; // This is correct for forward/backward
      const right = data.vector.x;   // This is correct for left/right
      
      // Update state while preserving vertical movement
      nippleState.current = {
        ...nippleState.current,
        forward,
        right,
        active: true
      };
    };

    // Handle joystick end event
    const handleEnd = () => {
      // Reset horizontal movement when joystick is released
      nippleState.current = {
        ...nippleState.current,
        forward: 0,
        right: 0,
        active: false
      };
    };

    // Handle vertical joystick movement
    const handleVerticalMove = (evt: Event, data: JoystickOutputData) => {
      // Extract vertical data - normalized values between -1 and 1
      // Use Y axis for up/down - positive is up, negative is down
      const up = -data.vector.y; // Inverted for intuitive control (up is positive)
      
      // Update state while preserving horizontal movement
      nippleState.current = {
        ...nippleState.current,
        up,
        verticalActive: true
      };
    };

    // Handle vertical joystick end event
    const handleVerticalEnd = () => {
      // Reset vertical movement when joystick is released
      nippleState.current = {
        ...nippleState.current,
        up: 0,
        verticalActive: false
      };
    };

    try {
      // Initialize main joystick
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

      // Initialize vertical joystick if container exists
      if (verticalContainerExistsRef.current && verticalContainer) {
        verticalJoystickManager.current = nipplejs.create({
          zone: verticalContainer,
          mode: 'static',
          position: { bottom: '90px', left: '90px' },
          color: 'rgba(255, 255, 255, 0.5)',
          size: 120,
          lockX: true, // Lock X axis to only allow vertical movement
          lockY: false,
          dynamicPage: true,
        });

        // Add event listeners for vertical joystick
        verticalJoystickManager.current.on('move', handleVerticalMove);
        verticalJoystickManager.current.on('end', handleVerticalEnd);
      }
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

      if (verticalJoystickManager.current) {
        try {
          verticalJoystickManager.current.off('move', handleVerticalMove);
          verticalJoystickManager.current.off('end', handleVerticalEnd);
          verticalJoystickManager.current.destroy();
        } catch (error) {
          console.error('Error cleaning up vertical nipplejs instance:', error);
        }
      }
    };
  }, [containerId, verticalContainerId]);

  return nippleState;
}; 