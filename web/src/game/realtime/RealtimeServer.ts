import { HubConnectionBuilder, HubConnection, LogLevel } from "@microsoft/signalr"
import { PlayerData } from './types/Controllers'
import * as ServerEvents from './types/ServerEvents'
import { PlayerStore } from "../stores/PlayerStore"
import { CHAT_EVENTS} from '../events/ChatEvents'
import { ChatMessage } from "../chat/ChatUI"
import { PlayersController } from '../players/PlayersController'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export interface ConnectionState {
    status: ConnectionStatus
    lastOnline?: Date
    reconnectAttempts: number
}

export class RealtimeServer {
    private connection: HubConnection | null = null
    private connectionState: ConnectionState = {
        status: 'disconnected',
        reconnectAttempts: 0
    }
    private positionUpdateInterval: number | null = null
    private cleanupInterval: number | null = null
    private readonly CLEANUP_INTERVAL = 30000 // 30 seconds
    private readonly INACTIVE_TIMEOUT = 50000 // 50 seconds

    // Static storage
    private static instance: RealtimeServer | null = null
    private static isConnected: boolean = false
    private static isLoading: boolean = false

    public static isServerConnected(): boolean {
        return RealtimeServer.isConnected
    }

    public static isServerLoading(): boolean {
        return RealtimeServer.isLoading
    }

    // Callbacks for state changes
    private onConnectionStateChange?: (state: ConnectionState) => void
    private onPlayersChange?: (count: number) => void

    constructor() {
        RealtimeServer.instance = this
        this.connection = new HubConnectionBuilder()
            .withUrl("/api/hubs/game", {
                withCredentials: true
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build()

        this.setupConnectionHandlers()
    }

    /**
     * Set up handlers for connection state changes
     */
    private setupConnectionHandlers() {
        if (!this.connection) return

        this.connection.onreconnecting(() => {
            this.updateConnectionState({
                status: 'connecting',
                reconnectAttempts: this.connectionState.reconnectAttempts + 1
            })
        })

        this.connection.onreconnected(() => {
            this.updateConnectionState({
                status: 'connected',
                lastOnline: new Date(),
                reconnectAttempts: 0
            })
        })

        this.connection.onclose(() => {
            this.updateConnectionState({
                status: 'disconnected',
                lastOnline: new Date(),
                reconnectAttempts: this.connectionState.reconnectAttempts
            })
        })
    }

    /**
     * Update connection state and notify listeners
     */
    private updateConnectionState(newState: Partial<ConnectionState>) {
        this.connectionState = { ...this.connectionState, ...newState }
        RealtimeServer.isConnected = this.connectionState.status === 'connected'
        RealtimeServer.isLoading = this.connectionState.status === 'connecting'
        this.onConnectionStateChange?.(this.connectionState)
    }

    /**
     * Initialize controllers and start connection
     */
    public async connect(
        onConnectionStateChange?: (state: ConnectionState) => void,
        onPlayersChange?: (count: number) => void
    ) {
        this.onConnectionStateChange = onConnectionStateChange
        this.onPlayersChange = onPlayersChange

        // Set up event handlers before connecting
        this.setupEventHandlers()

        try {
            this.updateConnectionState({ status: 'connecting' })
            await this.connection?.start()
            this.updateConnectionState({
                status: 'connected',
                lastOnline: new Date(),
                reconnectAttempts: 0
            })

            // Start sending position updates when connected
            this.startPositionUpdates()
            this.startCleanupInterval()

        } catch (error) {
            console.error('Failed to connect:', error)
            this.updateConnectionState({
                status: 'disconnected',
                lastOnline: new Date()
            })
            // Dispatch system message event
            window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                detail: { message: "❌ Failed to connect to server" }
            }))
            window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                detail: { message: "⚫ Playing offline - Multiplayer features disabled" }
            }))
        }
    }

    /**
     * Set up handlers for all server events
     */
    private setupEventHandlers() {
        if (!this.connection) return

        // Initial state when connecting
        this.connection.on('InitialState', (data: ServerEvents.InitialStateEvent) => {
            // Initialize with existing players
            data.players.forEach(player => {
                if (!player.position || player.playerId === PlayerStore.getPlayerId()) return

                PlayersController.getInstance().handlePlayerUpdate({
                    playerId: player.playerId,
                    name: player.name,
                    position: {
                        coordinates: player.position.coordinates,
                        rotation: player.position.rotation,
                        timestamp: player.position.timestamp || Date.now().toString()
                    },
                    state: {
                        stateType: player.stateType,
                        modelType: player.modelType,
                        animationState: player.animationState
                    },
                    stats: {
                        currentSpeed: player.currentSpeed,
                        kilometersDriven: player.kilometersDriven
                    }
                })
            })

            // Load recent messages through event
            const messages: ChatMessage[] = data.recentMessages.map(msg => ({
                isSystem: msg.playerId === 'system',
                playerId: msg.playerId || 'system',
                playerName: msg.playerName || 'System',
                message: msg.content,
                timestamp: Date.parse(msg.sentAt)
            }))
            
            window.dispatchEvent(new CustomEvent(CHAT_EVENTS.MESSAGES_LOADED, {
                detail: { messages }
            }))

            // Update player count
            this.onPlayersChange?.(data.players.length)
        })

        // Batch position updates
        this.connection.on('PlayerPositionsUpdate', (updates: ServerEvents.PlayerPositionUpdate[]) => {
            updates.forEach(data => {
                if (data.playerId === PlayerStore.getPlayerId()) return

                PlayersController.getInstance().handlePlayerUpdate({
                    playerId: data.playerId,
                    name: data.name,
                    position: {
                        coordinates: data.position.coordinates,
                        rotation: data.position.rotation,
                        timestamp: data.position.timestamp || Date.now().toString()
                    },
                    state: {
                        stateType: data.stateType,
                        modelType: data.modelType,
                        animationState: data.animationState
                    },
                    stats: {
                        currentSpeed: data.currentSpeed,
                        kilometersDriven: data.kilometersDriven
                    }
                })
            })
        })

        // Player left event
        this.connection.on('PlayerLeft', (playerId: string) => {
            PlayersController.getInstance().removePlayer(playerId)
            this.onPlayersChange?.(PlayersController.getInstance().getPlayerCount())
        })

        // Add name change handler
        this.connection.on('PlayerNameChanged', (data: ServerEvents.PlayerNameChangedEvent) => {
            PlayersController.getInstance().updatePlayerName(data.playerId, data.newName)
        })

        // Chat message handler
        this.connection.on('ChatMessage', (data: ServerEvents.ChatMessageEvent) => {
            const message: ChatMessage = {
                isSystem: data.isSystem,
                playerId: data.playerId,
                playerName: data.name,
                message: data.message,
                timestamp: Date.parse(data.timestamp)
            }

            if (data.isSystem) {
                window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                    detail: { message: message.message }
                }))
            } else {
                window.dispatchEvent(new CustomEvent(CHAT_EVENTS.MESSAGE_RECEIVED, {
                    detail: { message }
                }))

                // Show message above player
                if (data.playerId !== PlayerStore.getPlayerId()) {
                    PlayersController.getInstance().showPlayerMessage(data.playerId, data.message)
                }
            }
        })

        // Race result event
        this.connection.on('RaceResult', (data: ServerEvents.RaceResultEvent) => {
            // Dispatch event for UI to handle
            window.dispatchEvent(new CustomEvent('raceResult', {
                detail: data
            }))
        })
    }

    /**
     * Start sending periodic position updates
     */
    private startPositionUpdates() {
        if (this.positionUpdateInterval) {
            window.clearInterval(this.positionUpdateInterval)
        }

        this.positionUpdateInterval = window.setInterval(() => {
            if (this.connection?.state === "Connected") {
                const coordinates = PlayerStore.getCoordinates();
                const rotation = PlayerStore.getRotation();
                const state = PlayerStore.getState();
                this.connection.invoke("UpdatePosition", {
                    position: {
                        coordinates,
                        rotation: {
                            x: rotation.x,
                            y: rotation.y,
                            z: rotation.z
                        },
                        timestamp: Date.now(),
                    },
                    currentSpeed: PlayerStore.getCurrentSpeed(),
                    kilometersDriven: PlayerStore.getKilometersDriven(),
                    modelType: state.modelType || 'dino',
                    animationState: state.animationState || 'idle',
                    stateType: state.stateType || 'walking'
                });
            }
        }, 200);
    }

    private startCleanupInterval() {
        if (this.cleanupInterval) {
            window.clearInterval(this.cleanupInterval)
        }

        this.cleanupInterval = window.setInterval(() => {
            PlayersController.getInstance().cleanupInactivePlayers(this.INACTIVE_TIMEOUT)
        }, this.CLEANUP_INTERVAL)
    }

    /**
     * Update position
     */
    public async updatePosition(position: ServerEvents.Position): Promise<boolean> {
        if (this.connection?.state !== "Connected") return false

        try {
            await this.connection.invoke("UpdatePosition", position)
            return true
        } catch (error) {
            console.error('Failed to update position:', error)
            return false
        }
    }

    /**
     * Send a chat message
     */
    public async sendChatMessage(message: string): Promise<boolean> {
        if (this.connection?.state !== "Connected") return false

        try {
            await this.connection.invoke("SendChatMessage", message)
            return true
        } catch (error) {
            console.error('Failed to send chat message:', error)
            return false
        }
    }

    /**
     * Get current connection state
     */
    public getConnectionState(): ConnectionState {
        return this.connectionState
    }

    /**
     * Check if currently connected
     */
    public isConnected(): boolean {
        return this.connectionState.status === 'connected'
    }

    /**
     * Disconnect from server
     */
    public disconnect() {
        if (this.positionUpdateInterval) {
            window.clearInterval(this.positionUpdateInterval)
            this.positionUpdateInterval = null
        }

        if (this.cleanupInterval) {
            window.clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }

        this.connection?.stop()
    }

    // Add new method
    public async changePlayerName(newName: string): Promise<boolean> {
        if (this.connection?.state !== "Connected") return false

        try {
            return await this.connection.invoke("ChangePlayerName", newName)
        } catch (error) {
            console.error('Failed to change name:', error)
            return false
        }
    }

    /**
     * Submit a race result
     */
    public async submitRaceResult(trackId: string, trackName: string, time: number): Promise<ServerEvents.RaceResultResponse | null> {
        if (this.connection?.state !== "Connected") return null

        try {
            return await this.connection.invoke("AddRaceResult", trackId, trackName, time)
        } catch (error) {
            console.error('Failed to submit race result:', error)
            return null
        }
    }
} 