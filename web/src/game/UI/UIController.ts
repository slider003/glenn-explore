import { ChatController } from "../chat/ChatController";
import { ControlPanelController } from "../control-panel/ControlPanelController";
import { InfoPanel } from "../InfoPanel";
import { MovementControlsPanel } from "../MovementControlsPanel";
import { PlayersOnlineUI } from "../PlayersOnlineUI";
import { TeleportOptions } from "../../types/teleport";
import { ModelSelectorController } from "../model-selector/ModelSelectorController";
import { PlayerController } from "../player/PlayerController";

declare global {
    interface Window {
        showModelSelector: () => void;
    }
}

export class UIController {
    private modelSelectorController: ModelSelectorController;

    public constructor(
        map: mapboxgl.Map, 
        onTeleport: (teleportOptions: TeleportOptions) => void, 
        onChangeName: (newName: string) => Promise<boolean>, 
        setKeyState: (key: string, isPressed: boolean) => void, 
        switchToCar: () => void, 
        switchToWalking: () => void,
        toggleFlyingMode: () => void,
        playerController: PlayerController
    ) {
        new PlayersOnlineUI(onTeleport);
        new ControlPanelController({ 
            map, 
            onTeleport, 
            switchToCar, 
            switchToWalking,
            toggleFlyingMode 
        });
        new ChatController(onChangeName, onTeleport);
        new MovementControlsPanel(setKeyState);
        // Initialize movement controls panel with player's setKeyState method
        if (!window.isSmallScreen) {
            new InfoPanel();
        }

        // Initialize model selector with player controller
        this.modelSelectorController = new ModelSelectorController(map, playerController);
        window.showModelSelector = () => this.modelSelectorController.show();
    }
}