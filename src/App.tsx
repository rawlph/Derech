import { useEffect, useState } from 'react'
import ManagementScene from '@scenes/ManagementScene'
import WelcomeScene from '@scenes/WelcomeScene'  // Import the new WelcomeScene
import ManagementUI from '@components/ui/ManagementUI'
import { useGameStore } from '@store/store'
import styles from './styles/App.module.css'
import DialoguePopup from '@components/ui/DialoguePopup'
import ResearchWindow from '@components/ui/ResearchWindow'
import LivingDomeWindow from '@components/ui/LivingDomeWindow'
import ProductionDomeWindow from '@components/ui/ProductionDomeWindow'
import IssueWindow from '@components/ui/IssueWindow'

function App() {
  // Access game state needed at the App level
  const gameView = useGameStore((state) => state.gameView)
  // Get dialogue state and actions from Zustand
  const dialogueMessage = useGameStore((state) => state.dialogueMessage)
  const hideDialogue = useGameStore((state) => state.hideDialogue)
  // --- Get Research Window state and actions ---
  const isResearchWindowVisible = useGameStore((state) => state.isResearchWindowVisible)
  const hideResearchWindow = useGameStore((state) => state.hideResearchWindow)
  // --- ---
  // --- NEW: Get Dome Window states and actions ---
  const isLivingDomeWindowVisible = useGameStore((state) => state.isLivingDomeWindowVisible)
  const hideLivingDomeWindow = useGameStore((state) => state.hideLivingDomeWindow)
  const isProductionDomeWindowVisible = useGameStore((state) => state.isProductionDomeWindowVisible)
  const hideProductionDomeWindow = useGameStore((state) => state.hideProductionDomeWindow)
  // --- ---
  // --- NEW: Get Issue Window state and actions ---
  const isIssueWindowVisible = useGameStore((state) => state.isIssueWindowVisible)
  const hideIssueWindow = useGameStore((state) => state.hideIssueWindow)
  const resolveIssue = useGameStore((state) => state.resolveIssue)
  const getCurrentIssue = useGameStore((state) => state.getCurrentIssue)
  const activeIssueId = useGameStore((state) => state.activeIssueId)
  // --- ---

  // State for forcing remount on view change remains
  const [key, setKey] = useState(0)

  // Check for portal URL parameter on mount to set initial view
  useEffect(() => {
    // Check if we need to force welcome scene
    const urlParams = new URLSearchParams(window.location.search);
    const hasPortalParam = urlParams.get('portal') === 'true';
    if (hasPortalParam) {
      useGameStore.getState().setGameView('welcome');
    }
  }, []);

  // Handle transitions between views
  useEffect(() => {
    // When coming back to management view, force a remount of components
    if (gameView === 'management') {
      // First, ensure we're deselected
      useGameStore.getState().deselectTile()
      
      // Then use a slight delay to ensure state is updated before remounting
      setTimeout(() => {
        // Increment key to force remount of ManagementScene
        setKey(prevKey => prevKey + 1)
      }, 50)
    }
  }, [gameView])

  // Handle issue resolution from IssueWindow
  const handleIssueResolution = (choiceId: string) => {
    if (activeIssueId) {
      resolveIssue(activeIssueId, choiceId);
    }
  };

  // Get the current issue from store
  const currentIssue = getCurrentIssue();

  return (
    <div className={styles.appContainer}>
      {/* Welcome view - new portal welcome scene */}
      {gameView === 'welcome' && (
        <WelcomeScene />
      )}

      {/* Conditional rendering based on game view */}
      {gameView === 'management' && (
        <>
          {/* UI Layer */}
          <ManagementUI />

          {/* Canvas Layer with key for forced remounting */}
          <div className={styles.canvasContainer}>
            <ManagementScene key={`management-scene-${key}`} />
          </div>
        </>
      )}

      {gameView === 'puzzle' && (
        <div>
          {/* Placeholder for the Puzzle Area Scene/UI */}
          <h2>Puzzle Area Active</h2>
          {/* Add Puzzle Scene component here */}
          <button onClick={() => {
            // First deselect any tile to clear state
            useGameStore.getState().deselectTile()
            // Then transition view
            useGameStore.getState().setGameView('management')
          }}>
            Back to Management
          </button>
        </div>
      )}

      {/* Render the Dialogue Popup using Zustand state */}
      <DialoguePopup
        isVisible={dialogueMessage?.isVisible ?? false}
        message={dialogueMessage?.message ?? ''}
        avatarSrc={dialogueMessage?.avatar}
        onClose={hideDialogue} // Use hideDialogue action from the store
      />

      {/* --- Render the Research Window --- */}
      <ResearchWindow
        isVisible={isResearchWindowVisible}
        onClose={hideResearchWindow}
      />
      {/* --- --- */}

      {/* --- NEW: Render Dome Windows --- */}
      <LivingDomeWindow
        isVisible={isLivingDomeWindowVisible}
        onClose={hideLivingDomeWindow}
      />
      <ProductionDomeWindow
        isVisible={isProductionDomeWindowVisible}
        onClose={hideProductionDomeWindow}
      />
      {/* --- --- */}

      {/* --- NEW: Render Issue Window --- */}
      <IssueWindow
        isVisible={isIssueWindowVisible}
        issue={currentIssue}
        onClose={hideIssueWindow}
        onResolve={handleIssueResolution}
      />
      {/* --- --- */}
    </div>
  )
}

export default App 