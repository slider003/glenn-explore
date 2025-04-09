import { BasePanelUI } from './BasePanelUI';
import { DEMO_CINEMATICS, Cinematic } from './CinematicTypes';
import { CinematicController } from '../../CinematicController';
import { PlayerStore } from '../../stores/PlayerStore';

export class CinematicPanel extends BasePanelUI {
  private cinematicController: CinematicController;
  private currentlyPlaying: string | null = null;

  constructor(container: HTMLElement, map: mapboxgl.Map) {
    super(container, map);
    // We'll need to get this from dependencies later
    this.cinematicController = new CinematicController(map);
  }

  render(): void {
    const content = document.createElement('div');
    content.className = 'panel-content cinematic-panel';
    
    /*
     <div class="cinematic-filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="official">Official</button>
          <!-- More filters will be added here for user content -->
        </div>
    */
    content.innerHTML = `
    <div class="cinematic-header">
        <h3>Cinematics</h3>
        <button class="close-button" title="Close panel">×</button>
      </div>
      
      <div class="cinematic-list">
        ${this.renderCinematicCards()}
      </div>

      <!-- This section will be used for cinematic creation in the future -->
      <div class="cinematic-actions">
        <button class="create-cinematic-btn" disabled>
          <span>Create Cinematic</span>
          <small>Coming Soon!</small>
        </button>
      </div>
    `;

    // Add close button event listener
    const closeButton = content.querySelector('.close-button');
    closeButton?.addEventListener('click', () => {
      this.closePanel();
    });

    closeButton?.addEventListener('touchend', () => {
      this.closePanel();
    });

    // Add existing event listeners
    const cards = content.querySelectorAll('.cinematic-card');
    cards.forEach(card => {
      const id = card.getAttribute('data-id');
      if (!id) return;

      const cinematic = DEMO_CINEMATICS.find(c => c.id === id);
      if (!cinematic) return;

      const playBtn = card.querySelector('.play-btn');
      playBtn?.addEventListener('click', () => this.playCinematic(cinematic));
    });

    this.container.appendChild(content);
  }

  private renderCinematicCards(): string {
    return DEMO_CINEMATICS.map(cinematic => `
      <div class="cinematic-card" data-id="${cinematic.id}">
        <div class="card-content">
          <div class="card-header">
            <h4>${cinematic.title}</h4>
            <div class="card-meta">
              <span class="author">${cinematic.author}</span>
              <span class="duration">${this.formatDuration(cinematic.duration)}</span>
            </div>
          </div>
          
          <p class="description">${cinematic.description}</p>
          
          <div class="card-footer">
            <div class="tags">
              ${(cinematic.tags || []).map(tag => `
                <span class="tag">${tag}</span>
              `).join('')}
            </div>
            <div class="stats">
              <span class="likes">❤️ ${cinematic.likes || 0}</span>
            </div>
          </div>
        </div>
        
        <button class="play-btn ${this.currentlyPlaying === cinematic.id ? 'playing' : ''}"
                ${this.currentlyPlaying && this.currentlyPlaying !== cinematic.id ? 'disabled' : ''}>
          ${this.currentlyPlaying === cinematic.id ? '⏹️ Stop' : '▶️ Play'}
        </button>
      </div>
    `).join('');
  }

  private updatePlayButtons(): void {
    const buttons = this.container.querySelectorAll('.play-btn') as NodeListOf<HTMLButtonElement>;
    buttons.forEach(button => {
      const card = button.closest('.cinematic-card');
      const id = card?.getAttribute('data-id');
      if (!id) return;

      if (this.currentlyPlaying === id) {
        button.classList.add('playing');
        button.textContent = '⏹️ Stop';
        button.disabled = false;
      } else {
        button.classList.remove('playing');
        button.textContent = '▶️ Play';
        button.disabled = !!this.currentlyPlaying;
      }
    });
  }

  private playCinematic(cinematic: Cinematic): void {
    if (this.currentlyPlaying === cinematic.id) {
      this.cinematicController.stop();
      PlayerStore.setFollowCar(true);
      this.currentlyPlaying = null;
      this.updatePlayButtons();
      return;
    }

    this.currentlyPlaying = cinematic.id;
    this.updatePlayButtons();
    PlayerStore.setFollowCar(false);
    this.cinematicController.playTour(cinematic.waypoints, {
      onComplete: () => {
        this.currentlyPlaying = null;
        this.updatePlayButtons();
      }
    });
  }

  private formatDuration(ms?: number): string {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  destroy(): void {
    if (this.currentlyPlaying) {
      this.cinematicController.stop();
    }
    this.container.innerHTML = '';
  }
} 