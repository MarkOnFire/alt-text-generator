import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import config from './config.js';
import { systemPrompt } from './prompt.js';

export async function generateAltTextManual(payload) {
  const promptPath = await writeManualPrompt(payload);
  await writePayloadJson(payload);
  const imageBasename = path.basename(payload.image_path);

  return {
    image: imageBasename,
    doc_path: payload.doc_path,
    alt_text: '',
    summary: '',
    notes: `Manual prompt created at ${promptPath}`,
    status: 'manual',
  };
}

async function writeManualPrompt(payload) {
  await mkdir(config.manualPromptDir, { recursive: true });

  const promptFilename = buildPromptFilename(payload.image_path);
  const outPath = path.join(config.manualPromptDir, promptFilename);
  const payloadJson = JSON.stringify(payload, null, 2);

  const content = [
    `# Alt Text Prompt • ${path.basename(payload.image_path)}`,
    '',
    `Attach the image located at: \`${payload.image_path}\` when you send this prompt in ChatGPT.`,
    '',
    'Paste the full code block into ChatGPT Plus. The system instructions mirror `instructions.md` so bias and accessibility rules remain enforced.',
    '',
    '```text',
    'System prompt:',
    systemPrompt,
    '',
    'User message:',
    'Process the following JSON payload and respond with JSON that obeys the schema described in the system prompt.',
    'Payload:',
    payloadJson,
    '```',
    '',
    `Copy the \`alt_text\` (and optional summary) from the response into \`${payload.doc_path}\`.`,
  ].join('\n');

  await writeFile(outPath, content, 'utf8');
  return outPath;
}

async function writePayloadJson(payload) {
  const payloadFilename = buildPayloadFilename(payload.image_path);
  const outPath = path.join(
    config.manualPromptDir,
    `${payloadFilename}.payload.json`
  );
  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');
  return outPath;
}

function buildPromptFilename(imagePath) {
  const relative = path.relative(config.watchRoot, imagePath);
  const base = relative.startsWith('..') ? path.basename(imagePath) : relative;
  return `${sanitizeForFilename(base)}.prompt.md`;
}

function buildPayloadFilename(imagePath) {
  const relative = path.relative(config.watchRoot, imagePath);
  const base = relative.startsWith('..') ? path.basename(imagePath) : relative;
  return sanitizeForFilename(base);
}

function sanitizeForFilename(value) {
  return value.replace(/[/\\]/g, '__');
}
