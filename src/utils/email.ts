import { Resend } from 'resend';
import type { CreateEmailResponse } from 'resend';

interface EmailResponse {
  success: boolean;
  data?: CreateEmailResponse;
  error?: Error;
}

interface EmailOptions {
  subject: string;
  content: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const DEFAULT_FROM = 'Ebongue Avocats <onboarding@resend.dev>';
const DEFAULT_TO = 'alexis.besner1@gmail.com';

export async function sendEmail({
  subject,
  content,
  replyTo,
  attachments
}: EmailOptions): Promise<EmailResponse> {
  try {
    if (!import.meta.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }

    console.log('Attempting to send email with data:', { subject, content, replyTo, attachments });

    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to: DEFAULT_TO,
      reply_to: replyTo,
      subject: subject,
      html: content,
      attachments: attachments,
      headers: {
        'X-Entity-Ref-ID': new Date().getTime().toString(),
      },
      tags: [{ name: 'category', value: 'contact_form' }]
    });

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}
