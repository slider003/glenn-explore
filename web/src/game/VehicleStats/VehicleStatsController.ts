import { VehicleStatsUI } from './VehicleStatsUI';

export class VehicleStatsController {
    private ui: VehicleStatsUI;

    constructor() {
        this.ui = new VehicleStatsUI();
    }

    public destroy(): void {
        this.ui.destroy();
    }
} 