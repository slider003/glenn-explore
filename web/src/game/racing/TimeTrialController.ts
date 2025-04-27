import { CheckpointSystem } from './CheckpointSystem';
import { RaceStatus, RaceTrack, TimeTrialDependencies, TimeTrialState, RaceRecordResponse } from './TimeTrialTypes';
import { getTrackById, getAllTracks } from './RaceTrackData';
import { TimeTrialUI } from './TimeTrialUI';
import { PlayerStore } from '../stores/PlayerStore';
import { PitchController } from '../PitchController';

export class TimeTrialController {
  private state: TimeTrialState = {
    isActive: false,
    selectedTrackId: null,
    currentTrack: null,
    raceStartTime: null,
    currentCheckpointIndex: 0,
    lastCheckpointTime: null,
    checkpointTimes: [],
    records: null
  };

  private checkpointSystem: CheckpointSystem;
  private updateInterval: number | null = null;
  private animationFrameId: number | null = null;
  private ui: TimeTrialUI | null = null;

  constructor(private dependencies: TimeTrialDependencies) {
    this.dependencies = dependencies
    this.checkpointSystem = new CheckpointSystem(dependencies.tb, dependencies.map);
    // Initialize track records
    this.initializeTrackRecords();
  }

  /**
   * Set the UI instance to be used by the controller
   */
  public setUI(ui: TimeTrialUI): void {
    this.ui = ui;
  }

  /**
   * Start a time trial race on the selected track
   */
  public startRace(trackId: string): void {
    // Get the selected track
    const track = getTrackById(trackId);
    if (!track) {
      console.error(`Track with ID ${trackId} not found`);
      return;
    }

    // Update state
    this.state.selectedTrackId = trackId;
    this.state.currentTrack = track;
    this.state.currentCheckpointIndex = 0;
    this.state.checkpointTimes = [];

    // Load track records
    this.loadTrackRecords(trackId);

    // Setup the race
    this.setupRace(track);
  }

  /**
   * Load track records from server
   */
  private async loadTrackRecords(trackId: string): Promise<void> {
    try {
      const response = await fetch(`/api/race/records/${trackId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch track records: ${response.statusText}`);
      }

      const records = await response.json();
      this.updateRecordsFromServer(records);
    } catch (error) {
      console.error('Failed to load track records:', error);
    }
  }

  /**
   * Update records from server response
   */
  private updateRecordsFromServer(records: RaceRecordResponse): void {
    this.state.records = records;
    
    // Update track data if we have a record
    if (this.state.currentTrack && records.trackRecord) {
      this.state.currentTrack.bestTime = records.trackRecord;
      this.state.currentTrack.bestTimePlayer = records.trackRecordHolder || undefined;
    }

    // Update UI if needed
    if (this.ui && this.state.isActive) {
      this.updateRaceUI();
    }
  }

  /**
   * Setup the race with checkpoints and UI
   */
  private setupRace(track: RaceTrack): void {
    PlayerStore.setAllowedToDrive(false)
    // Set up checkpoint system
    this.checkpointSystem.setupCheckpoints(track, (checkpointIndex) => {
      this.onCheckpointPassed(checkpointIndex);
    });

    setTimeout(() => {
      // Teleport vehicle to start position
      if (track) {
        // Pass the bearing from startCamera if available
        this.dependencies.onTeleport({
          position: {
            lng: track.startPosition[0],
            lat: track.startPosition[1]
          },
          rotation: {
            z: track.startCamera?.bearing ?? 0
          },
          zoom: track.startCamera?.zoom ?? 22,
          pitch: track.startCamera?.pitch ?? 20
        });
        PlayerStore.setAllowedToDrive(false)
        // // Set camera if startCamera is defined
        // if (track.startCamera && this.dependencies.map) {
        //   this.dependencies.map.easeTo({
        //     center: track.startPosition,
        //     pitch: track.startCamera.pitch,
        //     bearing: track.startCamera.bearing,
        //     zoom: track.startCamera.zoom,
        //     duration: 1000
        //   });
        // }
      }
    }, 300);

    setTimeout(() => {
      PlayerStore.setAllowedToDrive(false)
    }, 900);

    // Show the race HUD
    if (this.ui) {
      this.ui.showRaceHUD();
      
      // Show countdown before starting the race
      this.ui.showCountdown(3, () => {
        // Start race when countdown completes
        this.actuallyStartRace();
      });
    }
  }

  /**
   * Actually start the race (after countdown)
   */
  private actuallyStartRace(): void {
    // Start the race
    this.state.isActive = true;
    this.state.raceStartTime = Date.now();
    this.state.lastCheckpointTime = Date.now();
    PlayerStore.setAllowedToDrive(true)
    PlayerStore.setFollowCar(true)

    // Start tracking the vehicle position
    this.startTracking();
  }

  /**
   * Quit the current race
   */
  public quitRace(): void {
    this.state.isActive = false;
    this.stopTracking();

    // Remove checkpoints
    this.checkpointSystem.clearCheckpoints();

    // Hide race UI
    if (this.ui) {
      this.ui.hideRaceHUD();
    }
  }

  /**
   * Start tracking vehicle position for checkpoint detection
   */
  private startTracking(): void {
    // Stop any existing tracking
    this.stopTracking();

    // Start a new interval
    this.updateInterval = window.setInterval(() => {
      this.updateRace();
    }, 100) as unknown as number;

    // Start animation frame for smoother UI updates
    const updateUI = () => {
      if (this.state.isActive) {
        this.updateRaceUI();
        this.animationFrameId = requestAnimationFrame(updateUI);
      }
    };

    this.animationFrameId = requestAnimationFrame(updateUI);
  }

  /**
   * Stop tracking
   */
  private stopTracking(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Update race state - check vehicle position against checkpoints
   */
  private updateRace(): void {
    if (!this.state.isActive) return;

    // Check if vehicle has passed through current checkpoint
    this.checkpointSystem.checkVehiclePosition([PlayerStore.getCoordinates()[0], PlayerStore.getCoordinates()[1]]);

    // Check if race is completed
    if (this.checkpointSystem.isRaceCompleted()) {
      this.completeRace();
    }
  }

  /**
   * Handle checkpoint passed event
   */
  private onCheckpointPassed(_checkpointIndex: number): void {
    if (!this.state.isActive) return;

    // Record the time this checkpoint was passed
    const time = Date.now();
    const checkpointTime = time - (this.state.lastCheckpointTime || time);

    // Store the time
    this.state.checkpointTimes.push(checkpointTime);

    // Update last checkpoint time
    this.state.lastCheckpointTime = time;
  }

  /**
   * Complete the race
   */
  private async completeRace(): Promise<void> {
    if (!this.state.isActive || !this.state.raceStartTime || !this.state.currentTrack) return;

    // Calculate final time
    const finalTime = (Date.now() - this.state.raceStartTime) / 1000; // Convert to seconds

    // Dispatch race completion event
    window.dispatchEvent(new CustomEvent('raceCompleted', {
      detail: {
        trackId: this.state.currentTrack.id,
        trackName: this.state.currentTrack.name,
        time: finalTime,
        checkpointTimes: this.state.checkpointTimes
      }
    }));

    // Stop tracking
    this.state.isActive = false;
    this.stopTracking();

    // Show completion UI - isPersonalBest will be updated when server responds
    if (this.ui) {
      const isPersonalBest = !this.state.records || this.state.records.personalBest === null || 
                            (finalTime < (this.state.records.personalBest || Infinity));
      this.ui.showRaceCompleted(finalTime * 1000, isPersonalBest);
    }
  }

  /**
   * Calculate time difference between current time and personal best
   */
  private calculateTimeDifference(currentTime: number): number | null {
    if (!this.state.records?.personalBest || !this.state.selectedTrackId) {
      return null;
    }

    const currentCheckpoint = this.checkpointSystem.getCurrentCheckpointIndex();
    const totalCheckpoints = this.checkpointSystem.getTotalCheckpoints();

    if (totalCheckpoints === 0) return null;

    // Approximate where we should be at this point in the best time
    const progress = currentCheckpoint / totalCheckpoints;
    const expectedBestTime = this.state.records.personalBest * progress * 1000; // Convert to ms

    // Return difference (positive = behind best, negative = ahead of best)
    return currentTime - expectedBestTime;
  }

  /**
   * Update the race UI with current status
   */
  private updateRaceUI(): void {
    if (!this.state.isActive || !this.ui) return;

    // Calculate current time
    const currentTime = Date.now() - (this.state.raceStartTime || 0);

    // Prepare race status for UI
    const status: RaceStatus = {
      isActive: this.state.isActive,
      currentTime,
      currentCheckpoint: this.checkpointSystem.getCurrentCheckpointIndex(),
      totalCheckpoints: this.checkpointSystem.getTotalCheckpoints(),
      bestTime: this.state.records?.personalBest ? this.state.records.personalBest * 1000 : null,
      compareToBest: this.calculateTimeDifference(currentTime)
    };

    // Update the UI
    this.ui.updateRaceHUD(status);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopTracking();
    this.checkpointSystem.clearCheckpoints();

    this.state = {
      isActive: false,
      selectedTrackId: null,
      currentTrack: null,
      raceStartTime: null,
      currentCheckpointIndex: 0,
      lastCheckpointTime: null,
      checkpointTimes: [],
      records: null
    };
  }

  /**
   * Initialize track records for all tracks
   */
  private async initializeTrackRecords(): Promise<void> {
    const tracks = getAllTracks(); // We need to import this from RaceTrackData
    
    for (const track of tracks) {
      try {
        const response = await fetch(`/api/race/records/${track.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch track records: ${response.statusText}`);
        }

        const records = await response.json();
        // Update track data with records
        if (records.trackRecord) {
          track.bestTime = records.trackRecord;
          track.bestTimePlayer = records.trackRecordHolder || undefined;
        }
      } catch (error) {
        console.error(`Failed to load track records for ${track.id}:`, error);
      }
    }

    // Update UI if it exists
    if (this.ui) {
      this.ui.updateTrackList();
    }
  }
} 