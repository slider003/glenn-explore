import { PlayerStore } from '../stores/PlayerStore';
import './vehicle-stats.css';

export class VehicleStatsUI {
    private container: HTMLElement;
    private speedElement: HTMLElement;
    private distanceElement: HTMLElement;
    private updateInterval: number | null = null;

    constructor() {
        this.container = this.createContainer();
        this.speedElement = this.createSpeedElement();
        this.distanceElement = this.createDistanceElement();
        
        this.container.appendChild(this.speedElement);
        this.container.appendChild(this.distanceElement);
        document.body.appendChild(this.container);

        // Start update loop
        this.startUpdates();
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'vehicle-stats-container';
        return container;
    }

    private createSpeedElement(): HTMLElement {
        const element = document.createElement('div');
        element.className = 'vehicle-stat-item';
        element.innerHTML = `
            <span class="stat-value">0</span>
            <span class="stat-label">km/h</span>
        `;
        return element;
    }

    private createDistanceElement(): HTMLElement {
        const element = document.createElement('div');
        element.className = 'vehicle-stat-item';
        element.innerHTML = `
            <span class="stat-value">0.0</span>
            <span class="stat-label">km</span>
        `;
        return element;
    }

    private startUpdates(): void {
        // Update every 100ms for smooth speed changes
        this.updateInterval = window.setInterval(() => {
            this.updateStats();
        }, 200);
    }

    private updateStats(): void {
        // Update distance
        const distance = PlayerStore.getKilometersDriven();
        const distanceValue = this.distanceElement.querySelector('.stat-value');
        if (distanceValue) {
            const oldDistance = parseFloat(distanceValue.textContent || '0');
            const newDistance = parseFloat(distance.toFixed(1));
            if (oldDistance !== newDistance) {
                distanceValue.textContent = newDistance.toFixed(1);
                distanceValue.classList.add('changed');
                setTimeout(() => distanceValue.classList.remove('changed'), 300);
            }
        }

        // Update speed
        const speed = PlayerStore.getCurrentSpeed();
        const speedValue = this.speedElement.querySelector('.stat-value');
        if (speedValue) {
            const oldSpeed = parseInt(speedValue.textContent || '0');
            if (oldSpeed !== speed) {
                speedValue.textContent = speed.toString();
                speedValue.classList.add('changed');
                setTimeout(() => speedValue.classList.remove('changed'), 300);
            }
        }
    }

    public destroy(): void {
        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
        }
        this.container.remove();
    }
} 