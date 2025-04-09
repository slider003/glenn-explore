import { PlayerStore } from "../stores/PlayerStore";
import { ChatMessage, ChatUI, SystemMessage } from './ChatUI';
import { CHAT_EVENTS } from '../events/ChatEvents';
import { AIController } from './ai';
import { AIMessage } from './ai/AIMessageTypes';
import { TeleportOptions } from "../../types/teleport";

export class ChatController {
    private chatUI: ChatUI;
    private aiController?: AIController;
    private messages: (ChatMessage | SystemMessage)[] = [];

    constructor(onChangeName: (newName: string) => Promise<boolean>, onTeleport: (teleportOptions: TeleportOptions) => void) {
        // Initialize ChatUI with AI message handler
        this.chatUI = new ChatUI(
            onChangeName, 
            this.sendMessage.bind(this),
            this.sendAIMessage.bind(this)
        );
        
        // Initialize AI Controller if we want to use AI
        this.setupAIController(onTeleport);
        
        // Setup regular chat events
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for chat messages
        window.addEventListener(CHAT_EVENTS.MESSAGE_RECEIVED, ((event: CustomEvent) => {
            const { message } = event.detail;
            this.handleChatMessage(message);
        }) as EventListener);

        // Listen for system messages
        window.addEventListener(CHAT_EVENTS.SYSTEM_MESSAGE, ((event: CustomEvent) => {
            const { message } = event.detail;
            this.handleSystemMessage(message);
        }) as EventListener);

        // Listen for batch message loading
        window.addEventListener(CHAT_EVENTS.MESSAGES_LOADED, ((event: CustomEvent) => {
            const { messages } = event.detail;
            this.loadMessages(messages);
        }) as EventListener);
    }

    private setupAIController(onTeleport: (teleportOptions: TeleportOptions) => void): void {
        // Setup AI Controller with callbacks
        this.aiController = new AIController({
            onAddMessage: (message: AIMessage, forceShow?: boolean) => {
                this.chatUI.addAIMessage(message, forceShow);
            },
            onAddSystemMessage: (message: string) => {
                this.chatUI.addSystemMessage(message);
            },
            onStreamingUpdate: (message: AIMessage) => {
                this.chatUI.updateStreamingMessage(message);
            },
            onToolResponse: (element: HTMLElement) => {
                // Find the last AI message to attach the tool response to
                const messages = this.aiController?.getMessages() || [];
                const lastAssistantMessage = [...messages]
                    .reverse()
                    .find(m => m.role === 'assistant' && !m.isStreaming);
                
                if (lastAssistantMessage) {
                    this.chatUI.addToolResponse(lastAssistantMessage.timestamp, element);
                }
            },
            onTeleport: onTeleport
        });
    }

    private handleChatMessage(message: ChatMessage, forceShow: boolean = false): void {
        this.messages.push(message);
        this.chatUI.addMessage(message, forceShow);
    }

    private handleSystemMessage(message: string): void {
        this.chatUI.addSystemMessage(message);
    }

    public loadMessages(messages: ChatMessage[]): void {
        this.messages = messages;
        this.chatUI.addMessages(messages);
    }

    private sendMessage(message: string): void {
        if (!message.trim()) return;

        const chatMessage: ChatMessage = {
            isSystem: false,
            playerId: PlayerStore.getPlayerId(),
            message: message.trim(),
            timestamp: Date.now(),
            playerName: PlayerStore.getPlayerName()
        };

        window.dispatchEvent(new CustomEvent('chat:send_message', {
            detail: { message: chatMessage.message }
        }));

        // Show message locally
        this.handleChatMessage(chatMessage, true);
    }

    private sendAIMessage(message: string): void {
        if (!message.trim() || !this.aiController) return;
        
        // Create a user message to show in the chat first
        const userMessage: ChatMessage = {
            isSystem: false,
            playerId: PlayerStore.getPlayerId(),
            playerName: PlayerStore.getPlayerName(),
            message: message,
            timestamp: Date.now(),
            isAI: true // Mark as part of AI conversation
        };
        
        // Add the user message to the UI
        this.chatUI.addMessage(userMessage, true);
        
        // Send to AI controller
        this.aiController.sendMessageToAI(message, true);
    }

    public toggle(): void {
        this.chatUI.toggle();
    }
} 