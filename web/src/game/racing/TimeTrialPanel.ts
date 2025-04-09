import { BasePanelUI } from '../control-panel/panels/BasePanelUI';
import { TimeTrialController } from './TimeTrialController';
import { TimeTrialUI } from './TimeTrialUI';
import { TeleportOptions } from '../../types/teleport';

export class TimeTrialPanel extends BasePanelUI {
  private controller: TimeTrialController;
  private ui: TimeTrialUI;

  constructor(container: HTMLElement, map: mapboxgl.Map, onTeleport: (teleportOptions: TeleportOptions) => void) {
    super(container, map);
    const threebox = window.tb;

    if (!threebox) {
      console.error('Vehicle or Threebox not found. Time Trial feature requires these components.');
    }

    // Create controller
    this.controller = new TimeTrialController({
      map: this.map,
      tb: threebox || null,
      onTeleport
    });

    // Create UI with callbacks
    this.ui = new TimeTrialUI(container, map, {
      onStartRace: (trackId: string) => this.controller.startRace(trackId),
      onQuitRace: () => this.controller.quitRace()
    });

    // Connect controller and UI
    this.controller.setUI(this.ui);
  }

  /**
   * Render the panel
   */
  public render(): void {
    this.ui.render();
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.controller.destroy();
    this.ui.destroy();
  }
} 