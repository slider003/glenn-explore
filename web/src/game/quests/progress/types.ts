export interface UserQuestProgress {
    [questId: string]: number;
}

export interface QuestProgressOperations {
    isStepCompleted(progress: number, stepIndex: number): boolean;
    completeStep(progress: number, stepIndex: number): number;
    isQuestCompleted(progress: number, totalSteps: number): boolean;
    getProgress(questId: string): number;
    updateProgress(questId: string, progress: number): void;
}
