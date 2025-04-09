// AI Message Types for Chat Integration

/**
 * Types of events that can be received from the stream
 */
export enum StreamEventType {
  StateChange = 'StateChange',
  TextContent = 'TextContent',
  ToolCall = 'ToolCall',
  ToolResult = 'ToolResult',
  Error = 'Error',
  Done = 'done'
}

/**
 * States of the AI stream
 */
export enum StreamState {
  Loading = 'Loading',
  Text = 'Text',
  ToolCall = 'ToolCall',
  Complete = 'Complete'
}

/**
 * Function call information from the AI
 */
export interface FunctionCall {
  name: string;
  arguments: string;
}

/**
 * Tool call information from the AI
 */
export interface ToolCall {
  id: string;
  type: string;
  function: FunctionCall;
}

/**
 * Raw event data from the SSE stream
 */
export interface StreamEvent {
  eventType: StreamEventType;
  state: StreamState;
  toolName?: string;
  textDelta?: string;
  toolCall?: ToolCall;
  toolResult?: string;
  formattedResult?: string;
  originalResponse?: any;
  error?: string;
}

/**
 * AI message with possible tool calls
 */
export interface AIMessage {
  id?: string;
  role: 'assistant' | 'user' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  isStreaming?: boolean;
  isMarkdown?: boolean;
  playerName?: string;
  timestamp: number;
  isTool?: boolean;
  toolName?: string;
}

/**
 * Parsed tool response with interactive elements
 */
export interface ParsedToolResponse {
  toolName: string;
  rawResponse: string;
  parsedData: any;
  interactiveElements?: HTMLElement[];
}

/**
 * Location information for teleport functionality
 */
export interface Location {
  name: string;
  description?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

/**
 * Type definition for tool response parsers
 */
export interface ToolResponseParser {
  canParse: (toolName: string) => boolean;
  parse: (toolName: string, response: string) => ParsedToolResponse;
}

/**
 * AI conversation information
 */
export interface AIConversation {
  id: string;
  messages: AIMessage[];
  lastUpdated: number;
}

/**
 * Add to your existing types
 */
export interface StreamErrorEvent {
    error: string;
} 