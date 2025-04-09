import { PlayerController } from '../PlayerController';
import * as THREE from 'three';
import { ModelConfig } from '../types/ModelConfig';

export interface PlayerState<T>{
  mixer: THREE.AnimationMixer | null;
  currentSpeed: number;
  modelType: string;
  animationState: string;
  stateType: 'car' | 'walking';
  verticalPosition: number | null;
  enter(player: PlayerController): Promise<void>;
  exit(player: PlayerController): void;
  update(player: PlayerController): void;
  getModel(): any;
  model: any;
  modelConfig: ModelConfig<T>;
  follow(): void;
} 