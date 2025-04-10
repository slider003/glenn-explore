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
    dino: {
        model: {
            obj: '/gugow_rex.glb',
            type: 'glb',
            scale: 1,
            units: 'meters',
            rotation: { x: 90, y: 180, z: 0 },
            anchor: 'center',
            screenshot: '/dino.png'
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
            walkSpeed: 3,
            runSpeed: 4,
            idleAnimation: 'idle',
            walkAnimation: 'walk',
            runAnimation: 'running',
        }
    },
    animeTeenage: {
        model: {
            obj: '/anime-teenage.glb',
            type: 'glb',
            scale: 1.5,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 },
            anchor: 'center',
            screenshot: '/anime.png'
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
    },
    levels: {
        model: {
            obj: '/levels.glb',
            type: 'glb',
            scale: 2,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 },
            anchor: 'center',
            screenshot: '/levels.png'
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
    },
    william: {
        model: {
            obj: '/william.glb',
            type: 'glb',
            scale: 1.5,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 },
            anchor: 'center',
            screenshot: '/william.jpg'
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