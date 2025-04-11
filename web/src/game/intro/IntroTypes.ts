import { LoginResponse } from "../realtime/types/Auth";

export interface Destination {
  name: string;
  coordinates: [number, number];
  description: string;
  icon: string;
}

export interface IntroOptions {
  onStartGame: (coords: [number, number]) => void;
  onVehicleSelect: (vehicleType: 'car' | 'dinosaur') => void;
  onRequestOtp: (email: string) => Promise<RequestOtpResponse>;
  onVerifyOtp: (email: string, otpCode: string) => Promise<LoginResponse | null>;
  onSetName: (name: string) => void;
  onInitiatePayment: () => Promise<{ success: boolean }>;
  isAuthenticated: boolean;
  hasPaid: boolean;
  email?: string;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  isExistingUser: boolean;
  expiresAt?: string;
}

export type IntroStep = 'login' | 'payment' | 'instructions';

export interface LoginState {
  email: string;
  isVerified: boolean;
  otpSent: boolean;
  isLoading: boolean;
}

export interface PaymentState {
  isProcessing: boolean;
  error?: string;
}

export interface InstructionsState {
  playerName: string;
  selectedVehicle: 'car' | 'dinosaur';
} 