export abstract class BasePanelUI {
  protected panelContainer: HTMLElement | null = null;

  constructor(protected container: HTMLElement, protected map: mapboxgl.Map) {
    this.panelContainer = container.closest('.panel-container') as HTMLElement;
  }

  abstract render(): void;
  abstract destroy(): void;

  protected collapsePanel(): void {
    if (this.panelContainer) {
      this.panelContainer.classList.add('collapsed');
    }
  }

  protected expandPanel(): void {
    if (this.panelContainer) {
      this.panelContainer.classList.remove('collapsed');
    }
  }

  protected closePanel(): void {
    if (this.panelContainer) {
      this.panelContainer.classList.remove('visible');
    }
  }
} 