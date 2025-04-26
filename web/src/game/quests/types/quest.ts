import { ALL_QUESTS } from "../constants/quests";

export enum QuestType {
    TUTORIAL = 'TUTORIAL',
    DAILY = 'DAILY',
    ACHIEVEMENT = 'ACHIEVEMENT'
}

// Define all possible quest events
export type QuestEvent = 
    | 'MAP_SWITCH_DAY_MODE'
    | 'MAP_SWITCH_SATELLITE_MODE'
    | 'MAP_ZOOM'
    | 'MAP_PITCH_CHANGE'
    | 'VEHICLE_CHANGE'
    | 'CHAT_SEND'
    | 'MODEL_SELECTOR_OPEN'
    | 'MODEL_SELECTED'
    | 'CHAT_OPEN'
    | 'CHAT_MESSAGE_SENT'
    | 'NAME_CHANGED';

export enum QuestValidationType {
    CLIENT_EVENT = 'CLIENT_EVENT',
    SERVER_STATE = 'SERVER_STATE',
    COMPOUND = 'COMPOUND'
}

// Type to extract all possible event names from quests
export type QuestEventName = (typeof ALL_QUESTS)[number]['steps'][number]['validation']['params']['event'];

export interface QuestValidation {
    type: QuestValidationType;
    params: {
        event: QuestEvent;
    };
}

export interface QuestReward {
    type: string;
    amount: number;
}

export interface QuestStep {
    id: string;
    title: string;
    description: string;
    validation: QuestValidation;
    order: number;
}

export type QuestStatus = 'not-started' | 'in-progress' | 'completed';

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: QuestType;
    steps: QuestStep[];
    completedSteps?: string[]; // Array of completed step IDs
    reward?: QuestReward;
    order?: number;
}

export interface QuestStepProgress {
    stepId: string;
    completed: boolean;
    completedAt?: Date;
}

export interface QuestProgress {
    questId: string;
    completed: boolean;
    completedAt?: Date;
    steps: QuestStepProgress[];
}

// This will be used to track all quest progress for a player
export interface PlayerQuestProgress {
    playerId: string;
    quests: Record<string, QuestProgress>;
}
