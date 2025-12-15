import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import config from './config.js';
import { appendResultLog } from './logger.js';
import { generateAltText } from './alt-text-service.js';
import { prepareExport } from './exporter.js';

export async function processImage(imagePath) {
  let exportContext;
  try {
    exportContext = await prepareExport(imagePath);
  } catch (error) {
    return {
      status: 'error',
      notes: `Failed to prepare export: ${error.message ?? error}`,
    };
  }

  const docPath = exportContext.markdownPath;
  const payload = await buildPayload(
    exportContext.originalPath,
    docPath,
    exportContext
  );

  const result = await generateAltText(payload);
  const altText = result.alt_text ?? '';
  const status = result.status ?? 'ok';
  const summary = result.summary ?? '';
  const notes = result.notes ?? '';
  const resolvedDocPath = result.doc_path || docPath;

  await appendResultLog({
    docPath: resolvedDocPath,
    imagePath: exportContext.originalPath,
    imageKey: exportContext.imageKey,
    previewPath: exportContext.optimizedJpegPath,
    title: exportContext.suggestedTitle,
    altText,
    summary,
    notes,
    status,
  });

  return {
    ...result,
    doc_path: resolvedDocPath,
  };
}

async function buildPayload(imagePath, docPath, exportContext) {
  const payload = {
    image_path: imagePath,
    doc_path: docPath,
  };

  if (config.projectKeywords.length) {
    payload.project_keywords = config.projectKeywords;
  }

  if (config.humanNotes) {
    payload.human_notes = config.humanNotes;
  }

  const ocrText = await loadCompanionText(imagePath);
  if (ocrText) {
    payload.ocr_text = ocrText;
  }

  if (exportContext?.exportMetadata) {
    payload.export_metadata = exportContext.exportMetadata;
  }

  return payload;
}

async function loadCompanionText(imagePath) {
  const { dir, name } = path.parse(imagePath);
  const candidates = [
    path.join(dir, `${name}.txt`),
    path.join(dir, `${name}.ocr.txt`),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      const contents = await readFile(candidate, 'utf8');
      const trimmed = contents.trim();
      if (trimmed) return trimmed;
    }
  }

  return '';
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
