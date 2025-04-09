import { Threebox } from 'threebox-plugin';
import { RemotePlayer } from './RemotePlayer';
import { RemotePlayerData } from './types/RemotePlayerTypes';
import { PlayerStore } from '../stores/PlayerStore';
import mapboxgl from 'mapbox-gl';

export class PlayersController {
    private static instance: PlayersController;
    private players: Map<string, RemotePlayer> = new Map();
    private playerMarkers: Map<string, mapboxgl.Marker> = new Map();
    private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
    private readonly INACTIVE_TIMEOUT = 50000; // 50 seconds

    private constructor(
        private map: mapboxgl.Map,
        private tb: Threebox
    ) {
        this.startCleanupInterval();
    }

    private createMarkerElement(playerName: string): HTMLElement {
        const markerContainer = document.createElement('div');
        markerContainer.className = 'player-marker-container';

        // Create marker dot
        const markerDot = document.createElement('div');
        markerDot.className = 'player-marker-dot';
        
        // Create name label
        const nameLabel = document.createElement('div');
        nameLabel.className = 'player-marker-name';
        nameLabel.textContent = playerName;

        // Add elements to container
        markerContainer.appendChild(markerDot);
        markerContainer.appendChild(nameLabel);

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .player-marker-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }
            .player-marker-dot {
                width: 12px;
                height: 12px;
                background-color: #FF4444;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
            }
            .player-marker-name {
                color: white;
                background-color: rgba(0, 0, 0, 0.6);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
            }
        `;
        document.head.appendChild(styles);

        return markerContainer;
    }

    public static getInstance(): PlayersController {
        return PlayersController.instance;
    }

    public static initialize(map: mapboxgl.Map, tb: Threebox): PlayersController {
        if (!PlayersController.instance) {
            PlayersController.instance = new PlayersController(map, tb);
        }
        return PlayersController.instance;
    }

    public handlePlayerUpdate(playerData: RemotePlayerData): void {
        // Skip if this is our own player
        if (playerData.playerId === PlayerStore.getPlayerId()) return;

        let player = this.players.get(playerData.playerId);
        let marker = this.playerMarkers.get(playerData.playerId);

        if (!player) {
            // Create new player
            player = new RemotePlayer(this.map, this.tb, playerData);
            this.players.set(playerData.playerId, player);

            // Create new marker
            const markerElement = this.createMarkerElement(playerData.name);
            marker = new mapboxgl.Marker({
                element: markerElement,
                rotationAlignment: 'map'
            })
            .setLngLat([playerData.position.coordinates[0], playerData.position.coordinates[1]])
            .addTo(this.map);

            this.playerMarkers.set(playerData.playerId, marker);
            
            console.log(`Created new remote player: ${playerData.playerId}, ${playerData.name}, model: ${playerData.state.modelType}, animation: ${playerData.state.animationState}`);
        } else {
            // Update existing player
            player.updatePosition(playerData.position.coordinates, playerData.position.rotation);
            
            // Update marker position
            if (marker) {
                marker.setLngLat([playerData.position.coordinates[0], playerData.position.coordinates[1]]);
                const nameLabel = marker.getElement().querySelector('.player-marker-name');
                if (nameLabel && nameLabel.textContent !== playerData.name) {
                    nameLabel.textContent = playerData.name;
                }
            }

            // Update state if model type, animation state or state type changed
            if (playerData.state && (
                player.getId() !== playerData.playerId ||
                playerData.state.modelType !== player.getModelType() || 
                playerData.state.animationState !== player.getAnimationState() ||
                playerData.state.stateType !== player.getStateType()
            )) {
                console.log(`Updating remote player state: ${playerData.state.modelType}, ${playerData.state.animationState}, ${playerData.state.stateType}`);
                player.updateState(playerData.state);
            }
        }
    }

    public removePlayer(playerId: string): void {
        const player = this.players.get(playerId);
        const marker = this.playerMarkers.get(playerId);
        
        if (player) {
            player.remove();
            this.players.delete(playerId);
        }
        
        if (marker) {
            marker.remove();
            this.playerMarkers.delete(playerId);
        }
    }

    public updatePlayerName(playerId: string, newName: string): void {
        const player = this.players.get(playerId);
        const marker = this.playerMarkers.get(playerId);
        
        if (player) {
            player.setName(newName);
        }
        
        if (marker) {
            const nameLabel = marker.getElement().querySelector('.player-marker-name');
            if (nameLabel) {
                nameLabel.textContent = newName;
            }
        }
    }

    private startCleanupInterval(): void {
        setInterval(() => {
            const now = Date.now();
            this.players.forEach((player, playerId) => {
                if (now - player.getLastUpdateTime() > this.INACTIVE_TIMEOUT) {
                    this.removePlayer(playerId);
                }
            });
        }, this.CLEANUP_INTERVAL);
    }

    public showPlayerMessage(playerId: string, message: string): void {
        const player = this.players.get(playerId);
        if (player) {
            player.showMessage(message);
        }
    }

    public getPlayerCount(): number {
        return this.players.size;
    }

    public getPlayers(): Array<RemotePlayer> {
        return Array.from(this.players.values());
    }

    public destroy(): void {
        // Clean up players
        this.players.forEach(player => player.remove());
        this.players.clear();

        // Clean up markers
        this.playerMarkers.forEach(marker => marker.remove());
        this.playerMarkers.clear();
    }

    public cleanupInactivePlayers(maxAge: number): void {
        const now = Date.now();
        this.players.forEach((player, playerId) => {
            if (now - player.getLastUpdateTime() > maxAge) {
                this.removePlayer(playerId);
            }
        });
    }
} 