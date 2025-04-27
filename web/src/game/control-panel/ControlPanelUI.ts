import { MenuItem } from './ControlPanelTypes';
import { MENU_ITEMS } from './menu-items';
import { BasePanelUI } from './panels/BasePanelUI';
import './control-panel.css';
import { TeleportOptions } from '../../types/teleport';
export class ControlPanelUI {
    private container: HTMLElement;
    private menuBar: HTMLElement;
    private panelContainer: HTMLElement;
    private activePanel: BasePanelUI | null = null;
    private activePanelId: string | null = null;
    private map: mapboxgl.Map;
    private menuItems: MenuItem[];
    private onTeleport: (teleportOptions: TeleportOptions) => void;
    constructor(map: mapboxgl.Map, onTeleport: (teleportOptions: TeleportOptions) => void) {
        this.menuItems = MENU_ITEMS();
        this.onTeleport = onTeleport;
        this.map = map;
        this.container = this.createContainer();
        this.menuBar = this.createMenuBar();
        this.panelContainer = this.createPanelContainer();

        this.container.appendChild(this.menuBar);
        this.container.appendChild(this.panelContainer);
        document.body.appendChild(this.container);
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'control-panel-container';
        return container;
    }

    private createMenuBar(): HTMLElement {
        const menuBar = document.createElement('div');
        menuBar.className = 'control-panel-menu-bar';

        this.menuItems.forEach(item => {
            const button = this.createMenuItem(item);
            menuBar.appendChild(button);
        });

        return menuBar;
    }

    private createMenuItem(item: MenuItem): HTMLElement {
        const button = document.createElement('button');
        button.className = 'menu-item';
        button.innerHTML = `${item.emoji} <span>${window.isSmallScreen ? '' : item.label}</span>`;
        button.onclick = () => this.handleMenuClick(item);
        return button;
    }

    private createPanelContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'panel-container';
        return container;
    }

    private handleMenuClick(item: MenuItem): void {
        if (this.activePanelId === item.id) {
            this.closePanel();
        } else {
            this.openPanel(item);
        }
    }

    private openPanel(item: MenuItem): void {
        this.closePanel();

        this.activePanelId = item.id;


        this.activePanel = new item.panel(this.panelContainer, this.map, this.onTeleport);


        this.activePanel?.render();

        this.panelContainer.classList.add('visible');
        this.updateActiveMenuItem(item.id);
    }

    private closePanel(): void {
        if (this.activePanel) {
            this.activePanel.destroy();
            this.activePanel = null;
            this.activePanelId = null;
            this.panelContainer.classList.remove('visible');
            this.panelContainer?.blur()
            this.updateActiveMenuItem(null);
        }
    }

    private updateActiveMenuItem(activeId: string | null): void {
        const menuItems = this.menuBar.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const menuItem = this.menuItems.find(mi =>
                item.textContent?.includes(mi.label)
            );
            item.classList.toggle('active', menuItem?.id === activeId);
        });
    }

    public destroy(): void {
        this.closePanel();
        this.container.remove();
    }
} 