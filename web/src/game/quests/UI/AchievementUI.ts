import { AchievementOptions, AchievementElements } from './AchievementTypes';
import { QuestModal } from './QuestModal';
import './achievement.css';

export class AchievementUI {
    private static instance: AchievementUI;
    private elements: Partial<AchievementElements> = {};
    private soundEnabled = true;
    private questModal: QuestModal;

    private constructor() {
        this.questModal = new QuestModal();
        this.initializeUI();
    }

    public static getInstance(): AchievementUI {
        if (!AchievementUI.instance) {
            AchievementUI.instance = new AchievementUI();
        }
        return AchievementUI.instance;
    }

    private initializeUI(): void {
        const container = document.createElement('div');
        container.className = 'achievement-container';
        document.body.appendChild(container);
        this.elements.container = container;
    }

    public showAchievement(options: AchievementOptions): void {
        const achievement = this.createAchievementElement(options);
        this.elements.container?.appendChild(achievement);

        // Play sound effect
        if (this.soundEnabled) {
            const sound = new Audio(options.type === 'quest-complete' 
                ? '/sounds/quest-complete.mp3' 
                : '/sounds/step-complete.mp3');
            sound.volume = 0.5;
            sound.play().catch(() => {
                // Ignore audio play errors
                this.soundEnabled = false;
            });
        }

        // Trigger animation
        requestAnimationFrame(() => {
            achievement.classList.add('show');
        });

        // Remove after duration
        setTimeout(() => {
            achievement.classList.remove('show');
            setTimeout(() => achievement.remove(), 500);
        }, options.duration || 4000);
    }

    private createAchievementElement(options: AchievementOptions): HTMLElement {
        const achievement = document.createElement('div');
        achievement.className = `achievement-notification ${options.type}`;

        const icon = options.type === 'quest-complete' ? '🏆' : '✨';
        
        achievement.innerHTML = `
            <div class="achievement-header">
                <span class="achievement-icon">${options.icon || icon}</span>
                <h3 class="achievement-title">${options.title}</h3>
            </div>
            <div class="achievement-message">${options.message}</div>
            ${this.createProgressBar(options)}
            ${options.xp ? `<div class="achievement-xp">+${options.xp} XP</div>` : ''}
            ${options.quest ? `<button class="view-quest-btn">View Quest</button>` : ''}
        `;

        // Add click handler for view quest button if quest is provided
        if (options.quest) {
            const viewQuestBtn = achievement.querySelector('.view-quest-btn');
            viewQuestBtn?.addEventListener('click', () => {
                this.questModal.show(options.quest!);
            });
        }

        return achievement;
    }

    private createProgressBar(options: AchievementOptions): string {
        if (!options.progress) return '';

        const percentage = (options.progress.current / options.progress.total) * 100;
        return `
            <div class="achievement-progress">
                <div class="achievement-progress-bar" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    public destroy(): void {
        this.elements.container?.remove();
        this.elements = {};
    }
}
