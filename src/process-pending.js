import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

import config from './config.js';
import { appendResultLog } from './logger.js';
import { generateAltText as generateAltTextApi } from './openai-client.js';

async function main() {
  if (!config.openaiApiKey) {
    console.error(
      'Cannot process pending prompts without OPENAI_API_KEY. Update .env.local and retry.'
    );
    process.exitCode = 1;
    return;
  }

  const payloadFiles = await collectPayloadFiles();
  if (!payloadFiles.length) {
    console.log('No pending prompt payloads found.');
    return;
  }

  for (const filePath of payloadFiles) {
    await handlePayloadFile(filePath);
  }
}

async function collectPayloadFiles() {
  let entries = [];
  try {
    entries = await readdir(config.manualPromptDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  return entries
    .filter(
      (entry) =>
        entry.isFile() && entry.name.toLowerCase().endsWith('.payload.json')
    )
    .map((entry) => path.join(config.manualPromptDir, entry.name));
}

async function handlePayloadFile(filePath) {
  const basename = path.basename(filePath);
  console.log(`Processing ${basename}...`);

  let payload;
  try {
    const contents = await readFile(filePath, 'utf8');
    payload = JSON.parse(contents);
  } catch (error) {
    console.error(`  Failed to parse ${basename}:`, error);
    return;
  }

  let result;
  try {
    result = await generateAltTextApi(payload);
  } catch (error) {
    console.error(`  OpenAI API error for ${basename}:`, error);
    return;
  }

  const altText = result.alt_text ?? '';
  const status = result.status ?? 'ok';
  const summary = result.summary ?? '';
  const notes = result.notes ?? '';
  const resolvedDocPath = result.doc_path || payload.doc_path;

  await appendResultLog({
    docPath: resolvedDocPath,
    imagePath: payload.image_path,
    altText,
    summary,
    notes,
    status,
  });

  await cleanupArtifacts(filePath);
  console.log(`  Completed ${basename}, logged to ${resolvedDocPath}.`);
}

async function cleanupArtifacts(payloadPath) {
  await unlink(payloadPath).catch(() => {});

  const promptPath = payloadPath.replace(/\.payload\.json$/i, '.prompt.md');
  await unlink(promptPath).catch(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
