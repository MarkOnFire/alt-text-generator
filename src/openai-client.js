import config from './config.js';
import { buildMessages } from './prompt.js';

const OPENAI_CHAT_COMPLETIONS_URL =
  'https://api.openai.com/v1/chat/completions';

export async function generateAltText(payload) {
  if (!config.openaiApiKey) {
    throw new Error(
      'OPENAI_API_KEY is missing. Set it in your environment or .env file.'
    );
  }

  const body = {
    model: config.openaiModel,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: buildMessages(payload),
  };

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await safeText(response);
    throw new Error(
      `OpenAI API error (${response.status} ${response.statusText}): ${text}`
    );
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message?.content;
  if (!message) {
    throw new Error('OpenAI API returned an empty response.');
  }

  try {
    return JSON.parse(message);
  } catch (error) {
    throw new Error(
      `Failed to parse OpenAI response as JSON: ${error.message ?? error}`
    );
  }
}

async function safeText(response) {
  try {
    return await response.text();
  } catch {
    return '<no body>';
  }
}
