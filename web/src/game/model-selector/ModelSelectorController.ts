import { PLAYER_MODELS } from '../player/types/PlayerModels';
import { CAR_MODELS } from '../player/types/CarModels';
import { PlayerStore } from '../stores/PlayerStore';
import { PlayerController } from '../player/PlayerController';
import './model-selector-dialog.css';

export class ModelSelectorController {
    private dialogElement: HTMLElement | null = null;
    private onClose?: () => void;

    constructor(
        private map: mapboxgl.Map,
        private playerController: PlayerController
    ) {
        // Bind methods
        this.handleModelSelect = this.handleModelSelect.bind(this);
        this.close = this.close.bind(this);
        
    }

    public show(onClose?: () => void): void {
        this.onClose = onClose;
        this.createDialog();
    }

    private createDialog(): void {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'model-selector-overlay';

        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'model-selector-dialog';

        // Create header section
        const header = document.createElement('div');
        header.className = 'model-selector-header';
        header.innerHTML = `
            <div class="header-content">
                <h2>Click on the model you want to use</h2>
                <div class="model-selector-subtitle">You can change this anytime in settings ⚙️</div>
            </div>
            <button class="model-selector-close">×</button>
        `;

        // Add promo text
        const promoText = document.createElement('div');
        promoText.className = 'model-selector-promo';
        promoText.innerHTML = `
            Want your own model or car in the game? Send me an image of what you want!<br>
            <a href="mailto:mail@playglenn.com">mail@playglenn.com</a> - I'll turn it into a 3D model for you <span class="price">2USD/model</span><br>
            <a href="https://discord.gg/4dgtFKQP " target="_blank">Join our Discord community!</a>
            <p>https://discord.gg/4dgtFKQP </p>
        `;

        // Create content
        const content = document.createElement('div');
        content.innerHTML = this.createContent();

        // Add event listeners
        header.querySelector('.model-selector-close')?.addEventListener('click', this.close);
        content.addEventListener('click', this.handleModelSelect);

        // Assemble dialog
        dialog.appendChild(header);
        dialog.appendChild(promoText);
        dialog.appendChild(content);
        overlay.appendChild(dialog);

        // Add to document
        document.body.appendChild(overlay);
        this.dialogElement = overlay;
    }

    private createContent(): string {
        const currentCarModel = PlayerStore.getState().modelType;
        const isInCarMode = PlayerStore.getMovementMode() === 'car';

        return `
            <div class="model-selector-section">
                <h3>🚗 Cars</h3>
                <div class="model-grid">
                    ${Object.entries(CAR_MODELS).map(([id, config]) => `
                        <div class="model-card ${isInCarMode && currentCarModel === id ? 'selected' : ''}" data-model-id="${id}" data-model-type="car">
                            <div class="model-preview ${!config.model.screenshot ? 'no-image' : ''}">
                                ${config.model.screenshot 
                                    ? `<img src="${config.model.screenshot}" alt="${id}">`
                                    : id
                                }
                            </div>
                            <p class="model-name">${id}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="model-selector-section">
                <h3>🚶 Characters</h3>
                <div class="model-grid">
                    ${Object.entries(PLAYER_MODELS).map(([id, config]) => `
                        <div class="model-card ${!isInCarMode && currentCarModel === id ? 'selected' : ''}" data-model-id="${id}" data-model-type="character">
                            <div class="model-preview ${!config.model.screenshot ? 'no-image' : ''}">
                                ${config.model.screenshot 
                                    ? `<img src="${config.model.screenshot}" alt="${id}">`
                                    : id
                                }
                            </div>
                            <p class="model-name">${id}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    private async handleModelSelect(event: Event): Promise<void> {
        const target = event.target as HTMLElement;
        const card = target.closest('.model-card') as HTMLElement;
        
        if (!card) return;

        const modelId = card.dataset.modelId;
        const modelType = card.dataset.modelType;

        if (!modelId || !modelType) return;

        // Use the new switchState method to handle both model and state change
        await this.playerController.switchState(
            modelId, 
            modelType === 'car' ? 'car' : 'walking'
        );

        // Close dialog
        this.close();
    }

    public close(): void {
        if (this.dialogElement) {
            this.dialogElement.remove();
            this.dialogElement = null;
        }
        if (this.onClose) {
            this.onClose();
        }
    }

    public destroy(): void {
        this.close();
    }
} 