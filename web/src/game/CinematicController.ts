import { PlayerStore } from './stores/PlayerStore';

/**
 * Interface for defining a waypoint in a cinematic sequence
 */
export interface Waypoint {
  position: [number, number];  // [longitude, latitude]
  zoom: number;                // Map zoom level
  pitch: number;               // Camera pitch in degrees
  bearing: number;             // Camera bearing in degrees 
  duration: number;            // Duration of transition to this point in ms
  message?: string;            // Optional message to display
}

/**
 * Interface for defining a point of interest
 */
export interface PointOfInterest extends Waypoint {
  id: string;                  // Unique identifier
  name: string;                // Display name
  description: string;         // Description of the location
  thumbnailUrl?: string;       // Optional thumbnail image URL
}

/**
 * Options for controlling cinematic behavior
 */
export interface CinematicOptions {
  disableControls?: boolean;   // Whether to disable user controls during cinematics
  showMessages?: boolean;      // Whether to show messages during transitions
  messageClass?: string;       // CSS class for message element
  pauseBetweenWaypoints?: number; // Pause time between waypoints in ms
  onStart?: () => void;        // Callback when cinematic starts
  onWaypoint?: (index: number, waypoint: Waypoint) => void; // Callback at each waypoint
  onComplete?: () => void;     // Callback when cinematic completes
}

/**
 * Class to manage cinematic camera movements and tours
 */
export class CinematicController {
  private map: mapboxgl.Map;
  private messageElement: HTMLElement | null = null;
  private isPlaying: boolean = false;
  private wasDragPanEnabled: boolean = false;
  private wasKeyboardEnabled: boolean = false;
  private defaultOptions: CinematicOptions = {
    disableControls: true,
    showMessages: true,
    messageClass: 'cinematic-message',
    pauseBetweenWaypoints: 500
  };

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  /**
   * Play a cinematic sequence through multiple waypoints
   */
  public playTour(waypoints: Waypoint[], options: CinematicOptions = {}): void {
    // Merge default options with provided options
    const mergedOptions = { ...this.defaultOptions, ...options };
    PlayerStore.setFollowCar(false)
    // Always start with Earth view
    this.map.flyTo({
      center: [0, 20],
      zoom: 2,
      pitch: 0,
      bearing: 0,
      duration: 2000
    });
    // Don't start if already playing
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Call onStart callback if provided
    if (mergedOptions.onStart) {
      mergedOptions.onStart();
    }

    // Disable controls if requested
    if (mergedOptions.disableControls) {
      this.disableControls();
    }

    // Create message element if needed
    if (mergedOptions.showMessages) {
      this.createMessageElement(mergedOptions.messageClass || 'cinematic-message');
    }

    // Start the tour animation
    this.animateThroughWaypoints(waypoints, 0, mergedOptions);
  }

  /**
   * Play a cinematic to a single point of interest
   */
  public flyToPOI(poi: PointOfInterest, options: CinematicOptions = {}): void {
    // Create a short tour with current position and the POI
    const currentPosition = this.map.getCenter();
    const startWaypoint: Waypoint = {
      position: [currentPosition.lng, currentPosition.lat],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing(),
      duration: 0
    };

    // Flyover waypoint that's higher and zoomed out
    const flyoverWaypoint: Waypoint = {
      position: [
        (currentPosition.lng + poi.position[0]) / 2,
        (currentPosition.lat + poi.position[1]) / 2
      ],
      zoom: Math.min(this.map.getZoom(), poi.zoom) - 2,
      pitch: 60,
      bearing: this.calculateBearing(
        [currentPosition.lng, currentPosition.lat],
        poi.position
      ),
      duration: 2000,
      message: `Flying to ${poi.name}...`
    };

    // Final POI waypoint
    const poiWaypoint: Waypoint = {
      ...poi,
      message: poi.description
    };

    // Play the three-point tour
    this.playTour([startWaypoint, flyoverWaypoint, poiWaypoint], {
      ...options,
      // Add a callback to return to the vehicle when done
      onComplete: () => {
        // Wait a moment to view the POI, then return to vehicle
        setTimeout(() => {
          this.returnToVehicle(options);

          // Call the original onComplete if provided
          if (options.onComplete) {
            options.onComplete();
          }
        }, 3000);
      }
    });
  }

  /**
   * Return to the vehicle after viewing a POI
   */
  public returnToVehicle(_options: CinematicOptions = {}): void {
    // if (!this.vehicle || !this.vehicle.getVehicle()) return;

    // const vehiclePosition = this.vehicle.getVehicle().coordinates;
    // const vehicleBearing = -this.vehicle.getVehicle().rotation.z * 180 / Math.PI;

    // Create a simple tour back to the vehicle
    // const returnWaypoint: Waypoint = {
    //   position: [vehiclePosition[0], vehiclePosition[1]],
    //   zoom: 21.5,
    //   pitch: 80,
    //   bearing: vehicleBearing,
    //   duration: 2000,
    //   message: 'Returning to vehicle...'
    // };

    // this.playTour([returnWaypoint], {
    //   ...options,
    //   onComplete: () => {
    //     // Resume camera following
    //     CameraController.startFollowing();


    //     // Call the original onComplete if provided
    //     if (options.onComplete) {
    //       options.onComplete();
    //     }
    //   }
    // });
  }

  /**
   * Stop the current cinematic sequence
   */
  public stop(): void {
    if (!this.isPlaying) return;

    // Remove message element
    this.removeMessageElement();

    // Re-enable controls
    this.enableControls();

    // Reset state
    this.isPlaying = false;
  }



  /**
   * Get predefined points of interest for Gothenburg
   */
  public getGothenburgPOIs(): PointOfInterest[] {
    return [
      {
        id: 'karlatornet',
        name: 'Karlatornet',
        position: [11.935, 57.700],
        zoom: 16,
        pitch: 70,
        bearing: 30,
        duration: 2000,
        description: 'Scandinavia\'s tallest skyscraper reaching for the Nordic sky!'
      },
      {
        id: 'ramberget',
        name: 'Ramberget',
        position: [11.925, 57.715],
        zoom: 15,
        pitch: 60,
        bearing: 220,
        duration: 2000,
        description: 'Offering the most spectacular panoramic views of the city!'
      },
      {
        id: 'nya-ullevi',
        name: 'Nya Ullevi',
        position: [11.988, 57.708],
        zoom: 16,
        pitch: 70,
        bearing: 150,
        duration: 2000,
        description: 'Sweden\'s largest stadium, home to unforgettable sporting events and concerts!'
      },
      {
        id: 'gamla-ullevi',
        name: 'Gamla Ullevi',
        position: [11.982, 57.708],
        zoom: 16,
        pitch: 65,
        bearing: 210,
        duration: 2000,
        description: 'The passionate home of Gothenburg\'s beloved football clubs!'
      },
      {
        id: 'sodra-skargarden',
        name: 'Södra Skärgården',
        position: [11.770, 57.600],
        zoom: 12,
        pitch: 50,
        bearing: 300,
        duration: 2000,
        description: 'The breathtaking Southern archipelago - a paradise of car-free islands and fishing villages!'
      },
      {
        id: 'liseberg',
        name: 'Liseberg',
        position: [11.991, 57.694],
        zoom: 16,
        pitch: 60,
        bearing: 120,
        duration: 2000,
        description: 'Scandinavia\'s most popular amusement park!'
      },
      {
        id: 'haga',
        name: 'Haga',
        position: [11.961, 57.699],
        zoom: 16,
        pitch: 60,
        bearing: 270,
        duration: 2000,
        description: 'The charming historic district famous for its giant cinnamon buns!'
      },
      {
        id: 'avenyn',
        name: 'Avenyn',
        position: [11.978, 57.697],
        zoom: 16,
        pitch: 60,
        bearing: 180,
        duration: 2000,
        description: 'Gothenburg\'s grand boulevard and cultural heart!'
      }
    ];
  }

  /**
   * Calculate bearing angle between two points
   */
  private calculateBearing(start: [number, number], end: [number, number]): number {
    const startLat = this.toRadians(start[1]);
    const startLng = this.toRadians(start[0]);
    const endLat = this.toRadians(end[1]);
    const endLng = this.toRadians(end[0]);

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  private toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  /**
   * Animate through waypoints recursively
   */
  private animateThroughWaypoints(
    waypoints: Waypoint[],
    index: number,
    options: CinematicOptions
  ): void {
    if (index >= waypoints.length) {
      // Tour complete
      this.finishTour(options);
      return;
    }

    const waypoint = waypoints[index];

    // Update message if provided
    if (options.showMessages && waypoint.message) {
      this.updateMessage(waypoint.message);
    }

    // Call waypoint callback if provided
    if (options.onWaypoint) {
      options.onWaypoint(index, waypoint);
    }

    // Special handling for first waypoint with spinning effect
    if (index === 0 && waypoint.position[0] === 0 && waypoint.position[1] === 0) {
      // Global view with spin
      this.map.flyTo({
        center: waypoint.position,
        zoom: waypoint.zoom,
        pitch: waypoint.pitch,
        bearing: waypoint.bearing,
        duration: waypoint.duration,
        essential: true
      });

      // Add a spinning effect
      let spinBearing = 0;
      const spinInterval = setInterval(() => {
        spinBearing += 1.0;
        this.map.setBearing(spinBearing);
      }, 50);

      // Move to next waypoint after duration plus pause
      setTimeout(() => {
        clearInterval(spinInterval);
        this.animateThroughWaypoints(waypoints, index + 1, options);
      }, waypoint.duration + (options.pauseBetweenWaypoints || 0));
    }
    // Final waypoint with vehicle-aligned bearing
    else if (index === waypoints.length - 1) {
      // Calculate bearing based on vehicle rotation
      let finalBearing = waypoint.bearing;

      // Fly to final position
      this.map.flyTo({
        center: waypoint.position,
        zoom: waypoint.zoom,
        pitch: waypoint.pitch,
        bearing: finalBearing,
        duration: waypoint.duration,
        essential: true
      });

      // Finish tour after duration plus pause
      setTimeout(() => {
        this.animateThroughWaypoints(waypoints, index + 1, options);
      }, waypoint.duration + (options.pauseBetweenWaypoints || 0));
    }
    // Regular waypoint
    else {
      this.map.flyTo({
        center: waypoint.position,
        zoom: waypoint.zoom,
        pitch: waypoint.pitch,
        bearing: waypoint.bearing,
        duration: waypoint.duration,
        essential: true
      });

      // Move to next waypoint after duration plus pause
      setTimeout(() => {
        this.animateThroughWaypoints(waypoints, index + 1, options);
      }, waypoint.duration + (options.pauseBetweenWaypoints || 0));
    }
  }

  /**
   * Finish the tour and clean up
   */
  private finishTour(options: CinematicOptions): void {
    // Re-enable controls if they were disabled
    if (options.disableControls) {
      this.enableControls();
    }

    // Remove message element
    this.removeMessageElement();

    // Reset state
    PlayerStore.setFollowCar(true);
    this.isPlaying = false;

    // Call onComplete callback if provided
    if (options.onComplete) {
      options.onComplete();
    }
  }

  /**
   * Create a message element for displaying waypoint messages
   */
  private createMessageElement(className: string): void {
    // Remove existing message element if it exists
    this.removeMessageElement();

    // Create new message element
    this.messageElement = document.createElement('div');
    this.messageElement.className = className;
    document.body.appendChild(this.messageElement);
  }

  /**
   * Update the message displayed during cinematics
   */
  private updateMessage(message: string): void {
    if (this.messageElement) {
      this.messageElement.textContent = message;
    }
  }

  /**
   * Remove the message element
   */
  private removeMessageElement(): void {
    if (this.messageElement && this.messageElement.parentNode) {
      this.messageElement.parentNode.removeChild(this.messageElement);
      this.messageElement = null;
    }
  }

  /**
   * Disable map controls during cinematics
   */
  private disableControls(): void {
    // Store current state
    this.wasDragPanEnabled = this.map.dragPan.isEnabled();
    this.wasKeyboardEnabled = this.map.keyboard.isEnabled();

    // Disable controls
    if (this.wasDragPanEnabled) this.map.dragPan.disable();
    if (this.wasKeyboardEnabled) this.map.keyboard.disable();
  }

  /**
   * Re-enable map controls after cinematics
   */
  private enableControls(): void {
    // Restore previous state
    if (this.wasDragPanEnabled) this.map.dragPan.enable();
    if (this.wasKeyboardEnabled) this.map.keyboard.enable();
  }
} 