export interface CreateGuestRequest {
  guestId: string;
  guestKey?: string;
}

export interface RequestOtpRequest {
  email: string;
  guestId?: string;
  guestKey?: string;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  isExistingUser: boolean;
  expiresAt?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
  isLowPerformanceDevice: boolean;
}

export interface LoginResponse {
  playerId: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  isGuest: boolean;
  hasPaid: boolean;
  lastPosition?: LastPosition;
  guestKey?: string;
}

export interface LastPosition {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
} 