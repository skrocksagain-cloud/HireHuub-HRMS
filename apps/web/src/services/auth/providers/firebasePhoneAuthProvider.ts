import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth } from '../../../firebase/firebase';
import type { IOtpAuthProvider } from '../../../types/auth';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export class FirebasePhoneAuthProvider implements IOtpAuthProvider {
  clearVerifier() {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // ignore errors during clear
      }
      window.recaptchaVerifier = undefined;
    }
  }

  async sendOtp(phoneNumber: string, recaptchaContainerId = 'recaptcha-container'): Promise<{ confirmationResult: ConfirmationResult }> {
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
    }

    try {
      this.clearVerifier(); // Clean up any stale verifier from previous DOM/lifecycle

      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {
          // Recaptcha resolved
        },
      });

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      return { confirmationResult };
    } catch (error) {
      this.clearVerifier();
      throw error;
    }
  }

  async linkPhoneOtp(phoneNumber: string, recaptchaContainerId = 'recaptcha-container'): Promise<{ confirmationResult: ConfirmationResult }> {
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
    }

    try {
      this.clearVerifier(); // Clean up any stale verifier from previous DOM/lifecycle

      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {},
      });

      const { linkWithPhoneNumber } = await import('firebase/auth');
      if (!auth.currentUser) throw new Error("Must be logged in to link phone number.");
      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, formattedPhone, window.recaptchaVerifier);
      return { confirmationResult };
    } catch (error) {
      this.clearVerifier();
      throw error;
    }
  }

  async verifyOtp(confirmationResult: unknown, code: string): Promise<boolean> {
    if (!confirmationResult || typeof (confirmationResult as ConfirmationResult).confirm !== 'function') {
      throw new Error('Invalid OTP session. Please request a new verification code.');
    }

    try {
      const res = await (confirmationResult as ConfirmationResult).confirm(code);
      return Boolean(res.user);
    } catch (error) {
      throw new Error('Invalid or expired verification code. Please check and try again.');
    }
  }
}

export const firebasePhoneAuthProvider = new FirebasePhoneAuthProvider();
