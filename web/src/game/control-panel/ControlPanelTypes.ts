import { BasePanelUI } from './panels/BasePanelUI';
import { TeleportOptions } from '../../types/teleport';
export interface MenuItem {
  id: string;
  emoji: string;
  label: string;
  panel: new (container: HTMLElement, map: mapboxgl.Map, onTeleport: (teleportOptions: TeleportOptions) => void) => BasePanelUI;
}

export interface ControlPanelDependencies {
  map: mapboxgl.Map;
  onTeleport: (teleportOptions: TeleportOptions) => void;
  switchToCar: () => void;
  switchToWalking: () => void;
  toggleFlyingMode: () => void;
}

export interface ControlPanelState {
  activePanelId: string | null;
} 