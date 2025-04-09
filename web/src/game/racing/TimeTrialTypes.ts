/**
 * Time Trial Types - Define types for time trial racing
 */

import { Threebox } from 'threebox-plugin';
import { TeleportOptions } from '../../types/teleport';
/**
 * Checkpoint definition - a point that racers must pass through
 */
export interface Checkpoint {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  radius: number; // Detection radius in meters
  name?: string; // Optional name for the checkpoint
  elevation?: number; // Optional elevation in meters
  rotation?: number; // Optional rotation in degrees
}

/**
 * Race track definition
 */
export interface RaceTrack {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  startPosition: [number, number]; // [longitude, latitude]
  startCamera?: {
    pitch: number; // Camera pitch angle in degrees
    bearing: number; // Camera bearing angle in degrees
    zoom: number; // Camera zoom level
  };
  checkpoints: Checkpoint[];
  bestTime?: number; // Best time in milliseconds
  bestTimePlayer?: string; // Player ID who set the best time
}

/**
 * Race record for storing completed race data
 */
export interface RaceRecord {
  trackId: string;
  playerId: string;
  playerName: string;
  time: number; // Time in milliseconds
  date: number; // Timestamp
  checkpointTimes: number[]; // Time to reach each checkpoint
}

/**
 * Time trial state for the controller
 */
export interface TimeTrialState {
  isActive: boolean;
  selectedTrackId: string | null;
  currentTrack: RaceTrack | null;
  raceStartTime: number | null;
  currentCheckpointIndex: number;
  lastCheckpointTime: number | null;
  checkpointTimes: number[];
  records: RaceRecordResponse | null;
}

/**
 * Time trial dependencies
 */
export interface TimeTrialDependencies {
  map: mapboxgl.Map;
  tb: Threebox;
  onTeleport: (teleportOptions: TeleportOptions) => void;
}

/**
 * Time trial UI callbacks
 */
export interface TimeTrialUICallbacks {
  onStartRace: (trackId: string) => void;
  onQuitRace: () => void;
}

/**
 * Race status for UI display
 */
export interface RaceStatus {
  isActive: boolean;
  currentTime: number;
  currentCheckpoint: number;
  totalCheckpoints: number;
  bestTime: number | null;
  compareToBest: number | null; // Positive means behind best, negative means ahead
}

export interface RaceRecordResponse {
  personalBest: number | null;
  trackRecord: number | null;
  trackRecordHolder: string | null;
} 