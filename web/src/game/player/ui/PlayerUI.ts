import { IFollowable } from '../../types/IFollowable';

export class PlayerUI {
    private messageElement: HTMLDivElement | null = null;
    private messageTimeout: number | null = null;
    private animationFrameId: number | null = null;

    constructor(
        private map: mapboxgl.Map,
        private player: IFollowable
    ) {
        this.createMessageElement();
    }

    private createMessageElement(): void {
        this.messageElement = document.createElement('div');
        this.messageElement.className = 'player-message-bubble';
        this.messageElement.style.position = 'fixed';
        this.messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.messageElement.style.color = 'white';
        this.messageElement.style.padding = '6px 10px';
        this.messageElement.style.borderRadius = '12px';
        this.messageElement.style.maxWidth = '200px';
        this.messageElement.style.wordBreak = 'break-word';
        this.messageElement.style.textAlign = 'center';
        this.messageElement.style.fontSize = '12px';
        this.messageElement.style.whiteSpace = 'normal';
        this.messageElement.style.pointerEvents = 'none';
        this.messageElement.style.display = 'none';
        this.messageElement.style.zIndex = '1000';
        this.messageElement.style.opacity = '0';
        this.messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        this.messageElement.style.left = '50%';

        document.body.appendChild(this.messageElement);
    }

    public showMessage(message: string, duration: number = 5000): void {
        if (!this.messageElement) return;

        // Clear any existing timeout
        if (this.messageTimeout !== null) {
            window.clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }

        // Clear any existing animation frame
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Set message content
        this.messageElement.textContent = message;
        this.messageElement.style.display = 'block';

        // Add a slight upward animation when appearing
        this.messageElement.style.transform += ' translateY(10px)';
        
        // Force a reflow
        this.messageElement.offsetHeight;

        // Start position update loop
        const updateMessageLoop = () => {
            if (this.messageElement && this.messageElement.style.display !== 'none') {
                this.updateMessagePosition();
                this.animationFrameId = requestAnimationFrame(updateMessageLoop);
            }
        };
        this.animationFrameId = requestAnimationFrame(updateMessageLoop);

        // Fade in and float up
        setTimeout(() => {
            if (this.messageElement) {
                this.messageElement.style.opacity = '1';
                this.messageElement.style.transform = this.messageElement.style.transform.replace('translateY(10px)', 'translateY(0)');
            }
        }, 10);

        // Set timeout to hide
        this.messageTimeout = window.setTimeout(() => {
            if (this.messageElement) {
                this.messageElement.style.opacity = '0';
                setTimeout(() => {
                    if (this.messageElement) {
                        this.messageElement.style.display = 'none';
                    }
                    if (this.animationFrameId !== null) {
                        cancelAnimationFrame(this.animationFrameId);
                        this.animationFrameId = null;
                    }
                }, 300);
            }
            this.messageTimeout = null;
        }, duration);
    }

    private updateMessagePosition(): void {
        if (!this.messageElement) return;

        const position = {
            lng: this.player.coordinates[0],
            lat: this.player.coordinates[1],
            altitude: (this.player.elevation || 0) + 5
        };

        const screenCoords = this.map.project([position.lng, position.lat]);

        // Increased height to -150px and slightly larger floating effect
        const floatingOffset = Math.sin(Date.now() / 1000) * 8; // Increased floating range
        this.messageElement.style.transform = `
            translate(-50%, 0) 
            translate(0, ${screenCoords.y - 150 + floatingOffset}px)
        `;
        this.messageElement.style.top = '0';
        this.messageElement.style.left = `${screenCoords.x}px`;
    }

    public destroy(): void {
        if (this.messageTimeout !== null) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.messageElement) {
            document.body.removeChild(this.messageElement);
            this.messageElement = null;
        }
    }
} 