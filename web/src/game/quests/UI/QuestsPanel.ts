import { Quest } from '../types/quest';
import { ALL_QUESTS } from '../constants/quests';
import { QuestModal } from './QuestModal';
import './quests.css'
import { BasePanelUI } from '../../control-panel/panels/BasePanelUI';
import { QuestEngine } from '../engine/QuestEngine';
import { QuestProgressTracker } from '../progress/QuestProgressTracker';

export class QuestsPanel extends BasePanelUI {
    private questList: HTMLElement | null = null;
    private modal: QuestModal;
    private questEngine: QuestEngine;
    private progressTracker: QuestProgressTracker;

    constructor(container: HTMLElement, map: mapboxgl.Map) {
        super(container, map);
        this.modal = new QuestModal();
        this.questEngine = QuestEngine.getInstance();
        this.progressTracker = QuestProgressTracker.getInstance();

        // Listen for quest updates
        this.questEngine.onQuestUpdated(this.handleQuestUpdate.bind(this));


    }

    private handleQuestUpdate(quest: Quest): void {
        // Find and update the quest item in the UI
        const questItem = this.questList?.querySelector(`[data-quest-id="${quest.id}"]`);
        if (questItem) {
            this.updateQuestItem(questItem as HTMLElement, quest);
        }
    }

    private createQuestItem(quest: Quest): HTMLElement {
        const item = document.createElement('div');
        item.className = 'quest-item';
        item.setAttribute('data-quest-id', quest.id);
        
        // Get quest status from progress tracker
        const progress = this.progressTracker.getProgress(quest.id);
        const status = this.progressTracker.getQuestStatus(quest.id, quest.steps.length);
        item.classList.add(status);
        
        // Calculate completed steps from progress bitmap
        let completedStepsCount = progress === -1 ? quest.steps.length :
            quest.steps.reduce((count, _, index) => 
                count + (this.progressTracker.isStepCompleted(progress, index) ? 1 : 0), 0);
        
        // Prepare progress text for in-progress quests
        const progressText = status === 'in-progress'
            ? `<span class="quest-progress">(${completedStepsCount}/${quest.steps.length})</span>`
            : '';

        item.innerHTML = `
            <span class="status-icon"></span>
            ${quest.title} ${progressText}
        `;

        // Open modal when clicking on a quest
        item.addEventListener('click', () => {
            this.modal.show(quest);
        });

        return item;
    }

    public render(): void {
        const content = document.createElement('div');
        content.className = 'panel-content quests-panel';
        content.innerHTML = `
            <div class="panel-header">
                <h3>Quests</h3>
            </div>
            <div class="quest-list"></div>
        `;

        this.questList = content.querySelector('.quest-list');
        if (!this.questList) return;

        // Group quests by calculated status
        const activeQuests = ALL_QUESTS.filter(q => 
            this.progressTracker.getQuestStatus(q.id, q.steps.length) === 'in-progress'
        );
        const availableQuests = ALL_QUESTS.filter(q => 
            this.progressTracker.getQuestStatus(q.id, q.steps.length) === 'not-started'
        );
        const completedQuests = ALL_QUESTS.filter(q => 
            this.progressTracker.getQuestStatus(q.id, q.steps.length) === 'completed'
        );

        // Add quest sections
        if (activeQuests.length > 0) {
            this.addQuestSection('Active Quests', activeQuests, 'in-progress');
        }
        if (availableQuests.length > 0) {
            this.addQuestSection('Available Quests', availableQuests, 'not-started');
        }
        if (completedQuests.length > 0) {
            this.addQuestSection('Completed Quests', completedQuests, 'completed');
        }

        // Clear and append the content
        this.container.innerHTML = '';
        this.container.appendChild(content);
    }

    private addQuestSection(title: string, quests: Quest[], status: string): void {
        if (!this.questList) return;

        const section = document.createElement('div');
        section.className = `quest-section ${status}-section`;
        
        const header = document.createElement('div');
        header.className = 'quest-section-header';
        header.innerHTML = `
            <h4>${title}</h4>
            <span class="quest-count">(${quests.length})</span>
        `;
        
        section.appendChild(header);
        
        quests.forEach(quest => {
            const questItem = this.createQuestItem(quest);
            section.appendChild(questItem);
        });

        this.questList.appendChild(section);
    }

    private updateQuestItem(item: HTMLElement, quest: Quest): void {
        // Update status class
        item.className = 'quest-item';
        const status = this.progressTracker.getQuestStatus(quest.id, quest.steps.length);
        item.classList.add(status);

        // Update progress text
        const progress = this.progressTracker.getProgress(quest.id);
        let completedStepsCount = progress === -1 ? quest.steps.length :
            quest.steps.reduce((count, _, index) => 
                count + (this.progressTracker.isStepCompleted(progress, index) ? 1 : 0), 0);

        const progressText = status === 'in-progress'
            ? `<span class="quest-progress">(${completedStepsCount}/${quest.steps.length})</span>`
            : '';

        item.innerHTML = `
            <span class="status-icon"></span>
            ${quest.title} ${progressText}
        `;
    }

    public destroy(): void {
        // Clean up any event listeners or resources
        this.questEngine.removeQuestUpdateListener(this.handleQuestUpdate.bind(this));
        this.modal.hide();
        this.container.innerHTML = '';
    }
}
