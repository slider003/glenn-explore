import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import { PlayerStore } from './stores/PlayerStore';

// Extend MapboxDirections type to include the off method
declare module '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions' {
  interface MapboxDirections {
    off: (event: string, callback: Function) => void;
  }
}

// Event types for navigation
export interface NavigationEvents {
    start: (destination: [number, number]) => void;
    update: (progress: number, remainingDistance: number, remainingDuration: number) => void;
    complete: () => void;
    cancel: () => void;
}

/**
 * Controller for handling navigation and directions
 */
export class NavigationController {
    private map: mapboxgl.Map;
    private directions!: MapboxDirections;
    private isActive: boolean = false;
    private updateInterval: NodeJS.Timeout | null = null;
    private destinationMarker: mapboxgl.Marker | null = null;
    private arrivalThreshold: number = 50; // Meters - how close to destination to consider "arrived"
    private eventListeners: Partial<NavigationEvents> = {};
    private arrivalCheckActive: boolean = false;
    private activeRouteInfo: any = null; // Store the current route information
    // Track event listeners to manage them safely
    private eventListenersMap: Map<string, Function> = new Map();
    private arrivalZoneId: string = 'arrival-zone-circle'; // ID for the arrival zone
    private arrivalZoneVisible: boolean = false; // Track if arrival zone is visible
    private arrivalZoneRadius: number = 20; // Radius of arrival zone in meters (slightly larger than threshold)
    private arrivalZonePulseRate: number = 0.75; // Pulse rate in seconds

    constructor(map: mapboxgl.Map) {
        this.map = map;
        this.initializeDirections();
    }

    /**
     * Initialize the Mapbox Directions control
     */
    private initializeDirections(): void {
        // Create a Mapbox Directions instance
        this.directions = new MapboxDirections({
            accessToken: mapboxgl.accessToken || '',
            unit: 'metric',
            profile: 'mapbox/driving',
            alternatives: false,
            geometries: 'geojson',
            controls: {
                inputs: false,       // Hide the inputs since we'll set them programmatically
                instructions: false  // Hide turn-by-turn instructions for now
            },
            flyTo: false,          // Disable automatic camera movement
            interactive: false     // Disable interactive behavior (clicking on routes)
        });

        // Add the directions control to the map but don't show the UI
        this.map.addControl(this.directions as any, 'bottom-left');

        // Hide the directions UI container for now
        const directionsContainer = document.querySelector('.mapboxgl-ctrl-directions');
        if (directionsContainer) {
            (directionsContainer as HTMLElement).style.display = 'none';
        }
        
        // Listen for route calculation completion but don't auto-start navigation
        this.directions.on('route', (event: any) => {
            if (event && event.route && event.route[0]) {
                // Store route info but don't display yet
                this.activeRouteInfo = event.route[0];
            }
        });
    }

    /**
     * Calculate a route to the destination without starting navigation
     * Returns a promise that resolves when route is calculated
     */
    public calculateRoute(destination: [number, number]): Promise<any> {
        if (!PlayerStore.getCoordinates()) {
            return Promise.reject(new Error('Vehicle not connected to navigation controller'));
        }

        // Get current vehicle position
        const vehiclePosition = PlayerStore.getCoordinates();
        if (!vehiclePosition) {
            return Promise.reject(new Error('Unable to get vehicle position'));
        }

        // Clear previous route info
        this.activeRouteInfo = null;

        // Add temporary destination marker if it doesn't exist
        if (this.destinationMarker) {
            this.destinationMarker.remove();
        }

        const markerElement = document.createElement('div');
        markerElement.className = 'temp-destination-marker';
        this.destinationMarker = new mapboxgl.Marker({
            element: markerElement,
            color: '#FFAA00',
        })
            .setLngLat(destination)
            .addTo(this.map);

        // Set origin and destination in directions
        this.directions.setOrigin(vehiclePosition);
        this.directions.setDestination(destination);

        // Return a promise that resolves when route is calculated
        return new Promise((resolve, reject) => {
            // Create a unique listener ID for this calculation
            const listenerId = `route-calculation-${Date.now()}`;
            
            const routeCalculatedHandler = (event: any) => {
                if (event && event.route && event.route[0]) {
                    // Store the route info
                    this.activeRouteInfo = event.route[0];
                    
                    // Remove the event listener using the safer approach
                    this.removeRouteListener(listenerId);
                    
                    // Resolve with the route info
                    resolve(event.route[0]);
                }
            };

            // Add temporary event listener for route calculation
            this.addRouteListener(listenerId, routeCalculatedHandler);
            
            // Add a timeout for the route calculation
            const timeout = setTimeout(() => {
                this.removeRouteListener(listenerId);
                reject(new Error('Route calculation timed out'));
            }, 10000);
        });
    }

    /**
     * Get the currently calculated route info
     */
    public getActiveRouteInfo(): any {
        return this.activeRouteInfo;
    }

    /**
     * Set a destination and start navigation
     */
    public navigateTo(destination: [number, number]): void {

        // Get current vehicle position
        const vehiclePosition = PlayerStore.getCoordinates();
        if (!vehiclePosition) {
            console.error('Unable to get vehicle position');
            return;
        }

        // Remove any existing arrival zone
        this.removeArrivalZone();

        // Add destination marker
        if (this.destinationMarker) {
            this.destinationMarker.remove();
        }

        const markerElement = document.createElement('div');
        markerElement.className = 'destination-marker';
        this.destinationMarker = new mapboxgl.Marker({
            element: markerElement,
            color: '#00FF00',
            scale: 1.2
        })
            .setLngLat(destination)
            .addTo(this.map);

        // Set origin and destination in directions
        this.directions.setOrigin(vehiclePosition);
        this.directions.setDestination(destination);

        // Show the directions UI container
        const directionsContainer = document.querySelector('.mapboxgl-ctrl-directions');
        if (directionsContainer) {
            (directionsContainer as HTMLElement).style.display = 'block';
        }

        // Display route info if available or wait for it
        if (this.activeRouteInfo) {
            this.displayRouteInfo(this.activeRouteInfo);
        } else {
            // Create a unique listener ID for this route
            const listenerId = `route-display-${Date.now()}`;
            
            const routeHandler = (event: any) => {
                if (event && event.route && event.route[0]) {
                    this.activeRouteInfo = event.route[0];
                    this.displayRouteInfo(event.route[0]);
                    this.removeRouteListener(listenerId);
                }
            };
            
            // Otherwise, listen for route calculation
            this.addRouteListener(listenerId, routeHandler);
        }

        // Start updating the route as the vehicle moves
        this.isActive = true;
        this.arrivalCheckActive = true;
        this.startRouteUpdates();

        // Trigger the start event
        if (this.eventListeners.start) {
            this.eventListeners.start(destination);
        }
    }

    /**
     * Display a toast notification with route information
     */
    private displayRouteInfo(route: any): void {
        if (!route || !route.distance || !route.duration) return;

        // Create or get the toast element
        let toast = document.getElementById('route-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'route-toast';
            toast.className = 'route-toast';
            document.body.appendChild(toast);
        }

        // Format distance and time
        const distance = route.distance > 1000
            ? `${(route.distance / 1000).toFixed(1)} km`
            : `${Math.round(route.distance)} m`;

        let duration = '';
        if (route.duration > 3600) {
            const hours = Math.floor(route.duration / 3600);
            const minutes = Math.floor((route.duration % 3600) / 60);
            duration = `${hours} hr ${minutes} min`;
        } else if (route.duration > 60) {
            duration = `${Math.floor(route.duration / 60)} min`;
        } else {
            duration = `${Math.round(route.duration)} sec`;
        }

        // Set the toast content
        toast.innerHTML = `
      <div class="route-toast-header">
        <span class="route-toast-icon">🧭</span>
        <span>Route Calculated</span>
      </div>
      <div class="route-toast-details">
        <div><strong>Distance:</strong> ${distance}</div>
        <div><strong>Time:</strong> ${duration}</div>
      </div>
    `;

        // Show the toast
        toast.classList.add('visible');

        // Hide the toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 5000);
    }

    /**
     * Start periodic updates of the route
     */
    private startRouteUpdates(): void {
        // Clear any existing update interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Update the route every second
        this.updateInterval = setInterval(() => {
            if (!this.isActive) return;

            // Get current vehicle position and destination
            const vehiclePosition = PlayerStore.getCoordinates();
            const destination = this.directions.getDestination();
            
            if (!vehiclePosition || !destination) return;

            // Check if we've arrived at the destination
            if (this.arrivalCheckActive) {
                const [destLng, destLat] = destination.geometry.coordinates;

                const distance = this.calculateDistance(
                    vehiclePosition[0], vehiclePosition[1],
                    destLng, destLat
                   
                );

                // Show arrival zone when getting close (within 100 meters)
                if (distance <= 100 && !this.arrivalZoneVisible) {
                    this.showArrivalZone([destLng, destLat]);
                }

                // Update progress for UI if needed
                if (this.eventListeners.update && this.activeRouteInfo) {
                    // Calculate progress percentage
                    const totalDistance = this.activeRouteInfo.distance;
                    const remainingDistance = distance;
                    const progress = Math.min(100, Math.max(0, 
                        (totalDistance - remainingDistance) / totalDistance * 100));
                    
                    // Estimate remaining duration based on progress
                    const totalDuration = this.activeRouteInfo.duration;
                    const remainingDuration = totalDuration * (1 - (progress / 100));
                    
                    // Trigger update event
                    this.eventListeners.update(progress, remainingDistance, remainingDuration);
                }

                if (distance <= this.arrivalThreshold) {
                    this.handleArrival();
                    return;
                }
            }

            // Update origin with current vehicle position
            //TODO this.directions.setOrigin(vehiclePosition);
        }, 500);
    }

    /**
     * Calculate the distance between two points in meters
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = this.toRadians(lat1);
        const φ2 = this.toRadians(lat2);
        const Δφ = this.toRadians(lat2 - lat1);
        const Δλ = this.toRadians(lon2 - lon1);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * Math.PI / 180;
    }

    /**
     * Show the arrival zone at the destination
     */
    private showArrivalZone(center: [number, number]): void {
        // Don't add if already visible
        if (this.arrivalZoneVisible) return;
        
        // Remove any existing arrival zone first
        this.removeArrivalZone();

        // Check if the map already has the source
        if (!this.map.getSource(this.arrivalZoneId)) {
            // Add a source for the arrival zone circle
            this.map.addSource(this.arrivalZoneId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: center
                    },
                    properties: {}
                }
            });
        } else {
            // Update the existing source
            const source = this.map.getSource(this.arrivalZoneId) as mapboxgl.GeoJSONSource;
            source.setData({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: center
                },
                properties: {}
            });
        }

        // Add a pulsing circle layer if it doesn't exist
        if (!this.map.getLayer(this.arrivalZoneId)) {
            this.map.addLayer({
                id: this.arrivalZoneId,
                type: 'circle',
                source: this.arrivalZoneId,
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12, this.arrivalZoneRadius * 2,  // Adjust size based on zoom level
                        16, this.arrivalZoneRadius * 10,
                        20, this.arrivalZoneRadius * 40
                    ],
                    'circle-color': '#00FF00',
                    'circle-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12, 0.2,  // More transparent when zoomed out
                        16, 0.3
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#00FF00',
                    'circle-stroke-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12, 0.5,
                        16, 0.8
                    ]
                }
            });
        }

        this.arrivalZoneVisible = true;
    }


    /**
     * Remove the arrival zone from the map
     */
    private removeArrivalZone(): void {
        // Remove the pulse layer
        if (this.map.getLayer(`${this.arrivalZoneId}-pulse`)) {
            this.map.removeLayer(`${this.arrivalZoneId}-pulse`);
        }

        // Remove the circle layer
        if (this.map.getLayer(this.arrivalZoneId)) {
            this.map.removeLayer(this.arrivalZoneId);
        }

        // Remove the source
        if (this.map.getSource(this.arrivalZoneId)) {
            this.map.removeSource(this.arrivalZoneId);
        }

        this.arrivalZoneVisible = false;
    }

    /**
     * Handle arrival at the destination
     */
    private handleArrival(): void {
        this.arrivalCheckActive = false;

        // Create confetti container
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'arrival-confetti';
        document.body.appendChild(confettiContainer);

        // Add 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            
            // Randomize confetti properties
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
            
            confettiContainer.appendChild(confetti);
        }

        // Get distance and time from route info
        let distanceText = '';
        let timeText = '';
        
        if (this.activeRouteInfo) {
            // Format distance
            const distance = this.activeRouteInfo.distance;
            distanceText = distance > 1000
                ? `${(distance / 1000).toFixed(1)} kilometers`
                : `${Math.round(distance)} meters`;
                
            // Format time
            const duration = this.activeRouteInfo.duration;
            if (duration > 3600) {
                timeText = `${Math.floor(duration / 3600)} hr ${Math.floor((duration % 3600) / 60)} min`;
            } else {
                timeText = `${Math.floor(duration / 60)} minutes`;
            }
        }

        // Create arrival notification with journey stats
        const notification = document.createElement('div');
        notification.className = 'arrival-notification';
        notification.innerHTML = `
            <div class="arrival-icon">🏁</div>
            <div class="arrival-text">Destination Reached!</div>
            <div class="arrival-subtext">
                ${distanceText && timeText ? `You've completed a ${distanceText} journey in style!` : 'Journey completed successfully!'}
            </div>
            <button class="arrival-close">×</button>
        `;
        document.body.appendChild(notification);

        // Add event listener to close button
        const closeButton = notification.querySelector('.arrival-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    confettiContainer.remove();
                }, 500);
            });
        }

        // Automatically remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('closing');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);

        // Remove confetti after 6 seconds
        setTimeout(() => {
            confettiContainer.remove();
        }, 6000);

        // Trigger the complete event
        if (this.eventListeners.complete) {
            this.eventListeners.complete();
        }

        // Auto-cancel navigation after arrival
        setTimeout(() => {
            this.cancelNavigation();
        }, 6000);
    }

    /**
     * Cancel navigation
     */
    public cancelNavigation(): void {
        this.isActive = false;
        this.arrivalCheckActive = false;

        // Clear update interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Remove arrival zone
        this.removeArrivalZone();

        // Remove routes
        this.directions.removeRoutes();

        // Remove destination marker
        if (this.destinationMarker) {
            this.destinationMarker.remove();
            this.destinationMarker = null;
        }

        // Hide the directions UI container
        const directionsContainer = document.querySelector('.mapboxgl-ctrl-directions');
        if (directionsContainer) {
            (directionsContainer as HTMLElement).style.display = 'none';
        }

        // Trigger the cancel event
        if (this.eventListeners.cancel) {
            this.eventListeners.cancel();
        }
    }

    /**
     * Register event listeners
     */
    public on<K extends keyof NavigationEvents>(event: K, callback: NavigationEvents[K]): void {
        this.eventListeners[event] = callback;
    }

    /**
     * Set the arrival threshold distance in meters
     */
    public setArrivalThreshold(meters: number): void {
        this.arrivalThreshold = meters;
    }

    /**
     * Toggle navigation visibility
     */
    public toggleDirectionsPanel(): void {
        const directionsContainer = document.querySelector('.mapboxgl-ctrl-directions');
        if (directionsContainer) {
            const currentDisplay = (directionsContainer as HTMLElement).style.display;
            (directionsContainer as HTMLElement).style.display = currentDisplay === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Set the routing profile
     */
    public setProfile(profile: 'driving' | 'walking' | 'cycling'): void {
        const profileMap = {
            'driving': 'mapbox/driving',
            'walking': 'mapbox/walking',
            'cycling': 'mapbox/cycling'
        };

        this.directions.setProfile(profileMap[profile]);

        // If navigation is active, refresh the route
        if (this.isActive) {
            const vehiclePosition = PlayerStore.getCoordinates();
            const destination = this.directions.getDestination();

            if (vehiclePosition && destination) {
                this.directions.setOrigin(vehiclePosition);
                this.directions.setDestination(destination);
            }
        }
    }

    /**
     * Get the current vehicle position coordinates
     */
    public getVehiclePosition(): [number, number] | null {
        const coords = PlayerStore.getCoordinates();
        if (!coords || coords.length < 2) return null;
        
        return [coords[0], coords[1]];
    }

    /**
     * Get the current vehicle bearing/heading
     */
    public getVehicleBearing(): number | null {
        const heading = PlayerStore.getRotation().z
        // Convert to mapbox bearing format (0-360 degrees)
        return heading !== undefined ? (heading * (180 / Math.PI) + 90) % 360 : null;
    }

    /**
     * Safely add a route event listener
     */
    private addRouteListener(id: string, callback: Function): void {
        // Store the callback in our map
        this.eventListenersMap.set(id, callback);
        
        // Add the listener to the directions control
        this.directions.on('route', callback as any);
    }
    
    /**
     * Safely remove a route event listener
     */
    private removeRouteListener(id: string): void {
        // Get the callback from our map
        const callback = this.eventListenersMap.get(id);
        
        if (callback) {
            // Remove from directions if it has an off method
            try {
                // Try to use off method if it exists
                (this.directions as any).off?.('route', callback);
            } catch (e) {
                // If off method doesn't exist or fails, we already have the callback
                // removed from our map which is the important part
            }
            
            // Remove from our map
            this.eventListenersMap.delete(id);
        }
    }
} 