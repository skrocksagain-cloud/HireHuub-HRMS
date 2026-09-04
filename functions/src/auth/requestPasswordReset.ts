import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

export const requestPasswordReset = functions.https.onCall(async (request) => {
  const { employeeId } = request.data;
  const genericResponse = {
    success: true,
    message: 'If the Employee ID exists, a recovery code has been sent to the registered profile email.'
  };

  if (!employeeId || typeof employeeId !== 'string') {
    return genericResponse;
  }

  const cleanId = employeeId.trim();
  
  const db = admin.firestore();
  
  try {
    // Artificial delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Resolve employee
    let employeeDocId = cleanId;
    let employeeData = null;

    // Try direct lookup by ID
    let docRef = db.collection('employees').doc(cleanId);
    let docSnap = await docRef.get();
    
    if (docSnap.exists) {
      employeeData = docSnap.data();
    } else {
      // Query by employeeId field
      const snapshot = await db.collection('employees').where('employeeId', '==', cleanId).limit(1).get();
      if (!snapshot.empty) {
        employeeDocId = snapshot.docs[0].id;
        employeeData = snapshot.docs[0].data();
      }
    }

    if (!employeeData || !employeeData.email) {
      // No employee or no profile email set.
      return genericResponse;
    }

    // Rate limiting: Check recent tokens
    const tokenRef = db.collection('passwordResetTokens').doc(employeeDocId);
    const tokenSnap = await tokenRef.get();
    if (tokenSnap.exists) {
      const tokenData = tokenSnap.data();
      // If a token was generated less than 1 minute ago, throttle
      if (tokenData && tokenData.createdAt) {
        const createdAt = tokenData.createdAt.toDate();
        if (Date.now() - createdAt.getTime() < 60000) {
           return genericResponse;
        }
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store securely
    await tokenRef.set({
      otpHash,
      expiresAt,
      attempts: 0,
      consumed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send email using Nodemailer
    // NOTE: In production, configure this via Firebase Environment variables or Secret Manager
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', 
      auth: {
        user: process.env.SMTP_USER || 'noreply@hirehuub.local',
        pass: process.env.SMTP_PASS || 'dummy-password'
      }
    });

    const mailOptions = {
      from: '"HireHuub ERP" <noreply@hirehuub.local>',
      to: employeeData.email,
      subject: 'HireHuub - Password Reset Code',
      text: `Your password reset code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`
    };

    // We wrap in a try-catch so failing to send email doesn't expose existence
    try {
      // Uncomment to actually send in production when configured
      await transporter.sendMail(mailOptions);
      console.log(`[Development] OTP for ${cleanId} sent to ${employeeData.email}: ${otp}`);
    } catch (mailErr) {
      console.error('Failed to send reset email:', mailErr);
    }

    return genericResponse;

  } catch (err) {
    console.error('Error in requestPasswordReset:', err);
    throw new functions.https.HttpsError('internal', 'An internal error occurred.');
  }
});
