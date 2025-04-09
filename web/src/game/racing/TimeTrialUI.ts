import { BasePanelUI } from '../control-panel/panels/BasePanelUI';
import { RaceStatus, RaceTrack, TimeTrialDependencies, TimeTrialUICallbacks } from './TimeTrialTypes';
import { RACE_TRACKS, getAllTracks } from './RaceTrackData';
import './timeTrialPanel.css';

export class TimeTrialUI extends BasePanelUI {
  private panelElement: HTMLElement | null = null;
  private hudElement: HTMLElement | null = null;
  private raceCompletedElement: HTMLElement | null = null;
  private countdownElement: HTMLElement | null = null;
  private selectedTrackId: string | null = null;
  private isRaceActive: boolean = false;
  private animationFrameId: number | null = null;

  constructor(
    protected container: HTMLElement,
    protected map: mapboxgl.Map,
    private callbacks: TimeTrialUICallbacks
  ) {
    super(container, map);
  }

  /**
   * Render the time trial panel
   */
  public render(): void {
    this.panelElement = document.createElement('div');
    this.panelElement.className = 'time-trial-panel';
    this.container.appendChild(this.panelElement);

    // Render track selection UI
    this.renderTrackSelection();
  }

  /**
   * Render the track selection UI
   */
  private renderTrackSelection(): void {
    if (!this.panelElement) return;

    // Clear panel first
    this.panelElement.innerHTML = `
      <h2>Time Trial Races</h2>
      <div class="track-selection">
        <div class="track-list"></div>
      </div>
    `;

    // Render tracks into the track list
    const trackList = this.panelElement.querySelector('.track-list') as HTMLElement;
    if (trackList) {
      this.renderTrackList(trackList);
    }
  }

  /**
   * Render the track list
   */
  private renderTrackList(container: HTMLElement): void {
    const tracks = getAllTracks();
    
    container.innerHTML = tracks.map(track => `
      <div class="track-item" data-track-id="${track.id}">
        <div class="track-info">
          <div class="track-header">
            <h3>${track.name}</h3>
            <div class="track-difficulty difficulty-${track.difficulty}">
              ${track.difficulty}
            </div>
          </div>
          ${track.bestTime ? `
            <div class="track-record">
              Best: ${this.formatTime(track.bestTime * 1000)}
              ${track.bestTimePlayer ? `by ${track.bestTimePlayer}` : ''}
            </div>
          ` : ''}
        </div>
        <button class="start-race-button">Start Race</button>
      </div>
    `).join('');

    // Add click handlers for play buttons
    container.querySelectorAll('.start-race-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent track selection when clicking button
        const trackId = (button.closest('.track-item') as HTMLElement)?.dataset.trackId;
        if (trackId && this.callbacks.onStartRace) {
          this.callbacks.onStartRace(trackId);
        }
      });
    });
  }

  /**
   * Select a track
   */
  private selectTrack(trackId: string): void {
    this.selectedTrackId = trackId;

    // Update UI to show selected track
    const trackItems = this.panelElement?.querySelectorAll('.track-item');
    if (trackItems) {
      trackItems.forEach(item => {
        if (item instanceof HTMLElement && item.dataset.trackId === trackId) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }

  /**
   * Show race HUD when a race starts
   */
  public showRaceHUD(): void {
    // Update panel to show race in progress
    if (this.panelElement) {
      this.panelElement.classList.add('race-active');
      this.panelElement.innerHTML = `
      <div class="time-trial-controls">
      <h2>Race in Progress</h2>
          <button class="quit-race-button">Exit Race</button>
        </div>
      `;

      // Add quit button handler
      const quitButton = this.panelElement.querySelector('.quit-race-button');
      if (quitButton) {
        quitButton.addEventListener('click', () => {
          this.callbacks.onQuitRace();
        });
      }
    }

    // Collapse the panel
    this.collapsePanel();

    // Create HUD element if it doesn't exist
    if (!this.hudElement) {
      this.hudElement = document.createElement('div');
      this.hudElement.className = 'race-hud';
      document.body.appendChild(this.hudElement);
    }

    // Initialize HUD content
    this.hudElement.style.display = 'flex';
    this.hudElement.innerHTML = `
      <div class="race-timer">0.000 seconds</div>
      <div class="race-info-row">
        <div class="race-checkpoints">Checkpoint: 0/0</div>
        <div class="personal-best">Best: --:--:---</div>
      </div>
    `;

    this.isRaceActive = true;
  }

  /**
   * Update the race HUD with current status
   */
  public updateRaceHUD(status: RaceStatus): void {
    if (!this.hudElement || !this.isRaceActive) return;

    // Update timer
    const timerElement = this.hudElement.querySelector('.race-timer');
    if (timerElement) {
      timerElement.textContent = this.formatTime(status.currentTime);
    }

    // Update checkpoint counter
    const checkpointElement = this.hudElement.querySelector('.race-checkpoints');
    if (checkpointElement) {
      checkpointElement.textContent = `Checkpoint: ${status.currentCheckpoint}/${status.totalCheckpoints}`;
    }

    // Update personal best comparison
    const bestElement = this.hudElement.querySelector('.personal-best');
    if (bestElement && status.bestTime) {
      bestElement.textContent = `Best: ${this.formatTime(status.bestTime)}`;
      
      // Show comparison if we have a value
      if (status.compareToBest !== null) {
        const diff = status.compareToBest;
        const prefix = diff <= 0 ? '-' : '+';
        bestElement.textContent += ` (${prefix}${this.formatTime(Math.abs(diff))})`;
        
        // Add color for ahead/behind
        if (bestElement instanceof HTMLElement) {
          bestElement.style.color = diff <= 0 ? '#44cc44' : '#cc4444';
        }
      } else {
        if (bestElement instanceof HTMLElement) {
          bestElement.style.color = ''; // Reset color
        }
      }
    }
  }

  /**
   * Show race completion screen
   */
  public showRaceCompleted(time: number, isPersonalBest: boolean): void {
    // Hide HUD
    if (this.hudElement) {
      this.hudElement.style.display = 'none';
    }

    // Create completion overlay if it doesn't exist
    if (!this.raceCompletedElement) {
      this.raceCompletedElement = document.createElement('div');
      this.raceCompletedElement.className = 'race-completed';
      document.body.appendChild(this.raceCompletedElement);
    }

    // Show completion overlay
    this.raceCompletedElement.style.display = 'block';
    this.raceCompletedElement.innerHTML = `
      <h3>${isPersonalBest ? 'New Personal Best!' : 'Race Completed!'}</h3>
      <div class="race-time">${this.formatTime(time)}</div>
      <div class="race-completed-buttons">
        <button class="exit-button">Back to Tracks</button>
      </div>
    `;

    // Add button handler
    const exitButton = this.raceCompletedElement.querySelector('.exit-button');
    if (exitButton) {
      exitButton.addEventListener('click', () => {
        this.hideRaceCompleted();
        this.callbacks.onQuitRace();
      });
    }

    // Show track selection UI again
    this.renderTrackSelection();
  }

  /**
   * Hide race completion screen
   */
  private hideRaceCompleted(): void {
    if (this.raceCompletedElement) {
      this.raceCompletedElement.style.display = 'none';
    }
  }

  /**
   * Show countdown before race starts
   */
  public showCountdown(seconds: number, onComplete: () => void): void {
    // Create countdown element
    if (!this.countdownElement) {
      this.countdownElement = document.createElement('div');
      this.countdownElement.className = 'countdown-overlay';
      document.body.appendChild(this.countdownElement);
    }

    let currentSecond = seconds;
    
    const updateCountdown = () => {
      if (currentSecond <= 0) {
        // Show GO text
        this.countdownElement!.innerHTML = `<div class="countdown-number">GO!</div>`;
        
        // Hide after a brief delay
        setTimeout(() => {
          if (this.countdownElement) {
            this.countdownElement.style.display = 'none';
          }
          onComplete();
        }, 1000);
        return;
      }
      
      // Update countdown number
      this.countdownElement!.innerHTML = `<div class="countdown-number">${currentSecond}</div>`;
      
      // Decrement counter
      currentSecond--;
      
      // Continue countdown
      setTimeout(updateCountdown, 1000);
    };
    
    // Start countdown
    this.countdownElement.style.display = 'flex';
    updateCountdown();
  }

  /**
   * Hide race HUD and show panel again
   */
  public hideRaceHUD(): void {
    // Hide HUD
    if (this.hudElement) {
      this.hudElement.style.display = 'none';
    }

    // Hide completion overlay if visible
    this.hideRaceCompleted();

    // Remove race-active class and show track selection UI again
    if (this.panelElement) {
      this.panelElement.classList.remove('race-active');
    }

    // Expand the panel
    this.expandPanel();
    
    this.renderTrackSelection();

    this.isRaceActive = false;
  }

  /**
   * Format time in ss.ms format with seconds label
   */
  private formatTime(timeMs: number): string {
    const totalSeconds = timeMs / 1000;
    const seconds = Math.floor(totalSeconds);
    const milliseconds = Math.floor((totalSeconds % 1) * 1000);
    
    return `${seconds}.${milliseconds.toString().padStart(3, '0')} seconds`;
  }

  /**
   * Clean up resources when the UI is destroyed
   */
  public destroy(): void {
    // Remove panel
    if (this.panelElement) {
      this.panelElement.remove();
      this.panelElement = null;
    }

    // Remove HUD
    if (this.hudElement) {
      this.hudElement.remove();
      this.hudElement = null;
    }

    // Remove race completed overlay
    if (this.raceCompletedElement) {
      this.raceCompletedElement.remove();
      this.raceCompletedElement = null;
    }

    // Remove countdown overlay
    if (this.countdownElement) {
      this.countdownElement.remove();
      this.countdownElement = null;
    }

    // Cancel animation frame if active
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.isRaceActive = false;
  }

  /**
   * Update the track list with current records
   */
  public updateTrackList(): void {
    const trackList = this.container.querySelector('.track-list') as HTMLElement;
    if (!trackList) return;

    this.renderTrackList(trackList);
  }
} 