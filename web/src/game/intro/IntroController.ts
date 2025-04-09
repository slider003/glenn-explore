import { PlayerStore } from '../stores/PlayerStore';
import { AuthClient } from '../realtime/AuthClient';
import { IntroOptions } from './IntroTypes';
import { IntroUI } from './IntroUI';

export class IntroController {
  private introUI: IntroUI;
  private authClient: AuthClient;
  private playerIdKey = 'playerId';
  private introViewedKey = 'introViewed';
  private selectedVehicle: 'car' | 'dinosaur' = 'car';

  constructor(authClient: AuthClient, private onNameChange?: (name: string) => void) {
    this.introUI = new IntroUI();
    this.authClient = authClient;
  }

  /**
   * Show the intro UI with authentication requirements
   */
  public async showIntro(onComplete: (coords: [number, number]) => void): Promise<void> {
    const options: IntroOptions = {
      onStartGame: onComplete,
      onVehicleSelect: (vehicleType) => {
        this.selectedVehicle = vehicleType;
        PlayerStore.setMovementMode(vehicleType === 'car' ? 'car' : 'walking');
      },
      onRequestOtp: async (email) => {
        try {
          return await this.authClient.requestOtp(email);
        } catch (error) {
          console.error('Failed to request OTP:', error);
          throw error;
        }
      },
      onVerifyOtp: async (_email, otpCode) => {
        try {
          const response = await this.authClient.verifyOtp(otpCode);
          
          // Update player store with data from login response
          PlayerStore.setPlayerName(response.username);
          PlayerStore.setIsGuest(response.isGuest);
          
          // Store player ID for future sessions
          localStorage.setItem(this.playerIdKey, response.username);
          
          // Mark intro as viewed
          this.markIntroAsViewed();
          
          return response
        } catch (error) {
          console.error('Failed to verify OTP:', error);
          return null;
        }
      },
      onSetName: (name) => {
        if (this.onNameChange) {
          this.onNameChange(name);
        }
      }
    };

    this.introUI.show(options);
  }

  /**
   * Mark the intro as viewed in local storage
   */
  private markIntroAsViewed(): void {
    localStorage.setItem(this.introViewedKey, 'true');
  }

  /**
   * Check if the intro has been viewed
   */
  public hasViewedIntro(): boolean {
    return localStorage.getItem(this.introViewedKey) === 'true';
  }
} 