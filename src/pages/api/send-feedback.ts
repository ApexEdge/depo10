import type { APIRoute } from 'astro';
import { sendEmail } from '../../utils/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { rating, feedback } = body;

    const emailContent = `
      <h2>Nouvelle évaluation reçue</h2>
      <p><strong>Note:</strong> ${rating} étoiles</p>
      ${feedback ? `<p><strong>Commentaire:</strong> ${feedback}</p>` : ''}
    `;

    const result = await sendEmail({
      subject: `Nouvelle évaluation: ${rating} étoiles`,
      content: emailContent
    });

    if (!result.success) {
      throw new Error(result.error?.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
