export interface LoginResponse {
  username: string;
  isGuest: boolean;
  isAdmin: boolean;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
}

export interface LoginFormState {
  step: 'email' | 'otp';
  email: string;
  otpCode: string;
  isLoading: boolean;
  error?: string;
}
