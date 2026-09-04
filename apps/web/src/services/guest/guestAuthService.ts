import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { firebasePhoneAuthProvider } from '../auth/providers/firebasePhoneAuthProvider';
import { associatePartnerRepository } from '../../pages/Workbench/Network/associatePartners/repositories/associatePartnerRepository';

export interface GuestInvitation {
  id?: string;
  token: string;
  partnerId: string;
  contactNumber: string;
  expiresAt: string;
  status: 'Active' | 'Revoked';
}

export interface GuestSession {
  token: string;
  partnerId: string;
  partnerName: string;
  contactNumber: string;
  verifiedAt: string;
}

class GuestAuthService {
  /**
   * Generates a cryptographically strong token
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate an invitation for an Associate Partner
   */
  async generateInvitation(partnerId: string, contactNumber: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const inv: GuestInvitation = {
      token,
      partnerId,
      contactNumber,
      expiresAt: expiresAt.toISOString(),
      status: 'Active'
    };

    await addDoc(collection(db, 'guest_invitations'), inv);
    return token;
  }

  /**
   * Validate token
   */
  async getInvitation(token: string): Promise<GuestInvitation | null> {
    const q = query(collection(db, 'guest_invitations'), where('token', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    const docSnap = snap.docs[0];
    const data = docSnap.data() as GuestInvitation;
    
    if (data.status !== 'Active') return null;
    if (new Date(data.expiresAt).getTime() < Date.now()) return null;

    return { ...data, id: docSnap.id };
  }

  /**
   * Send OTP for Guest Invitation
   */
  async sendGuestOtp(token: string, contactNumber: string): Promise<any> {
    const inv = await this.getInvitation(token);
    if (!inv) throw new Error('Invalid or expired invitation.');
    
    // Ensure the contact number provided matches the invitation
    if (inv.contactNumber !== contactNumber) {
      throw new Error('Contact number does not match the invitation record.');
    }

    const { confirmationResult } = await firebasePhoneAuthProvider.sendOtp(contactNumber);
    return confirmationResult;
  }

  /**
   * Verify OTP and return session
   */
  async verifyGuestOtp(token: string, confirmationResult: any, otpCode: string): Promise<GuestSession> {
    const inv = await this.getInvitation(token);
    if (!inv) throw new Error('Invalid or expired invitation.');

    const isValid = await firebasePhoneAuthProvider.verifyOtp(confirmationResult, otpCode);
    if (!isValid) throw new Error('Invalid OTP code.');

    let partnerName = 'Associate Partner';
    try {
      const partner = await this.getPartnerInfo(inv.partnerId);
      if (partner) {
        partnerName = partner.subVendorName || partner.name || 'Associate Partner';
      }
    } catch {
      // Ignored
    }

    return {
      token,
      partnerId: inv.partnerId,
      partnerName,
      contactNumber: inv.contactNumber,
      verifiedAt: new Date().toISOString()
    };
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(tokenId: string): Promise<void> {
    const docRef = doc(db, 'guest_invitations', tokenId);
    await updateDoc(docRef, { status: 'Revoked' });
  }

  /**
   * Fetch partner info
   */
  async getPartnerInfo(partnerId: string) {
    return await associatePartnerRepository.getPartnerById(partnerId);
  }
}

export const guestAuthService = new GuestAuthService();
