import { PlayerState } from './PlayerState';
import { PlayerController } from '../PlayerController';
import { CameraController } from '../../CameraController';
import * as THREE from 'three';
import { Threebox } from 'threebox-plugin';
import { ModelConfig } from '../types/ModelConfig';
import { CarPhysics } from '../types/CarModels';
import { PlayerStore } from '../../stores/PlayerStore';
import { Toast } from '../../toast/ToastController';

export class CarState implements PlayerState<CarPhysics> {
    currentSpeed: number = 0;
    mixer: THREE.AnimationMixer | null = null;
    model: any;
    modelType: string = 'golfCart';
    verticalPosition: number | null = null;
    animationState: string = 'idle';
    stateType: 'car' | 'walking' = 'car';
    private lastFrameTime: number = 0;
    private readonly TARGET_FRAME_RATE = 60;
    private readonly TIME_STEP = 1 / this.TARGET_FRAME_RATE;
    private readonly MAX_DELTA_TIME = 0.1; // Cap deltaTime to prevent spiral of death
    private timeAccumulator: number = 0; // Accumulator for fixed timestep
    private lastSpaceMessageTime: number = 0;
    private readonly SPACE_MESSAGE_COOLDOWN = 10000; // 10 seconds in milliseconds

    // Get config from PlayerController
    modelConfig: ModelConfig<CarPhysics>;

    // Car state
    private velocity: number = 0;
    private currentSpeedKmh: number = 0;
    private steeringAngle: number = 0;

    // Flying mode constants
    private readonly FLYING_SMOOTHING = 0.05; // Smoother transitions

    // Remove local keys object and use controller's key states instead
    private controller?: PlayerController;

    // Update elevation properties to match vehicle-copy.ts
    private currentElevation: number = 0;
    private terrainEnabled: boolean = true;

    // Add distance tracking properties
    private lastPosition: [number, number] | null = null;
    private lastDistanceCalculation: number = 0;
    private distanceAccumulator: number = 0;

    constructor(private tb: Threebox, modelId: string) {
        this.modelConfig = PlayerController.getCarConfig(modelId);
        // Initialize kilometers from PlayerStore
        this.distanceAccumulator = PlayerStore.getKilometersDriven();
        this.modelType = modelId;
    }

    async enter(player: PlayerController): Promise<void> {
        this.controller = player;
        
        // Check if flying mode should be enabled based on saved state
        if (PlayerStore.getCarMode() === 'fly' && !PlayerStore.isPlayerFlying()) {
            // Restore flying mode if it was enabled
            PlayerStore.setIsFlying(true);
            console.log('🚗✈️ Restored flying mode from saved state');
        }
        // Remove setup controls, no longer needed as controller handles input
    }

    update(player: PlayerController): void {
        // Calculate delta time
        const currentTime = performance.now();
        let deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Cap deltaTime to prevent physics explosion on slow frames
        deltaTime = Math.min(deltaTime, this.MAX_DELTA_TIME);

        // Add to accumulator
        this.timeAccumulator += deltaTime;

        // Perform fixed timestep updates
        while (this.timeAccumulator >= this.TIME_STEP) {
            this.fixedUpdate(player);
            this.timeAccumulator -= this.TIME_STEP;
        }

        // After moving, calculate distance traveled
        if (this.model) {
            const currentCoords = this.model.coordinates;
            const now = Date.now();

            // Only calculate if we have a last position
            if (this.lastPosition) {
                const [lastLng, lastLat] = this.lastPosition;
                const [currentLng, currentLat] = currentCoords;

                // Calculate distance using Haversine formula
                const distance = this.calculateDistance(lastLat, lastLng, currentLat, currentLng);
                this.distanceAccumulator += distance;
                PlayerStore.setKilometersDriven(this.distanceAccumulator);
                this.lastDistanceCalculation = now;
            }

            // Update last position
            this.lastPosition = [currentCoords[0], currentCoords[1]];
        }
    }

    private fixedUpdate(player: PlayerController): void {
        const { physics } = this.modelConfig;

        // Check for space key press when not flying
        if (this.controller?.getKeyState('space') && !PlayerStore.isPlayerFlying()) {
            const currentTime = Date.now();
            if (currentTime - this.lastSpaceMessageTime >= this.SPACE_MESSAGE_COOLDOWN) {
                Toast.show({
                    message: 'Go to settings and activate "fly car" so you can fly!',
                    duration: 3000,
                    type: 'info'
                });
                this.lastSpaceMessageTime = currentTime;
            }
        }

        // Handle input and physics at fixed timestep
        this.handleDriving(physics);
        this.handleSteering(physics);

        // Apply movement
        if (this.model) {
            // Apply forward/backward movement at fixed timestep
            const translation = new THREE.Vector3(
                0,
                -this.velocity,
                0
            );

            this.model.set({ worldTranslate: translation });

            // Apply steering at fixed timestep
            if (Math.abs(this.steeringAngle) > 0.001) {
                const zAxis = new THREE.Vector3(0, 0, 1);
                this.model.set({
                    quaternion: [zAxis, this.model.rotation.z + (this.steeringAngle * Math.PI / 180), 50]
                });
            }

            // Always update elevation through one method
            this.updateElevation(this.TIME_STEP);

            // Update player position and rotation
            const currentCoords = this.model.coordinates;
            player.setPosition([currentCoords[0], currentCoords[1]]);
            player.setRotation({
                x: 0,
                y: 0,
                z: this.model.rotation.z * 180 / Math.PI
            });
        }

        // Update camera bearing
        if (this.model?.rotation?.z !== undefined) {
            CameraController.setBearing(-this.model.rotation.z * 180 / Math.PI);
        }
    }

    private handleDriving(physics: CarPhysics): void {
        // Simplified driving physics with fixed timestep
        let animationName = this.modelConfig.drivingAnimation?.drivingAnimation;
        
        // Check for boost (shift key)
        const isBoost = this.controller?.getKeyState('shift');
        const boostMultiplier = isBoost ? 4 : 1;
        
        // Use controller's key states
        if (this.controller?.getKeyState('w')) {
            // Accelerate forward with boost
            this.velocity = Math.min(
                this.velocity + physics.acceleration * boostMultiplier,
                physics.maxSpeed * boostMultiplier
            );
            this.animationState = 'driving';
        } else if (this.controller?.getKeyState('s')) {
            if (this.velocity > 0) {
                // Braking
                this.velocity = Math.max(
                    this.velocity - physics.brakeForce,
                    0
                );
                this.animationState = 'braking';
            } else {
                // Reverse
                this.velocity = Math.max(
                    this.velocity - physics.acceleration,
                    -physics.reverseSpeed
                );
                this.animationState = 'reversing';
            }
        } else {
            animationName = undefined;
            this.animationState = 'idle';
            // Natural slowdown with fixed timestep
            this.velocity *= physics.friction;
            if (Math.abs(this.velocity) < 0.01) this.velocity = 0;
        }

        if (animationName) {
            console.log("Playing animation", animationName)
            this.controller?.playAnimation(animationName, 10);
        } else {
            this.controller?.stopAnimation();
        }

        // Convert to km/h for display
        this.currentSpeedKmh = Math.abs(this.velocity) * 1000
        this.currentSpeed = this.currentSpeedKmh
    }

    private handleSteering(physics: CarPhysics): void {
        // Increased base turning responsiveness
        const baseTurnMultiplier = 1.5;

        if (this.controller?.getKeyState('a')) {
            this.steeringAngle = physics.turnSpeed * baseTurnMultiplier * (this.velocity >= 0 ? 1 : -1);
        } else if (this.controller?.getKeyState('d')) {
            this.steeringAngle = -physics.turnSpeed * baseTurnMultiplier * (this.velocity >= 0 ? 1 : -1);
        } else {
            this.steeringAngle = 0;
        }

        // Less reduction at higher speeds for better control
        const speedFactor = 1 - (Math.abs(this.velocity) / physics.maxSpeed * 0.9); // Reduced from 0.7
        this.steeringAngle *= Math.max(speedFactor, 0.4); // Minimum factor increased
    }

    exit(_player: PlayerController): void {
        // Remove removeControls, no longer needed
        if (this.model) {
            this.tb.remove(this.model);
            this.model = null;
        }
        this.velocity = 0;
        this.steeringAngle = 0;
        this.lastPosition = null;
    }

    private updateElevation(_deltaTime: number): void {
        if (!this.model) return;

        const coords = this.model.coordinates;
        const groundElevation = this.controller?.getElevation() ?? 0;
        const modelOffset = this.modelConfig.model.elevationOffset ?? 0;

        // Use PlayerStore to check flying state
        if (PlayerStore.isPlayerFlying()) {
            // Use the flying elevation from PlayerStore
            const flyingElevation = PlayerStore.getFlyingElevation();

            const targetElevation = groundElevation + modelOffset + flyingElevation;
            this.currentElevation += (targetElevation - this.currentElevation) * this.FLYING_SMOOTHING;
        } else {
            // Simplified ground elevation handling, matching walking state
            this.currentElevation = groundElevation + modelOffset;
        }

        this.verticalPosition = this.currentElevation
        
        // Set coordinates
        this.model.setCoords([
            coords[0],
            coords[1],
            this.currentElevation
        ]);
    }

    // Add helper methods for distance calculation
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    public getModel(): any {
        return this.model;
    }

    public follow(): void {
        if (!this.controller) return;
        //CameraController.follow(this.controller, 'car');
    }
} 