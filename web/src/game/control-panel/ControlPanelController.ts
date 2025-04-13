import { ControlPanelDependencies, ControlPanelState } from './ControlPanelTypes';
import { ControlPanelUI } from './ControlPanelUI';
import { PlayerStore } from '../stores/PlayerStore';
import { TheaterPanel } from './panels/theater/TheaterPanel';

export class ControlPanelController {
  private ui: ControlPanelUI;
  private state: ControlPanelState = {
    activePanelId: null
  };
  private switchToCar?: () => void;
  private switchToWalking?: () => void;
  private toggleFlyingMode?: () => void;
  private theaterPanel: TheaterPanel;

  constructor(private dependencies: ControlPanelDependencies) {
    this.ui = new ControlPanelUI(dependencies.map, dependencies.onTeleport);
    this.switchToCar = dependencies.switchToCar;
    this.switchToWalking = dependencies.switchToWalking;
    this.toggleFlyingMode = dependencies.toggleFlyingMode;
    
    // Initialize theater immediately
    this.theaterPanel = new TheaterPanel(document.createElement('div'), dependencies.map);
    
    // Setup event listeners for movement mode changes
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Listen for movement mode changes
    window.addEventListener('movement:mode_changed', ((event: CustomEvent) => {
      const { mode } = event.detail;
      if (mode === 'car' && this.switchToCar) {
        this.switchToCar();
      } else if (mode === 'walking' && this.switchToWalking) {
        this.switchToWalking();
      }
    }) as EventListener);
    
    // Listen for car mode changes
    window.addEventListener('car:mode_changed', ((event: CustomEvent) => {
      const { mode } = event.detail;
      if (mode === 'fly' && this.toggleFlyingMode) {
        // Enable flying mode if it's not already enabled
        if (!PlayerStore.isPlayerFlying()) {
          this.toggleFlyingMode();
        }
      } else if (mode === 'normal' && this.toggleFlyingMode) {
        // Disable flying mode if it's currently enabled
        if (PlayerStore.isPlayerFlying()) {
          this.toggleFlyingMode();
        }
      }
    }) as EventListener);
  }

  public destroy(): void {
    // Remove event listeners
    window.removeEventListener('movement:mode_changed', this.setupEventListeners);
    window.removeEventListener('car:mode_changed', this.setupEventListeners);
    
    // Destroy the theater
    this.theaterPanel.destroyTheater();
    
    this.ui.destroy();
  }
} 