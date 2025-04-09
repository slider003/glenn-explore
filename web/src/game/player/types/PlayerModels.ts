import { ModelConfig } from './ModelConfig';

export interface PlayerPhysics {
    walkMaxVelocity: number;
    runMaxVelocity: number;
    walkAcceleration: number;
    runAcceleration: number;
    deceleration: number;
    rotationSpeed: number;
    jumpForce: number;
    gravity: number;
}

export interface PlayerModels {
    [key: string]: ModelConfig<PlayerPhysics>;
}

// Default player models configuration
export const PLAYER_MODELS: PlayerModels = {
    cesiumMan: {
        model: {
            obj: '/gugow_rex.glb',
            type: 'glb',
            scale: 1,
            units: 'meters',
            rotation: { x: 90, y: 180, z: 0 },
            anchor: 'center'
        },
        physics: {
            walkMaxVelocity: 0.01, 
            runMaxVelocity: 0.03,
            walkAcceleration: 0.001,
            runAcceleration: 0.001,
            deceleration: 0.95,
            rotationSpeed: 1,
            jumpForce: 0.15,
            gravity: 0.005
        },
        walkingAnimation: {
            walkSpeed: 2,
            runSpeed: 3,
            idleAnimation: 'idle',
            walkAnimation: 'walk',
            runAnimation: 'running',
        }
    }
}; 