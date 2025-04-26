import { ALL_QUESTS } from '../constants/quests';
import { QuestEngine } from './QuestEngine';

export function initializeQuests(): void {
    const questEngine = QuestEngine.getInstance();
    ALL_QUESTS.forEach(quest => questEngine.registerQuest(quest));
}
