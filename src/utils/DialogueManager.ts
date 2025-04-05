// DialogueManager.ts - Helper utility for managing dialogue sequences

import { DialogueChoice, DialogueData, DialogueWithChoices } from '@config/dialogues';
import { useGameStore } from '@store/store';

type DialogueAction = () => void;

// Type for dialogue sequence with choice handling
export interface DialogueSequenceStep {
  dialogueKey: string;
  delay?: number;
  choiceActions?: DialogueAction[] | DialogueAction;
}

// Manager for handling dialogue sequences
export class DialogueManager {
  private delay: number;
  
  constructor(defaultDelay = 500) {
    this.delay = defaultDelay;
  }
  
  /**
   * Show a dialogue with optional choices
   */
  showDialogue(dialogue: DialogueData | DialogueWithChoices, choiceActions?: DialogueAction[] | DialogueAction): void {
    // Get the dialogue functions from store
    const { showDialogue } = useGameStore.getState();
    
    const { message, avatar, speakerName } = dialogue;
    
    // Check if dialogue has choices and actions were provided
    if ('choices' in dialogue && dialogue.choices && dialogue.choices.length > 0) {
      // Map the choices with actions
      const mappedChoices = dialogue.choices.map((choice, index) => {
        let action: DialogueAction;
        
        // If choiceActions is an array, get the action at this index
        if (Array.isArray(choiceActions) && choiceActions[index]) {
          action = choiceActions[index];
        } 
        // If choiceActions is a single function, use it for all choices
        else if (typeof choiceActions === 'function') {
          action = choiceActions;
        }
        // Fallback to an empty function
        else {
          action = () => {};
        }
        
        return {
          text: choice.text,
          action
        };
      });
      
      // Show the dialogue with choices
      showDialogue(message, avatar, speakerName, mappedChoices);
    } else {
      // Show the dialogue without choices
      showDialogue(message, avatar, speakerName);
    }
  }
  
  /**
   * Hide the current dialogue
   */
  hideDialogue(): void {
    const { hideDialogue } = useGameStore.getState();
    hideDialogue();
  }
  
  /**
   * Play a sequence of dialogues with delays between them
   * @param dialogues Array of dialogues to show in sequence
   * @param delays Array of delays in ms between dialogues (optional)
   * @param onComplete Callback when sequence completes (optional)
   */
  async playSequence(
    dialogues: (DialogueData | DialogueWithChoices)[],
    delays?: number[],
    onComplete?: () => void
  ): Promise<void> {
    const { hideDialogue } = useGameStore.getState();
    
    // Show dialogues in sequence with delays
    for (let i = 0; i < dialogues.length; i++) {
      // Hide previous dialogue (except for the first one)
      if (i > 0) {
        hideDialogue();
        // Wait a bit before showing the next dialogue
        await this.wait(this.delay);
      }
      
      // Show current dialogue
      this.showDialogue(dialogues[i]);
      
      // If this is not the last dialogue, wait before continuing
      if (i < dialogues.length - 1) {
        // Use specific delay if provided, otherwise use default
        const delayTime = delays && delays[i] ? delays[i] : 3000;
        await this.wait(delayTime);
      }
    }
    
    // Call completion callback if provided
    if (onComplete) {
      onComplete();
    }
  }
  
  /**
   * Play a dialogue sequence with choice handling using dialogue keys
   * @param dialogueGetter Function to get dialogue by key
   * @param sequence Array of sequence steps with dialogue keys and optional choice handlers
   * @param onComplete Callback when sequence completes (optional)
   */
  async playKeyedSequence<T extends string>(
    dialogueGetter: (key: T) => DialogueData | DialogueWithChoices,
    sequence: { dialogueKey: T; delay?: number; choiceActions?: DialogueAction[] | DialogueAction }[],
    onComplete?: () => void
  ): Promise<void> {
    const { hideDialogue } = useGameStore.getState();
    
    // Last step might have choices that branch the dialogue, so we track if we reach the end
    let completed = false;
    
    // Process sequence steps
    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      const dialogue = dialogueGetter(step.dialogueKey);
      
      // Hide previous dialogue (except for the first one)
      if (i > 0) {
        hideDialogue();
        // Wait a bit before showing the next dialogue
        await this.wait(this.delay);
      }
      
      // Show current dialogue with any choice actions
      this.showDialogue(dialogue, step.choiceActions);
      
      // If this has choices, don't wait automatically as user interaction controls flow
      if ('choices' in dialogue && dialogue.choices && dialogue.choices.length > 0) {
        // If this is the last step, mark as completed
        if (i === sequence.length - 1) {
          completed = true;
        }
        // Stop automatic sequence on dialogues with choices
        break;
      }
      
      // If this is not the last dialogue, wait before continuing
      if (i < sequence.length - 1) {
        // Use specific delay if provided, otherwise use default
        const delayTime = step.delay ?? 3000;
        await this.wait(delayTime);
      } else {
        // This is the last step and it had no choices
        completed = true;
      }
    }
    
    // Call completion callback if we completed the sequence
    if (completed && onComplete) {
      onComplete();
    }
  }
  
  /**
   * Create a promise that resolves after a delay
   */
  wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const dialogueManager = new DialogueManager();

// Export a helper to show a single dialogue with choices
export function showDialogueWithChoices(
  dialogue: DialogueWithChoices,
  choiceActions: DialogueAction[]
): void {
  dialogueManager.showDialogue(dialogue, choiceActions);
} 