import * as THREE from 'three';
import { Checkpoint, RaceTrack } from './TimeTrialTypes';

/**
 * CheckpointSystem - Manages the 3D checkpoint objects and detection
 * Enhanced with visual effects and player guidance features
 */
export class CheckpointSystem {
  private checkpointObjects: Map<string, any> = new Map();
  private currentCheckpointIndex: number = 0;
  private activeTrack: RaceTrack | null = null;
  private checkpointPassedCallback: ((checkpointIndex: number) => void) | null = null;

  // Animation properties
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private pathObjects: THREE.Object3D[] = [];

  // Proximity feedback
  private proximityThreshold: number = 150; // meters
  private isNearCheckpoint: boolean = false;
  private nearCheckpointCallback: ((isNear: boolean, distance: number) => void) | null = null;

  // Animation parameters
  private pulseSpeed: number = 2;
  private rotationSpeed: number = 0.3;

  constructor(private tb: any, private map: mapboxgl.Map) {
    this.clock = new THREE.Clock();
  }

  /**
   * Set up checkpoints for a race track
   */
  public setupCheckpoints(
    track: RaceTrack,
    onCheckpointPassed: (checkpointIndex: number) => void,
    onNearCheckpoint?: (isNear: boolean, distance: number) => void
  ): void {
    // Clear any existing checkpoints first
    this.clearCheckpoints();

    // Set the active track
    this.activeTrack = track;
    this.currentCheckpointIndex = 0;
    this.checkpointPassedCallback = onCheckpointPassed;
    this.nearCheckpointCallback = onNearCheckpoint || null;

    // Create checkpoint objects
    track.checkpoints.forEach((checkpoint, index) => {
      this.createCheckpoint(checkpoint, index === 0);
    });

    // Create path visualization between checkpoints
    this.createPathVisualization();

    // Start animation loop
    this.startAnimations();
  }

  /**
   * Create a 3D checkpoint at the specified coordinates
   */
  private createCheckpoint(checkpoint: Checkpoint, isActive: boolean = false): void {
    // Get terrain elevation at checkpoint location
    this.getTerrainElevation(checkpoint.coordinates[0], checkpoint.coordinates[1], (elevation) => {
      try {
        // Make checkpoints much bigger
        const radius = 30; // Fixed size in meters
        const height = 60; // Fixed height in meters

        // Create a container for all checkpoint elements
        const container = new THREE.Group();

        // Create the main cylinder with more interesting visuals
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true); // Open cylinder
        const material = new THREE.MeshPhongMaterial({
          color: isActive ? 0x00ff88 : 0x0088ff,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          emissive: isActive ? 0x00ff88 : 0x0088ff,
          emissiveIntensity: 1.2,
          wireframe: false
        });
        container.rotation.y = 65;
        const cylinder = new THREE.Mesh(geometry, material);
        container.add(cylinder);

        // Add horizontal rings for better depth perception
        for (let i = 0; i < 5; i++) {
          const ringY = (i - 2) * (height / 5);
          const ringGeometry = new THREE.TorusGeometry(radius, 1, 16, 48);
          const ringMaterial = new THREE.MeshPhongMaterial({
            color: isActive ? 0x00ff88 : 0x0088ff,
            transparent: true,
            opacity: 0.6,
            emissive: isActive ? 0x00ff88 : 0x0088ff,
            emissiveIntensity: 1.2
          });
          const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
          ringMesh.rotation.x = Math.PI / 2;
          ringMesh.position.y = ringY;
          container.add(ringMesh);
        }

        // Add a ground ring with more visible effect
        const groundRingGeometry = new THREE.RingGeometry(radius - 2, radius * 1.3, 48);
        const groundRingMaterial = new THREE.MeshPhongMaterial({
          color: isActive ? 0x00ff88 : 0x0088ff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
          emissive: isActive ? 0x00ff88 : 0x0088ff,
          emissiveIntensity: 1.2
        });
        const groundRing = new THREE.Mesh(groundRingGeometry, groundRingMaterial);
        groundRing.rotation.x = -Math.PI / 2;
        groundRing.position.y = -height / 2 + 0.5; // Slightly above ground
        container.add(groundRing);

        // Add animated inner cone for directional guidance
        const coneGeometry = new THREE.ConeGeometry(radius * 0.6, height * 0.7, 32);
        const coneMaterial = new THREE.MeshPhongMaterial({
          color: isActive ? 0xccffcc : 0xccffff,
          transparent: true,
          opacity: 0.3,
          emissive: isActive ? 0xccffcc : 0xccffff,
          emissiveIntensity: 0.8,
          side: THREE.DoubleSide
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = height * 0.15; // Positioned for visual interest
        container.add(cone);


        // Add particles for active checkpoint for more visual appeal
        if (isActive) {
          const particleCount = 50;
          const particleGeometry = new THREE.BufferGeometry();
          const particlePositions = new Float32Array(particleCount * 3);

          for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radiusVar = radius * (0.8 + Math.random() * 0.4);
            const heightVar = (Math.random() - 0.5) * height;

            particlePositions[i * 3] = Math.cos(angle) * radiusVar;
            particlePositions[i * 3 + 1] = heightVar;
            particlePositions[i * 3 + 2] = Math.sin(angle) * radiusVar;
          }

          particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

          const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 3,
            transparent: true,
            opacity: 0.6
          });

          const particles = new THREE.Points(particleGeometry, particleMaterial);
          container.add(particles);
        }

        // Create the object using Threebox's API
        const options = {
          obj: container,
          type: 'custom',
          units: 'meters',
          anchor: 'center'
        };

        // Add to map using Threebox's method
        const checkpoint3D = this.tb.Object3D(options);

        if (!checkpoint3D) {
          console.error('Failed to create Threebox object');
          return;
        }

        // Set the position
        const coords = [
          checkpoint.coordinates[0],
          checkpoint.coordinates[1],
          checkpoint.elevation
        ];
        checkpoint3D.setCoords(coords);
        if (checkpoint.rotation) {
          checkpoint3D.rotation.z = THREE.MathUtils.degToRad(checkpoint.rotation);
        }

        // Add to the map
        this.tb.add(checkpoint3D);

        // Store the checkpoint
        this.checkpointObjects.set(checkpoint.id, checkpoint3D);

        // Add the checkpoint data to the 3D object for reference
        checkpoint3D.checkpointData = checkpoint;
        checkpoint3D.checkpointIndex = this.activeTrack?.checkpoints.findIndex(cp => cp.id === checkpoint.id) ?? 0;

        // Store all materials and objects that will be animated
        checkpoint3D.materials = {
          cylinder: material,
          groundRing: groundRingMaterial,
          cone: coneMaterial
        };

        // Store objects for animation
        checkpoint3D.animatedObjects = {
          cone: cone,
          container: container,
          groundRing: groundRing
        };

      } catch (error) {
        console.error('Error creating checkpoint:', error);
        console.error('Error details:', {
          checkpoint,
          isActive,
          elevation,
          threebox: this.tb,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      }
    });
  }

  /**
   * Create visual path between checkpoints
   */
  private createPathVisualization(): void {
    if (!this.activeTrack || this.activeTrack.checkpoints.length < 2) return;

    // Clear existing path
    this.clearPathObjects();

    // Create path between checkpoints
    for (let i = this.currentCheckpointIndex; i < this.activeTrack.checkpoints.length - 1; i++) {
      // Skip paths beyond the next checkpoint
      if (i > this.currentCheckpointIndex + 1) break;

      const current = this.activeTrack.checkpoints[i];
      const next = this.activeTrack.checkpoints[i + 1];

      // Create line between checkpoints
      const points = [];
      points.push(new THREE.Vector3(
        current.coordinates[0],
        current.elevation || 0,
        current.coordinates[1]
      ));
      points.push(new THREE.Vector3(
        next.coordinates[0],
        next.elevation || 0,
        next.coordinates[1]
      ));

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineDashedMaterial({
        color: i === this.currentCheckpointIndex ? 0x00ff88 : 0x0088ff,
        dashSize: 5,
        gapSize: 3,
        opacity: 0.8,
        transparent: true
      });

      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.computeLineDistances(); // Required for dashed lines

      // Create a custom object for the path line
      const options = {
        obj: line,
        type: 'custom',
        units: 'meters',
        anchor: 'center'
      };

      const pathLine = this.tb.Object3D(options);

      // Add to map
      if (pathLine) {
        pathLine.setCoords([0, 0, 0]); // Will be positioned in world coordinates
        this.tb.add(pathLine);
        this.pathObjects.push(pathLine);
      }
    }
  }

  /**
   * Start animation loop
   */
  private startAnimations(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.clock.start();
    this.animate();
  }

  /**
   * Animation loop
   */
  private animate(): void {
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Animate all visible checkpoints
    if (this.activeTrack) {
      this.activeTrack.checkpoints.forEach((checkpoint, index) => {
        const checkpointObj = this.checkpointObjects.get(checkpoint.id);

        if (checkpointObj && checkpointObj.visible) {
          // Get animated objects
          const animatedObjects = checkpointObj.animatedObjects;

          if (animatedObjects) {
            // Animate based on checkpoint status
            if (index === this.currentCheckpointIndex) {
              // Current checkpoint animations

              // Pulse the material
              const pulse = Math.sin(elapsedTime * this.pulseSpeed) * 0.2 + 0.8;
              if (checkpointObj.materials.cone) {
                checkpointObj.materials.cone.opacity = pulse * 0.6;
                checkpointObj.materials.cone.emissiveIntensity = pulse * 1.2;
              }

              // Rotate the inner cone
              if (animatedObjects.cone) {
                animatedObjects.cone.rotation.y += this.rotationSpeed * deltaTime * 2;
              }

              // Rotate the ground ring in opposite direction
              if (animatedObjects.groundRing) {
                animatedObjects.groundRing.rotation.z -= this.rotationSpeed * deltaTime * 1.5;
              }

            } else if (index === this.currentCheckpointIndex + 1) {
              // Next checkpoint animations (slower and less intense)

              // Subtle pulse
              const pulse = Math.sin(elapsedTime * this.pulseSpeed * 0.7) * 0.15 + 0.7;
              if (checkpointObj.materials.cone) {
                checkpointObj.materials.cone.opacity = pulse * 0.4;
                checkpointObj.materials.cone.emissiveIntensity = pulse * 0.8;
              }

              // Slow rotation
              if (animatedObjects.cone) {
                animatedObjects.cone.rotation.y += this.rotationSpeed * deltaTime;
              }

              if (animatedObjects.groundRing) {
                animatedObjects.groundRing.rotation.z -= this.rotationSpeed * deltaTime * 0.75;
              }
            }
          }
        }
      });
    }

    // Update the scene
    this.tb.update();

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Get terrain elevation at specific coordinates
   */
  private getTerrainElevation(lng: number, lat: number, callback: (elevation: number | null) => void): void {
    try {
      // Try to get terrain elevation
      const elevationQuery = this.map.queryTerrainElevation([lng, lat]);

      // Use the actual elevation, multiplied by 100 to make it more visible
      // If elevation is null/undefined, default to 0
      const elevation = (elevationQuery !== null && elevationQuery !== undefined) ? elevationQuery * 100 : 0;
      callback(elevation);
    } catch (error) {
      console.warn('Error querying terrain elevation:', error);
      console.warn('Error details:', {
        coordinates: [lng, lat],
        map: this.map,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      callback(0);
    }
  }

  /**
   * Update all checkpoints (colors, visibility)
   */
  public updateCheckpoints(): void {
    if (!this.activeTrack) return;

    // Update checkpoints visibility and appearance
    this.activeTrack.checkpoints.forEach((checkpoint, index) => {
      const checkpointObj = this.checkpointObjects.get(checkpoint.id);
      if (checkpointObj && checkpointObj.materials) {
        const materials = checkpointObj.materials;

        if (index < this.currentCheckpointIndex) {
          // Passed checkpoint - show as faded instead of hiding completely
          checkpointObj.visible = true;
          this.updateCheckpointMaterials(materials, {
            color: 0x666666,
            opacity: 0.2,
            emissiveIntensity: 0.3
          });

          // Hide after 2 checkpoints back
          if (index < this.currentCheckpointIndex - 2) {
            checkpointObj.visible = false;
          }

        } else if (index === this.currentCheckpointIndex) {
          // Current checkpoint - bright green and highly visible
          checkpointObj.visible = true;
          this.updateCheckpointMaterials(materials, {
            color: 0x00ff88,
            opacity: 0.9,
            emissiveIntensity: 1.2
          });

        } else if (index === this.currentCheckpointIndex + 1) {
          // Next checkpoint - blue and visible
          checkpointObj.visible = true;
          this.updateCheckpointMaterials(materials, {
            color: 0x0088ff,
            opacity: 0.8,
            emissiveIntensity: 0.8
          });

        } else if (index === this.currentCheckpointIndex + 2) {
          // Checkpoint after next - dimmed blue, slightly visible
          checkpointObj.visible = true;
          this.updateCheckpointMaterials(materials, {
            color: 0x0066aa,
            opacity: 0.3,
            emissiveIntensity: 0.4
          });

        } else {
          // Future checkpoints beyond next - hide them
          checkpointObj.visible = false;
        }
      }
    });

    // Update path visualization
    this.createPathVisualization();
  }

  /**
   * Helper to update checkpoint materials
   */
  private updateCheckpointMaterials(materials: any, props: { color: number, opacity: number, emissiveIntensity: number }) {
    // Update all materials with the new properties
    Object.values(materials).forEach((material: any) => {
      if (material) {
        material.color.setHex(props.color);
        material.opacity = props.opacity;
        material.emissive.setHex(props.color);
        material.emissiveIntensity = props.emissiveIntensity;
      }
    });
  }

  /**
   * Check if the vehicle has passed through the current checkpoint
   * and provide proximity feedback
   */
  public checkVehiclePosition(vehicleCoords: [number, number]): void {
    if (!this.activeTrack || this.currentCheckpointIndex >= this.activeTrack.checkpoints.length) return;

    // Get current checkpoint
    const currentCheckpoint = this.activeTrack.checkpoints[this.currentCheckpointIndex];

    // Calculate distance from vehicle to checkpoint
    const distance = this.calculateDistance(
      vehicleCoords[1], vehicleCoords[0],
      currentCheckpoint.coordinates[1], currentCheckpoint.coordinates[0]
    );

    // Proximity feedback
    const isNear = distance <= this.proximityThreshold;
    if (isNear !== this.isNearCheckpoint) {
      this.isNearCheckpoint = isNear;

      // Call proximity callback if set
      if (this.nearCheckpointCallback) {
        this.nearCheckpointCallback(isNear, distance);
      }

      // Visual feedback - make checkpoint pulse faster when near
      if (isNear) {
        this.pulseSpeed = 4;
        this.rotationSpeed = 0.8;
      } else {
        this.pulseSpeed = 2;
        this.rotationSpeed = 0.3;
      }
    }

    // Check if vehicle is within checkpoint radius
    if (distance <= currentCheckpoint.radius) {
      // Checkpoint passed!
      this.currentCheckpointIndex++;

      // Call the callback
      if (this.checkpointPassedCallback) {
        this.checkpointPassedCallback(this.currentCheckpointIndex - 1);
      }

      // Update checkpoint visuals
      this.updateCheckpoints();

      // Reset proximity state
      this.isNearCheckpoint = false;
    }
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = this.toRad(lat1);
    const φ2 = this.toRad(lat2);
    const Δφ = this.toRad(lat2 - lat1);
    const Δλ = this.toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Clear path visualization objects
   */
  private clearPathObjects(): void {
    for (const pathObj of this.pathObjects) {
      this.tb.remove(pathObj);
    }
    this.pathObjects = [];
  }

  /**
   * Clean up and remove all checkpoints
   */
  public clearCheckpoints(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove all checkpoint objects from the map
    for (const checkpointObj of this.checkpointObjects.values()) {
      this.tb.remove(checkpointObj);
    }

    // Clear path objects
    this.clearPathObjects();

    // Clear collections
    this.checkpointObjects.clear();
    this.currentCheckpointIndex = 0;
    this.activeTrack = null;
    this.checkpointPassedCallback = null;
    this.nearCheckpointCallback = null;
    this.isNearCheckpoint = false;
  }

  /**
   * Reset the current race (keep checkpoints but reset progress)
   */
  public resetRace(): void {
    this.currentCheckpointIndex = 0;
    this.isNearCheckpoint = false;
    this.updateCheckpoints();
  }

  /**
   * Get current checkpoint index
   */
  public getCurrentCheckpointIndex(): number {
    return this.currentCheckpointIndex;
  }

  /**
   * Get total number of checkpoints
   */
  public getTotalCheckpoints(): number {
    return this.activeTrack?.checkpoints.length || 0;
  }

  /**
   * Check if all checkpoints are passed
   */
  public isRaceCompleted(): boolean {
    return this.activeTrack !== null &&
      this.currentCheckpointIndex >= this.activeTrack.checkpoints.length;
  }

  /**
   * Get distance to current checkpoint
   */
  public getDistanceToCurrentCheckpoint(vehicleCoords: [number, number]): number {
    if (!this.activeTrack || this.currentCheckpointIndex >= this.activeTrack.checkpoints.length) {
      return Infinity;
    }

    const currentCheckpoint = this.activeTrack.checkpoints[this.currentCheckpointIndex];
    return this.calculateDistance(
      vehicleCoords[1], vehicleCoords[0],
      currentCheckpoint.coordinates[1], currentCheckpoint.coordinates[0]
    );
  }
} 