import { PlayerStore } from './stores/PlayerStore';
import { PitchController } from './PitchController';
import { ZoomController } from './ZoomController';
import { CameraController } from './CameraController';

export class InfoPanel {
  private container: HTMLElement;
  private fpsElement: HTMLElement;
  private coordinatesElement: HTMLElement;
  private mapPropertiesElement: HTMLElement;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private updateInterval: number = 500; // Update FPS every 500ms
  private lastFpsUpdateTime: number = 0;
  private isVisible: boolean = true; // Track panel visibility
  private currentCoords: { lng: number; lat: number } | null = null;
  private currentElevation: number | null = null;
  private currentCamera: { pitch: number; bearing: number; zoom: number } | null = null;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'info-panel';
    
    // Create header with title and close button
    const header = document.createElement('div');
    header.className = 'info-panel-header';
    
    // Create title
    const title = document.createElement('div');
    title.className = 'info-panel-title';
    title.textContent = 'Debug Information';
    header.appendChild(title);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'info-panel-close';
    closeButton.textContent = '✕';
    closeButton.setAttribute('aria-label', 'Close debug panel');
    closeButton.addEventListener('click', () => this.hide());
    header.appendChild(closeButton);
    
    this.container.appendChild(header);
    
    // Create FPS display
    this.fpsElement = document.createElement('div');
    this.fpsElement.className = 'info-panel-item';
    this.fpsElement.textContent = 'FPS: --';
    this.container.appendChild(this.fpsElement);
    
    // Create coordinates container
    const coordsContainer = document.createElement('div');
    coordsContainer.className = 'info-panel-item coordinates-container';
    
    // Create coordinates display
    this.coordinatesElement = document.createElement('div');
    this.coordinatesElement.innerHTML = '<strong>Position:</strong><br>Lng: --<br>Lat: --';
    coordsContainer.appendChild(this.coordinatesElement);
    
    // Create copy coordinates button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-coords-button';
    copyButton.innerHTML = '📋';
    copyButton.title = 'Copy coordinates in checkpoint format';
    copyButton.addEventListener('click', () => this.copyCoordinates());
    coordsContainer.appendChild(copyButton);
    
    this.container.appendChild(coordsContainer);
    
    // Create map properties display
    this.mapPropertiesElement = document.createElement('div');
    this.mapPropertiesElement.className = 'info-panel-item';
    this.mapPropertiesElement.innerHTML = '<strong>Map Properties:</strong><br>Zoom: --<br>Pitch: --°<br>Bearing: --°';
    this.container.appendChild(this.mapPropertiesElement);
    
    // Add styles for close button and copy button
    this.addStyles();
    
    // Add to document
    document.body.appendChild(this.container);
    
    // Start FPS counter
    this.startFpsCounter();

    // Start interval to update all information
    setInterval(() => {
      if (!this.isVisible) return;

      // Get current coordinates from PlayerStore
      const coordinates = PlayerStore.getCoordinates();
      if (coordinates) {
        const [lng, lat, elevation] = coordinates;
        this.updateCoordinates(lng, lat);
        this.updateElevation(elevation);
      }

      // Get camera information from controllers
      const pitch = PitchController.getPitch();
      const zoom = ZoomController.getZoom();
      const bearing = CameraController.getBearing();
      this.updateCamera(pitch, bearing, zoom);
    }, 500);
  }
  
  /**
   * Add styles for the panel and close button
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .info-panel {
        background-color: rgba(0, 40, 80, 0.8);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        position: absolute;
        top: 140px;
        left: 100%;
        transform: translateX(-100%);
        z-index: 10;
        max-width: 200px;
        backdrop-filter: blur(4px);
        height: 200px;
      }
      
      .info-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .info-panel-title {
        font-weight: bold;
        margin-bottom: 0;
      }
      
      .info-panel-close {
        background: none;
        border: none;
        color: #555;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 4px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        transition: all 0.2s;
      }
      
      .info-panel-close:hover {
        background-color: rgba(0, 0, 0, 0.1);
        color: #000;
      }
      
      .info-panel-item {
        margin-bottom: 8px;
      }
      
      .info-panel-item:last-child {
        margin-bottom: 0;
      }
      
      .coordinates-container {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      
      .copy-coords-button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .copy-coords-button:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
      

        .info-panel {
          background-color: rgba(40, 40, 40, 0.9);
          color: #eee;
        }
        
        .info-panel-close {
          color: #aaa;
        }
        
        .info-panel-close:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .copy-coords-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Start FPS counter
   */
  private startFpsCounter(): void {
    const countFrame = (time: number) => {
      // Only count frames and update if panel is visible
      if (this.isVisible) {
        // Count frames
        this.frameCount++;
        
        // Update FPS every interval
        if (time - this.lastFpsUpdateTime >= this.updateInterval) {
          this.fps = Math.round((this.frameCount * 1000) / (time - this.lastFpsUpdateTime));
          this.lastFpsUpdateTime = time;
          this.frameCount = 0;
          this.updateFpsDisplay();
        }
      } else {
        // Reset counters when hidden to avoid inaccurate FPS when shown again
        this.lastFpsUpdateTime = time;
        this.frameCount = 0;
      }
      
      // Request next frame
      requestAnimationFrame(countFrame);
    };
    
    // Start counting
    this.lastFpsUpdateTime = performance.now();
    requestAnimationFrame(countFrame);
  }
  
  /**
   * Update FPS display
   */
  private updateFpsDisplay(): void {
    if (this.isVisible) {
      this.fpsElement.textContent = `FPS: ${this.fps}`;
    }
  }
  
  /**
   * Update coordinates display
   */
  public updateCoordinates(lng: number, lat: number): void {
    if (!this.isVisible) return;
    
    this.currentCoords = { lng, lat };
    
    this.coordinatesElement.innerHTML = `
      <strong>Position:</strong><br>
      Lng: ${lng.toFixed(6)}<br>
      Lat: ${lat.toFixed(6)}<br>
      Elevation: ${this.currentElevation?.toFixed(2) || '--'} m
    `;
  }
  
  /**
   * Update map properties display
   */
  public updateMapProperties(zoom: number, pitch: number, bearing: number): void {
    if (!this.isVisible) return;
    
    this.mapPropertiesElement.innerHTML = `
      <strong>Map Properties:</strong><br>
      Zoom: ${zoom.toFixed(2)}<br>
      Pitch: ${pitch.toFixed(1)}°<br>
      Bearing: ${bearing.toFixed(1)}°
    `;
  }
  
  /**
   * Show the info panel
   */
  public show(): void {
    this.container.style.display = 'block';
    this.isVisible = true;
    
    // Reset FPS counter when showing
    this.lastFpsUpdateTime = performance.now();
    this.frameCount = 0;
  }
  
  /**
   * Hide the info panel
   */
  public hide(): void {
    this.container.style.display = 'none';
    this.isVisible = false;
  }
  
  /**
   * Toggle the info panel
   */
  public toggle(): void {
    if (this.container.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  public updateElevation(elevation: number): void {
    if (!this.isVisible) return;
    this.currentElevation = elevation;
    this.updateCoordinates(this.currentCoords?.lng || 0, this.currentCoords?.lat || 0);
  }

  public updateCamera(pitch: number, bearing: number, zoom: number): void {
    if (!this.isVisible) return;
    this.currentCamera = { pitch, bearing, zoom };
    this.updateMapProperties(zoom, pitch, bearing);
  }

  private copyCoordinates(): void {
    if (!this.currentCoords) return;
    
    const { lng, lat } = this.currentCoords;
    const elevation = this.currentElevation;
    const camera = this.currentCamera;
    
    // Ask user if this is a start position
    const isStartPosition = confirm('Is this a start position? Click OK if yes, Cancel if this is a checkpoint.');
    
    let coordString;
    if (isStartPosition) {
      coordString = `    startPosition: [${lng.toFixed(4)}, ${lat.toFixed(4)}], // Apple Park Visitor Center
    startCamera: {
      pitch: ${camera?.pitch.toFixed(0) || 60},
      bearing: ${camera?.bearing.toFixed(0) || 45},
      zoom: ${camera?.zoom.toFixed(0) || 18}
    },`;
    } else {
      coordString = `        coordinates: [${lng.toFixed(4)}, ${lat.toFixed(4)}],
        elevation: ${elevation?.toFixed(0) || 0},`;
    }
    
    navigator.clipboard.writeText(coordString).then(() => {
      // Show feedback
      const copyButton = this.container.querySelector('.copy-coords-button');
      if (copyButton) {
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '✅';
        setTimeout(() => {
          copyButton.innerHTML = originalText;
        }, 1000);
      }
    }).catch(err => {
      console.error('Failed to copy coordinates:', err);
    });
  }
} 