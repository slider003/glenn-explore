import { AIMessage, AIConversation, ToolCall, ParsedToolResponse, Location } from './AIMessageTypes';
import { AIMessageParser } from './AIMessageParser';
import { AIStreamHandler } from './AIStreamHandler';
import { ToolResponseRenderer } from './ToolResponseRenderer';
import { PlayerStore } from '../../stores/PlayerStore';
import { TeleportOptions } from '../../../types/teleport';
import { trackQuestEvent } from '../../quests/engine/trackQuestEvent';

// Interface for event callbacks from external components
interface AIControllerCallbacks {
  onAddMessage: (message: AIMessage, forceShow?: boolean) => void;
  onAddSystemMessage: (message: string) => void;
  onStreamingUpdate: (message: AIMessage) => void;
  onToolResponse: (element: HTMLElement) => void;
  onTeleport: (teleportOptions: TeleportOptions) => void;
}


/**
 * Controller for AI chat functionality
 */
export class AIController {
  private parser: AIMessageParser;
  private streamHandler: AIStreamHandler;
  private renderer: ToolResponseRenderer;
  private callbacks: AIControllerCallbacks;

  // State
  private conversation: AIConversation;
  private isStreaming: boolean = false;
  private activeStreamingMessage: AIMessage | null = null;

  constructor(callbacks: AIControllerCallbacks) {
    this.callbacks = callbacks;

    // Initialize components
    this.parser = new AIMessageParser();
    this.streamHandler = new AIStreamHandler();
    this.renderer = new ToolResponseRenderer();

    // Initialize conversation
    this.conversation = {
      id: this.generateConversationId(),
      messages: [],
      lastUpdated: Date.now()
    };

    // Setup handlers
    this.setupStreamHandler();
    this.setupToolRenderer();
  }

  /**
   * Setup stream handler callbacks
   */
  private setupStreamHandler(): void {
    this.streamHandler
      .setOnTextUpdate((text: string) => {
        if (this.isStreaming) {
          // Update or create streaming message
          if (!this.activeStreamingMessage) {
            this.activeStreamingMessage = {
              role: 'assistant',
              content: text,
              isStreaming: true,
              isMarkdown: true,
              timestamp: Date.now()
            };
          } else {
            this.activeStreamingMessage.content = text;
          }

          // Update UI
          this.callbacks.onStreamingUpdate(this.activeStreamingMessage);
        }
      })
      .setOnToolCall((toolCall: ToolCall) => {
        // Log tool call for debugging

        // Create a new message for the tool call
        const toolCallMessage: AIMessage = {
          role: 'assistant',
          content: `Using tool: ${toolCall.function.name}`,
          isMarkdown: true,
          timestamp: Date.now(),
          isTool: true,
          toolName: toolCall.function.name
        };

        // Add to conversation
        this.addMessageToConversation(toolCallMessage);

        // Add to UI
        this.callbacks.onAddMessage(toolCallMessage, true);
      })
      .setOnToolResult((toolName: string, result: string) => {
        // Parse tool result
        const parsedResult = this.parser.parseToolResponse(toolName, result);

        // Render tool result
        const element = this.renderer.renderToolResponse(parsedResult);

        // Create a new message for the tool result
        const toolResultMessage: AIMessage = {
          role: 'tool',
          content: '', // Empty content since we'll use the rendered element
          isMarkdown: false,
          timestamp: Date.now(),
          isTool: true,
          toolName: toolName
        };

        // Add to conversation
        this.addMessageToConversation(toolResultMessage);

        // Add to UI as a separate message
        this.callbacks.onAddMessage(toolResultMessage, true);

        // Pass element to callback
        this.callbacks.onToolResponse(element);
      })
      .setOnComplete((message: AIMessage) => {
        // Ensure message is marked as no longer streaming
        message.isStreaming = false;

        // Add final message to conversation
        this.addMessageToConversation(message);

        // Mark streaming as complete
        this.isStreaming = false;
        this.activeStreamingMessage = null;

        // Add message to UI
        this.callbacks.onAddMessage(message, true);
      })
      .setOnError((error: string) => {
        console.error('AI Stream error:', error);
        this.isStreaming = false;
        this.activeStreamingMessage = null;
        this.callbacks.onAddSystemMessage(`AI Error: ${error}`);
      });
  }

  /**
   * Setup tool renderer callbacks
   */
  private setupToolRenderer(): void {
    this.renderer.setTeleportCallback((teleportOptions: TeleportOptions, name: string) => {
      // Use teleport service if available
      this.callbacks.onTeleport(teleportOptions);
      this.callbacks.onAddSystemMessage(`Teleporting to ${name}...`);
      trackQuestEvent('AI_TELEPORT_USED');
    });
  }

  /**
   * Send a message to the AI
   * @param message The message text to send
   * @param markdownEnabled Whether the response should be rendered as Markdown
   */
  public sendMessageToAI(message: string, markdownEnabled: boolean = true): void {
    if (this.isStreaming) {
      this.callbacks.onAddSystemMessage("AI is still responding, please wait...");
      return;
    }

    // Create user message
    const userMessage: AIMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
      isMarkdown: false, // User messages don't use Markdown
      playerName: PlayerStore.getPlayerName() // Add the player's name
    };

    // Add to conversation
    this.addMessageToConversation(userMessage);

    // Don't add to UI since ChatController already did this
    // this.callbacks.onAddMessage(userMessage, true);

    // Start streaming
    this.isStreaming = true;
    this.activeStreamingMessage = null;
    this.streamHandler.startStream(message, 'openai/gpt-4o', markdownEnabled);
  }

  /**
   * Add a message to the conversation
   * @param message The message to add
   */
  private addMessageToConversation(message: AIMessage): void {
    this.conversation.messages.push(message);
    this.conversation.lastUpdated = Date.now();
  }

  /**
   * Generate a new conversation ID
   */
  private generateConversationId(): string {
    return `ai_conversation_${PlayerStore.getPlayerId()}_${Date.now()}`;
  }

  /**
   * Check if AI is currently streaming a response
   */
  public isCurrentlyStreaming(): boolean {
    return this.isStreaming;
  }

  /**
   * Get all messages in the current conversation
   */
  public getMessages(): AIMessage[] {
    return [...this.conversation.messages];
  }
} 