import { QuestEngine } from './QuestEngine';

/**
 * Helper function to track quest-related events from anywhere in the UI
 * @param eventName The name of the event (e.g., 'zoom_changed', 'speed_reached')
 * @param data Additional data for the event (e.g., { value: 200 })
 */
export function trackQuestEvent(eventName: string): void {
    const questEngine = QuestEngine.getInstance();
    questEngine.trackEvent(eventName);
}
