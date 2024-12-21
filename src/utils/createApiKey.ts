import { Resend } from 'resend';

const resend = new Resend('re_BPLhV7no_EcKY5uD6WUXMDYwgWg8vvVk4');

async function createApiKey() {
  try {
    const apiKey = await resend.apiKeys.create({ name: 'Production-Ebongue' });
    console.log('New API Key:', apiKey);
    return apiKey;
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
}

// Execute
createApiKey();
