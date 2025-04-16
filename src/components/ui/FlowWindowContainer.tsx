import React from 'react';
import FlowWindow from './FlowWindow';
import { useGameStore } from '@store/store';

const FlowWindowContainer: React.FC = () => {
    const isFlowWindowVisible = useGameStore((state) => state.isFlowWindowVisible);
    const showFlowWindow = useGameStore((state) => state.showFlowWindow);
    const hideFlowWindow = useGameStore((state) => state.hideFlowWindow);

    // Expose the toggle function through a global handler
    if (typeof window !== 'undefined') {
        (window as any).toggleFlowWindow = () => {
            if (isFlowWindowVisible) {
                hideFlowWindow();
            } else {
                showFlowWindow();
            }
        };
    }

    return (
        <FlowWindow
            isVisible={isFlowWindowVisible}
            onClose={hideFlowWindow}
        />
    );
};

export default FlowWindowContainer; 