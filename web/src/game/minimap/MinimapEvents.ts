import { MinimapState } from './MinimapTypes';

export type MinimapAction = 
    | 'expand'
    | 'collapse'
    | 'zoomIn'
    | 'zoomOut'
    | 'resetView';

export interface MinimapEvent {
    type: MinimapAction;
    payload?: any;
}

export interface MinimapEventHandlers {
    onExpand?: () => void;
    onCollapse?: () => void;
    onMove?: (center: [number, number]) => void;
    onZoom?: (zoom: number) => void;
    onRotate?: (bearing: number) => void;
    onVehicleUpdate?: (coords: [number, number], bearing: number) => void;
}

export class MinimapEventEmitter {
    private handlers: Map<MinimapAction, Function[]> = new Map();

    public on(event: MinimapAction, handler: Function): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event)?.push(handler);
    }

    public off(event: MinimapAction, handler: Function): void {
        const eventHandlers = this.handlers.get(event);
        if (eventHandlers) {
            const index = eventHandlers.indexOf(handler);
            if (index > -1) {
                eventHandlers.splice(index, 1);
            }
        }
    }

    public emit(event: MinimapEvent): void {
        const eventHandlers = this.handlers.get(event.type);
        if (eventHandlers) {
            eventHandlers.forEach(handler => handler(event.payload));
        }
    }
} 