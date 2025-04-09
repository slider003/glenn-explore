export interface PlayerData {
  playerId: string
  position: {
    coordinates: [number, number]
    rotation: {
      x: number
      y: number
      z: number
    }
  }
  name: string
  timestamp: number
  currentSpeed: number
  kilometersDriven: number
}

export interface ChatMessage {
  isSystem?: boolean
  playerId: string
  playerName: string
  message: string
  timestamp: number
}

export interface Vehicle {
  getVehicle(): any
  getPlayerId(): string
  showMessage(message: string, duration?: number): void
  savePositionToLocalStorage(): void
  forceSavePosition(): void
}

export interface VehiclesController {
  // Player management
  addPlayer(playerData: PlayerData): void
  updatePlayerPosition(playerData: PlayerData): void
  updatePlayerName(playerId: string, newName: string): void
  removePlayer(playerId: string): void
  clearAllPlayers(): void
  getVehicleByPlayerId(playerId: string): Vehicle | null
  
  // State queries
  getPlayerCount(): number
  getPlayerIds(): string[]
  hasPlayer(playerId: string): boolean
  getAllPlayers(): Array<{
    id: string
    name: string
    position: {
      coordinates: [number, number]
    }
    lastUpdate: number
  }>
  
  // Cleanup
  cleanupInactivePlayers(maxAge?: number): void
}

export interface ChatController {
  // Message handling
  addMessage(message: ChatMessage): void
  addMessages(messages: ChatMessage[]): void
  addSystemMessage(message: string): void
  toggle(): void
} 