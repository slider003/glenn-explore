import { ToastOptions, ToastElements } from './ToastTypes';
import './toast.css';

export class ToastUI {
  private elements: Partial<ToastElements> = {};

  constructor() {
    this.initializeUI();
  }

  private initializeUI(): void {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    this.elements.container = container;
  }

  public showToast(options: ToastOptions): void {
    const toast = this.createToastElement(options);
    this.elements.container?.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 1000);
    }, options.duration || 3000);
  }

  private createToastElement(options: ToastOptions): HTMLElement {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${options.type}`;

    if (options.type === 'mission') {
      toast.innerHTML = `
        <div class="mission-header">
          ${options.icon ? `<span class="mission-icon">${options.icon}</span>` : ''}
          <span>${options.title || ''}</span>
        </div>
        <div class="mission-details">
          <div>${options.message}</div>
        </div>
      `;
    } else {
      toast.textContent = options.message;
    }

    if (options.actions?.length) {
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'toast-actions';
      
      options.actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.label;
        button.onclick = action.onClick;
        actionsContainer.appendChild(button);
      });

      toast.appendChild(actionsContainer);
    }

    return toast;
  }

  public destroy(): void {
    this.elements.container?.remove();
    this.elements = {};
  }
} 