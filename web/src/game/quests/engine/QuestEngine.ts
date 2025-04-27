import { Quest } from '../types/quest';
import { EventEmitter } from '../../utils/EventEmitter';
import { QuestProgressTracker } from '../progress/QuestProgressTracker';
import { AchievementUI } from '../UI/AchievementUI';
import { QuestModal } from '../UI/QuestModal';

export class QuestEngine {
    private static instance: QuestEngine;
    private activeQuests: Map<string, Quest> = new Map();
    private progressTracker: QuestProgressTracker;
    private eventEmitter: EventEmitter;
    private questModal: QuestModal;
    private eventListeners: Map<string, Set<string>> = new Map(); // event -> questIds

    private constructor() {
        this.activeQuests = new Map();
        this.eventEmitter = new EventEmitter();
        this.eventListeners = new Map();
        this.progressTracker = QuestProgressTracker.getInstance();
        this.questModal = new QuestModal();
    }

    public static getInstance(): QuestEngine {
        if (!QuestEngine.instance) {
            QuestEngine.instance = new QuestEngine();
        }
        return QuestEngine.instance;
    }

    public registerQuest(quest: Quest): void {
        this.activeQuests.set(quest.id, quest);
        
        // Register event listeners for each step
        quest.steps.forEach(step => {
            if (step.validation.type === 'CLIENT_EVENT') {
                const eventName = step.validation.params.event;
                
                // Initialize set if it doesn't exist
                if (!this.eventListeners.has(eventName)) {
                    this.eventListeners.set(eventName, new Set());
                }
                
                // Add quest ID to the set of listeners for this event
                this.eventListeners.get(eventName)?.add(quest.id);
            }
        });
    }

    public handleEvent(eventName: string): void {
        // Get all quests listening for this event
        const questIds = this.eventListeners.get(eventName) || new Set<string>();
        questIds.forEach(questId => this.handleQuestEvent(questId, eventName));
    }

    public handleQuestEvent(questId: string, eventName: string): void {
        // Get quests listening to this event
        const affectedQuestIds = this.eventListeners.get(eventName);
        if (!affectedQuestIds) return;
        // Check each affected quest
        affectedQuestIds.forEach(questId => {
            const quest = this.activeQuests.get(questId);
            if (!quest) return;
            const status = this.progressTracker.getQuestStatus(quest.id, quest.steps.length);
            if (status === 'completed') return;

            // Check each step in the quest
            quest.steps.forEach((step, stepIndex) => {
                if (step.validation.type === 'CLIENT_EVENT' && 
                    step.validation.params.event === eventName) {
                    
                    // Validate the event data against the step requirements
                    if (this.validateStepCompletion()) {
                        // Auto-start quest if this is the first step being completed
                        const currentStatus = this.progressTracker.getQuestStatus(quest.id, quest.steps.length);
                        if (currentStatus === 'not-started' && stepIndex === 0) {
                            this.progressTracker.initializeQuest(quest.id);
                        }
                        this.completeStep(quest.id, step.id);
                    }
                }
            });
        });
    }

    public trackEvent(eventName: string): void {
        this.handleEvent(eventName);
    }

    private validateStepCompletion(): boolean {
        // Only check if the event matches - that's enough for now
        return true;
    }

    private async completeStep(questId: string, stepId: string): Promise<void> {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;

        // Get current progress and step index
        const progress = this.progressTracker.getProgress(questId);
        const stepIndex = this.progressTracker.getStepIndex(questId, stepId);
        if (stepIndex === -1) return;

        // Check if step is already completed
        if (!this.progressTracker.isStepCompleted(progress, stepIndex)) {
            // Update progress with completed step
            const newProgress = this.progressTracker.completeStep(progress, stepIndex);

            // Find the completed step
            const step = quest.steps[stepIndex];
            if (step) {
                // Count completed steps for progress display
                const completedSteps = quest.steps.filter((_, idx) => 
                    this.progressTracker.isStepCompleted(newProgress, idx)
                ).length;

                // Show step completion achievement
                AchievementUI.getInstance().showAchievement({
                    type: 'step-complete',
                    title: step.title,
                    message: step.description,
                    progress: {
                        current: completedSteps,
                        total: quest.steps.length
                    },
                    xp: 50, // Base XP for completing a step
                    quest // Pass the quest object for the view button
                });

                // If this was the last step, show quest completion achievement and modal
                if (this.progressTracker.isQuestCompleted(newProgress, quest.steps.length)) {
                    setTimeout(() => {
                        AchievementUI.getInstance().showAchievement({
                            type: 'quest-complete',
                            title: quest.title,
                            message: `Completed: ${quest.description}`,
                            xp: 200, // Bonus XP for completing the entire quest
                            quest // Pass the quest object for the view button
                        });
                        
                        // Show quest completion modal after achievement
                        setTimeout(() => {
                            this.questModal.show(quest);
                        }, 1500); // Show modal after achievement animation
                    }, 1000); // Delay quest completion notification
                }
            }

            // Save progress
            await this.progressTracker.updateProgress(questId, newProgress);
        }

        // Emit quest update event with latest quest data
        this.eventEmitter.emit('questUpdated', quest);
    }

    public onQuestUpdated(callback: (quest: Quest) => void): void {
        this.eventEmitter.on('questUpdated', callback);
    }

    public removeQuestUpdateListener(callback: (quest: Quest) => void): void {
        this.eventEmitter.off('questUpdated', callback);
    }
}
