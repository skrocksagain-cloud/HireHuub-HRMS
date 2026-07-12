import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

export interface EmailAttachment {
  fileName: string;

  downloadUrl: string;
}

export interface SendEmailOptions {
  to: string | string[];

  cc?: string[];

  bcc?: string[];

  subject: string;

  html: string;

  attachments?: EmailAttachment[];

  module: string;

  referenceId: string;

  createdBy: string;
}

/**
 * ============================================================
 * Queue Email
 * ============================================================
 *
 * A Firebase Cloud Function will process
 * the mail queue.
 */
export async function queueEmail(
  options: SendEmailOptions
): Promise<string> {
  const docRef = await addDoc(
    collection(db, "mailQueue"),
    {
      to: Array.isArray(options.to)
        ? options.to
        : [options.to],

      cc: options.cc ?? [],

      bcc: options.bcc ?? [],

      subject: options.subject,

      html: options.html,

      attachments:
        options.attachments ?? [],

      module: options.module,

      referenceId:
        options.referenceId,

      status: "Pending",

      retryCount: 0,

      createdBy: options.createdBy,

      createdAt: serverTimestamp(),
    }
  );

  return docRef.id;
}

/**
 * ============================================================
 * Offer Letter Email
 * ============================================================
 */
export async function sendOfferLetterEmail(
  candidateName: string,
  email: string,
  downloadUrl: string,
  createdBy: string,
  referenceId: string
) {
  return queueEmail({
    to: email,

    subject:
      "Offer Letter | HireHuub People Solution Pvt. Ltd.",

    html: `
      <p>Dear ${candidateName},</p>

      <p>
        Congratulations!
      </p>

      <p>
        Please find your Offer Letter attached.
      </p>

      <p>
        We look forward to welcoming you to
        HireHuub.
      </p>

      <br/>

      <p>
        Regards,
      </p>

      <p>
        HR Team
      </p>
    `,

    attachments: [
      {
        fileName: "OfferLetter.pdf",

        downloadUrl,
      },
    ],

    module: "Offer",

    referenceId,

    createdBy,
  });
}

/**
 * ============================================================
 * Generic Notification Email
 * ============================================================
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  html: string,
  createdBy: string
) {
  return queueEmail({
    to: email,

    subject,

    html,

    module: "System",

    referenceId: "",

    createdBy,
  });
}