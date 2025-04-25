import { LoginResponse, RequestOtpResponse } from '../../auth/types';

export class AuthClient {
  private baseUrl = '/api/auth';
  private readonly AUTH_EMAIL_STORAGE = 'auth_email';

  async requestOtp(email: string): Promise<RequestOtpResponse> {
    const request = { email };
    const response = await fetch(`${this.baseUrl}/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to request OTP: ${response.statusText}`);
    }

    const otpResponse = await response.json();
    localStorage.setItem(this.AUTH_EMAIL_STORAGE, email);
    return otpResponse;
  }

  async verifyOtp(otpCode: string): Promise<LoginResponse> {
    const email = localStorage.getItem(this.AUTH_EMAIL_STORAGE);
    if (!email) {
      throw new Error('No email found. Please request an OTP first.');
    }

    const request = { email, otpCode };
    const response = await fetch(`${this.baseUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to verify OTP: ${response.statusText}`);
    }

    const loginResponse = await response.json();
    localStorage.removeItem(this.AUTH_EMAIL_STORAGE);
    return loginResponse;
  }

  async checkAuthentication(): Promise<LoginResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/check`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return null;
    }
  }
}

// Create a singleton instance
export const authClient = new AuthClient();
