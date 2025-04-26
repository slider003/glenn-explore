import { UserQuestProgress, QuestProgressOperations } from './types';
import { Quest, QuestStep } from '../types/quest';
import { TUTORIAL_QUESTS, ACHIEVEMENT_QUESTS } from '../constants/quests';

export class QuestProgressTracker implements QuestProgressOperations {
    private static instance: QuestProgressTracker;
    private static STORAGE_KEY = 'glenn_quest_progress';
    private progress: UserQuestProgress;

    private constructor() {
        this.progress = this.loadProgress();
    }

    public static getInstance(): QuestProgressTracker {
        if (!QuestProgressTracker.instance) {
            QuestProgressTracker.instance = new QuestProgressTracker();
        }
        return QuestProgressTracker.instance;
    }

    private loadProgress(): UserQuestProgress {
        const stored = localStorage.getItem(QuestProgressTracker.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }

    private saveProgress(): void {
        localStorage.setItem(QuestProgressTracker.STORAGE_KEY, JSON.stringify(this.progress));
    }

    public isStepCompleted(progress: number, stepIndex: number): boolean {
        if (progress === -1) return true;  // Quest completed
        return (progress & (1 << stepIndex)) !== 0;
    }

    public completeStep(progress: number, stepIndex: number): number {
        return progress | (1 << stepIndex);
    }

    public initializeQuest(questId: string): void {
        // Initialize quest with 0 progress (no steps completed)
        this.progress[questId] = 0;
        this.saveProgress();
    }

    public isQuestCompleted(progress: number, totalSteps: number): boolean {
        if (progress === -1) return true;
        return progress === (1 << totalSteps) - 1;
    }

    public getProgress(questId: string): number {
        return this.progress[questId] || 0;
    }

    public async updateProgress(questId: string, progress: number): Promise<void> {
        this.progress[questId] = progress;
        this.saveProgress();
        
        // Simulate API delay (remove this in production)
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Helper method to get step index from step ID
    public getStepIndex(questId: string, stepId: string): number {
        const quest = this.findQuest(questId);
        if (!quest) return -1;
        
        // Find the step index in the quest's steps array
        const stepIndex = quest.steps.findIndex((step: QuestStep) => step.id === stepId);
        return stepIndex;
    }

    private findQuest(questId: string): Quest | undefined {
        // Look through all quest arrays to find the quest
        const allQuests = [...TUTORIAL_QUESTS, ...ACHIEVEMENT_QUESTS];
        return allQuests.find(quest => quest.id === questId);
    }

    // Helper to convert progress to quest status
    public getQuestStatus(questId: string, totalSteps: number): 'not-started' | 'in-progress' | 'completed' {
        const progress = this.getProgress(questId);
        if (progress === -1 || this.isQuestCompleted(progress, totalSteps)) {
            return 'completed';
        }
        if (progress === 0) {
            return 'not-started';
        }
        return 'in-progress';
    }

    // For debugging/development
    public resetProgress(): void {
        this.progress = {};
        this.saveProgress();
    }
}
