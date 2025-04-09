export interface MinimapOptions {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    defaultZoomOffset?: number;
    autoFollowVehicle?: boolean;
    rotateWithVehicle?: boolean;
}

export interface MinimapState {
    isExpanded: boolean;
    userHasZoomed: boolean;
    autoFollowVehicle: boolean;
    rotateWithVehicle: boolean;
    lastAutoUpdateTime: number;
    otherVehicleMarkers: Map<string, mapboxgl.Marker>;
}

export interface MinimapElements {
    container: HTMLElement;
    map: mapboxgl.Map;
    marker: mapboxgl.Marker;
    toggleButton: HTMLButtonElement;
    navigationContainer: HTMLElement;
}

export interface MinimapDimensions {
    small: {
        width: number;
        height: number;
    };
    large: {
        width: number;
        height: number;
    };
}

export interface OtherVehicleData {
    id: string;
    name: string;
    coordinates: [number, number];
    rotation: { x: number; y: number; z: number };
} 