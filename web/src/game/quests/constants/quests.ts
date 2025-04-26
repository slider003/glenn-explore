import { Quest, QuestType, QuestValidationType } from '../types/quest';

export const TUTORIAL_QUESTS: Quest[] = [
    {
        id: 'social_butterfly',
        title: 'Social Butterfly',
        description: 'Learn to communicate with other players in the world.',
        type: QuestType.TUTORIAL,
        steps: [
            {
                id: 'open_chat',
                title: 'Chat Explorer',
                description: 'Open the chat interface to connect with other players.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'CHAT_OPEN' }
                },
                order: 1
            },
            {
                id: 'change_name',
                title: 'Name Changer',
                description: 'Choose a unique name for yourself.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'NAME_CHANGED' }
                },
                order: 2
            },
            {
                id: 'send_message',
                title: 'First Contact',
                description: 'Send your first message to other players.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'CHAT_MESSAGE_SENT' }
                },
                order: 3
            }
        ]
    },
    {
        id: 'vehicle_customization',
        title: 'Vehicle Virtuoso',
        description: 'Learn how to personalize your ride with different models.',
        type: QuestType.TUTORIAL,
        steps: [
            {
                id: 'open_model_selector',
                title: 'Style Explorer',
                description: 'Open the model selector to view available vehicles.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'MODEL_SELECTOR_OPEN' }
                },
                order: 1
            },
            {
                id: 'select_new_model',
                title: 'Model Makeover',
                description: 'Choose a new model to transform your vehicle.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'MODEL_SELECTED' }
                },
                order: 2
            }
        ]
    },
    {
        id: 'explore_settings',
        title: 'The Path of Enlightenment',
        description: 'Learn how to customize your view of the world.',
        type: QuestType.TUTORIAL,

        steps: [
            {
                id: 'switch_night_mode',
                title: 'Night Explorer',
                description: 'Experience the world in a different light by switching to night mode.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'MAP_SWITCH_DAY_MODE' }
                },
                order: 1
            },
            {
                id: 'try_satellite',
                title: 'Satellite View',
                description: 'Get a bird\'s eye view by switching to satellite mode.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'MAP_SWITCH_SATELLITE_MODE' }
                },
                order: 2
            },
            {
                id: 'adjust_perspective',
                title: 'Master of Perspective',
                description: 'Change your view angle using the up/down arrow keys.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'MAP_PITCH_CHANGE' }
                },
                order: 3
            },
            {
                id: 'zoom_master',
                title: 'Zoom Master',
                description: 'Master map navigation by zooming in and out.',
                validation: {
                    type: QuestValidationType.CLIENT_EVENT,
                    params: { event: 'MAP_ZOOM' }
                },
                order: 3
            }
        ],
        order: 1
    }
];

export const ACHIEVEMENT_QUESTS: Quest[] = [
    // {
    //     id: 'speed_demon',
    //     title: 'The Need for Speed',
    //     description: 'Prove your driving skills.',
    //     type: QuestType.ACHIEVEMENT,
    
    //     steps: [
    //         {
    //             id: 'reach_200',
    //             title: 'Hit 200 km/h',
    //             description: 'Reach a speed of 200 kilometers per hour.',
    //             validation: {
    //                 type: QuestValidationType.CLIENT_EVENT,
    //                 params: { event: 'speed_reached' }
    //             },
    //             order: 1
    //         }
    //     ]
    // },
    // {
    //     id: 'mountain_climber',
    //     title: 'Mountain Conqueror',
    //     description: 'Scale the highest peaks.',
    //     type: QuestType.ACHIEVEMENT,
    //     completedSteps: ['reach_peak'],
    //     steps: [
    //         {
    //             id: 'reach_peak',
    //             title: 'Reach the Summit',
    //             description: 'Drive to the highest point on the map.',
    //             validation: {
    //                 type: QuestValidationType.CLIENT_EVENT,
    //                 params: { event: 'altitude_reached' }
    //             },
    //             order: 1
    //         }
    //     ]
    // },
];

// Combine all quests for easy access
export const ALL_QUESTS: Quest[] = [
    ...TUTORIAL_QUESTS,
    ...ACHIEVEMENT_QUESTS
];
