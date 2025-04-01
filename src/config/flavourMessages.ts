export interface FlavourMessage {
    message: string;
    avatar?: string; // Optional avatar path - we'll populate this based on category
    category?: 'mars' | 'colony' | 'resource' | 'event-hint' | 'general';
}

// Define the mapping from category to avatar filename
const categoryAvatars: Record<NonNullable<FlavourMessage['category']>, string> = {
    mars: '/Derech/avatars/regolithdeposit.jpg',
    colony: '/Derech/avatars/ColonistAvatarFem2.jpg',
    resource: '/Derech/avatars/ColonistAvatarMal5.jpg',
    general: '/Derech/avatars/AiHelper.jpg',
    'event-hint': '/Derech/avatars/AiHelper.jpg', // Use AI Helper for hints too
};

// Default avatar if category is missing or unmapped
const defaultAvatar = '/Derech/avatars/AiHelper.jpg';

// Updated message list - removed specific avatars, relying on category now
export const flavourMessages: FlavourMessage[] = [
    // Mars Related
    { message: "Another dust storm is brewing on the horizon. Standard procedure: seal all external vents.", category: 'mars' },
    { message: "Spectrometer readings show unusual silicate concentrations in the northern plains. Worth investigating?", category: 'mars' },
    { message: "The thin Martian atmosphere offers little protection from solar radiation. Keep those suits maintained!", category: 'mars' },
    { message: "Phobos and Deimos put on quite a show tonight in the night sky.", category: 'mars' },

    // Colony Related
    { message: "Morale seems stable, Commander. The latest batch of synthesized coffee helped.", category: 'colony' },
    { message: "Life support systems are nominal. Oxygen recyclers operating at 98% efficiency.", category: 'colony' },
    { message: "Received a delayed transmission from Earth today. Mostly news and requests for more geological samples.", category: 'colony' },
    { message: "Expansion efforts are proceeding as planned. We're making a home here, step by step.", category: 'colony' },

    // Resource Related
    { message: "Power grid holding steady, but demand increases with every new module.", category: 'resource' },
    { message: "Water reclamation is critical. Every drop counts out here.", category: 'resource' },
    { message: "Mineral reserves are adequate, but we should prioritize locating new deposits soon.", category: 'resource' },
    { message: "Colony goods production is meeting current needs. Let's keep it that way.", category: 'resource' },

    // General / Hints
    { message: "Remember, careful planning prevents catastrophic failures. Usually.", category: 'general' },
    { message: "Exploration is key to survival. Who knows what resources or dangers lie beyond the next ridge?", category: 'general' },
    { message: "Sometimes, just watching the red dust settle can be... peaceful.", category: 'general' },
    // Add a hint example
    { message: "Low on power? Consider building more solar panels or researching geothermal energy.", category: 'event-hint'},
];

// Helper function to get a random message WITH the correct avatar assigned
export const getRandomFlavourMessage = (): FlavourMessage => {
    const randomIndex = Math.floor(Math.random() * flavourMessages.length);
    const baseMessage = { ...flavourMessages[randomIndex] }; // Clone the message object

    // Assign avatar based on category
    if (baseMessage.category && categoryAvatars[baseMessage.category]) {
        baseMessage.avatar = categoryAvatars[baseMessage.category];
    } else {
        baseMessage.avatar = defaultAvatar; // Assign default if category missing or unmapped
    }

    return baseMessage;
}; 