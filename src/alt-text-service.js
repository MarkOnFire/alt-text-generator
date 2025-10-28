import config from './config.js';
import { generateAltText as generateAltTextApi } from './openai-client.js';
import { generateAltTextManual } from './manual-mode.js';

export async function generateAltText(payload) {
  if (config.processorMode === 'manual') {
    return generateAltTextManual(payload);
  }

  if (!config.openaiApiKey) {
    throw new Error(
      'Processor mode is set to "api" but OPENAI_API_KEY is missing.'
    );
  }

  return generateAltTextApi(payload);
}
