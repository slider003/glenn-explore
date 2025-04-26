import { QuestEngine } from '../engine/QuestEngine';

export function trackQuestEvent(event: string): void {
    // Trigger quest event validation
    QuestEngine.getInstance().handleEvent(event);
}
