export interface TeleportOptions {
    position: {
        lng: number;
        lat: number;
    };
    rotation?: {
        z: number;
    };
    zoom?: number;
    pitch?: number;
    bearing?: number;
}