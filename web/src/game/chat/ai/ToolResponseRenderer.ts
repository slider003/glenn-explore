import { TeleportOptions } from '../../../types/teleport';
import { Location, ParsedToolResponse } from './AIMessageTypes';

/**
 * Renders interactive UI components for tool responses
 */
export class ToolResponseRenderer {
  private teleportCallback: (teleportOptions: TeleportOptions, name: string) => void = () => {};

  /**
   * Set callback for teleport actions
   */
  public setTeleportCallback(callback: (teleportOptions: TeleportOptions, name: string) => void): ToolResponseRenderer {
    this.teleportCallback = callback;
    return this;
  }

  /**
   * Render appropriate UI for a tool response
   * @param toolResponse The parsed tool response
   * @returns HTML element containing the rendered response
   */
  public renderToolResponse(toolResponse: ParsedToolResponse): HTMLElement {
    const container = document.createElement('div');
    container.className = 'ai-tool-response';
    
    // // Create a more compact header that shows only essential info
    // const toolHeader = document.createElement('div');
    // toolHeader.className = 'ai-tool-header';
    
    // // For location/teleport tools, use a special header
    // if (toolResponse.toolName.toLowerCase().includes('location') || 
    //     toolResponse.toolName.toLowerCase().includes('teleport')) {
    //   toolHeader.innerHTML = '<span class="ai-tool-icon">📍</span> Location';
    // } else if (toolResponse.toolName.toLowerCase().includes('places')) {
    //   toolHeader.innerHTML = '<span class="ai-tool-icon">🗺️</span> Places';
    // } else {
    //   // For other tools, just show the formatted name
    //   toolHeader.textContent = this.formatToolName(toolResponse.toolName);
    // }
    
    // container.appendChild(toolHeader);

    // Render based on tool type
    if (toolResponse.toolName.toLowerCase().includes('location') || 
        toolResponse.toolName.toLowerCase().includes('teleport')) {
      this.renderTeleportResponse(container, toolResponse);
    } else if (toolResponse.toolName.toLowerCase().includes('places')) {
      this.renderPlacesResponse(container, toolResponse);
    } else {
      // Generic rendering for unknown tool types
      this.renderGenericResponse(container, toolResponse);
    }

    return container;
  }

  /**
   * Format tool name for display
   */
  private formatToolName(toolName: string): string {
    // Remove underscores, capitalize words
    return toolName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/[_-]/g, ' ')      // Replace underscores and hyphens with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /**
   * Render a teleport location response
   */
  private renderTeleportResponse(container: HTMLElement, response: ParsedToolResponse): void {
    // For teleport responses we expect a location object
    const data = response.parsedData;
    
    if (!data || typeof data !== 'object') {
      this.renderErrorState(container, 'Invalid location data');
      return;
    }

    // Try to extract location information
    const location: Location = data as Location;
    
    if (!location.lat || !location.lng) {
      this.renderErrorState(container, 'Missing coordinates for teleport');
      return;
    }

    // Create location card
    const card = this.createLocationCard(location);
    container.appendChild(card);
  }

  /**
   * Render a places list response
   */
  private renderPlacesResponse(container: HTMLElement, response: ParsedToolResponse): void {
    const data = response.parsedData;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      this.renderErrorState(container, 'No places found');
      return;
    }

    // Create places list in a more compact format
    const placesContainer = document.createElement('div');
    placesContainer.className = 'ai-places-container';
    
    // Add a more compact header
    const header = document.createElement('div');
    header.className = 'ai-places-header';
    header.textContent = `${data.length} location${data.length > 1 ? 's' : ''} found`;
    placesContainer.appendChild(header);

    // Add each place as a card with the compact format
    data.forEach((place: Location) => {
      const card = this.createLocationCard(place);
      placesContainer.appendChild(card);
    });

    container.appendChild(placesContainer);
  }

  /**
   * Create a location card with teleport button
   */
  private createLocationCard(location: Location): HTMLElement {
    const card = document.createElement('div');
    card.className = 'ai-location-card';

    // Create a more compact structure
    const topRow = document.createElement('div');
    topRow.className = 'ai-location-top-row';
    
    // Add location name
    const name = document.createElement('div');
    name.className = 'ai-location-name';
    name.textContent = location.name;
    topRow.appendChild(name);
    
    // Add teleport button directly in the top row
    const teleportButton = document.createElement('button');
    teleportButton.className = 'ai-teleport-button';
    teleportButton.textContent = 'Teleport';
    teleportButton.title = `Teleport to ${location.name}`;
    teleportButton.addEventListener('click', () => {
      this.teleportCallback({
        position: {
          lng: location.lng,
          lat: location.lat
        },
      }, location.name);
    });
    topRow.appendChild(teleportButton);
    
    card.appendChild(topRow);

    // // Add description if available
    // if (location.description) {
    //   const description = document.createElement('div');
    //   description.className = 'ai-location-description';
    //   description.textContent = location.description;
    //   card.appendChild(description);
    // }

    // Don't show coordinates on the UI
    // Instead, store them as data attributes
    card.dataset.lat = location.lat.toString();
    card.dataset.lng = location.lng.toString();

    // Add image if available
    if (location.imageUrl) {
      const image = document.createElement('img');
      image.className = 'ai-location-image';
      image.src = location.imageUrl;
      image.alt = location.name;
      card.appendChild(image);
    }

    return card;
  }

  /**
   * Render a generic response for unknown tool types
   */
  private renderGenericResponse(container: HTMLElement, response: ParsedToolResponse): void {
    const content = document.createElement('div');
    content.className = 'ai-tool-content';
    
    // Try to render as JSON with formatting
    try {
      if (typeof response.parsedData === 'object') {
        // Pretty-print JSON
        const pre = document.createElement('pre');
        pre.className = 'ai-json-response';
        pre.textContent = JSON.stringify(response.parsedData, null, 2);
        content.appendChild(pre);
      } else {
        // Plain text response
        content.textContent = response.rawResponse;
      }
    } catch (e) {
      // If JSON rendering fails, fall back to raw response
      content.textContent = response.rawResponse;
    }
    
    container.appendChild(content);
  }

  /**
   * Render an error state
   */
  private renderErrorState(container: HTMLElement, message: string): void {
    const error = document.createElement('div');
    error.className = 'ai-tool-error';
    error.textContent = message;
    container.appendChild(error);
  }
} 