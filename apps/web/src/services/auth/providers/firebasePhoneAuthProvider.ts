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
  async sendOtp(phoneNumber: string, recaptchaContainerId = 'recaptcha-container'): Promise<{ confirmationResult: ConfirmationResult }> {
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
    }

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: 'invisible',
          callback: () => {
            // Recaptcha resolved
          },
        });
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      return { confirmationResult };
    } catch (error) {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // ignore clear errors
        }
        window.recaptchaVerifier = undefined;
      }
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
