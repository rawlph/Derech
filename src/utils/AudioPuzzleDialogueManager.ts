// AudioPuzzleDialogueManager.ts - Specialized dialogue sequence manager for the Audio Puzzle

import { AudioPuzzleDialogues, getAudioPuzzleDialogue } from '@config/dialogues';
import { dialogueManager } from './DialogueManager';
import { useGameStore } from '@store/store';

/**
 * Show the introduction dialogue for the puzzle
 */
export function showIntroductionDialogue(): void {
  const { showDialogue } = useGameStore.getState();
  const intro = getAudioPuzzleDialogue('introduction');
  showDialogue(intro.message, intro.avatar, intro.speakerName);
}

/**
 * Show the dialogue when wave functions are filtered (all cubes turn green)
 */
export function showWaveFilterSuccessDialogue(): void {
  const { showDialogue } = useGameStore.getState();
  const success = getAudioPuzzleDialogue('waveFilterSuccess');
  showDialogue(success.message, success.avatar, success.speakerName);
}

/**
 * Start the initial dialogue sequence without choices
 * This plays the first few messages that lead up to the first player choice
 */
export async function playInitialDialogueSequence(): Promise<void> {
  await dialogueManager.playKeyedSequence(
    getAudioPuzzleDialogue,
    [
      { dialogueKey: 'engineerFirst', delay: 3000 },
      { dialogueKey: 'ccNotice', delay: 3000 },
      { dialogueKey: 'engineerDismissal', delay: 3000 }
    ]
  );
}

/**
 * Start the main dialogue sequence that happens at 30% progress
 */
export function playMainDialogueSequence(onComplete?: () => void): void {
  // Get starting dialogues
  playInitialDialogueSequence().then(() => {
    // Show C.C.'s dialogue with choices after the initial sequence
    const { showDialogue } = useGameStore.getState();
    const ccWorkingDialogue = getAudioPuzzleDialogue('ccWorking');
    
    if ('choices' in ccWorkingDialogue) {
      showDialogue(
        ccWorkingDialogue.message,
        ccWorkingDialogue.avatar,
        ccWorkingDialogue.speakerName,
        [
          {
            text: ccWorkingDialogue.choices[0].text,
            action: () => handleFirstChoice(onComplete)
          },
          {
            text: ccWorkingDialogue.choices[1].text,
            action: () => handleSecondChoice(onComplete)
          }
        ]
      );
    }
  });
}

/**
 * Handle the first choice from C.C.'s dialogue
 */
function handleFirstChoice(onComplete?: () => void): void {
  dialogueManager.hideDialogue();
  
  // First response sequence
  dialogueManager.playKeyedSequence(
    getAudioPuzzleDialogue,
    [
      { dialogueKey: 'ccExcited', delay: 3000 }
    ],
    () => continueDialogueAfterFirstResponse(onComplete)
  );
}

/**
 * Handle the second choice from C.C.'s dialogue
 */
function handleSecondChoice(onComplete?: () => void): void {
  dialogueManager.hideDialogue();
  
  // Alternative first response sequence
  dialogueManager.playKeyedSequence(
    getAudioPuzzleDialogue,
    [
      { dialogueKey: 'engineerExcited', delay: 3000 }
    ],
    () => continueDialogueAfterFirstResponse(onComplete)
  );
}

/**
 * Continue dialogue after first response is shown
 */
function continueDialogueAfterFirstResponse(onComplete?: () => void): void {
  // Continue dialogue sequence
  dialogueManager.playKeyedSequence(
    getAudioPuzzleDialogue,
    [
      { dialogueKey: 'ccDontMess', delay: 3000 },
      { dialogueKey: 'engineerInterrupted', delay: 3000 }
    ],
    () => {
      // Show engineer surprised with choices
      const { showDialogue } = useGameStore.getState();
      const engineerSurprised = getAudioPuzzleDialogue('engineerSurprised');
      
      if ('choices' in engineerSurprised) {
        showDialogue(
          engineerSurprised.message,
          engineerSurprised.avatar,
          engineerSurprised.speakerName,
          [
            {
              text: engineerSurprised.choices[0].text,
              action: () => handleArrangedSignalChoice(onComplete)
            },
            {
              text: engineerSurprised.choices[1].text,
              action: () => handleCommunicationsChoice(onComplete)
            }
          ]
        );
      }
    }
  );
}

/**
 * Handle "arranged signal" choice
 */
function handleArrangedSignalChoice(onComplete?: () => void): void {
  dialogueManager.hideDialogue();
  
  // After a short delay, show CC's question with choices
  setTimeout(() => {
    const { showDialogue } = useGameStore.getState();
    const ccQuestion = getAudioPuzzleDialogue('ccQuestion');
    
    if ('choices' in ccQuestion) {
      showDialogue(
        ccQuestion.message,
        ccQuestion.avatar,
        ccQuestion.speakerName,
        [
          {
            text: ccQuestion.choices[0].text,
            action: () => handleRemarkabyChoice(onComplete)
          },
          {
            text: ccQuestion.choices[1].text,
            action: () => handleInterfaceWorkingChoice(onComplete)
          }
        ]
      );
    }
  }, 500);
}

/**
 * Handle "established communications" choice
 */
function handleCommunicationsChoice(onComplete?: () => void): void {
  dialogueManager.hideDialogue();
  
  // After a short delay, show CC's question (same as for arranged signal)
  setTimeout(() => {
    const { showDialogue } = useGameStore.getState();
    const ccQuestion = getAudioPuzzleDialogue('ccQuestion');
    
    if ('choices' in ccQuestion) {
      showDialogue(
        ccQuestion.message,
        ccQuestion.avatar,
        ccQuestion.speakerName,
        [
          {
            text: ccQuestion.choices[0].text,
            action: () => handleRemarkabyChoice(onComplete)
          },
          {
            text: ccQuestion.choices[1].text,
            action: () => handleInterfaceWorkingChoice(onComplete)
          }
        ]
      );
    }
  }, 500);
}

/**
 * Handle the "remarkably" choice response
 */
function handleRemarkabyChoice(onComplete?: () => void): void {
  finishDialogueSequence(onComplete);
}

/**
 * Handle the "interface working" choice response
 */
function handleInterfaceWorkingChoice(onComplete?: () => void): void {
  finishDialogueSequence(onComplete);
}

/**
 * Finish the dialogue sequence with the final exchanges
 */
function finishDialogueSequence(onComplete?: () => void): void {
  dialogueManager.hideDialogue();
  
  // Play the first part of the final sequence
  dialogueManager.playKeyedSequence(
    getAudioPuzzleDialogue,
    [
      { dialogueKey: 'ccApologetic', delay: 3000 }
    ],
    () => {
      // Show CC's question about connection
      const { showDialogue } = useGameStore.getState();
      const ccQuestion2 = getAudioPuzzleDialogue('ccQuestion2');
      
      if ('choices' in ccQuestion2) {
        showDialogue(
          ccQuestion2.message,
          ccQuestion2.avatar,
          ccQuestion2.speakerName,
          [
            {
              text: ccQuestion2.choices[0].text,
              action: () => {
                // Final sequence after player chooses
                dialogueManager.hideDialogue();
                
                dialogueManager.playKeyedSequence(
                  getAudioPuzzleDialogue,
                  [
                    { dialogueKey: 'ccPlayful', delay: 6000 },
                    { dialogueKey: 'engineerAngry', delay: 3000 },
                    { dialogueKey: 'systemTerminate' }
                  ],
                  () => {
                    // Increment insight and call completion handler
                    const { incrementEmbodimentInsight } = useGameStore.getState();
                    incrementEmbodimentInsight();
                    if (onComplete) onComplete();
                  }
                );
              }
            }
          ]
        );
      }
    }
  );
} 