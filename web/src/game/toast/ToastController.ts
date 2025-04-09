import { ToastOptions } from './ToastTypes';
import { ToastUI } from './ToastUI';

export class Toast {
  private static ui: ToastUI;

  private static initialize() {
    if (!Toast.ui) {
      Toast.ui = new ToastUI();
    }
  }

  public static show(options: ToastOptions): void {
    Toast.initialize();
    Toast.ui.showToast(options);
  }
} 