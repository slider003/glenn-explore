export interface ToastOptions {
  type: 'mission' | 'info' | 'success' | 'warning';
  title?: string;
  message: string;
  icon?: string;
  duration?: number;
  actions?: ToastAction[];
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastElements {
  container: HTMLElement;
  toastElement?: HTMLElement;
} 