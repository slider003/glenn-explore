export interface ModelConfig<T> {
    model: {
        obj: string;
        type: string;
        scale: number;
        units: string;
        rotation: { x: number; y: number; z: number };
        anchor: string;
        elevationOffset?: number;
        screenshot?: string;
    };
    physics: T;
    walkingAnimation?: {
        idleAnimation?: string;
        walkAnimation?: string;
        runAnimation?: string;
        walkSpeed: number;
        runSpeed: number;
    };
    drivingAnimation?: {
        idleAnimation?: string;
        drivingAnimation?: string;
    };
} 