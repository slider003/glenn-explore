import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { authClient } from '../services/auth-client';
import { useAuth } from '../hooks/use-auth';
import type { LoginFormState } from '../types';
import { toast } from '@/shared/components/ui/use-toast';

export const LoginForm = () => {
  const { login } = useAuth();
  const [formState, setFormState] = useState<LoginFormState>({
    step: 'email',
    email: '',
    otpCode: '',
    isLoading: false,
    error: undefined,
  });

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      await authClient.requestOtp(formState.email);
      setFormState(prev => ({ ...prev, step: 'otp', isLoading: false }));
      toast({
        title: 'OTP sent',
        description: 'Please check your email for the verification code',
      });
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to send verification code. Please try again.',
      }));
    }
  };

  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const loginResponse = await authClient.verifyOtp(formState.otpCode);
      login(loginResponse);
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid verification code. Please try again.',
      }));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value, error: undefined }));
  };

  if (formState.step === 'otp') {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="relative">
            <Input
              name="otpCode"
              type="text"
              placeholder="Enter verification code"
              value={formState.otpCode}
              onChange={handleChange}
              className={cn(
                "h-11 transition-all duration-200 bg-white/50 hover:bg-white focus:bg-white text-center text-lg tracking-widest",
                formState.error && "ring-rose-100 border-rose-200 focus:ring-rose-100 focus:border-rose-200"
              )}
              required
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>
        </div>

        {formState.error && (
          <div className="flex items-center gap-2 text-sm text-rose-500/80 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-4 w-4" />
            <span>{formState.error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Button 
            type="submit" 
            disabled={formState.isLoading}
            className="w-full h-11 transition-all duration-200"
          >
            {formState.isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify'
            )}
          </Button>

          <Button 
            type="button" 
            variant="ghost"
            disabled={formState.isLoading}
            onClick={() => setFormState(prev => ({ ...prev, step: 'email', otpCode: '' }))}
            className="w-full h-11 transition-all duration-200"
          >
            Use different email
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="relative">
          <Mail className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
            formState.error ? "text-rose-300" : "text-gray-500"
          )} />
          <Input
            name="email"
            type="email"
            placeholder="Email address"
            value={formState.email}
            onChange={handleChange}
            className={cn(
              "pl-10 h-11 transition-all duration-200 bg-white/50 hover:bg-white focus:bg-white",
              formState.error && "ring-rose-100 border-rose-200 focus:ring-rose-100 focus:border-rose-200"
            )}
            required
          />
        </div>
      </div>

      {formState.error && (
        <div className="flex items-center gap-2 text-sm text-rose-500/80 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-4 w-4" />
          <span>{formState.error}</span>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={formState.isLoading}
        className="w-full h-11 transition-all duration-200"
      >
        {formState.isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending code...</span>
          </div>
        ) : (
          'Continue'
        )}
      </Button>
    </form>
  );
};