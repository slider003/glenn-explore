import { ModelConfig } from './ModelConfig';

export interface CarPhysics {
    // Simplified physics
    maxSpeed: number;          // Maximum forward speed
    acceleration: number;      // How fast car speeds up
    brakeForce: number;       // How fast car slows down
    reverseSpeed: number;     // Maximum reverse speed
    turnSpeed: number;        // How fast car turns
    friction: number;         // Natural slowdown (0-1)
}

export interface CarModels {
    [key: string]: ModelConfig<CarPhysics>;
}

// Default car models configuration
export const CAR_MODELS: CarModels = {
    lambo: {
        model: {
            obj: '/lambo.glb',
            type: 'glb',
            scale: 1,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 },
            anchor: 'center',
            elevationOffset: 0.7,
            screenshot: '/lambo.png'
        },
        physics: {
            maxSpeed: 0.1,         // Reduced from 5
            acceleration: 0.0003,      // Reduced from 1.2
            brakeForce: 0.0008,       // Reduced from 60
            reverseSpeed: 0.01,      // Reduced from 20
            turnSpeed: 1,        // Reduced from 2.0
            friction: 0.99         // Slightly increased from 0.95 for smoother deceleration
        },
        drivingAnimation: {
            drivingAnimation: 'Body.001Action.001'
        }
    },
    golfCart: {
        model: {
            obj: '/golf-cart.glb',
            type: 'glb',
            scale: 1,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 },
            anchor: 'center',
            elevationOffset: 0.7,
            screenshot: '/golf-cart.png'
        },
        physics: {
            maxSpeed: 0.04,         // Reduced from 5
            acceleration: 0.0001,      // Reduced from 1.2
            brakeForce: 0.0002,       // Reduced from 60
            reverseSpeed: 0.01,      // Reduced from 20
            turnSpeed: 1,        // Reduced from 2.0
            friction: 0.99         // Slightly increased from 0.95 for smoother deceleration
        },
        drivingAnimation: {
            drivingAnimation: 'Body.001Action.001'
        }
    },
    vikingBoat: {
        model: {
            obj: '/viking-boat.glb',
            type: 'glb',
            scale: 3,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 },
            anchor: 'center',
            elevationOffset: 0.7,
            screenshot: '/viking-boat.png'
        },
        physics: {
            maxSpeed: 0.06,         // Reduced from 5
            acceleration: 0.0003,      // Reduced from 1.2
            brakeForce: 0.0002,       // Reduced from 60
            reverseSpeed: 0.01,      // Reduced from 20
            turnSpeed: 0.7,        // Reduced from 2.0
            friction: 0.999         // Slightly increased from 0.95 for smoother deceleration
        },
        drivingAnimation: {
            drivingAnimation: 'Body.001Action.001'
        }
    },
    pepeFrogRide: {
        model: {
            obj: '/pepe-frog-ride.glb',
            type: 'glb',
            scale: 2,
            units: 'meters',
            rotation: { x: 90, y: 0, z: 0 },
            anchor: 'center',
            elevationOffset: 0.7,
            screenshot: '/pepe-frog-ride.png'
        },
        physics: {
            maxSpeed: 0.06,         // Reduced from 5
            acceleration: 0.0001,      // Reduced from 1.2
            brakeForce: 0.0002,       // Reduced from 60
            reverseSpeed: 0.01,      // Reduced from 20
            turnSpeed: 1.2,        // Reduced from 2.0
            friction: 0.999         // Slightly increased from 0.95 for smoother deceleration
        },
        drivingAnimation: {
            drivingAnimation: 'Body.001Action.001'
        }
    }
}; 