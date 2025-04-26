import { Quest, QuestStep } from '../types/quest';
import { QuestProgressTracker } from '../progress/QuestProgressTracker';
import './quest-modal.css';

export class QuestModal {
    private modal: HTMLElement;
    private content: HTMLElement;
    private currentQuest: Quest | null = null;
    private progressTracker: QuestProgressTracker;

    constructor() {
        this.progressTracker = QuestProgressTracker.getInstance();
        this.modal = document.createElement('div');
        this.modal.className = 'modal quest-modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2></h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="quest-description"></div>
                    <div class="quest-steps"></div>
                </div>
            </div>
        `;

        this.content = this.modal.querySelector('.modal-content')!;
        
        // Close button handler
        const closeButton = this.modal.querySelector('.close-button')!;
        closeButton.addEventListener('click', () => this.hide());

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        document.body.appendChild(this.modal);
    }

    private createStepElement(step: QuestStep, questId: string, stepIndex: number): HTMLElement {
        const progress = this.progressTracker.getProgress(questId);
        const isCompleted = this.progressTracker.isStepCompleted(progress, stepIndex);

        const stepElement = document.createElement('div');
        stepElement.className = `quest-step ${isCompleted ? 'completed' : ''}`;
        stepElement.innerHTML = `
            <div class="step-header">
                <div class="step-title">${isCompleted ? '✓' : '○'} ${step.title}</div>
                <div class="step-status ${isCompleted ? 'completed' : ''}">
                    ${isCompleted ? 'Completed' : 'Incomplete'}
                </div>
            </div>
            <div class="step-description">${step.description}</div>
        `;
        return stepElement;
    }

    public show(quest: Quest): void {
        this.currentQuest = quest;
        
        // Update modal content
        const header = this.modal.querySelector('.modal-header h2')!;
        const description = this.modal.querySelector('.quest-description')!;
        const stepsContainer = this.modal.querySelector('.quest-steps')!;

        header.textContent = quest.title;
        description.textContent = quest.description;

        // Clear and populate steps
        stepsContainer.innerHTML = '';
        quest.steps.forEach((step, index) => {
            const stepElement = this.createStepElement(step, quest.id, index);
            stepsContainer.appendChild(stepElement);
        });

        // Show modal with animation
        this.modal.style.display = 'flex';
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });

        // Add rewards section if quest is completed
        const progress = this.progressTracker.getProgress(quest.id);
        if (this.progressTracker.isQuestCompleted(progress, quest.steps.length)) {
            const rewardsSection = document.createElement('div');
            rewardsSection.className = 'quest-rewards';
            rewardsSection.innerHTML = `
                <div class="trophy-icon">🏆</div>
                <div class="reward-title">Quest Completed!</div>
                <div class="reward-xp">+200 XP</div>
            `;
            this.content.appendChild(rewardsSection);
        }

        // Show modal with animation
        this.modal.style.display = 'flex';
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
    }

    public hide(): void {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.currentQuest = null;
            // Remove rewards section if it exists
            const rewards = this.content.querySelector('.quest-rewards');
            if (rewards) rewards.remove();
        }, 300);
    }
}
