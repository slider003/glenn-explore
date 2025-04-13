import { BasePanelUI } from '../BasePanelUI';
import * as THREE from 'three';
import { PlayerStore } from '../../../stores/PlayerStore';
import './theater-panel.css';

export class TheaterPanel extends BasePanelUI {
    private screen: THREE.Mesh | null = null;
    private textMesh: THREE.Mesh | null = null;
    private theater3D: any = null;
    private htmlContainer: HTMLElement | null = null;

    constructor(container: HTMLElement, map: mapboxgl.Map) {
        super(container, map);
        // Initialize theater immediately
        this.initializeTheater();
    }

    public async render(): Promise<void> {
        const panel = document.createElement('div');
        panel.className = 'panel-content theater-panel';

        // Get current theater state
        const currentPosition = this.theater3D.coordinates;
        const currentRotation = this.theater3D.rotation;
        // Access geometry parameters safely
        const geometry = this.screen?.geometry as THREE.PlaneGeometry;
        const currentWidth = geometry?.parameters?.width || 42;
        const currentHeight = geometry?.parameters?.height || 24;

        panel.innerHTML = `
            <div class="theater-header">
                <h2>🎬 Theater Controls</h2>
                <button class="close-button" title="Close panel">×</button>
            </div>

            <div class="theater-controls-container">
                <div class="control-section">
                    <h3>Position</h3>
                    <button class="my-position-btn">My Position</button>
                    <div class="control-inputs position-controls">
                        <div class="control-input">
                            <label>LNG:</label>
                            <input type="number" class="lng-input" step="0.000001" value="${currentPosition[0]}">
                        </div>
                        <div class="control-input">
                            <label>LAT:</label>
                            <input type="number" class="lat-input" step="0.000001" value="${currentPosition[1]}">
                        </div>
                        <div class="control-input">
                            <label>Elevation:</label>
                            <input type="number" class="elevation-input" step="1" value="${currentPosition[2]}">
                        </div>
                    </div>
                </div>

                <div class="control-section">
                    <h3>Rotation</h3>
                    <div class="control-inputs rotation-controls">
                        <div class="control-input">
                            <label>X:</label>
                            <input type="number" class="rotation-x" value="${currentRotation.x}">
                        </div>
                        <div class="control-input">
                            <label>Y:</label>
                            <input type="number" class="rotation-y" value="${currentRotation.y}">
                        </div>
                        <div class="control-input">
                            <label>Z:</label>
                            <input type="number" class="rotation-z" value="${currentRotation.z}">
                        </div>
                    </div>
                </div>

                <div class="control-section">
                    <h3>Size</h3>
                    <div class="control-inputs size-controls">
                        <div class="control-input">
                            <label>Width:</label>
                            <input type="number" class="width-input" min="1" step="0.5" value="${currentWidth}">
                        </div>
                        <div class="control-input">
                            <label>Height:</label>
                            <input type="number" class="height-input" min="1" step="0.5" value="${currentHeight}">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners(panel);
        this.container.appendChild(panel);
    }

    private setupEventListeners(panel: HTMLElement): void {
        // Close button
        const closeButton = panel.querySelector('.close-button');
        closeButton?.addEventListener('click', () => this.closePanel());

        // My Position button
        const myPosButton = panel.querySelector('.my-position-btn');
        myPosButton?.addEventListener('click', () => {
            if (!this.theater3D) return;
            const playerCoords = PlayerStore.getCoordinates();
            const elevation = parseFloat((panel.querySelector('.elevation-input') as HTMLInputElement).value);
            
            this.theater3D.setCoords([playerCoords[0], playerCoords[1], elevation]);
            (panel.querySelector('.lng-input') as HTMLInputElement).value = playerCoords[0].toString();
            (panel.querySelector('.lat-input') as HTMLInputElement).value = playerCoords[1].toString();
        });

        // Position controls
        const positionInputs = panel.querySelectorAll('.position-controls input');
        positionInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (!this.theater3D) return;
                const lng = parseFloat((panel.querySelector('.lng-input') as HTMLInputElement).value);
                const lat = parseFloat((panel.querySelector('.lat-input') as HTMLInputElement).value);
                const elevation = parseFloat((panel.querySelector('.elevation-input') as HTMLInputElement).value);
                this.theater3D.setCoords([lng, lat, elevation]);
            });
        });

        // Rotation controls
        const rotationInputs = panel.querySelectorAll('.rotation-controls input');
        rotationInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (!this.theater3D) return;
                const x = parseFloat((panel.querySelector('.rotation-x') as HTMLInputElement).value);
                const y = parseFloat((panel.querySelector('.rotation-y') as HTMLInputElement).value);
                const z = parseFloat((panel.querySelector('.rotation-z') as HTMLInputElement).value);
                this.theater3D.setRotation({ x, y, z });
            });
        });

        // Size controls
        const sizeInputs = panel.querySelectorAll('.size-controls input');
        sizeInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (!this.screen || !this.textMesh) return;
                const width = parseFloat((panel.querySelector('.width-input') as HTMLInputElement).value);
                const height = parseFloat((panel.querySelector('.height-input') as HTMLInputElement).value);
                
                // Update screen geometry
                const newScreenGeometry = new THREE.PlaneGeometry(width, height);
                this.screen.geometry.dispose();
                this.screen.geometry = newScreenGeometry;
                
                // Update text overlay size and position
                const textGeometry = new THREE.PlaneGeometry(width, height * 0.25);
                this.textMesh.geometry.dispose();
                this.textMesh.geometry = textGeometry;
                this.textMesh.position.set(0, height/2 + 0.5, 0.01);
            });
        });
    }

    private initializeTheater(): void {
        // Create HTML container for text
        this.htmlContainer = document.createElement('div');
        this.htmlContainer.style.position = 'absolute';
        this.htmlContainer.style.left = '-9999px';
        this.htmlContainer.style.background = 'transparent';
        this.htmlContainer.style.padding = '20px';
        this.htmlContainer.style.width = '1024px';
        this.htmlContainer.style.height = '200px';
        this.htmlContainer.innerHTML = `
            <h1 style="
                color: white; 
                font-family: Arial, sans-serif;
                font-size: 60px;
                text-align: center;
                margin: 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            ">WELCOME TO PLAYGLENN.COM!</h1>
        `;
        document.body.appendChild(this.htmlContainer);

        // Create video element
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        video.play();

        // Create video texture
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;

        // Create text texture
        const textTexture = new THREE.Texture();
        
        // Function to update text texture
        const updateTextTexture = () => {
            import('html2canvas').then(({default: html2canvas}) => {
                if (!this.htmlContainer) return;
                html2canvas(this.htmlContainer, {
                    backgroundColor: null,
                }).then(canvas => {
                    textTexture.image = canvas;
                    textTexture.needsUpdate = true;
                });
            });
        };

        // Initial text render
        updateTextTexture();

        // Create container for all 3D objects
        const container = new THREE.Object3D();

        // Create screen with video
        const screenGeometry = new THREE.PlaneGeometry(42, 24);
        const screenMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.DoubleSide,
        });
        this.screen = new THREE.Mesh(screenGeometry, screenMaterial);
        
        // Create text overlay
        const textGeometry = new THREE.PlaneGeometry(42, 6);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            side: THREE.DoubleSide,
        });
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
        this.textMesh.position.set(0, 12 + 0.5, 0.01);

        // Add meshes to container
        container.add(this.screen);
        container.add(this.textMesh);

        // Create the Threebox object
        const theaterOptions = {
            obj: container,
            type: 'custom',
            units: 'meters',
            anchor: 'center',
            draggable: true,
            rotation: true,
            bbox: true,
            tooltip: false
        };

        this.theater3D = window.tb.Object3D(theaterOptions);
        this.theater3D.setCoords([11.980409469975397, 57.696599268753296, 37]);
        this.theater3D.setRotation({ x: 90, y: 38, z: 0 });

        window.tb.add(this.theater3D);
    }

    public destroy(): void {
        // Only remove the panel, not the theater
        this.container.innerHTML = '';
    }

    public destroyTheater(): void {
        // This should be called when the entire app is being destroyed
        if (this.theater3D) {
            window.tb.remove(this.theater3D);
        }
        if (this.screen) {
            this.screen.geometry.dispose();
            (this.screen.material as THREE.Material).dispose();
        }
        if (this.textMesh) {
            this.textMesh.geometry.dispose();
            (this.textMesh.material as THREE.Material).dispose();
        }
        if (this.htmlContainer) {
            this.htmlContainer.remove();
        }
    }
} 