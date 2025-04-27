/**
 * Types for all events we can receive from the server
 */

export interface Position {
  coordinates: [number, number, number] // [lng, lat, elevation]
  rotation: Rotation
  timestamp: string
}

export interface Rotation {
  x: number    // 0-360 degrees
  y: number      // -90 to 90 degrees
  z: number       // -180 to 180 degrees
}

export interface PlayerState {
  playerId: string
  name: string
  lastSeen: string
  position?: Position
  totalTimeOnline: string
  currentSpeed: number
  kilometersDriven: number
  modelType: string
  animationState: string
  stateType: string
}

export interface Message {
  id: string
  type: "Chat" | "System"
  playerId?: string
  playerName?: string
  content: string
  sentAt: string
}

// Server -> Client Events
export interface InitialStateEvent {
  players: PlayerState[]
  recentMessages: Message[]
  questProgress: Record<string, number>
}

export interface PlayerJoinedEvent {
  playerId: string
  name: string
  isGuest: boolean
}

export interface PlayerLeftEvent {
  playerId: string
}

export interface PlayerMovedEvent {
  playerId: string
  position: Position
  name: string
  timestamp: string
}


export interface PlayerExitedVehicleEvent {
  playerId: string
  name: string
  timestamp: string
}

export interface ChatMessageEvent {
  playerId: string
  name: string
  message: string
  isSystem: boolean
  isGuest: boolean
  inVehicle: boolean
  timestamp: string
}

export interface PlayerPositionUpdate {
    playerId: string
    name: string
    position: Position
    timestamp: string
    currentSpeed: number
    kilometersDriven: number
    stateType: string
    modelType: string
    animationState: string
}

export interface PlayerNameChangedEvent {
    playerId: string;
    oldName: string;
    newName: string;
    timestamp: string;
}

export interface RaceResultEvent {
    playerId: string
    playerName: string
    trackId: string
    trackName: string
    time: number
    isPersonalBest: boolean
    isTrackRecord: boolean
    completedAt: string
}

export interface RaceResultResponse {
    isPersonalBest: boolean
    isTrackRecord: boolean
    previousPersonalBest: number | null
    previousTrackRecord: number | null
}

export interface RaceRecordResponse {
    personalBest: number | null;
    trackRecord: number | null;
    trackRecordHolder: string | null;
}

// Quest Events
export interface QuestProgressEvent {
    playerId: string;
    questId: string;
    progress: number;
    timestamp: string;
}

export interface QuestCompletedEvent extends QuestProgressEvent {
    questTitle: string;
    xpGained: number;
}