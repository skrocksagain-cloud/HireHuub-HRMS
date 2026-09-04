# Secure Password Reset Implementation Report

## Backend Modifications (`functions`)
1. **Dependencies**: Installed `nodemailer` to serve as the initial transactional email transport for the ERP.
2. **`requestPasswordReset.ts`**:
    - Validates Employee ID and looks up the employee document.
    - Rate-limits token generation (1 request per minute).
    - Generates a random 6-digit OTP and hashes it via SHA-256 (`crypto.createHash`).
    - Stores the hash, expiration (10 mins), attempts (0), and consumed (false) in the `passwordResetTokens/{employeeDocId}` collection.
    - Dispatches an email via Nodemailer to the employee's profile/recovery email (e.g. `connect@hirehuub.in`).
    - **Security**: Hardcoded to *always* return the same generic HTTP 200 response to prevent unauthenticated enumeration of Employee IDs.
3. **`completePasswordReset.ts`**:
    - Validates the provided Employee ID, OTP code, and new password.
    - Resolves the OTP hash and strictly validates expiration, attempt counts (max 5), and consumed flags. If invalid, safely increments the `attempts` counter to prevent brute-force.
    - Identifies the canonical Firebase Auth UID (`firebaseUid` or via `admin.auth().getUserByEmail(canonicalEmail)`).
    - Uses the Admin SDK (`admin.auth().updateUser`) to securely apply the new password.
    - Marks the token as consumed.
    - Clears standard `failedLoginAttempts`, `lockedUntil`, and `lockReason` fields in Firestore. **It does NOT modify `firstLoginCompleted`.**

## Frontend Modifications (`apps/web`)
1. **`authService.ts`**:
    - **`requestPasswordResetToken`**: Replaced the client-side Firebase Phone OTP request. It now invokes the `requestPasswordReset` Cloud Function using Firebase `httpsCallable`.
    - **`resetPassword`**: Removed the limitation report / hardcoded error. It now strictly calls the `completePasswordReset` Cloud Function, passing the Employee ID, OTP, and the user's new password.
2. **`useAuthEngine.ts`**:
    - Updated `handleSendOtp` to point to the new `requestPasswordResetToken` flow instead of the legacy `sendOtpForFlow`. Target mobile number displays are masked/suppressed generically during this flow since it goes to email now.

## Verification
- Both `apps/web` and `functions` were successfully built (`npm run build`) without TypeScript or compilation errors.
- No modifications were made to First Login flows.
- The Firebase Client SDK is no longer used for resetting existing passwords.

All architectural rules have been honored.
