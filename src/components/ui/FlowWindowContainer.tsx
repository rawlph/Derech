import React, { useState } from 'react';
import FlowWindow from './FlowWindow';

const FlowWindowContainer: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Function to toggle visibility
    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    // Function to hide window
    const hideWindow = () => {
        setIsVisible(false);
    };

    // Expose the toggle function through a global handler
    if (typeof window !== 'undefined') {
        (window as any).toggleFlowWindow = toggleVisibility;
    }

    return (
        <FlowWindow
            isVisible={isVisible}
            onClose={hideWindow}
        />
    );
};

export default FlowWindowContainer; 