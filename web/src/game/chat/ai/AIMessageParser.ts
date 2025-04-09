import { 
  AIMessage, 
  ParsedToolResponse, 
  ToolCall, 
  ToolResponseParser, 
  Location 
} from './AIMessageTypes';

/**
 * Parser for AI messages and tool responses
 */
export class AIMessageParser {
  private toolParsers: ToolResponseParser[] = [];

  constructor() {
    // Register default parsers
    this.registerDefaultParsers();
  }

  /**
   * Register a new tool response parser
   * @param parser The parser to register
   */
  public registerParser(parser: ToolResponseParser): void {
    this.toolParsers.push(parser);
  }

  /**
   * Register the default set of parsers
   */
  private registerDefaultParsers(): void {
    // Register teleport location parser
    this.registerParser({
      canParse: (toolName: string) => toolName.toLowerCase().includes('teleport') 
        || toolName.toLowerCase().includes('location'),
      parse: (_toolName: string, response: string) => this.parseTeleportResponse(response)
    });

    // Register beautiful places parser
    this.registerParser({
      canParse: (toolName: string) => toolName.toLowerCase().includes('places') 
        || toolName.toLowerCase().includes('beautiful'),
      parse: (_toolName: string, response: string) => this.parseBeautifulPlacesResponse(response)
    });

    // Register default fallback parser
    this.registerParser({
      canParse: () => true, // Always matches as last resort
      parse: (toolName: string, response: string) => ({
        toolName,
        rawResponse: response,
        parsedData: this.tryParseJson(response)
      })
    });
  }

  /**
   * Extract tool calls from an AI message
   * @param message The AI message
   * @returns Array of tool calls
   */
  public extractToolCalls(message: AIMessage): ToolCall[] {
    return message.toolCalls || [];
  }

  /**
   * Parse a tool response using the appropriate parser
   * @param toolName The name of the tool
   * @param response The raw response from the tool
   * @returns Parsed tool response
   */
  public parseToolResponse(toolName: string, response: string): ParsedToolResponse {
    // Find the first parser that can handle this tool
    const parser = this.toolParsers.find(p => p.canParse(toolName));
    
    if (parser) {
      return parser.parse(toolName, response);
    }
    
    // Fallback to basic JSON parsing
    return {
      toolName,
      rawResponse: response,
      parsedData: this.tryParseJson(response)
    };
  }

  /**
   * Try to parse JSON, return the original string if parsing fails
   * @param jsonString The JSON string to parse
   * @returns Parsed object or original string
   */
  private tryParseJson(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return jsonString;
    }
  }

  /**
   * Parse a teleport location response
   * @param response The raw response
   * @returns Parsed teleport response
   */
  private parseTeleportResponse(response: string): ParsedToolResponse {
    const parsedData = this.tryParseJson(response);
    let location: Location | null = null;

    // Try to extract location information
    if (typeof parsedData === 'object' && parsedData !== null) {
      // Check for specific teleport type from our backend
      if (parsedData.type === 'teleport' && parsedData.location) {
        const loc = parsedData.location;
        location = {
          name: loc.name || 'Location',
          description: loc.description || '',
          lat: loc.coordinates?.lat || 0,
          lng: loc.coordinates?.lng || 0,
          imageUrl: loc.imageUrl || ''
        };
      }
      // Handle older or alternate response formats
      else if (parsedData.coordinates || (parsedData.lat && parsedData.lng)) {
        location = {
          name: parsedData.name || parsedData.location || 'Location',
          description: parsedData.description || '',
          lat: parsedData.lat || (parsedData.coordinates?.lat) || 0,
          lng: parsedData.lng || (parsedData.coordinates?.lng) || 0,
          imageUrl: parsedData.imageUrl || parsedData.image || ''
        };
      }
      // Try to extract from success/action/location format
      else if (parsedData.success && parsedData.action === 'teleport' && parsedData.location) {
        const loc = parsedData.location;
        location = {
          name: loc.name || 'Location',
          description: loc.description || '',
          lat: loc.coordinates?.lat || 0,
          lng: loc.coordinates?.lng || 0,
          imageUrl: loc.imageUrl || ''
        };
      }
    }

    return {
      toolName: 'teleport',
      rawResponse: response,
      parsedData: location || parsedData
    };
  }

  /**
   * Parse a beautiful places response
   * @param response The raw response
   * @returns Parsed beautiful places response
   */
  private parseBeautifulPlacesResponse(response: string): ParsedToolResponse {
    const parsedData = this.tryParseJson(response);
    let locations: Location[] = [];

    // Try to extract locations
    if (Array.isArray(parsedData)) {
      locations = parsedData.map((item: any) => ({
        name: item.name || 'Location',
        description: item.description || '',
        lat: item.lat || (item.coordinates?.lat) || 0,
        lng: item.lng || (item.coordinates?.lng) || 0,
        imageUrl: item.imageUrl || item.image || ''
      }));
    } else if (parsedData.places && Array.isArray(parsedData.places)) {
      locations = parsedData.places.map((item: any) => ({
        name: item.name || 'Location',
        description: item.description || '',
        lat: item.lat || (item.coordinates?.lat) || 0,
        lng: item.lng || (item.coordinates?.lng) || 0,
        imageUrl: item.imageUrl || item.image || ''
      }));
    }

    return {
      toolName: 'beautifulPlaces',
      rawResponse: response,
      parsedData: locations.length > 0 ? locations : parsedData
    };
  }

  /**
   * Format an AI message for display
   * @param message The AI message
   * @returns Formatted message content
   */
  public formatAIMessage(message: AIMessage): string {
    // Simple text content formatting
    return message.content;
  }
} 