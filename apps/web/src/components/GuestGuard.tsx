import React, { useEffect, useState } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { useGuestAuth } from '../context/GuestAuthContext';
import { guestAuthService } from '../services/guest/guestAuthService';

interface GuestGuardProps {
  children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const { guestSession, logoutGuest } = useGuestAuth();
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function validate() {
      if (!guestSession || guestSession.token !== token) {
        if (isMounted) {
          setIsValid(false);
          setIsValidating(false);
        }
        return;
      }
      try {
        const inv = await guestAuthService.getInvitation(token!);
        if (isMounted) {
          if (!inv) {
            logoutGuest(); // Revoked or expired
            setIsValid(false);
          } else {
            setIsValid(true);
          }
          setIsValidating(false);
        }
      } catch {
        if (isMounted) {
          setIsValid(false);
          setIsValidating(false);
        }
      }
    }
    validate();
    return () => { isMounted = false; };
  }, [guestSession, token, logoutGuest]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-emerald-600 rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to={`/guest/login/${token || ''}`} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
