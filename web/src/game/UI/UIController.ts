import { ChatController } from "../chat/ChatController";
import { ControlPanelController } from "../control-panel/ControlPanelController";
import { InfoPanel } from "../InfoPanel";
import { MovementControlsPanel } from "../MovementControlsPanel";
import { PlayersOnlineUI } from "../PlayersOnlineUI";
import { TeleportOptions } from "../../types/teleport";
export class UIController {
    public constructor(map: mapboxgl.Map, onTeleport: (teleportOptions: TeleportOptions) => void, onChangeName: (newName: string) => Promise<boolean>, setKeyState: (key: string, isPressed: boolean) => void, switchToCar: () => void, switchToWalking: () => void, toggleFlyingMode: () => void) {
        new PlayersOnlineUI(onTeleport);
        new ControlPanelController({ map, onTeleport, switchToCar, switchToWalking, toggleFlyingMode });
        new ChatController(onChangeName, onTeleport);
        // Initialize movement controls panel with player's setKeyState method
        if (window.isSmallScreen) {
            new MovementControlsPanel(setKeyState);
        }else {
            new InfoPanel();
        }
    }
}