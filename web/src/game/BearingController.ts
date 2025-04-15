import { InputUtils } from './InputUtils';

/**
 * Class to control camera bearing with arrow keys
 */
export class BearingController {
  private static instance: BearingController;

  // The current bearing value
  private static currentBearing: number = 0;

  // Bearing limits
  private static minBearing: number = -10000;    // Furthest out
  private static maxBearing: number = 10000;   // Closest in

  // How much to change bearing per key press
  private static bearingStep: number = 10;

  // Track which arrow keys are pressed
  private static keys: Record<string, boolean> = {
    ArrowLeft: false,
    ArrowRight: false
  };

  private constructor() {
    this.setupControls();
  }

  public static initialize(initialBearing: number = 0): void {
    if (!BearingController.instance) {
      BearingController.instance = new BearingController();
      BearingController.currentBearing = initialBearing;
    }
  }

  public static getInstance(): BearingController {
    if (!BearingController.instance) {
      throw new Error('BearingController not initialized');
    }
    return BearingController.instance;
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
      
      if (BearingController.keys.hasOwnProperty(e.key)) {
        BearingController.keys[e.key] = true;
        BearingController.updateBearing();
      }
    });

    // Track key up events
    document.addEventListener('keyup', (e) => {
      // Skip if an input element is focused
      if (InputUtils.isInputElementFocused()) {
        return;
      }
      
      if (BearingController.keys.hasOwnProperty(e.key)) {
        BearingController.keys[e.key] = false;
      }
    });
  }

  /**
   * Update the bearing based on currently pressed keys
   */
  private static updateBearing(): void {
    if (BearingController.keys.ArrowLeft) {
      // Decrease bearing (bearing out)
      BearingController.setBearing(BearingController.currentBearing + BearingController.bearingStep);
    } else if (BearingController.keys.ArrowRight) {
      // Increase bearing (bearing in)
      BearingController.setBearing(BearingController.currentBearing - BearingController.bearingStep);
    }
  }

  /**
   * Set the current bearing value with constraints
   */
  public static setBearing(value: number): void {
    // Constrain bearing to min/max values
    BearingController.currentBearing = Math.max(BearingController.minBearing, Math.min(BearingController.maxBearing, value));
    // Save to localStorage
    localStorage.setItem('cameraBearing', BearingController.currentBearing.toString());
  }

  /**
   * Get the current bearing value
   */
  public static getBearing(): number {
    return BearingController.currentBearing;
  }

  /**
   * Set the minimum and maximum allowed bearing values
   */
  public static setBearingLimits(min: number, max: number): void {
    BearingController.minBearing = min;
    BearingController.maxBearing = max;

    // Re-constrain current bearing to new limits
    BearingController.setBearing(BearingController.currentBearing);
  }

  /**
   * Set how much the bearing changes per key press
   */
  public static setBearingStep(step: number): void {
    BearingController.bearingStep = step;
  }
} 