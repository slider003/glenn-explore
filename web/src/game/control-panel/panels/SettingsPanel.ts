import { BasePanelUI } from './BasePanelUI';
import { PlayerStore } from '../../stores/PlayerStore';
import { ZoomController } from '../../ZoomController';
import { PitchController } from '../../PitchController';
import { DEFAULT_COORDINATES } from '../../../config';
import './settings-panel.css';

export class SettingsPanel extends BasePanelUI {
  /**
   * TODO: Future Enhancements
   * - Add keyboard shortcuts for camera controls (WASD for movement, QE for height)
   * - Add tooltips explaining each control's function
   * - Consider adding camera smoothing/easing options
   */

  constructor(container: HTMLElement, map: mapboxgl.Map) {
    super(container, map);
  }

  render(): void {
    const content = document.createElement('div');
    content.className = 'panel-content settings-panel';

    // Get current movement mode from PlayerStore (default to car if not set)
    const movementMode = PlayerStore.getMovementMode() || 'car';
    const carMode = PlayerStore.getCarMode() || 'normal';

    content.innerHTML = `
      <button class="close-button" title="Close panel">×</button>
      <div class="settings-header">
        <h3>Settings</h3>
      </div>
      
      <div class="settings-list">
        <!-- Movement Mode Section (NEW) -->
        <div class="settings-section movement-settings">
          <h4>Movement Mode</h4>
          <div class="mode-toggle">
            <button class="mode-btn ${movementMode === 'car' ? 'active' : ''}" data-movement-mode="car">
              🚗 Car
            </button>
            <button class="mode-btn ${movementMode === 'walking' ? 'active' : ''}" data-movement-mode="walking">
              🚶 Walking
            </button>
          </div>
        </div>

        <!-- Car Mode Section (NEW - conditionally shown) -->
        <div class="settings-section car-mode-settings ${movementMode === 'car' ? 'visible' : ''}">
          <h4>Car Mode</h4>
          <div class="mode-toggle">
            <button class="mode-btn ${carMode === 'normal' ? 'active' : ''}" data-car-mode="normal">
              🛣️ Normal
            </button>
            <button class="mode-btn ${carMode === 'fly' ? 'active' : ''}" data-car-mode="fly">
              ✈️ Fly Mode
            </button>
          </div>
        </div>

        <div class="settings-section camera-settings">
          <h4>Camera Mode</h4>
          <div class="mode-toggle">
            <button class="mode-btn ${PlayerStore.isFollowingCar() ? 'active' : ''}" data-mode="follow">
              Follow Car
            </button>
            <button class="mode-btn ${!PlayerStore.isFollowingCar() ? 'active' : ''}" data-mode="free">
              Free
            </button>
          </div>

          <div class="free-camera-help ${!PlayerStore.isFollowingCar() ? '' : 'hidden'}">
            <small>🖱️ You can move with mouse and zoom with mouse wheel</small>
          </div>

          <div class="camera-controls ${PlayerStore.isFollowingCar() ? '' : 'hidden'}">
            <div class="control-group">
              <button class="control-btn zoom-in" title="Zoom In">
                <span>🔍</span> Zoom In
              </button>
              <button class="control-btn zoom-out" title="Zoom Out">
                <span>🔍</span> Zoom Out
              </button>
            </div>

            <div class="control-group">
              <button class="control-btn camera-up" title="Move Camera Up">
                <span>⬆️</span> Camera Up
              </button>
              <button class="control-btn camera-down" title="Move Camera Down">
                <span>⬇️</span> Camera Down
              </button>
            </div>
          </div>

          <div class="camera-reset">
            <button class="control-btn reset" title="Reset Camera">
              <span>🔄</span> Reset Camera
            </button>
          </div>
        </div>

        <div class="settings-section map-settings">
          <h4>Map Mode</h4>
          <div class="mode-toggle">
            <button class="mode-btn ${PlayerStore.getMap() === 'standard' ? 'active' : ''}" data-map-mode="standard">
              Standard
            </button>
            <button class="mode-btn ${PlayerStore.getMap() === 'satellite' ? 'active' : ''}" data-map-mode="satellite">
              Satellite
            </button>
          </div>

          <h4>Time of Day</h4>
          <div class="mode-toggle">
            <button class="mode-btn ${PlayerStore.getTimeOfDay() === 'day' ? 'active' : ''}" data-time-mode="day">
              ☀️ Day
            </button>
            <button class="mode-btn ${PlayerStore.getTimeOfDay() === 'night' ? 'active' : ''}" data-time-mode="night">
              🌙 Night
            </button>
          </div>

          <h4>Collision</h4>
          <div class="mode-toggle">
            <button class="mode-btn ${PlayerStore.getCollisionEnabled() ? 'active' : ''}" data-collision="enabled">
              💥 Enabled
            </button>
            <button class="mode-btn ${!PlayerStore.getCollisionEnabled() ? 'active' : ''}" data-collision="disabled">
              🚗 Disabled
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.setupEventListeners(content);

    this.container.appendChild(content);
  }

  private setupEventListeners(content: HTMLElement): void {
    // Close button
    const closeButton = content.querySelector('.close-button');
    closeButton?.addEventListener('click', () => {
      this.closePanel();
    });

    closeButton?.addEventListener('touchend', () => {
      this.closePanel();
    });

    // Movement Mode toggle (NEW)
    const movementModeButtons = content.querySelectorAll('.movement-settings .mode-btn');
    movementModeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.movementMode;

        // Update UI
        movementModeButtons.forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');

        // Show/hide car mode section based on selection
        const carModeSection = content.querySelector('.car-mode-settings');
        carModeSection?.classList.toggle('visible', mode === 'car');

        // Update store 
        PlayerStore.setMovementMode(mode as 'car' | 'walking');

        // Dispatch event to notify other parts of the app
        window.dispatchEvent(new CustomEvent('movement:mode_changed', {
          detail: { mode }
        }));
      });
    });

    // Car Mode toggle (NEW)
    const carModeButtons = content.querySelectorAll('.car-mode-settings .mode-btn');
    carModeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.carMode;

        // Update UI
        carModeButtons.forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');

        // Update store
        PlayerStore.setCarMode(mode as 'normal' | 'fly');

        // Dispatch event to notify other parts of the app
        window.dispatchEvent(new CustomEvent('car:mode_changed', {
          detail: { mode }
        }));
      });
    });

    // Camera Mode toggle
    const cameraModeButtons = content.querySelectorAll('.camera-settings .mode-btn');
    cameraModeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode;
        const isFollowMode = mode === 'follow';

        // Update UI
        cameraModeButtons.forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');

        // Update controls visibility
        const controls = content.querySelector('.camera-controls');
        const helpText = content.querySelector('.free-camera-help');
        controls?.classList.toggle('hidden', !isFollowMode);
        helpText?.classList.toggle('hidden', isFollowMode);

        // Update state
        PlayerStore.setFollowCar(isFollowMode);
      });
    });

    // Map Mode toggle
    const mapModeButtons = content.querySelectorAll('.map-settings .mode-btn[data-map-mode]');
    mapModeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mapMode;
        PlayerStore.setMap(mode as 'satellite' | 'standard');
        PlayerStore._saveStateToLocalStorage();
        setTimeout(() => {
          // Refresh the page to apply the map style change
          window.location.reload();
        }, 1000);
        // Update UI
        mapModeButtons.forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
      });
    });

    // Time of Day toggle
    const timeModeButtons = content.querySelectorAll('.map-settings .mode-btn[data-time-mode]');
    timeModeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.timeMode;
        PlayerStore.setTimeOfDay(mode as 'day' | 'night');
        // Update UI
        timeModeButtons.forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');

        // Update map light preset
        this.map.setConfigProperty('basemap', 'lightPreset', mode);
      });
    });

    // Camera controls
    const zoomInBtn = content.querySelector('.zoom-in');
    zoomInBtn?.addEventListener('click', () => {
      const currentZoom = ZoomController.getZoom();
      ZoomController.setZoom(currentZoom + 0.5);
    });

    const zoomOutBtn = content.querySelector('.zoom-out');
    zoomOutBtn?.addEventListener('click', () => {
      const currentZoom = ZoomController.getZoom();
      ZoomController.setZoom(currentZoom - 0.5);
    });

    const cameraUpBtn = content.querySelector('.camera-up');
    cameraUpBtn?.addEventListener('click', () => {
      const currentPitch = PitchController.getPitch();
      PitchController.setPitch(currentPitch - 5);
    });

    const cameraDownBtn = content.querySelector('.camera-down');
    cameraDownBtn?.addEventListener('click', () => {
      const currentPitch = PitchController.getPitch();
      PitchController.setPitch(currentPitch + 5);
    });

    const resetBtn = content.querySelector('.reset');
    resetBtn?.addEventListener('click', () => {
      // Reset camera to default values
      PlayerStore.setFollowCar(true);
      PitchController.setPitch(DEFAULT_COORDINATES.pitch);
      ZoomController.setZoom(DEFAULT_COORDINATES.zoom);
    });

    // Add Collision toggle
    const collisionButtons = content.querySelectorAll('.map-settings .mode-btn[data-collision]');
    collisionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.collision;
        const isEnabled = mode === 'enabled';

        // Update UI
        collisionButtons.forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');

        // Update state
        PlayerStore.setCollisionEnabled(isEnabled);
        localStorage.setItem('collisionEnabled', isEnabled.toString());
      });
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
} 