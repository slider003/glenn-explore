import { Position } from '../../realtime/types/ServerEvents';

export interface RemotePlayerState {
    stateType: string;
    modelType: string;
    animationState: string;
}

export interface RemotePlayerData {
    playerId: string;
    name: string;
    position: Position;
    state: RemotePlayerState;
    stats: {
        currentSpeed: number;
        kilometersDriven: number;
    };
}

// Network update types
export interface PlayerPositionUpdate {
    coordinates: [number, number];
    rotation: { x: number; y: number; z: number };
    currentSpeed: number;
}

export interface PlayerStateUpdate {
    stateType: 'car' | 'walking';
    modelType: string;
    animationState: string;
} 