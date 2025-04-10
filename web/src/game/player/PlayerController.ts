import { Threebox } from 'threebox-plugin';
import { IFollowable } from '../types/IFollowable';
import { PlayerState } from './states/PlayerState';
import { WalkingState } from './states/WalkingState';
import { CameraController } from '../CameraController';
import { PlayerModels, PlayerPhysics } from './types/PlayerModels';
import { PlayerUI } from './ui/PlayerUI';
import { PLAYER_MODELS } from './types/PlayerModels';
import { CarModels, CAR_MODELS, CarPhysics } from './types/CarModels';
import { CarState } from './states/CarState';
import { ModelConfig } from './types/ModelConfig';
import { VehicleStatsController } from '../VehicleStats/VehicleStatsController';
import { PlayerStore } from '../stores/PlayerStore';
import { MinimapController } from '../minimap/MinimapController';
import { NavigationUI } from '../NavigationUI';
import { NavigationController } from '../NavigationController';
import * as THREE from 'three';
import { PitchController } from '../PitchController';
import { ZoomController } from '../ZoomController';
import mapboxgl from 'mapbox-gl'
import { InputUtils } from '../InputUtils';
import { TeleportOptions } from '../../types/teleport';
import { DEFAULT_COORDINATES } from '../../config';

export class PlayerController implements IFollowable {
    public static getModelConfig(modelType: keyof PlayerModels): ModelConfig<PlayerPhysics> {
        return PLAYER_MODELS[modelType];
    }

    public static getCarConfig(modelType: keyof CarModels): ModelConfig<CarPhysics> {
        return CAR_MODELS[modelType];
    }

    private currentAction: THREE.AnimationAction | null = null;
    private isAnimationPlaying: boolean = false;
    private currentState: PlayerState<any>;
    private _coordinates: [number, number] = [0, 0];
    private _rotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 40 };
    private _elevation: number = 0;
    private animationFrameId: number | null = null;
    private lastUpdateTime: number = 0;
    private ui: PlayerUI;
    private keyStates: Record<string, boolean> = {
        w: false,    // Forward
        a: false,    // Left
        s: false,    // Backward
        d: false,    // Right
        shift: false, // Run (walking state)
        space: false  // Jump (walking state) / Fly up (flying mode)
    };

    constructor(
        private tb: Threebox,
        private map: mapboxgl.Map,
    ) {
        // Initialize state based on PlayerStore's saved movement mode
        const savedMode = PlayerStore.getMovementMode();
        if (savedMode === 'car') {
            this.currentState = new CarState(this.tb, PlayerStore.getState().modelType);
        } else {
            this.currentState = new WalkingState(this.tb, PlayerStore.getState().modelType);
        }

        this.ui = new PlayerUI(map, this);

        new VehicleStatsController()
        const minimapController = new MinimapController(map)
        const navigationController = new NavigationController(map)
        new NavigationUI(map, navigationController, (teleportOptions: TeleportOptions) => {
            this.teleport(teleportOptions);
        }, {
            position: 'top-right',
            container: minimapController.getNavigationContainer()
        });

        // Set up chat message listener
        this.setupChatListener();

        // Add state switch listener
        this.setupStateSwitch();

        // Add global key listeners for space bar in flying mode
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    private setupChatListener(): void {
        // Listen for chat messages
        window.addEventListener('chat:send_message', ((event: CustomEvent) => {
            const { message } = event.detail;
            // Show message above player
            this.showMessage(message);
        }) as EventListener);

        // // Optional: Listen for system messages if needed
        // window.addEventListener('chat:system_message', ((event: CustomEvent) => {
        //     const { message } = event.detail;
        //     this.showMessage(`System: ${message}`, 3000); // Shorter duration for system messages
        // }) as EventListener);
    }

    private setupStateSwitch(): void {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (InputUtils.isInputElementFocused()) {
                return;
            }

            const key = e.key.toLowerCase();

            // if (key === 'e') {
            //     // Toggle between car and walking state
            //     if (this.currentState instanceof CarState) {
            //         this.switchToWalking();
            //         this.showMessage("Switched to walking mode", 2000);
            //     } else {
            //         this.switchToCar();
            //         this.showMessage("Switched to car mode", 2000);
            //     }
            // }

            // // Toggle flying mode with F key
            // if (key === 'f') {
            //     this.toggleFlyingMode();
            // }
        });
    }

    // IFollowable implementation
    get coordinates(): [number, number] { return this._coordinates; }
    get rotation(): { x: number; y: number; z: number } { return this._rotation; }
    get elevation(): number { return this._elevation; }
    get threebox(): Threebox { return this.tb; }

    public async initializeState(initialPosition: [number, number]): Promise<void> {
        this._coordinates = initialPosition ?? [DEFAULT_COORDINATES.lng, DEFAULT_COORDINATES.lat];

        // Make sure current state matches saved movement mode
        this.currentState = new CarState(this.tb, 'lambo');


        await this.setState(this.currentState);
        this.startUpdateLoop();
        setInterval(() => {
            PlayerStore.setCurrentSpeed(this.currentState.currentSpeed);
            PlayerStore.setCoordinates([this._coordinates[0], this._coordinates[1], this.currentState.verticalPosition ?? this._elevation]);
            PlayerStore.setRotation(this._rotation);
        }, 200);
    }

    private startUpdateLoop(): void {
        this.lastUpdateTime = performance.now();
        const animate = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastUpdateTime;
            this.lastUpdateTime = currentTime;
            this.update();
            this.animationFrameId = requestAnimationFrame(animate);
            if (PlayerStore.isFollowingCar()) {
                if (PlayerStore.isPlayerFlying() && this.currentState.verticalPosition && this.currentState.verticalPosition > this._elevation + 5) {
                    const camera = CameraController.getMap().getFreeCameraOptions();

                    // Get current zoom and elevation data
                    const zoomLevel = ZoomController.getZoom();
                    const elevationDifference = this.currentState.verticalPosition - this._elevation;

                    // Convert rotation to bearing (0 = north, clockwise)
                    // Mapbox uses 0 = north, clockwise positive
                    // We need to handle the conversion carefully
                    const bearingDegrees = (-this._rotation.z + 360) % 360;

                    // For camera behind the car, we need to offset bearing by 180 degrees
                    const cameraBearingDegrees = (bearingDegrees + 180) % 360;
                    const cameraBearingRadians = (cameraBearingDegrees * Math.PI) / 180;

                    // Distance increases with elevation and zoom level
                    const baseDistance = 0.0015;
                    const elevationFactor = 1 + (elevationDifference / 200);
                    const zoomFactor = Math.pow(0.75, (zoomLevel - 14));
                    const distance = baseDistance * elevationFactor * zoomFactor;

                    // Use standard cartographic formula for offset calculation
                    // We use sin for longitude and cos for latitude when calculating from bearing
                    const offsetLng = this._coordinates[0] + Math.sin(cameraBearingRadians) * distance;
                    const offsetLat = this._coordinates[1] + Math.cos(cameraBearingRadians) * distance;

                    // Set camera elevation - slightly above vehicle for better visibility
                    const cameraElevation = this.currentState.verticalPosition + (zoomLevel * 0.3);

                    // Position camera at calculated position
                    camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
                        [offsetLng, offsetLat],
                        cameraElevation
                    );

                    // Look directly at the player's position
                    camera.lookAtPoint([this._coordinates[0], this._coordinates[1]]);

                    // Set the camera orientation
                    // Use original bearing for camera direction, not offset bearing
                    camera.setPitchBearing(PitchController.getPitch(), bearingDegrees);

                    CameraController.getMap().setFreeCameraOptions(camera);
                } else {
                    CameraController.getMap().jumpTo({
                        center: [this._coordinates[0], this._coordinates[1]],
                        bearing: -this._rotation.z,
                        pitch: PitchController.getPitch(),
                        zoom: ZoomController.getZoom()
                    });
                }
            }
        };
        animate();
    }

    public async setState(state: PlayerState<any>): Promise<void> {
        CameraController.stopFollowing();
        PlayerStore.setModelType(state.modelType);
        PlayerStore.setAnimationState(state.animationState);
        PlayerStore.setStateType(state.stateType);
        PlayerStore.setAllowedToDrive(false);
        this.currentState.exit(this);
        this.currentState = state;
        await this.loadModel();
        await this.currentState.enter(this);
        if (state.getModel().animations && state.getModel().animations.length > 0) {
            console.log('WalkingState: Animations found:', state.getModel().animations.map((anim: any) => anim.name));
        }
        PlayerStore.setAllowedToDrive(true)
        this.currentState.follow()
        PlayerStore.setFollowCar(true)
    }

    public update(): void {
        if (!PlayerStore.getAllowedToDrive()) return;

        // If in flying mode and car state, check for space key
        if (PlayerStore.isPlayerFlying() && this.currentState instanceof CarState) {
            const spacePressed = this.getKeyState('space');
            // Constants from CarState
            const FLYING_ASCEND_SPEED = 50;
            const FLYING_DESCEND_SPEED = 20;

            // Update flying elevation
            const currentElevation = PlayerStore.getFlyingElevation();
            const delta = 1 / 60; // Approximate time step

            if (spacePressed) {
                // Rise when space is pressed
                PlayerStore.setFlyingElevation(currentElevation + FLYING_ASCEND_SPEED * delta);
            } else {
                // Apply gravity when space is not pressed
                const newElevation = Math.max(0, currentElevation - FLYING_DESCEND_SPEED * delta);
                PlayerStore.setFlyingElevation(newElevation);
            }
        }

        this.currentState.update(this);
    }

    public setPosition(position: [number, number]): void {
        this._coordinates = position;
    }

    public setRotation(rotation: { x: number; y: number; z: number }): void {
        this._rotation = rotation;
    }

    public getElevation(): number {
        const elevation = this.map.queryTerrainElevation([this._coordinates[0], this._coordinates[1]], {
            exaggerated: true // Match the exaggeration setting
        });
        this._elevation = elevation || 0;
        return elevation || 0;
    }

    // Public method to show messages (delegates to UI)
    public showMessage(message: string, duration?: number): void {
        this.ui.showMessage(message, duration);
    }

    public destroy(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // Clean up event listeners
        window.removeEventListener('chat:send_message', this.setupChatListener);
        window.removeEventListener('chat:system_message', this.setupChatListener);
        document.removeEventListener('keydown', this.setupStateSwitch);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);

        this.ui.destroy();
        this.currentState.exit(this);
        CameraController.stopFollowing();
    }

    public async switchState(modelId: string, type: 'car' | 'walking'): Promise<void> {
        // Create appropriate state based on type
        const newState = type === 'car' ? new CarState(this.tb, modelId) : new WalkingState(this.tb, modelId);

        // Update store values
        PlayerStore.setMovementMode(type);
        PlayerStore.setModelType(modelId);

        console.log("HELLO!?", modelId)

        // Switch state with new model
        await this.setState(newState);
    }

    public async switchToCar(): Promise<void> {
        const state = new CarState(this.tb, PlayerStore.getState().modelType);
        await this.setState(state);
        PlayerStore.setMovementMode('car');
    }

    public async switchToWalking(): Promise<void> {
        const state = new WalkingState(this.tb, PlayerStore.getState().modelType);
        await this.setState(state);
        PlayerStore.setMovementMode('walking');
    }

    public async teleport(teleportOptions: TeleportOptions): Promise<void> {
        this.currentState.exit(this);
        CameraController.stopFollowing();
        this._coordinates = [teleportOptions.position.lng, teleportOptions.position.lat];
        if (teleportOptions.rotation) {
            this._rotation = { x: 0, y: 0, z: teleportOptions.rotation.z ?? -CameraController.getBearing() };
        }
        if (teleportOptions.zoom) {
            ZoomController.setZoom(teleportOptions.zoom);
        }
        if (teleportOptions.pitch) {
            PitchController.setPitch(teleportOptions.pitch);
        }
        if (teleportOptions.bearing) {
            CameraController.setBearing(teleportOptions.bearing);
        }
        await this.setState(this.currentState);
    }

    public playAnimation(animationName: string, speed: number = 1.0): void {
        if (!this.currentState.mixer || !this.currentState.getModel().animations) return;

        if (PlayerStore.getState().animationState !== animationName) {
            PlayerStore.setAnimationState(animationName);
        }
        const clip = this.currentState.getModel().animations.find((anim: any) => anim.name === animationName);
        if (clip) {
            if (this.currentAction) {
                this.currentAction.setEffectiveTimeScale(speed);
                return;
            }

            this.currentAction = this.currentState.mixer.clipAction(clip);
            this.currentAction.setLoop(THREE.LoopRepeat, Infinity);
            this.currentAction.clampWhenFinished = false;
            this.currentAction.setEffectiveTimeScale(speed);
            this.currentAction.play();

            this.isAnimationPlaying = true;
        }
    }

    public stopAnimation(): void {
        if (this.currentAction && this.isAnimationPlaying) {
            this.currentAction.stop();
            this.currentAction = null;
            this.isAnimationPlaying = false;
        }
    }

    private async loadModel(): Promise<void> {
        try {
            this.currentState.model = await new Promise((resolve, reject) => {
                this.tb.loadObj(this.currentState.modelConfig.model, (model: any) => {
                    if (!model) {
                        reject(new Error('No model returned'));
                        return;
                    }
                    console.log("Model loaded", model.animations)
                    if (model.animations && model.animations.length > 0) {
                        this.currentState.mixer = new THREE.AnimationMixer(model);
                    }

                    resolve(model);
                    model.setCoords(this._coordinates, this.getElevation());
                    console.log("Camera bearing", CameraController.getBearing())
                    model.setRotation({
                        x: 0,
                        y: 0,
                        z: this._rotation.z // Start facing north
                    });
                });
            });


            this.tb.add(this.currentState.model);
        } catch (error) {
            console.error('WalkingState: Failed to load model:', error);
            throw error;
        }
    }

    // New method to toggle flying mode
    public toggleFlyingMode(): void {
        // Only works in car state
        if (!(this.currentState instanceof CarState)) {
            this.showMessage("Flying mode only available in car mode", 2000);
            return;
        }

        const isCurrentlyFlying = PlayerStore.isPlayerFlying();
        PlayerStore.setIsFlying(!isCurrentlyFlying);

        // Update car mode in PlayerStore for persistence
        PlayerStore.setCarMode(!isCurrentlyFlying ? 'fly' : 'normal');

        const statusMessage = !isCurrentlyFlying ? 'ENABLED 🛸' : 'DISABLED';
        console.log('🔄 Flying mode:', !isCurrentlyFlying ? 'ENABLED 🛸' : 'DISABLED');
        this.showMessage(`Flying mode ${statusMessage}`, 2000);
    }

    // Add key pressed check
    private isKeyPressed(key: string): boolean {
        return this.keyStates[key] === true;
    }

    // Setup key handling for flying controls
    private handleKeyDown = (e: KeyboardEvent): void => {
        if (InputUtils.isInputElementFocused()) {
            return;
        }

        const key = e.key.toLowerCase();

        // Check if this is a key we're tracking
        if (key in this.keyStates) {
            this.setKeyState(key, true);
        } else if (key === ' ') {
            // Handle space bar specifically
            this.setKeyState('space', true);

            if (PlayerStore.isPlayerFlying()) {
                console.log('🚀 SPACE pressed in flying mode!');
            }
        }
    };

    private handleKeyUp = (e: KeyboardEvent): void => {
        if (InputUtils.isInputElementFocused()) {
            return;
        }

        const key = e.key.toLowerCase();

        // Check if this is a key we're tracking
        if (key in this.keyStates) {
            this.setKeyState(key, false);
        } else if (key === ' ') {
            // Handle space bar specifically
            this.setKeyState('space', false);

            if (PlayerStore.isPlayerFlying()) {
                console.log('🛬 SPACE released in flying mode!');
            }
        }
    };

    // Add method to get key state
    public getKeyState(key: string): boolean {
        return this.keyStates[key] || false;
    }

    // Add method to set key state (to be used by MovementControlsPanel)
    public setKeyState(key: string, isPressed: boolean): void {
        if (key in this.keyStates) {
            this.keyStates[key] = isPressed;
        }
    }
} 