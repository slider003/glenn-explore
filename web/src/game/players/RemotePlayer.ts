import { Threebox } from 'threebox-plugin';
import { RemotePlayerData, RemotePlayerState } from './types/RemotePlayerTypes';
import { PlayerController, ThreeboxModelConfig } from '../player/PlayerController';
import mapboxgl from 'mapbox-gl';
import './styles/remote-player.css';
import * as THREE from 'three';
import { ModelClient } from '../api/ModelClient';

export class RemotePlayer {
    private model: any = null;
    private mixer: THREE.AnimationMixer | null = null;
    private currentAnimation: THREE.AnimationAction | null = null;
    private marker!: mapboxgl.Marker;
    private nameElement!: HTMLElement;
    private messageElement: HTMLElement | null = null;
    private currentElevation: number = 0;
    private lastUpdateTime: number = Date.now();
    private messageTimeout: number | null = null;
    private messageUpdateInterval: number | null = null;
    private modelType: string = 'dino';
    private animationState: string = 'idle';
    private animationFrameId: number | null = null;
    private lastAnimationTime: number = 0;

    constructor(
        private map: mapboxgl.Map,
        private tb: Threebox,
        private data: RemotePlayerData
    ) {
        this.createMarker();
        this.createMessageElement();
        this.loadModel();
    }

    private createMarker(): void {
        const el = document.createElement('div');
        el.className = 'remote-player-marker';

        this.nameElement = document.createElement('div');
        this.nameElement.className = 'remote-player-name';
        this.nameElement.textContent = this.data.name;
        el.appendChild(this.nameElement);

        this.marker = new mapboxgl.Marker({
            element: el,
            rotationAlignment: 'map',
            pitchAlignment: 'map'
        })
            .setLngLat([this.data.position.coordinates[0], this.data.position.coordinates[1]])
            .addTo(this.map);
    }

    private async loadModel(): Promise<void> {
        this.modelType = this.data.state.modelType;
        this.animationState = this.data.state.animationState;
        console.log(`Loading model: ${this.modelType}`);
        console.log(`State type: ${this.data.state.stateType}`);

        // If models aren't loaded yet, implement a backoff retry mechanism
        if (Object.keys(ModelClient.AVAILABLE_MODELS).length === 0) {
            console.log('Models not yet loaded, implementing backoff retry...');
            
            // Define a backoff retry function with exponential delay
            const retryWithBackoff = async (maxRetries: number = 5, initialDelay: number = 500): Promise<void> => {
                let retryCount = 0;
                let delay = initialDelay;
                
                while (retryCount < maxRetries) {
                    console.log(`Retry attempt ${retryCount + 1}/${maxRetries} for loading models...`);
                    
                    // Wait for the current delay
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    // Check if models are now available
                    if (Object.keys(ModelClient.AVAILABLE_MODELS).length > 0 && 
                        ModelClient.AVAILABLE_MODELS[this.data.state.modelType]) {
                        console.log('Models loaded successfully after retry');
                        return;
                    }
                    
                    // Increase retry count and apply exponential backoff
                    retryCount++;
                    delay = Math.min(delay * 2, 10000); // Cap at 10 seconds
                }
                
                console.error('Failed to load models after maximum retry attempts');
            };
            
            // Wait for models to be loaded
            await retryWithBackoff();
            
            // Try to get the model again after retries
            this.modelType = this.data.state.modelType;
            this.animationState = this.data.state.animationState;
        }

        const model = ModelClient.AVAILABLE_MODELS[this.data.state.modelType];

        try {
            this.model = await new Promise((resolve, reject) => {
                const modelConfig: ThreeboxModelConfig = {
                    obj: model.modelUrl || model.config.model.obj,
                    type: 'glb',
                    scale: model.config.model.scale,
                    units: model.config.model.units as 'meters',
                    rotation: model.config.model.rotation,
                    anchor: model.config.model.anchor as 'center',
                    elevationOffset: model.config.model.elevationOffset
                };
                this.tb.loadObj(modelConfig, (model: any) => {
                    if (!model) {
                        reject(new Error('Failed to load model'));
                        return;
                    }

                    // Set up animation mixer if the model has animations
                    if (model.animations && model.animations.length > 0) {
                        console.log(`Model loaded with animations: ${model.animations.map((a: any) => a.name).join(', ')}`);
                        this.mixer = new THREE.AnimationMixer(model);
                        this.startAnimationLoop();
                    }

                    resolve(model);
                });
            });

            this.updatePosition(this.data.position.coordinates, this.data.position.rotation);
            this.tb.add(this.model);

            // Play initial animation if model has animations
            if (this.model.animations && this.model.animations.length > 0) {
                //this.playAnimation(this.animationState);
            }

        } catch (error) {
            console.error('Failed to load remote player model:', error);
        }
    }

    private startAnimationLoop(): void {
        if (this.animationFrameId) return;

        const animate = (time: number) => {
            if (!this.mixer) return;

            if (this.lastAnimationTime === 0) {
                this.lastAnimationTime = time;
            }

            const delta = (time - this.lastAnimationTime) * 0.001;
            this.lastAnimationTime = time;

            this.mixer.update(delta);
            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    public getCoordinates(): [number, number, number] {
        return this.data.position.coordinates;
    }

    public updatePosition(coordinates: [number, number, number], rotation: { x: number, y: number, z: number }): void {
        this.lastUpdateTime = Date.now();

        this.data.position = {
            coordinates,
            rotation,
            timestamp: Date.now().toString()
        };

        this.marker.setLngLat([coordinates[0], coordinates[1]]);
        this.currentElevation = coordinates[2];

        if (this.model) {
            this.model.visible = true;
            this.model.setCoords([coordinates[0], coordinates[1], this.currentElevation]);
            this.model.setRotation(rotation);
        }

        if (this.messageElement?.style.display !== 'none') {
            this.updateMessagePosition();
        }
    }

    public async updateState(state: RemotePlayerState): Promise<void> {

        // Check if model type has changed
        const modelChanged = this.modelType !== state.modelType ||
            this.data.state.stateType !== state.stateType;

        this.data.state = state;

        // Handle model change
        if (modelChanged) {
            if (this.model) {
                this.tb.remove(this.model);
                this.model = null;
                this.mixer = null;
                this.currentAnimation = null;
            }

            this.modelType = state.modelType;
            setTimeout(async () => {
                await this.loadModel();
            }, 100);
        }
        // Handle animation change
        else if (this.animationState !== state.animationState) {
            this.animationState = state.animationState;
            this.playAnimation(this.animationState);
        }
    }

    private playAnimation(animationName: string): void {
        if (!this.model || !this.mixer) return;


        if (!this.model.animations || this.model.animations.length === 0) {
            console.warn(`No animations available for this model`);
            return;
        }

        // Find the animation clip
        const clip = this.model.animations.find((anim: any) =>
            anim.name === animationName ||
            anim.name.toLowerCase() === animationName.toLowerCase()
        );

        if (!clip) {
            console.warn(`Animation "${animationName}" not found for model. Available animations: ${this.model.animations.map((a: any) => a.name).join(', ')
                }`);
            return;
        }

        // Stop current animation if playing
        if (this.currentAnimation) {
            this.currentAnimation.stop();
        }

        // Play new animation
        this.currentAnimation = this.mixer.clipAction(clip);
        this.currentAnimation.setLoop(THREE.LoopRepeat, Infinity);
        this.currentAnimation.clampWhenFinished = false;

        // Get animation speed from model config
        let animationSpeed = 1.0;
        // const modelConfig = this.data.state.stateType === 'car'
        //     ? ModelClient.AVAILABLE_MODELS[this.data.state.modelType].config.model.walkingAnimation
        //     : ModelClient.AVAILABLE_MODELS[this.data.state.modelType].config.model.walkingAnimation;

        // const animation = modelConfig.walkingAnimation;
        // if (animation) {
        //     if (animationName === animation.walkAnimation) {
        //         animationSpeed = 1.0;
        //     } else if (animationName === animation.runAnimation) {
        //         animationSpeed = 3.0;
        //     } else if (animationName === animation.idleAnimation) {
        //         animationSpeed = 1.0;
        //     }
        // }

        // this.currentAnimation.setEffectiveTimeScale(animationSpeed);
        // this.currentAnimation.play();
    }

    public showMessage(message: string, duration: number = 5000): void {
        if (!this.messageElement) {
            this.createMessageElement();
        }

        if (!this.messageElement) return;

        if (this.messageUpdateInterval) {
            window.cancelAnimationFrame(this.messageUpdateInterval);
            this.messageUpdateInterval = null;
        }

        this.messageElement.textContent = message;
        this.messageElement.style.display = 'block';

        this.updateMessagePosition();

        const updateMessageLoop = () => {
            if (this.messageElement && this.messageElement.style.display !== 'none') {
                this.updateMessagePosition();
                this.messageUpdateInterval = window.requestAnimationFrame(updateMessageLoop);
            } else {
                this.messageUpdateInterval = null;
            }
        };

        this.messageUpdateInterval = window.requestAnimationFrame(updateMessageLoop);

        setTimeout(() => {
            if (this.messageElement) {
                this.messageElement.style.opacity = '1';
            }
        }, 10);

        if (this.messageTimeout) {
            window.clearTimeout(this.messageTimeout);
        }

        this.messageTimeout = window.setTimeout(() => {
            if (this.messageElement) {
                this.messageElement.style.opacity = '0';

                setTimeout(() => {
                    if (this.messageElement) {
                        this.messageElement.style.display = 'none';
                    }

                    if (this.messageUpdateInterval) {
                        window.cancelAnimationFrame(this.messageUpdateInterval);
                        this.messageUpdateInterval = null;
                    }
                }, 300);
            }
            this.messageTimeout = null;
        }, duration);
    }

    private createMessageElement(): void {
        this.messageElement = document.createElement('div');
        this.messageElement.className = 'remote-player-message';
        document.body.appendChild(this.messageElement);
    }

    private updateMessagePosition(): void {
        if (!this.messageElement || !this.data.position.coordinates) return;

        const screenCoords = this.map.project([
            this.data.position.coordinates[0],
            this.data.position.coordinates[1]
        ]);

        this.messageElement.style.transform = `translate(-50%, 0) translate(0, ${screenCoords.y - 100}px)`;
        this.messageElement.style.top = '0';
        this.messageElement.style.left = `${screenCoords.x}px`;
    }

    public remove(): void {
        if (this.messageTimeout) {
            window.clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }

        if (this.messageUpdateInterval) {
            window.cancelAnimationFrame(this.messageUpdateInterval);
            this.messageUpdateInterval = null;
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.model) {
            this.tb.remove(this.model);
            this.model = null;
        }

        this.mixer = null;
        this.currentAnimation = null;
        this.lastAnimationTime = 0;

        this.marker.remove();

        if (this.messageElement) {
            document.body.removeChild(this.messageElement);
            this.messageElement = null;
        }
    }

    public getLastUpdateTime(): number {
        return this.lastUpdateTime;
    }

    public getSpeed(): number {
        return this.data.stats.currentSpeed;
    }

    public getId(): string {
        return this.data.playerId;
    }

    public getName(): string {
        return this.data.name;
    }

    public getModelType(): string {
        return this.modelType;
    }

    public getAnimationState(): string {
        return this.animationState;
    }

    public getCurrentSpeed(): number {
        return this.data.stats.currentSpeed;
    }


    public getStateType(): string {
        return this.data.state.stateType;
    }

    public setName(name: string): void {
        this.data.name = name;
        this.nameElement.textContent = name;
    }
} 