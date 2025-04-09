import { 
  AIMessage, 
  StreamEvent, 
  StreamEventType, 
  StreamState,
  ToolCall
} from './AIMessageTypes';

/**
 * Handles AI message streaming via Server-Sent Events
 */
export class AIStreamHandler {
  private eventSource: EventSource | null = null;
  private conversationId: string = '';
  private currentMessage: AIMessage | null = null;
  private isStreaming: boolean = false;
  
  // Callbacks
  private onTextUpdate: (text: string) => void = () => {};
  private onToolCall: (toolCall: ToolCall) => void = () => {};
  private onToolResult: (toolName: string, result: string) => void = () => {};
  private onComplete: (message: AIMessage) => void = () => {};
  private onError: (error: string) => void = () => {};

  /**
   * Set callback for text updates during streaming
   */
  public setOnTextUpdate(callback: (text: string) => void): AIStreamHandler {
    this.onTextUpdate = callback;
    return this;
  }

  /**
   * Set callback for tool calls
   */
  public setOnToolCall(callback: (toolCall: ToolCall) => void): AIStreamHandler {
    this.onToolCall = callback;
    return this;
  }

  /**
   * Set callback for tool results
   */
  public setOnToolResult(callback: (toolName: string, result: string) => void): AIStreamHandler {
    this.onToolResult = callback;
    return this;
  }

  /**
   * Set callback for stream completion
   */
  public setOnComplete(callback: (message: AIMessage) => void): AIStreamHandler {
    this.onComplete = callback;
    return this;
  }

  /**
   * Set callback for errors
   */
  public setOnError(callback: (error: string) => void): AIStreamHandler {
    this.onError = callback;
    return this;
  }

  /**
   * Start streaming an AI response
   * @param message The user message to send
   * @param model Optional model to use
   * @param markdownEnabled Whether to render the assistant response as Markdown
   */
  public startStream(message: string, model: string = 'openai/gpt-4o', markdownEnabled: boolean = true): void {
    if (this.isStreaming) {
      this.stopStream();
    }

    this.isStreaming = true;
    
    // Generate a conversation ID if none exists
    if (!this.conversationId) {
      this.conversationId = this.generateConversationId();
    }

    // Create a new message object
    this.currentMessage = {
      role: 'assistant',
      content: '',
      isStreaming: true,
      isMarkdown: markdownEnabled,
      timestamp: Date.now()
    };

    // Trigger initial update with empty content
    this.onTextUpdate('');

    // Create URL for streaming endpoint
    const url = new URL('/api/openrouter/tools/chat/stream', window.location.origin);
    url.searchParams.append('conversationId', this.conversationId);
    url.searchParams.append('message', message);
    url.searchParams.append('model', model);

    // Create EventSource for SSE connection
    try {
      this.eventSource = new EventSource(url.toString());
      this.setupEventListeners();
    } catch (error) {
      this.handleError(`Failed to connect to AI: ${error}`);
    }
  }

  /**
   * Stop the current stream
   */
  public stopStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isStreaming = false;

    // If we have a current message, mark it as complete
    if (this.currentMessage) {
      // Create a new message object for the final message to ensure complete separation
      const finalMessage: AIMessage = {
        role: 'assistant',
        content: this.currentMessage.content,
        toolCalls: this.currentMessage.toolCalls,
        isMarkdown: this.currentMessage.isMarkdown, // Preserve Markdown setting
        timestamp: Date.now(),
        isStreaming: false
      };
      
      // Clean up current message
      this.currentMessage = null;
      
      // Call complete callback with the final message
      this.onComplete(finalMessage);
    }
  }

  /**
   * Setup event listeners for the SSE connection
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    // Handle different event types
    this.eventSource.addEventListener(StreamEventType.TextContent.toString(), (e) => {
      this.handleTextContentEvent(JSON.parse(e.data));
    });

    this.eventSource.addEventListener(StreamEventType.ToolCall.toString(), (e) => {
      this.handleToolCallEvent(JSON.parse(e.data));
    });

    this.eventSource.addEventListener(StreamEventType.ToolResult.toString(), (e) => {
      this.handleToolResultEvent(JSON.parse(e.data));
    });

    this.eventSource.addEventListener(StreamEventType.StateChange.toString(), (e) => {
      this.handleStateChangeEvent(JSON.parse(e.data));
    });

    this.eventSource.addEventListener(StreamEventType.Error.toString(), (e) => {
      this.handleErrorEvent(JSON.parse(e.data));
    });

    this.eventSource.addEventListener('done', () => {
      this.handleDoneEvent();
    });

    // Handle general errors
    this.eventSource.onerror = () => {
      this.handleError('Connection to AI failed');
    };
  }

  /**
   * Handle text content events
   */
  private handleTextContentEvent(event: StreamEvent): void {
    if (!this.currentMessage || !event.textDelta) return;
    
    // Ensure message is marked as streaming
    this.currentMessage.isStreaming = true;
    
    // Append text to the current message
    this.currentMessage.content += event.textDelta;
    
    // Trigger callback with updated text
    this.onTextUpdate(this.currentMessage.content);
  }

  /**
   * Handle tool call events
   */
  private handleToolCallEvent(event: StreamEvent): void {
    if (!event.toolCall) return;
    
    // Store the tool call locally
    const toolCall = event.toolCall;
    
    // Trigger callback for UI update
    this.onToolCall(toolCall);
  }

  /**
   * Handle tool result events
   */
  private handleToolResultEvent(event: StreamEvent): void {
    if (!event.toolName) return;
    
    // Check if we have a formatted result for UI rendering
    if (event.formattedResult) {
      try {
        // Parse the formatted result
        const formattedData = JSON.parse(event.formattedResult);
        // Trigger callback with tool result and formatted data
        this.onToolResult(event.toolName, event.formattedResult);
      } catch (e) {
        console.error('Error parsing formatted result:', e);
        // Fall back to regular tool result
        if (event.toolResult) {
          this.onToolResult(event.toolName, event.toolResult);
        }
      }
    } else if (event.toolResult) {
      // Use regular tool result if no formatted result
      this.onToolResult(event.toolName, event.toolResult);
    }
  }

  /**
   * Handle state change events
   */
  private handleStateChangeEvent(event: StreamEvent): void {
    // If state is complete, finish the stream
    if (event.state === StreamState.Complete) {
      this.finishStream();
    }
  }

  /**
   * Handle error events
   */
  private handleErrorEvent(event: StreamEvent): void {
    this.handleError(event.toolResult || 'Unknown error from AI');
  }

  /**
   * Handle done events
   */
  private handleDoneEvent(): void {
    this.finishStream();
  }

  /**
   * Handle general errors
   */
  private handleError(message: string): void {
    console.error('AI Stream error:', message);
    
    // Call the error callback with the message
    this.onError(message);
    
    // Stop the stream on error
    this.stopStream();
    
    // Clean up the current message if it exists
    if (this.currentMessage) {
        this.currentMessage.content += `\n\n_Error: ${message}_`;
        this.onTextUpdate(this.currentMessage.content);
    }
  }

  /**
   * Finish the stream and clean up
   */
  private finishStream(): void {
    // Only proceed if we're still streaming
    if (!this.isStreaming || !this.currentMessage) return;
    
    // Create a new message object for the final message to ensure complete separation
    const finalMessage: AIMessage = {
      role: 'assistant',
      content: this.currentMessage.content,
      toolCalls: this.currentMessage.toolCalls,
      isMarkdown: this.currentMessage.isMarkdown,
      timestamp: Date.now(),
      isStreaming: false
    };
    
    // Clean up current message
    this.currentMessage = null;
    this.isStreaming = false;
    
    // Call complete callback with the final message
    this.onComplete(finalMessage);
    
    // Clean up
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Generate a new conversation ID
   */
  private generateConversationId(): string {
    return `conversation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
} 