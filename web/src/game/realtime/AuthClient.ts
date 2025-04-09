import { PlayerStore } from '../stores/PlayerStore';
import { CreateGuestRequest, LoginResponse, RequestOtpRequest, RequestOtpResponse, VerifyOtpRequest } from './types/Auth';

export class AuthClient {
  private baseUrl: string;
  private readonly GUEST_KEY_STORAGE = 'glenn_guest_key';
  private readonly GUEST_ID_STORAGE = 'playerId';
  private readonly AUTH_EMAIL_STORAGE = 'auth_email';

  constructor() {
    this.baseUrl = `/api/auth`;
  }

  /**
   * Request a one-time password to be sent to the provided email
   */
  public async requestOtp(email: string): Promise<RequestOtpResponse> {
    // Include guest credentials if available for migration
    const guestId = localStorage.getItem(this.GUEST_ID_STORAGE);
    const guestKey = localStorage.getItem(this.GUEST_KEY_STORAGE);

    const request: RequestOtpRequest = {
      email,
      guestId: guestId || undefined,
      guestKey: guestKey || undefined
    };

    const response = await fetch(`${this.baseUrl}/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to request OTP: ${response.statusText}`);
    }

    const otpResponse: RequestOtpResponse = await response.json();

    // Save email for later verification
    localStorage.setItem(this.AUTH_EMAIL_STORAGE, email);

    return otpResponse;
  }

  /**
   * Verify a one-time password
   */
  public async verifyOtp(otpCode: string): Promise<LoginResponse> {
    // Get the email from storage
    const email = localStorage.getItem(this.AUTH_EMAIL_STORAGE);
    if (!email) {
      throw new Error('No email found. Please request an OTP first.');
    }

    const request: VerifyOtpRequest = {
      email,
      otpCode
    };

    const response = await fetch(`${this.baseUrl}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to verify OTP: ${response.statusText}`);
    }

    const loginResponse: LoginResponse = await response.json();

    // If successful, clean up storage
    localStorage.removeItem(this.AUTH_EMAIL_STORAGE);

    // If this was a guest account that's now been upgraded,
    // we can clear the guest credentials
    if (!loginResponse.isGuest) {
      this.clearGuestKey();
    }

    PlayerStore.setPlayerId(loginResponse.playerId);
    PlayerStore.setPlayerName(loginResponse.username);
    if (loginResponse.lastPosition) {
      PlayerStore.setCoordinates([loginResponse.lastPosition.x, loginResponse.lastPosition.y, loginResponse.lastPosition.z]);
    }
    return loginResponse;
  }

  /**
   * Create a guest user and get authentication cookie
   * @deprecated Use email authentication instead
   */
  // public async createGuestUser(guestId: string): Promise<LoginResponse> {
  //   // Try to get existing guest key
  //   const existingGuestKey = localStorage.getItem(this.GUEST_KEY_STORAGE);

  //   const request: CreateGuestRequest = { 
  //     guestId,
  //     guestKey: existingGuestKey || undefined
  //   };

  //   const response = await fetch(`${this.baseUrl}/guest`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(request),
  //     credentials: 'include', // Important: This is needed to include cookies
  //   });

  //   if (!response.ok) {
  //     // If unauthorized and we had a key, clear it as it might be invalid
  //     if (response.status === 401) {
  //       localStorage.removeItem(this.GUEST_KEY_STORAGE);
  //       localStorage.removeItem(this.GUEST_ID_STORAGE);
  //       window.location.reload()
  //     }
  //     throw new Error(`Failed to create guest user: ${response.statusText}`);
  //   }

  //   const loginResponse: LoginResponse = await response.json();

  //   // If we got a new guest key, save it
  //   if (loginResponse.guestKey) {
  //     localStorage.setItem(this.GUEST_KEY_STORAGE, loginResponse.guestKey);
  //   }

  //   return loginResponse;
  // }

  /**
   * Clear guest key from storage (useful for logout)
   */
  public clearGuestKey(): void {
    localStorage.removeItem(this.GUEST_KEY_STORAGE);
    localStorage.removeItem(this.GUEST_ID_STORAGE);
  }

  /**
   * Check if we have a guest key stored
   */
  public hasGuestKey(): boolean {
    return !!localStorage.getItem(this.GUEST_KEY_STORAGE);
  }

  /**
   * Check if the user is already authenticated
   * @returns LoginResponse if authenticated, null otherwise
   */
  public async checkAuthentication(): Promise<LoginResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: This is needed to include cookies
      });

      if (!response.ok) {
        return null; // Not authenticated
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return null;
    }
  }
}