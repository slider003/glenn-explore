import { TeleportOptions } from '../types/teleport';
import { PlayersController } from './players/PlayersController';
import { RealtimeController } from './realtime/RealtimeController';
import { RealtimeServer } from './realtime/RealtimeServer';
import { PlayerStore } from './stores/PlayerStore';
interface Player {
  id: string;
  name: string;
  position: {
    coordinates: [number, number];
  };
  lastUpdate: number;
  currentSpeed?: number;  // Add speed property
}

export class PlayersOnlineUI {
  private container: HTMLDivElement;
  private panel: HTMLDivElement;
  private playerList: HTMLDivElement;
  private searchInput: HTMLInputElement;
  private isExpanded: boolean = false;
  private players: Player[] = [];
  private updateInterval: number | null = null;
  private onTeleport: (teleportOptions: TeleportOptions) => void;

  constructor(onTeleport: (teleportOptions: TeleportOptions) => void) {
    // Create main container
    this.onTeleport = onTeleport;
    this.container = document.createElement('div');
    this.container.className = 'players-online-container';

    // Create expandable panel
    this.panel = document.createElement('div');
    this.panel.className = 'players-online-panel';

    // Create player list container
    this.playerList = document.createElement('div');
    this.playerList.className = 'players-list';

    // Create search input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search players...';
    this.searchInput.className = 'players-search-input';

    this.createUI();
    this.setupEventListeners();
    this.startUpdates();
    this.addStyles();
  }

  private createUI(): void {
    // Create header (always visible part)
    const header = document.createElement('div');
    header.className = 'players-online-header';
    
    const countContainer = document.createElement('div');
    countContainer.className = 'players-count-container';
    countContainer.innerHTML = `
      <span class="players-count-icon">👥</span>
      <span class="players-count-number">Loading...</span>
      <span class="players-action-hint">🚀</span>
    `;

    const toggleButton = document.createElement('button');
    toggleButton.className = 'players-panel-toggle';
    toggleButton.innerHTML = '▼';

    // Add click handlers
    header.addEventListener('click', (e) => {
      // Only toggle if clicking the header or count container, not the toggle button
      if (e.target !== toggleButton && !toggleButton.contains(e.target as Node)) {
        this.togglePanel();
      }
    });

    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent header click from firing
      this.togglePanel();
    });

    header.appendChild(countContainer);
    header.appendChild(toggleButton);

    // Assemble the panel
    this.panel.appendChild(this.searchInput);
    this.panel.appendChild(this.playerList);
    this.panel.style.display = 'none';

    // Assemble the container
    this.container.appendChild(header);
    this.container.appendChild(this.panel);

    // Add to document
    document.body.appendChild(this.container);
  }

  private setupEventListeners(): void {
    // Search input handler
    this.searchInput.addEventListener('input', () => {
      this.filterPlayers(this.searchInput.value);
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node) && this.isExpanded) {
        this.togglePanel();
      }
    });
  }

  private startUpdates(): void {
    // Update player list every second
    this.updateInterval = window.setInterval(() => {
      this.updatePlayerList();
    }, 1000) as unknown as number;
  }

  private updatePlayerList(): void {
    // Get players directly from RealtimeServer
    const players = PlayersController.getInstance().getPlayers();
    
    this.players = players.map(player => ({
      id: player.getId(),
      name: player.getName(),
      position: {
        coordinates: [player.getCoordinates()[0], player.getCoordinates()[1]]
      },
      lastUpdate: player.getLastUpdateTime(),
      currentSpeed: player.getCurrentSpeed()
    }));

    // Update UI
    this.renderPlayerList();
    this.updatePlayerCount();
  }

  private renderPlayerList(): void {
    this.playerList.innerHTML = '';
    const currentPlayerId = PlayerStore.getPlayerId();

    this.players.forEach(player => {
      if (player.id === currentPlayerId) return; // Skip current player

      const playerItem = document.createElement('div');
      playerItem.className = 'player-item';
      
      const playerInfo = document.createElement('div');
      playerInfo.className = 'player-info';
      
      // Format speed with one decimal and add km/h
      const speedText = player.currentSpeed !== undefined 
          ? `${player.currentSpeed.toFixed(1)} km/h`
          : '0.0 km/h';
      
      playerInfo.innerHTML = `
        <span class="player-name">${player.name}</span>
        <span class="player-speed">${speedText}</span>
        <span class="player-status ${Date.now() - player.lastUpdate < 5000 ? 'online' : 'away'}"></span>
      `;

      const teleportButton = document.createElement('button');
      teleportButton.className = 'teleport-button';
      teleportButton.textContent = 'Teleport to';
      teleportButton.addEventListener('click', () => {
        this.teleportToPlayer(player);
      });

      playerItem.appendChild(playerInfo);
      playerItem.appendChild(teleportButton);
      this.playerList.appendChild(playerItem);
    });
  }

  private filterPlayers(searchTerm: string): void {
    const items = this.playerList.getElementsByClassName('player-item');
    const term = searchTerm.toLowerCase();

    Array.from(items).forEach((item) => {
      const name = item.querySelector('.player-name')?.textContent?.toLowerCase() || '';
      (item as HTMLElement).style.display = name.includes(term) ? '' : 'none';
    });
  }

  private updatePlayerCount(): void {
    const countElement = this.container.querySelector('.players-count-number');
    const actionHint = this.container.querySelector('.players-action-hint');
    if (countElement && actionHint) {
      if (RealtimeServer.isServerLoading()) {
        countElement.textContent = '🔄 Connecting...';
        countElement.className = 'players-count-number connecting';
      } else if (!RealtimeServer.isServerConnected()) {
        countElement.textContent = '😢 Offline';
        countElement.className = 'players-count-number offline';
        actionHint.textContent = '🔄';
      } else {
        const count = this.players.length;
        countElement.textContent = `${count + 1} online`;
        countElement.className = 'players-count-number';
        actionHint.textContent = '🚀 Click to join them!';
      }
    }
  }

  private teleportToPlayer(player: Player): void {
    // Teleport the vehicle to the player's position
    this.onTeleport({
      position: {
        lng: player.position.coordinates[0],
        lat: player.position.coordinates[1]
      }
    });
    
    // Close the panel
    if (this.isExpanded) {
      this.togglePanel();
    }

    // Show feedback toast
    this.showToast(`Teleported to ${player.name}!`);
  }

  private togglePanel(): void {
    this.isExpanded = !this.isExpanded;
    const toggle = this.container.querySelector('.players-panel-toggle') as HTMLElement;
    
    if (this.isExpanded) {
      this.panel.style.display = 'block';
      toggle.innerHTML = '▲';
      // Focus search input when opening
      setTimeout(() => this.searchInput.focus(), 100);
    } else {
      this.panel.style.display = 'none';
      toggle.innerHTML = '▼';
    }
  }

  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'players-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .players-online-container {
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        min-width: 200px;
      }

      .players-online-header {
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .players-online-header:hover {
        background-color: rgba(0, 0, 0, 0.85);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .players-online-header::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.1),
          transparent
        );
        animation: shine 3s infinite;
      }

      @keyframes shine {
        0% { left: -100%; }
        50% { left: 100%; }
        100% { left: 100%; }
      }

      .players-count-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .players-count-icon {
        font-size: 16px;
        animation: pulse 2s infinite;
      }

      .players-action-hint {
        font-size: 12px;
        opacity: 0.9;
        color: #4CAF50;
        margin-left: 8px;
        font-weight: 500;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .players-action-hint {
        animation: float 2s ease-in-out infinite;
      }

      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-2px); }
        100% { transform: translateY(0px); }
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      .players-panel-toggle {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0 4px;
        font-size: 12px;
        opacity: 0.8;
        transition: all 0.3s ease;
      }

      .players-panel-toggle:hover {
        opacity: 1;
        transform: translateY(2px);
      }

      /* Mobile adjustments */
      @media (max-width: 768px) {
        .players-online-container {
          top: 5px;
          width: 80%;
        }

        .players-action-hint {
          font-size: 11px;
        }

        .players-count-icon {
          font-size: 14px;
        }
      }

      .players-online-panel {
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        margin-top: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        max-height: 300px;
        display: none;
      }

      .players-search-input {
        width: 100%;
        padding: 8px 12px;
        border: none;
        border-bottom: 1px solid #eee;
        outline: none;
        font-size: 14px;
      }

      .players-list {
        max-height: 250px;
        overflow-y: auto;
      }

      .player-item {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #eee;
      }

      .player-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .player-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .player-status.online {
        background-color: #4CAF50;
      }

      .player-status.away {
        background-color: #FFC107;
      }

      .teleport-button {
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }

      .teleport-button:hover {
        background-color: #1976D2;
      }

      .players-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        animation: toast 3s ease;
      }

      @keyframes toast {
        0% { opacity: 0; transform: translate(-50%, 20px); }
        10% { opacity: 1; transform: translate(-50%, 0); }
        90% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .players-online-panel {
          background-color: rgba(33, 33, 33, 0.95);
          color: white;
        }

        .players-search-input {
          background-color: #333;
          color: white;
          border-bottom-color: #444;
        }

        .player-item {
          border-bottom-color: #444;
        }

        .teleport-button {
          background-color: #1976D2;
        }

        .teleport-button:hover {
          background-color: #1565C0;
        }
      }

      .players-count-number {
        transition: color 0.3s ease;
      }

      .players-count-number.connecting {
        color: #FFA500;
        animation: pulse 1s infinite;
      }

      .players-count-number.offline {
        color: #FF4444;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      .player-speed {
        font-size: 12px;
        color: #666;
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: 8px;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .player-speed {
          color: #aaa;
          background: rgba(255, 255, 255, 0.1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  public destroy(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }
    this.container.remove();
  }
}