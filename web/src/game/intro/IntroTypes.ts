import { LoginResponse } from "../realtime/types/Auth";

export interface Destination {
  name: string;
  coordinates: [number, number];
  description: string;
  icon: string;
}

export interface IntroOptions {
  onStartGame: (coords: [number, number]) => void;
  onVehicleSelect?: (vehicleType: 'car' | 'dinosaur') => void;
  onRequestOtp?: (email: string) => Promise<RequestOtpResponse>;
  onVerifyOtp?: (email: string, otpCode: string) => Promise<LoginResponse | null>;
  onSetName?: (name: string) => void;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  isExistingUser: boolean;
  expiresAt?: string;
} 