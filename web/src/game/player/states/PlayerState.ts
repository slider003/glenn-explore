import { ModelConfig } from '../../api/types/ModelTypes';
import { PlayerController } from '../PlayerController';
import * as THREE from 'three';

export interface PlayerState<T extends ModelConfig> {
    currentSpeed: number;
    mixer: THREE.AnimationMixer | null;
    model: any;
    modelType: string;
    verticalPosition: number | null;
    animationState: string;
    stateType: 'car' | 'walking';
    modelConfig: T;
    
    enter(player: PlayerController): Promise<void>;
    exit(player: PlayerController): void;
    update(player: PlayerController): void;
    getModel(): any;
    follow(): void;
} 