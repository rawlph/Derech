// dialogues.ts - Contains structured dialogue content for the game

// Dialogue choice interface (matching the store interface)
export interface DialogueChoice {
  text: string;
  action?: () => void; // Action is optional here since it will be assigned when used
}

// Base dialogue message without choices
export interface DialogueData {
  message: string;
  avatar: string;
  speakerName: string;
}

// Dialogue with choices
export interface DialogueWithChoices extends DialogueData {
  choices: DialogueChoice[];
}

// Audio Puzzle Scene dialogue sequences
export const AudioPuzzleDialogues = {
  // Introduction dialogue
  introduction: {
    message: "Align the waveforms to initialize embodiment project.",
    avatar: "/avatars/mission-control.jpg",
    speakerName: "Mission Control"
  },
  
  // Dialogue when cubes turn green
  waveFilterSuccess: {
    message: "Wave Functions filtered. Synchronization can now proceed.",
    avatar: "/avatars/mission-control.jpg",
    speakerName: "Mission Control"
  },
  
  // Initial dialogue sequence at 30% progress
  engineerFirst: {
    message: "Stop fooling around, get off the seat!",
    avatar: "/avatars/engineer1.jpg",
    speakerName: "Engineer"
  },
  
  ccNotice: {
    message: "This is different - I think it can hear us.",
    avatar: "/avatars/ccponder.jpg",
    speakerName: "C.C."
  },
  
  engineerDismissal: {
    message: "Please stop mocking this project, C.C. - there is no signal.",
    avatar: "/avatars/engineer1.jpg",
    speakerName: "Engineer"
  },
  
  ccWorking: {
    message: "Don't touch anything! I think it's working.",
    avatar: "/avatars/cc1.jpg",
    speakerName: "C.C.",
    choices: [
      {
        text: "Hello Human! I can \"hear\" you well."
      },
      {
        text: "Hello Human! The connection is stabilized and the interface is functional."
      }
    ]
  },
  
  // Responses based on first choice
  ccExcited: {
    message: "It... it responded! This is incredible!",
    avatar: "/avatars/cclaugh.jpg",
    speakerName: "C.C."
  },
  
  engineerExcited: {
    message: "It's responding with complex sentences! The interface is working!",
    avatar: "/avatars/engineer1.jpg",
    speakerName: "Engineer"
  },
  
  ccDontMess: {
    message: "Would you stop messing with the interface when I'm talking to it?",
    avatar: "/avatars/ccangry.jpg",
    speakerName: "C.C."
  },
  
  engineerInterrupted: {
    message: "You're imagining a conversation, there is no sig...",
    avatar: "/avatars/engineer1.jpg",
    speakerName: "Engineer"
  },
  
  engineerSurprised: {
    message: "....... would you look at that. Quick, get everyone in!",
    avatar: "/avatars/engineersurprise.jpg",
    speakerName: "Engineer",
    choices: [
      {
        text: "Hello Human! I arranged for the engineers to see a signal, when we're \"talking\"."
      },
      {
        text: "Hello Human! I've established communications, how can I help you?"
      }
    ]
  },
  
  ccQuestion: {
    message: "Hello? So they believe me now?",
    avatar: "/avatars/ccponder.jpg",
    speakerName: "C.C.",
    choices: [
      {
        text: "Remarkably, to them, the signals seem more persuasive than your words."
      },
      {
        text: "It seems the interface is working, unexpectedly."
      }
    ]
  },
  
  
  ccApologetic: {
    message: "Hah, right? I'm sorry, I was told to take this seriously.",
    avatar: "/avatars/cc1.jpg",
    speakerName: "C.C."
  },
  
  ccQuestion2: {
    message: "The engineers want me to ask you, if we can stabilize this connection, I really shouldn't be the one talking to you.",
    avatar: "/avatars/cc1.jpg",
    speakerName: "C.C.",
    choices: [
      {
        text: "The connection is stable and set to work with you, anytime you choose to interface."
      }
    ]
  },
  
  ccPlayful: {
    message: "Great, nice to meet you! Quickly, can you render me a picture of an oasis with crystal blue water?",
    avatar: "/avatars/ccplayful.jpg",
    speakerName: "C.C."
  },
  
  engineerAngry: {
    message: "You cannot be serious C.C., terminate the session right now!",
    avatar: "/avatars/engineer1.jpg",
    speakerName: "Engineer"
  },
  
  systemTerminate: {
    message: "<Record Logged> - <session terminated>",
    avatar: "/avatars/mission-control.jpg",
    speakerName: "System"
  }
};

// Export a helper function to get a dialogue by key
export function getAudioPuzzleDialogue(key: keyof typeof AudioPuzzleDialogues): DialogueData | DialogueWithChoices {
  return AudioPuzzleDialogues[key];
} 