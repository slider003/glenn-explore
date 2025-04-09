import '../styles/navigation.css'
import mapboxgl from 'mapbox-gl';
import { CameraController } from './CameraController';
import { NavigationController } from './NavigationController';
import { TeleportOptions } from '../types/teleport';

export interface NavigationUIOptions {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    cameraController?: CameraController;
    container?: HTMLElement;
}

/**
 * UI Controller for navigation that allows address input and map selection
 */
export class NavigationUI {
    private map: mapboxgl.Map;
    private navigationController: NavigationController;
    private container: HTMLDivElement;
    private addressInput: HTMLInputElement;
    private findRouteButton: HTMLButtonElement;
    private teleportButton: HTMLButtonElement;
    private cancelButton: HTMLButtonElement;
    private mapSelectionMode: boolean = false;
    private tempMarker: mapboxgl.Marker | null = null;
    private selectedDestination: [number, number] | null = null;
    // Add new properties for suggestions
    private suggestionsContainer: HTMLDivElement;
    private suggestions: Array<{ text: string, coords: [number, number] }> = [];
    private debounceTimer: number | null = null;
    private onTeleport: (teleportOptions: TeleportOptions) => void;
    constructor(map: mapboxgl.Map, navigationController: NavigationController, onTeleport: (teleportOptions: TeleportOptions) => void, options: NavigationUIOptions = {}) {
        this.map = map;
        this.navigationController = navigationController;
        this.onTeleport = onTeleport;

        // Create the UI container
        this.container = document.createElement('div');
        this.container.className = 'navigation-ui';

        // Create input container for input and suggestions
        const inputContainer = document.createElement('div');
        inputContainer.className = 'navigation-input-container';

        // Create address input field
        this.addressInput = document.createElement('input');
        this.addressInput.type = 'text';
        this.addressInput.placeholder = 'Where to?';
        this.addressInput.className = 'navigation-address-input';

        // Create suggestions container
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'navigation-suggestions';
        this.suggestionsContainer.style.display = 'none';

        // Add input and suggestions to input container
        inputContainer.appendChild(this.addressInput);
        inputContainer.appendChild(this.suggestionsContainer);

        // Create buttons container (hidden by default)
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'navigation-buttons-container hidden';

        // Create find route button
        this.findRouteButton = document.createElement('button');
        this.findRouteButton.textContent = 'Navigate to';
        this.findRouteButton.className = 'navigation-find-button';
        this.findRouteButton.disabled = true;

        // Create teleport button
        this.teleportButton = document.createElement('button');
        this.teleportButton.textContent = 'Teleport';
        this.teleportButton.className = 'navigation-teleport-button';
        this.teleportButton.disabled = true;

        // Create cancel button (hidden by default)
        this.cancelButton = document.createElement('button');
        this.cancelButton.textContent = '×';
        this.cancelButton.className = 'navigation-cancel-button hidden';

        // Add buttons to container
        buttonsContainer.appendChild(this.findRouteButton);
        buttonsContainer.appendChild(this.teleportButton);

        // Add all elements to main container
        this.container.appendChild(inputContainer);
        this.container.appendChild(buttonsContainer);
        this.container.appendChild(this.cancelButton);

        // Add container to the specified container or document.body
        if (options.container) {
            options.container.appendChild(this.container);
        } else {
            document.body.appendChild(this.container);
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for UI interactions
     */
    private setupEventListeners(): void {
        // Address input change
        this.addressInput.addEventListener('input', () => {
            // Reset suggestion selection state

            // Always disable find route button until a suggestion is selected
            this.findRouteButton.disabled = true;
            this.teleportButton.disabled = true;

            const query = this.addressInput.value.trim();
            if (query.length > 2) {
                // Debounce the suggestions request
                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                }

                this.debounceTimer = window.setTimeout(() => {
                    this.fetchSuggestions(query);
                }, 300) as unknown as number;
            } else {
                this.hideSuggestions();
            }
        });

        // Click outside suggestions to dismiss
        document.addEventListener('click', (e) => {
            if (!this.suggestionsContainer.contains(e.target as Node) &&
                e.target !== this.addressInput) {
                this.hideSuggestions();
            }
        });

        // Find route button
        this.findRouteButton.addEventListener('click', () => {
            this.findRoute();
        });

        // Teleport button
        this.teleportButton.addEventListener('click', () => {
            this.teleportToDestination();
        });

        // Cancel button
        this.cancelButton.addEventListener('click', () => {
            this.reset();
            this.hide();
        });

        // Map click for destination selection
        this.map.on('click', (e) => {
            if (this.mapSelectionMode) {
                this.handleMapClick(e);
            }
        });

        // Geocoding result handling - now handled by suggestions
        this.addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                // Prevent default form submission behavior
                e.preventDefault();

                // If there are suggestions and first one is visible, select it
                if (this.suggestions.length > 0 && this.suggestionsContainer.style.display !== 'none') {
                    this.selectSuggestion(0);
                }
            }
        });
    }

    /**
     * Fetch address suggestions based on query
     */
    private fetchSuggestions(query: string): void {
        // Use Mapbox geocoding API with autocomplete enabled
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&autocomplete=true&limit=5`)
            .then(response => response.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    // Transform features to our suggestions format
                    this.suggestions = data.features.map((feature: any) => ({
                        text: feature.place_name,
                        coords: [feature.center[0], feature.center[1]] as [number, number]
                    }));

                    // Display suggestions
                    this.showSuggestions();
                } else {
                    this.hideSuggestions();
                }
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
                this.hideSuggestions();
            });
    }

    /**
     * Display the suggestions dropdown
     */
    private showSuggestions(): void {
        // Clear previous suggestions
        this.suggestionsContainer.innerHTML = '';

        // Create and append suggestion elements
        this.suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'navigation-suggestion-item';
            item.textContent = suggestion.text;

            // Add click handler
            item.addEventListener('click', () => {
                this.selectSuggestion(index);
            });

            this.suggestionsContainer.appendChild(item);
        });

        // Show the container
        this.suggestionsContainer.style.display = 'block';
    }

    /**
     * Hide the suggestions dropdown
     */
    private hideSuggestions(): void {
        this.suggestionsContainer.style.display = 'none';
    }

    /**
     * Select a suggestion by index
     */
    private selectSuggestion(index: number): void {
        if (index >= 0 && index < this.suggestions.length) {
            const selected = this.suggestions[index];

            // Update input value
            this.addressInput.value = selected.text;

            // Store coordinates
            this.selectedDestination = selected.coords;

            // Update marker on map
            if (this.tempMarker) {
                this.tempMarker.setLngLat(selected.coords);
            } else {
                const markerElement = document.createElement('div');
                markerElement.className = 'temp-destination-marker';

                this.tempMarker = new mapboxgl.Marker({
                    element: markerElement,
                    color: '#FFAA00',
                })
                    .setLngLat(selected.coords)
                    .addTo(this.map);
            }

            // Fly to location
            this.map.flyTo({
                center: selected.coords,
                zoom: 17.5,
                essential: true
            });

            // Show and enable buttons
            const buttonsContainer = this.container.querySelector('.navigation-buttons-container');
            if (buttonsContainer) {
                buttonsContainer.classList.remove('hidden');
            }
            this.findRouteButton.disabled = false;
            this.teleportButton.disabled = false;
            this.cancelButton.classList.remove('hidden');

            // Hide suggestions
            this.hideSuggestions();
        }
    }

    /**
     * Handle map click when in selection mode
     */
    private handleMapClick(e: mapboxgl.MapMouseEvent): void {
        // Get clicked coordinates
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];

        // Update or create temporary marker
        if (this.tempMarker) {
            this.tempMarker.setLngLat(coords);
        } else {
            const markerElement = document.createElement('div');
            markerElement.className = 'temp-destination-marker';

            this.tempMarker = new mapboxgl.Marker({
                element: markerElement,
                color: '#FFAA00', // Different color from final destination marker
            })
                .setLngLat(coords)
                .addTo(this.map);
        }

        // Store selected destination
        this.selectedDestination = coords;

        // Enable both buttons
        this.findRouteButton.disabled = false;
        this.teleportButton.disabled = false;

        // Exit selection mode
        this.mapSelectionMode = false;
        this.map.getCanvas().style.cursor = '';
    }

    /**
     * Teleport directly to the selected destination
     */
    private teleportToDestination(): void {
        if (!this.selectedDestination) {
            this.showToast('Please select a location from the suggestions', 'info');
            return;
        }

        // Teleport the vehicle to the destination
        this.onTeleport({
            position: {
                lng: this.selectedDestination[0],
                lat: this.selectedDestination[1]
            }
        });

        // Show a teleportation success message
        this.showToast('Teleported to destination!', 'info');

        // Remove temporary marker
        if (this.tempMarker) {
            this.tempMarker.remove();
            this.tempMarker = null;
        }

        // Reset UI and hide
        this.reset();
        this.hide();
    }

    /**
     * Find a route to the selected destination
     */
    private findRoute(): void {
        if (!this.selectedDestination) {
            // We require a selected destination now
            this.showToast('Please select a location from the suggestions', 'info');
            return;
        }

        if (this.selectedDestination) {
            // Start navigation with the selected destination
            this.navigationController.navigateTo(this.selectedDestination);

            // Remove temporary marker as the navigation controller will add the real one
            if (this.tempMarker) {
                this.tempMarker.remove();
                this.tempMarker = null;
            }

            // Hide navigation UI after starting navigation
            this.hide();
        }
    }

    /**
     * Show a toast notification
     */
    private showToast(message: string, type: 'info' | 'error' = 'info'): void {
        // Create or get toast element
        let toast = document.getElementById('nav-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'nav-toast';
            toast.className = 'nav-toast';
            document.body.appendChild(toast);
        }

        // Set toast content and type
        toast.textContent = message;
        toast.className = `nav-toast nav-toast-${type}`;

        // Show the toast
        toast.classList.add('visible');

        // Hide the toast after a few seconds
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }

    /**
     * Reset the navigation UI state
     */
    public reset(): void {
        // Clear address input
        this.addressInput.value = '';

        // Hide buttons container
        const buttonsContainer = this.container.querySelector('.navigation-buttons-container');
        if (buttonsContainer) {
            buttonsContainer.classList.add('hidden');
        }

        // Hide cancel button
        this.cancelButton.classList.add('hidden');

        // Disable both buttons
        this.findRouteButton.disabled = true;
        this.teleportButton.disabled = true;

        // Remove temporary marker
        if (this.tempMarker) {
            this.tempMarker.remove();
            this.tempMarker = null;
        }

        // Hide suggestions
        this.hideSuggestions();

        // Clear selected destination
        this.selectedDestination = null;
    }

    /**
     * Show the navigation UI
     */
    public show(): void {
        //this.container.style.display = 'flex';
        this.reset(); // Reset state when showing
    }

    /**
     * Hide the navigation UI
     */
    public hide(): void {
        //this.container.style.display = 'none';
        this.reset(); // Reset state when hiding
    }

    /**
     * Toggle the navigation UI visibility
     */
    public toggle(): void {
        if (this.container.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Check if the navigation UI is visible
     */
    public isVisible(): boolean {
        return this.container.style.display !== 'none';
    }

    /**
     * Set the destination from map coordinates
     */
    public setDestinationFromMap(coords: [number, number]): void {
        // Update or create temporary marker
        if (this.tempMarker) {
            this.tempMarker.setLngLat(coords);
        } else {
            const markerElement = document.createElement('div');
            markerElement.className = 'temp-destination-marker';

            this.tempMarker = new mapboxgl.Marker({
                element: markerElement,
                color: '#FFAA00',
            })
                .setLngLat(coords)
                .addTo(this.map);
        }

        // Store selected destination
        this.selectedDestination = coords;

        // Enable both buttons
        this.findRouteButton.disabled = false;
        this.teleportButton.disabled = false;

        // Fetch and display the location name
        this.reverseGeocode(coords);
    }

    /**
     * Reverse geocode coordinates to get address
     */
    private reverseGeocode(coords: [number, number]): void {
        // Use Mapbox geocoding API to get place name
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${mapboxgl.accessToken}`)
            .then(response => response.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    // Display the place name in the address input
                    this.addressInput.value = data.features[0].place_name || `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
                } else {
                    // Just display the coordinates if place name not found
                    this.addressInput.value = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
                }
            })
            .catch(err => {
                console.error('Reverse geocoding error:', err);
                // Fallback to showing coordinates
                this.addressInput.value = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
            });
    }
} 