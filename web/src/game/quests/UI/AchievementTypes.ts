export interface AchievementOptions {
    type: 'step-complete' | 'quest-complete';
    title: string;
    message: string;
    icon?: string;
    duration?: number;
    progress?: {
        current: number;
        total: number;
    };
    xp?: number;
}

export interface AchievementElements {
    container: HTMLElement;
    achievementElement?: HTMLElement;
}
