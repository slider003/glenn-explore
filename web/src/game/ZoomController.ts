import { InputUtils } from './InputUtils';
import { trackQuestEvent } from './quests/engine/trackQuestEvent';

/**
 * Class to control camera zoom with arrow keys
 */
export class ZoomController {
  private static instance: ZoomController;

  // The current zoom value
  private static currentZoom: number = 0;

  // Zoom limits
  private static minZoom: number = 1;    // Furthest out
  private static maxZoom: number = 40;   // Closest in

  // How much to change zoom per key press
  private static zoomStep: number = 1;

  // Track which arrow keys are pressed
  private static keys: Record<string, boolean> = {
    '+': false,
    '=': false,
    '-': false,
    '_': false
  };

  private constructor() {
    this.setupControls();
  }

  public static initialize(initialZoom: number = 0): void {
    if (!ZoomController.instance) {
      ZoomController.instance = new ZoomController();
      ZoomController.currentZoom = initialZoom;
    }
  }

  public static getInstance(): ZoomController {
    if (!ZoomController.instance) {
      throw new Error('ZoomController not initialized');
    }
    return ZoomController.instance;
  }

  /**
   * Setup keyboard event listeners for arrow keys
   */
  private setupControls(): void {
    // Track key down events
    document.addEventListener('keydown', (e) => {
      // Skip if an input element is focused
      if (InputUtils.isInputElementFocused()) {
        return;
      }
      
      if (ZoomController.keys.hasOwnProperty(e.key)) {
        ZoomController.keys[e.key] = true;
        ZoomController.updateZoom();
      }
    });

    // Track key up events
    document.addEventListener('keyup', (e) => {
      // Skip if an input element is focused
      if (InputUtils.isInputElementFocused()) {
        return;
      }
      
      if (ZoomController.keys.hasOwnProperty(e.key)) {
        ZoomController.keys[e.key] = false;
      }
    });
  }

  /**
   * Update the zoom based on currently pressed keys
   */
  private static updateZoom(): void {
    if (ZoomController.keys['+'] || ZoomController.keys['=']) {
      // Increase zoom (zoom in)
      ZoomController.setZoom(ZoomController.currentZoom + ZoomController.zoomStep);
    } else if (ZoomController.keys['-'] || ZoomController.keys['_']) {
      // Decrease zoom (zoom out)
      ZoomController.setZoom(ZoomController.currentZoom - ZoomController.zoomStep);
    }
  }

  /**
   * Set the current zoom value with constraints
   */
  public static setZoom(value: number): void {
    // Constrain zoom to min/max values
    const newZoom = Math.max(ZoomController.minZoom, Math.min(ZoomController.maxZoom, value));
    
    // Only trigger quest event and save if zoom actually changed
    if (newZoom !== ZoomController.currentZoom) {
      ZoomController.currentZoom = newZoom;
      // Save to localStorage
      localStorage.setItem('cameraZoom', ZoomController.currentZoom.toString());
      // Track quest event
      trackQuestEvent('MAP_ZOOM');
    }
  }

  /**
   * Get the current zoom value
   */
  public static getZoom(): number {
    return ZoomController.currentZoom;
  }

  /**
   * Set the minimum and maximum allowed zoom values
   */
  public static setZoomLimits(min: number, max: number): void {
    ZoomController.minZoom = min;
    ZoomController.maxZoom = max;

    // Re-constrain current zoom to new limits
    ZoomController.setZoom(ZoomController.currentZoom);
  }

  /**
   * Set how much the zoom changes per key press
   */
  public static setZoomStep(step: number): void {
    ZoomController.zoomStep = step;
  }
} 