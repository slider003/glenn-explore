/**
 * Utility functions for handling input focus
 */
export class InputUtils {
  /**
   * Static flag to track if any input element is currently focused
   */
  private static _isInputFocused: boolean = false;
  
  /**
   * Stored references to event handlers for proper cleanup
   */
  private static focusInHandler = () => InputUtils.handleFocusChange();
  private static focusOutHandler = () => InputUtils.handleFocusChange();
  
  /**
   * Initialize focus tracking
   * Call this once at app startup
   */
  public static initialize(): void {
    // Set initial state based on current focus
    InputUtils._isInputFocused = InputUtils.checkInputElementFocused();
    
    // Add event listeners to track focus
    document.addEventListener('focusin', InputUtils.focusInHandler);
    document.addEventListener('focusout', InputUtils.focusOutHandler);
    
    // Log initial state
    console.log('InputUtils initialized, current focus state:', InputUtils._isInputFocused);
  }
  
  /**
   * Handle focus change events
   */
  private static handleFocusChange(): void {
    // Get previous state for comparison
    const previousState = InputUtils._isInputFocused;
    
    // Update the static flag
    InputUtils._isInputFocused = InputUtils.checkInputElementFocused();
    
    // Log focus changes for debugging
    if (previousState !== InputUtils._isInputFocused) {
  
    }
  }
  
  /**
   * Check if an input element is currently focused
   * Performs actual DOM check
   */
  private static checkInputElementFocused(): boolean {
    const activeElement = document.activeElement;
    
    // Check if the active element is an input, textarea, or any element with contentEditable
    return (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.getAttribute('contenteditable') === 'true' ||
      // Also check for our specific chat input and name input classes
      activeElement?.classList.contains('chat-input') === true ||
      activeElement?.classList.contains('name-change-input') === true
    );
  }
  
  /**
   * Public method to check if input is focused
   * Uses the cached static variable for better performance
   */
  public static isInputElementFocused(): boolean {
    return InputUtils._isInputFocused;
  }
  
  /**
   * Cleanup method to remove event listeners
   * Call when app is shutting down (rarely needed)
   */
  public static cleanup(): void {
    document.removeEventListener('focusin', InputUtils.focusInHandler);
    document.removeEventListener('focusout', InputUtils.focusOutHandler);
  }
} 