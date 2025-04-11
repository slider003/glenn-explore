import { ChatController } from '../chat/ChatController'
import { RealtimeServer, ConnectionState } from './RealtimeServer'
import * as ServerEvents from './types/ServerEvents'
import { AuthClient } from './AuthClient'
import { PlayerStore } from '../stores/PlayerStore'
import { CHAT_EVENTS } from '../events/ChatEvents'
import { PlayersController } from '../players/PlayersController'
import { Threebox } from 'threebox-plugin'

export class RealtimeController {
    private server: RealtimeServer
    private chatController: ChatController | null
    private isOnline: boolean = false
    private authClient: AuthClient

    constructor(
    ) {
        this.server = new RealtimeServer()
        this.authClient = new AuthClient()
        this.chatController = null




        // Listen for chat message send requests
        window.addEventListener('chat:send_message', ((event: CustomEvent) => {
            const { message } = event.detail
            this.sendChatMessage(message)
        }) as EventListener)

        // Keep race completion listener
        window.addEventListener('raceCompleted', ((event: Event) => {
            if (this.isOnline && event instanceof CustomEvent) {
                const { trackId, trackName, time } = event.detail
                this.submitRaceResult(trackId, trackName, time)
            }
        }) as EventListener)
    }

    /**
     * Try to connect to realtime server
     */
    public async connect(map: mapboxgl.Map, tb: Threebox): Promise<void> {
        try {
            // // First authenticate as guest using vehicle's player ID
            // const guestId = PlayerStore.getPlayerId()
            // //const loginResponse = await this.authClient.createGuestUser(guestId)
            // //PlayerStore.setPlayerName(loginResponse.username)

            // //if (loginResponse.lastPosition) {
            //     //this.onTeleport(loginResponse.lastPosition.x, loginResponse.lastPosition.y)
            // //}
            PlayersController.initialize(map, tb)

            // Now try to connect to SignalR
            await this.server.connect(
                this.handleConnectionStateChange.bind(this),
                this.handlePlayersChange.bind(this)
            )
        } catch (error) {
            console.error('Failed to connect to realtime server:', error)
        }
    }

    /**
     * Handle connection state changes
     */
    private handleConnectionStateChange(state: ConnectionState) {
        this.isOnline = state.status === 'connected'
        PlayerStore.setOnlineStatus(this.isOnline)

        // Emit event for UI to update
        window.dispatchEvent(new CustomEvent('connectionStateChanged', {
            detail: state
        }))
    }

    /**
     * Handle player count changes
     */
    private handlePlayersChange(count: number) {
        window.dispatchEvent(new CustomEvent('playersChanged', {
            detail: { count }
        }))
    }

    /**
     * Update position
     */
    public updatePosition(position: ServerEvents.Position) {
        // Only send to server if online
        if (this.isOnline) {
            this.server.updatePosition(position)
        }
    }

    /**
     * Send chat message
     */
    public async sendChatMessage(message: string): Promise<void> {
        window.dispatchEvent(new CustomEvent(CHAT_EVENTS.MESSAGE_RECEIVED, {
            detail: {
                playerId: PlayerStore.getPlayerId(),
                playerName: PlayerStore.getPlayerName(),
                message,
                timestamp: Date.now(),
                force: true
            }
        }));

        // Try to send to server if online
        if (this.isOnline) {
            const sent = await this.server.sendChatMessage(message)
            if (!sent) {
                window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                    detail: { message: "❌ Failed to send message" }
                }))
            }
        } else {
            window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                detail: { message: "⚫ Message not sent - You're offline" }
            }))
        }
    }

    /**
     * Toggle chat visibility
     */
    public toggleChat(): void {
        this.chatController?.toggle()
    }

    /**
     * Check if connected to server
     */
    public isConnected(): boolean {
        return this.isOnline
    }

    /**
     * Get current connection state
     */
    public getConnectionState(): ConnectionState {
        return this.server.getConnectionState()
    }

    /**
     * Clean up resources
     */
    public destroy() {
        this.server.disconnect()
        PlayersController.getInstance().destroy()
    }

    // Add new method
    public async changePlayerName(newName: string): Promise<boolean> {
        if (!PlayerStore.isPlayerOnline()) {
            window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                detail: { message: "⚫ Can't change name - You're offline" }
            }))
            return false;
        }

        const success = await this.server.changePlayerName(newName);
        if (success) {
            PlayerStore.setPlayerName(newName);
        } else {
            window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                detail: { message: "❌ Failed to change name" }
            }))
        }
        return success;
    }

    /**
     * Submit a race result
     */
    public async submitRaceResult(trackId: string, trackName: string, time: number): Promise<boolean> {
        if (!this.isOnline) {
            window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                detail: { message: "⚫ Can't submit race result - You're offline" }
            }))
            return false
        }

        const result = await this.server.submitRaceResult(trackId, trackName, time)
        if (!result) {
            window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
                detail: { message: "❌ Failed to submit race result" }
            }))
            return false
        }

        // Format time for local message
        const timeStr = new Date(time * 1000).toISOString().substr(14, 9).replace('.', ':')
        let localMessage = `You completed ${trackName} in ${timeStr}`

        if (result.isTrackRecord) {
            localMessage = `🏆 NEW TRACK RECORD! ${localMessage}`
        } else if (result.isPersonalBest) {
            localMessage = `⭐ NEW PERSONAL BEST! ${localMessage}`
        }

        window.dispatchEvent(new CustomEvent(CHAT_EVENTS.SYSTEM_MESSAGE, {
            detail: { message: localMessage }
        }))
        return true
    }
} 