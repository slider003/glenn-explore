import mapboxgl from 'mapbox-gl';
import { MinimapElements, MinimapOptions, OtherVehicleData } from './MinimapTypes';
import './minimap.css';
import { PlayerStore } from '../stores/PlayerStore';

interface MinimapCallbacks {
    onExpand: () => void;
    onCollapse: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
}

export class MinimapUI {
    private elements: Partial<MinimapElements> = {};
    private isExpanded: boolean = false;
    private otherVehicleMarkers: Map<string, mapboxgl.Marker> = new Map();
    private coords: [number, number] = [0, 0];
    private rotation: number = 0;
    private defaultZoom: number = 14;
    constructor(
        private map: mapboxgl.Map,
        private options: MinimapOptions = {},
        private callbacks: MinimapCallbacks
    ) {
        this.map = map;
        this.initializeUI();
    }

    private initializeUI(): void {
        this.createContainer();
        this.createMap();
        this.setupEventListeners();
    }

    private createContainer(): void {
        const container = document.createElement('div');
        container.className = 'minimap-container';
        document.body.appendChild(container);
        this.elements.container = container;
    }

    private createMap(): void {
        // Create wrapper first
        const wrapper = document.createElement('div');
        wrapper.className = 'minimap-wrapper';
        this.elements.container?.appendChild(wrapper);

        // Create map container inside wrapper
        const mapContainer = document.createElement('div');
        mapContainer.className = 'minimap-small';
        wrapper.appendChild(mapContainer);

        // Create navigation container after the wrapper
        const navigationContainer = document.createElement('div');
        navigationContainer.className = 'minimap-navigation-container';
        this.elements.container?.appendChild(navigationContainer);
        this.elements.navigationContainer = navigationContainer;

        this.elements.map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: this.map.getCenter(),
            zoom: this.defaultZoom, // Fixed zoom for small mode
            attributionControl: false
        });

        // Disable all interactions initially (small mode)
        this.elements.map.dragPan.disable();
        this.elements.map.scrollZoom.disable();
        this.elements.map.doubleClickZoom.disable();
        this.elements.map.touchZoomRotate.disable();
        this.elements.map.keyboard.disable();
        this.elements.map.boxZoom.disable();
        this.elements.map.dragRotate.disable();

        // Add navigation control (hidden initially in small mode)
        const nav = new mapboxgl.NavigationControl({
            showCompass: false
        });

        this.elements.map.addControl(nav, 'top-right');

        // Add zoom control handlers after the control is added to the map
        const container = this.elements.container;
        if (container) {
            const zoomInButton = container.querySelector('.mapboxgl-ctrl-zoom-in');
            const zoomOutButton = container.querySelector('.mapboxgl-ctrl-zoom-out');

            zoomInButton?.addEventListener('click', this.callbacks.onZoomIn);
            zoomOutButton?.addEventListener('click', this.callbacks.onZoomOut);
        }

        // Create vehicle marker
        const markerElement = document.createElement('div');
        markerElement.className = 'minimap-vehicle-marker';
        this.elements.marker = new mapboxgl.Marker({
            element: markerElement,
            rotationAlignment: 'map'
        }).setLngLat(this.map.getCenter())
            .addTo(this.elements.map);

        // Add toggle button to wrapper
        this.createToggleButton(wrapper);
    }

    private createToggleButton(wrapper: HTMLElement): void {
        const button = document.createElement('button');
        button.className = 'minimap-toggle';
        button.innerHTML = '⤢';
        button.title = 'Expand Minimap';
        wrapper.appendChild(button);
        this.elements.toggleButton = button;
    }

    private setupEventListeners(): void {
        // Toggle button click
        this.elements.toggleButton?.addEventListener('click', () => {
            if (this.isExpanded) {
                this.callbacks.onCollapse();
            } else {
                this.callbacks.onExpand();
            }
        });

        // Map movement
        this.elements.map?.on('movestart', (e: any) => {
            // If user initiated the movement (not programmatic)
            if (e.originalEvent && this.isExpanded) {
                this.options.autoFollowVehicle = false;
            }
        });

        // Map zoom
        this.elements.map?.on('zoomstart', (e: any) => {
            // If user initiated the zoom (not programmatic)
            if (e.originalEvent && this.isExpanded) {
                this.options.autoFollowVehicle = false;
            }
        });

        // Map rotation
        this.elements.map?.on('rotatestart', (e: any) => {
            // If user initiated the rotation (not programmatic)
            if (e.originalEvent && this.isExpanded) {
                this.options.rotateWithVehicle = false;
            }
        });
    }

    public setExpanded(expanded: boolean): void {
        this.isExpanded = expanded;

        const mapContainer = this.elements.container?.querySelector('.minimap-small, .minimap-large');
        if (mapContainer) {
            mapContainer.className = expanded ? 'minimap-large' : 'minimap-small';
        }

        if (this.elements.toggleButton) {
            this.elements.toggleButton.innerHTML = expanded ? '⤢' : '⤢';
            this.elements.toggleButton.title = expanded ? 'Collapse Minimap' : 'Expand Minimap';
        }

        // Update map interactivity and zoom based on mode
        if (this.elements.map) {
            if (expanded) {
                // Enable all interactions for expanded mode
                this.elements.map.dragPan.enable();
                this.elements.map.scrollZoom.enable();
                this.elements.map.doubleClickZoom.enable();
                this.elements.map.touchZoomRotate.enable();
                this.elements.map.keyboard.enable();
                this.elements.map.boxZoom.enable();
                this.elements.map.dragRotate.enable();

                // Set zoom level for expanded mode
                const mainMapZoom = this.map.getZoom();
                this.elements.map.setZoom(mainMapZoom - (this.options.defaultZoomOffset || 6));
            } else {
                // Disable all interactions for small mode
                this.elements.map.dragPan.disable();
                this.elements.map.scrollZoom.disable();
                this.elements.map.doubleClickZoom.disable();
                this.elements.map.touchZoomRotate.disable();
                this.elements.map.keyboard.disable();
                this.elements.map.boxZoom.disable();
                this.elements.map.dragRotate.disable();

                // Reset zoom for small mode
                this.elements.map.setZoom(10);
            }

            // Trigger resize on the map
            setTimeout(() => {
                this.elements.map?.resize();
            }, 300);
        }
    }

    public zoomIn(): void {
        if (!this.isExpanded || !this.elements.map) return;
        const currentZoom = this.elements.map.getZoom();
        this.elements.map.setZoom(currentZoom + 1);
    }

    public zoomOut(): void {
        if (!this.isExpanded || !this.elements.map) return;
        const currentZoom = this.elements.map.getZoom();
        this.elements.map.setZoom(currentZoom - 1);
    }

    public resetView(): void {
        if (!this.elements.map) return;

        this.elements.map.setZoom(this.defaultZoom);
        this.elements.map.setCenter([PlayerStore.getCoordinates()[0], PlayerStore.getCoordinates()[1]]);
        this.elements.map.setBearing(-(PlayerStore.getRotation().z * 180 / Math.PI));
    }

    public resize(): void {
        this.elements.map?.resize();
    }

    public updateOtherVehicle(vehicleData: OtherVehicleData): void {
        let marker = this.otherVehicleMarkers.get(vehicleData.id);

        if (!marker) {
            // Create marker element
            const markerElement = document.createElement('div');
            markerElement.className = 'minimap-other-vehicle-marker';

            // Add name label
            const nameLabel = document.createElement('div');
            nameLabel.className = 'minimap-vehicle-name';
            nameLabel.textContent = vehicleData.name;
            markerElement.appendChild(nameLabel);

            // Create and add marker
            marker = new mapboxgl.Marker({
                element: markerElement,
                rotationAlignment: 'map'
            }).setLngLat(this.coords)
                .addTo(this.elements.map!);

            this.otherVehicleMarkers.set(vehicleData.id, marker);
        } else {
            // Update existing marker
            marker.setLngLat(vehicleData.coordinates)
            // Update name if changed
            const nameLabel = marker.getElement().querySelector('.minimap-vehicle-name');
            if (nameLabel && nameLabel.textContent !== vehicleData.name) {
                nameLabel.textContent = vehicleData.name;
            }
        }

        // Update rotation if available
        if (vehicleData.rotation) {
            marker.setRotation(-(vehicleData.rotation.z * 180 / Math.PI));
        }
    }

    public removeOtherVehicle(playerId: string): void {
        const marker = this.otherVehicleMarkers.get(playerId);
        if (marker) {
            marker.remove();
            this.otherVehicleMarkers.delete(playerId);
        }
    }

    public destroy(): void {
        // Remove all other vehicle markers
        this.otherVehicleMarkers.forEach(marker => marker.remove());
        this.otherVehicleMarkers.clear();

        // Remove all DOM elements
        this.elements.container?.remove();

        // Remove map
        this.elements.map?.remove();

        // Remove marker
        this.elements.marker?.remove();

        // Clear elements reference
        this.elements = {};
    }



    public updateVehiclePosition(coords: [number, number], bearing: number): void {
        this.coords = coords
        this.rotation = bearing
        // Update marker position and rotation
        if (this.elements.marker) {
            this.elements.marker
                .setLngLat(coords)
                .setRotation(0);

            // In small mode, always follow vehicle
            // In expanded mode, only follow if autoFollow is enabled
            if (!this.isExpanded || this.options.autoFollowVehicle) {
                this.elements.map?.setCenter(coords);
            }

            // Only rotate with vehicle if the option is enabled
            if (this.options.rotateWithVehicle) {
                this.elements.map?.setBearing(bearing);
            }
        }
    }

    // Add method to get navigation container
    public getNavigationContainer(): HTMLElement | undefined {
        return this.elements.navigationContainer;
    }
} 