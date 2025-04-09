import { BasePanelUI } from '../BasePanelUI';
import { RadioService } from '../../../radio/RadioService';
import './radio-panel.css';

export class RadioPanel extends BasePanelUI {
    private radioService: RadioService;

    constructor(container: HTMLElement, map: mapboxgl.Map) {
        super(container, map);
        this.radioService = RadioService.getInstance();
        this.radioService.play();
    }

    public async render(): Promise<void> {
        const panel = document.createElement('div');
        panel.className = 'panel-content radio-panel';

        panel.innerHTML = `
            <div class="radio-header">
                <h2>📻 Radio</h2>
                <button class="close-button" title="Close panel">×</button>
            </div>

            <div class="radio-stations">
                ${this.radioService.getStations().map(station => `
                    <button class="station-button ${station.id === this.radioService.getCurrentStation() ? 'active' : ''}" 
                            data-station="${station.id}">
                        ${station.label}
                    </button>
                `).join('')}
            </div>

            <div class="radio-player">
                <div class="radio-controls">
                    <button class="play-pause-btn">
                        <span class="play-icon" style="${!this.radioService.isPlaying() ? '' : 'display: none'}">▶️</span>
                        <span class="pause-icon" style="${this.radioService.isPlaying() ? '' : 'display: none'}">⏸️</span>
                    </button>
                    <div class="volume-control">
                        <span>🔊</span>
                        <input type="range" min="0" max="100" value="${this.radioService.getVolume() * 100}" class="volume-slider">
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners(panel);
        this.container.appendChild(panel);
    }

    private setupEventListeners(panel: HTMLElement): void {
        // Close button
        const closeButton = panel.querySelector('.close-button');
        closeButton?.addEventListener('click', () => {
            this.closePanel();
        });

        closeButton?.addEventListener('touchend', () => {
            this.closePanel();
        });

        // Station buttons
        const stationButtons = panel.querySelectorAll('.station-button');
        stationButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const stationId = (e.currentTarget as HTMLElement).dataset.station;
                if (stationId) {
                    this.radioService.changeStation(stationId);
                    stationButtons.forEach(btn => btn.classList.remove('active'));
                    (e.currentTarget as HTMLElement).classList.add('active');
                }
            });
        });

        // Play/Pause button
        const playPauseBtn = panel.querySelector('.play-pause-btn');
        playPauseBtn?.addEventListener('click', () => this.togglePlayPause());

        // Volume control
        const volumeSlider = panel.querySelector('.volume-slider') as HTMLInputElement;
        volumeSlider?.addEventListener('input', (e) => {
            this.radioService.setVolume(Number((e.target as HTMLInputElement).value) / 100);
        });
    }

    private togglePlayPause(): void {
        const playIcon = this.container.querySelector('.play-icon');
        const pauseIcon = this.container.querySelector('.pause-icon');

        if (!this.radioService.isPlaying()) {
            this.radioService.play();
            playIcon?.setAttribute('style', 'display: none');
            pauseIcon?.setAttribute('style', 'display: inline');
        } else {
            this.radioService.pause();
            playIcon?.setAttribute('style', 'display: inline');
            pauseIcon?.setAttribute('style', 'display: none');
        }
    }

    public destroy(): void {
        // Don't stop the radio, just clear the panel
        this.container.innerHTML = '';
    }
} 