import { DEFAULT_COORDINATES } from '../../config';
import { PlayerStore } from '../stores/PlayerStore';
import { IntroOptions } from './IntroTypes';
import './intro.css';

export class IntroUI {
  private element: HTMLElement | null = null;
  private options: IntroOptions | null = null;
  private selectedVehicle: 'car' | 'dinosaur' = 'car';
  private authState: 'EMAIL_INPUT' | 'OTP_VERIFICATION' | 'GAME_INTRO' = 'EMAIL_INPUT';
  private email: string = '';
  private playerName: string = '';

  private renderEmailSection() {
    return `
      <div class="email-section">
        <h2 class="welcome-message">Login with your email</h2>
        <p class="auth-explanation">
          To play Glenn Explore and save your progress, we need your email. 
          This helps us keep track of your achievements, lap times, and stats.
          A one-time password will be sent to your email.
        </p>
        <p class="consent-message">
          By providing your email, you agree to receive occasional updates about game features and improvements. 
          You can easily unsubscribe via the link in any email you receive from us.
        </p>
        <div class="email-input-container">
          <input type="email" class="email-input" placeholder="Enter your email" value="${this.email}">
        </div>
      </div>
    `;
  }

  private renderOtpSection() {
    return `
      <div class="otp-section">
        <h2 class="welcome-message">Verify your email</h2>
        <p class="otp-message">A verification code was sent to ${this.email}</p>
        <div class="otp-input-container">
          <input type="text" class="otp-input" placeholder="Enter verification code" maxlength="6">
        </div>
        <button class="try-again-btn">Try different email</button>
      </div>
    `;
  }

  private renderVehicleToggle() {
    return `
      <div class="vehicle-selection">
        <div class="name-input-section">
          <p class="name-message">You can set a name if you want! 😊</p>
          <input type="text" class="name-input" placeholder="Enter your name" value="${this.playerName}" maxlength="20">
          <div class="name-validation-message">Name must be 2-20 characters and only contain letters, numbers, hyphens, and underscores</div>
        </div>
      </div>
    `;
  }

  private renderInstructions() {
    const isMobile = window.isSmallScreen;

    return `
      <div class="game-instructions">
        ${isMobile ? `
          <div class="instruction-list">
            <div class="instruction-item">
              <span>👆</span>
              <span>Left thumb: steer</span>
            </div>
            <div class="instruction-item">
              <span>👆</span>
              <span>Right thumb: accelerate</span>
            </div>
            <div class="instruction-item">
              <span>⚙️</span>
              <span>Control the camera by clicking settings button</span>
            </div>
          </div>
        ` : `
          <div class="instruction-list">
            <div class="instruction-item">
              <div class="key-group">
                <span class="instruction-key">W</span>
                <div class="key-row">
                  <span class="instruction-key">A</span>
                  <span class="instruction-key">S</span>
                  <span class="instruction-key">D</span>
                </div>
              </div>
              <span>Drive & steer your ride</span>
            </div>

            <div class="instruction-item">
              <span class="instruction-key">SHIFT</span>
              <span>🚀 Boost your velocity</span>
            </div>

            <div class="instruction-item camera-controls">
              <div class="key-group">
                <span class="instruction-key">⬆️</span>
                <div class="key-row">
                  <span class="instruction-key">⬅️</span>
                  <span class="instruction-key">⬇️</span>
                  <span class="instruction-key">➡️</span>
                </div>
              </div>
              <span>🎥 Control the camera view</span>
            </div>
          </div>
        `}
      </div>
    `;
  }

  public show(options: IntroOptions) {
    this.options = options;
    this.element = document.createElement('div');
    this.element.className = 'intro-overlay';

    this.renderIntroDialog();

    document.body.appendChild(this.element);
    requestAnimationFrame(() => {
      if (this.element) {
        this.element.classList.add('fade-in');
      }
    });

    this.addEventListeners();
  }

  private renderIntroDialog() {
    if (!this.element) return;

    this.element.innerHTML = `
      <div class="intro-dialog">
        <h1 class="intro-title">Welcome to Glenn Explore! 🌍</h1>
        ${this.authState === 'GAME_INTRO' ? `
          <p class="welcome-verified">
            You're all set! Welcome ${this.email.split('@')[0]}!
          </p>
        ` : ''}
        <div class="intro-content">
          ${this.authState === 'GAME_INTRO' ? this.renderVehicleToggle() : ''}
          ${this.authState === 'GAME_INTRO' ? this.renderInstructions() : ''}
          ${this.authState === 'EMAIL_INPUT' || this.authState === 'OTP_VERIFICATION'
        ? this.authState === 'EMAIL_INPUT' ? this.renderEmailSection() : this.renderOtpSection()
        : ''}
        </div>
        <button class="start-game-btn" ${this.authState === 'EMAIL_INPUT' ? 'disabled' : ''}>
          ${this.authState === 'EMAIL_INPUT'
        ? 'Send Verification Code'
        : this.authState === 'OTP_VERIFICATION'
          ? 'Verify & Start'
          : 'I Get It, Let Me Play!'}
        </button>
      </div>
    `;
  }

  private addEventListeners() {
    if (!this.element) return;

    // Email validation
    const emailInput = this.element.querySelector('.email-input') as HTMLInputElement;
    const startButton = this.element.querySelector('.start-game-btn') as HTMLButtonElement;

    if (emailInput && startButton) {
      emailInput.addEventListener('input', () => {
        const isValid = this.validateEmail(emailInput.value);
        startButton.disabled = !isValid;
        this.email = emailInput.value;
      });
    }

    // Vehicle selection
    const vehicleOptions = this.element.querySelectorAll('.toggle-option');
    vehicleOptions.forEach(option => {
      option.addEventListener('click', () => {
        const vehicleEl = option as HTMLElement;
        const vehicleType = vehicleEl.dataset.vehicle as 'car' | 'dinosaur';
        this.selectedVehicle = vehicleType;

        // Update UI
        vehicleOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        if (this.options?.onVehicleSelect) {
          this.options.onVehicleSelect(vehicleType);
        }
      });
    });

    // Add name input listener with validation
    const nameInput = this.element.querySelector('.name-input') as HTMLInputElement;
    const nameValidationMessage = this.element.querySelector('.name-validation-message') as HTMLElement;
    
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        const name = nameInput.value.trim();
        this.playerName = name;

        if (!name) {
          // Reset validation state if empty
          nameInput.classList.remove('invalid');
          nameValidationMessage?.classList.remove('visible');
          return;
        }

        const isValid = this.validateName(name);
        nameInput.classList.toggle('invalid', !isValid);
        nameValidationMessage?.classList.toggle('visible', !isValid);
      });
    }

    // Start button handler
    if (startButton) {
      startButton.addEventListener('click', async () => {
        if (this.authState === 'EMAIL_INPUT') {
          // Request OTP
          startButton.disabled = true;
          startButton.textContent = 'Sending...';

          try {
            if (this.options?.onRequestOtp) {
              const response = await this.options.onRequestOtp(this.email);
              if (response.success) {
                this.authState = 'OTP_VERIFICATION';
                this.renderIntroDialog();
                this.addEventListeners(); // Re-add listeners after re-rendering
              } else {
                throw new Error(response.message);
              }
            }
          } catch (error) {
            console.error('Failed to send OTP:', error);
            startButton.disabled = false;
            startButton.textContent = 'Send Verification Code';

            // Show error message
            const emailSection = this.element!.querySelector('.email-section');
            if (emailSection && this.element) {
              const errorElement = this.element.querySelector('.error-message');
              if (errorElement) {
                errorElement.textContent = 'Failed to send verification code. Please try again.';
              } else {
                emailSection.innerHTML += `<p class="error-message">Failed to send verification code. Please try again.</p>`;
              }
            }
          }
        } else if (this.authState === 'OTP_VERIFICATION') {
          // Verify OTP
          const otpInput = this.element!.querySelector('.otp-input') as HTMLInputElement;

          if (otpInput) {
            const otpCode = otpInput.value;
            if (!otpCode || otpCode.length < 6) {
              const otpSection = this.element!.querySelector('.otp-section');
              if (otpSection && this.element) {
                const errorElement = this.element.querySelector('.error-message');
                if (errorElement) {
                  errorElement.textContent = 'Please enter a valid verification code.';
                } else {
                  otpSection.innerHTML += `<p class="error-message">Please enter a valid verification code.</p>`;
                }
              }
              return;
            }

            startButton.disabled = true;
            startButton.textContent = 'Verifying...';

            try {
              if (this.options?.onVerifyOtp) {
                const success = await this.options.onVerifyOtp(this.email, otpCode);
                if (success) {
                  this.authState = 'GAME_INTRO';
                  this.renderIntroDialog();
                  this.addEventListeners(); // Re-add listeners after re-rendering
                } else {
                  throw new Error('Invalid verification code');
                }
              }
            } catch (error) {
              console.error('Failed to verify OTP:', error);
              startButton.disabled = false;
              startButton.textContent = 'Verify & Start';

              // Show error message
              const otpSection = this.element!.querySelector('.otp-section');
              if (otpSection && this.element) {
                const errorElement = this.element.querySelector('.error-message');
                if (errorElement) {
                  errorElement.textContent = 'Invalid verification code. Please try again.';
                } else {
                  otpSection.innerHTML += `<p class="error-message">Invalid verification code. Please try again.</p>`;
                }
              }
            }
          }
        } else if (this.authState === 'GAME_INTRO') {
          // Only validate if name is not empty
          if (this.playerName && !this.validateName(this.playerName)) {
            return; // Don't proceed if name is invalid
          }

          this.hide();
          if (this.options?.onStartGame) {
            this.options.onStartGame([PlayerStore.getCoordinates()[0], PlayerStore.getCoordinates()[1]]);
            
            // Set name after 500ms delay if provided and valid
            if (this.playerName && this.options.onSetName) {
              setTimeout(() => {
                this.options?.onSetName?.(this.playerName);
              }, 500);
            }
          }
        }
      });
    }

    // Try again button (only in OTP view)
    const tryAgainButton = this.element.querySelector('.try-again-btn');
    if (tryAgainButton) {
      tryAgainButton.addEventListener('click', () => {
        this.authState = 'EMAIL_INPUT';
        this.renderIntroDialog();
        this.addEventListeners(); // Re-add listeners after re-rendering
      });
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateName(name: string): boolean {
    if (!name) return true; // Empty input is valid (optional name)
    
    const validNamePattern = /^[a-zA-Z0-9-_]+$/;
    const minLength = 2;
    const maxLength = 20;

    return name.length >= minLength && 
           name.length <= maxLength && 
           validNamePattern.test(name);
  }

  public hide() {
    if (this.element) {
      this.element.classList.add('fade-out');
      setTimeout(() => {
        if (this.element) {
          this.element.remove();
          this.element = null;
        }
      }, 300);
    }
  }
} 