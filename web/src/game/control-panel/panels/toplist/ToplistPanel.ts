import { BasePanelUI } from '../BasePanelUI';
import { ToplistClient } from './ToplistClient';
import { ToplistCategory, ToplistEntry } from './types/Toplist';
import './toplist-panel.css';

export class ToplistPanel extends BasePanelUI {
    private client: ToplistClient;
    private currentCategory: ToplistCategory = 'time';
    private isLoading = false;
    private error: string | null = null;

    constructor(container: HTMLElement, map: mapboxgl.Map) {
        super(container, map);
        this.client = new ToplistClient();
    }

    public async render(): Promise<void> {
        const panel = document.createElement('div');
        panel.className = 'panel-content toplist-panel';

        panel.innerHTML = `
            <div class="toplist-header">
                <h2>🏆 Toplists</h2>
                <button class="close-button" title="Close panel">×</button>
            </div>

            <div class="toplist-tabs">
                <button class="toplist-tab active" data-category="time">
                    ⏱️ Time Online
                </button>
                <button class="toplist-tab" data-category="kilometers">
                    🚗 Distance Driven
                </button>
            </div>

            <div class="toplist-content">
                <div class="loading-overlay">Loading toplists...</div>
            </div>

            <button class="refresh-button">
                <span class="refresh-icon">🔄</span>
                Refresh
            </button>
        `;

        // Add event listeners
        this.setupEventListeners(panel);

        // First add to DOM
        this.container.appendChild(panel);

        // Then fetch data
        setTimeout(async () => {
            await this.fetchData();
        }, 1000);
    }

    private async fetchData(): Promise<void> {
        if (this.isLoading) return;

        const content = this.container.querySelector('.toplist-content');
        if (!content) {
            console.error('Could not find .toplist-content element');
            return;
        }

        this.isLoading = true;
        this.updateRefreshButton();

        try {
            let data: ToplistEntry[];
            if (this.currentCategory === 'kilometers') {
                data = await this.client.getKilometersToplist();
            } else {
                data = await this.client.getTimeToplist();
            }
            content.innerHTML = this.renderEntries(data, this.currentCategory);
        } catch (err) {
            console.error('Failed to fetch toplist:', err);
            this.error = 'Failed to load toplist. Please try again.';
            content.innerHTML = `
                <div class="error-message">
                    ${this.error}
                </div>
            `;
        } finally {
            this.isLoading = false;
            this.updateRefreshButton();
        }
    }

    private renderEntries(entries: ToplistEntry[], category: ToplistCategory): string {
        if (entries.length === 0) {
            return '<div class="loading-overlay">No entries yet!</div>';
        }

        return entries.map(entry => `
            <div class="toplist-entry ${entry.rank <= 3 ? 'top-' + entry.rank : ''}">
                <div class="entry-left">
                    <span class="entry-rank">
                        ${this.getRankEmoji(entry.rank)}
                    </span>
                    <span class="entry-name">${entry.playerName}</span>
                </div>
                <span class="entry-value">${category === 'time' ? entry.value : entry.valueString}</span>
            </div>
        `).join('');
    }

    private getRankEmoji(rank: number): string {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${rank}.`;
        }
    }

    private updateRefreshButton(): void {
        const button = this.container.querySelector('.refresh-button');
        if (!button) return;

        button.classList.toggle('loading', this.isLoading);
        button.setAttribute('disabled', this.isLoading ? 'true' : 'false');
    }

    private setupEventListeners(panel: HTMLElement): void {
        // Close button
        const closeButton = panel.querySelector('.close-button');
        closeButton?.addEventListener('click', () => {
            this.closePanel();
        });
        
        // Add touch support for the close button
        closeButton?.addEventListener('touchend', () => {
           this.closePanel();
        });

        // Refresh button
        const refreshButton = panel.querySelector('.refresh-button');
        refreshButton?.addEventListener('click', () => this.fetchData());

        // Tab switching
        const tabs = panel.querySelectorAll('.toplist-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = (e.currentTarget as HTMLElement).dataset.category as ToplistCategory;
                if (category && !this.isLoading) {
                    this.currentCategory = category;
                    tabs.forEach(t => t.classList.remove('active'));
                    (e.currentTarget as HTMLElement).classList.add('active');
                    this.fetchData();
                }
            });
        });
    }

    public destroy(): void {
        this.container.innerHTML = '';
    }
} 