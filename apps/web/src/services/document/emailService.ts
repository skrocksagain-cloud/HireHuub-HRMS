import { notificationRepository } from '../../core/notifications/notificationRepository';

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

export async function queueEmail(options: SendEmailOptions): Promise<string> {
  const mailId = `mail_${Date.now()}`;
  await notificationRepository.create({
    recipientEmployeeId: Array.isArray(options.to) ? options.to[0] : options.to,
    title: options.subject,
    message: options.html.replace(/<[^>]*>?/gm, '').slice(0, 100),
    module: options.module || 'System',
    type: 'info',
  });
  return mailId;
}

export async function sendOfferLetterEmail(
  candidateName: string,
  email: string,
  downloadUrl: string,
  createdBy: string,
  referenceId: string
) {
  return queueEmail({
    to: email,
    subject: 'Offer Letter | HireHuub People Solution Pvt. Ltd.',
    html: `<p>Dear ${candidateName},</p><p>Congratulations! Please find your Offer Letter attached.</p>`,
    attachments: [{ fileName: 'OfferLetter.pdf', downloadUrl }],
    module: 'Offer',
    referenceId,
    createdBy,
  });
}

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
    module: 'System',
    referenceId: '',
    createdBy,
  });
}