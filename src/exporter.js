import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import config from './config.js';
import { createOptimizedVariants } from './optimizer.js';

export async function prepareExport(imagePath) {
  const context = buildContext(imagePath);
  await mkdir(context.jobRoot, { recursive: true });

  await copyOriginal(imagePath, context.originalPath);
  const variants = await createOptimizedVariants(
    context.originalPath,
    context.optimizedBasePath,
    config.optimizedMaxDimension
  );

  return {
    ...context,
    optimizedJpegPath: variants.jpegPath,
    optimizedWebpPath: variants.webpPath,
    exportMetadata: buildExportMetadata(context, variants),
  };
}

export function rebuildExportMetadataFromPayload(payload) {
  const exportMetadata = payload?.export_metadata ?? {};
  const docPath = payload?.doc_path ?? exportMetadata.markdown_path ?? '';
  const docDir = docPath ? path.dirname(docPath) : '';

  const previewRel = exportMetadata.preview_rel ?? '';
  const jobRoot = exportMetadata.job_root ?? (docDir || '');
  const previewPath = previewRel
    ? path.resolve(jobRoot, previewRel)
    : payload?.image_path;

  return {
    docPath: docPath || undefined,
    previewPath: previewPath || undefined,
    title:
      exportMetadata.title ??
      suggestTitle(path.parse(payload?.image_path ?? '').name),
    imageKey: normalizeKey(
      previewRel || payload?.image_path || exportMetadata.image_key || ''
    ),
  };
}

function buildContext(imagePath) {
  const relativeToWatch = path.relative(config.watchRoot, imagePath);
  const normalizedRelative = relativeToWatch.startsWith('..')
    ? path.basename(imagePath)
    : relativeToWatch;

  const segments = normalizedRelative.split(path.sep).filter(Boolean);
  const setName = sanitizeSegment(
    segments.length > 1
      ? segments[0]
      : path.parse(segments[0] ?? 'image-set').name
  );

  const relativeWithinSet =
    segments.length > 1 ? path.join(...segments.slice(1)) : path.basename(imagePath);
  const relativeDir = path.dirname(relativeWithinSet);
  const safeRelativeDir = relativeDir === '.' ? '' : relativeDir;
  const baseName = path.parse(relativeWithinSet).name;

  const jobRoot = path.join(config.exportRoot, setName);
  const originalsDir = path.join(jobRoot, 'ORIGINALS');
  const optimizedDir = path.join(jobRoot, 'OPTIMIZED');

  const originalPath = path.join(originalsDir, relativeWithinSet);
  const optimizedBasePath = path.join(optimizedDir, safeRelativeDir, baseName);

  const markdownPath = path.join(jobRoot, config.exportMarkdownFilename);
  const previewPath = path.join(optimizedDir, safeRelativeDir, `${baseName}.jpg`);

  return {
    jobRoot,
    markdownPath,
    originalPath,
    optimizedBasePath,
    previewPath,
    imageKey: normalizeKey(path.join(safeRelativeDir, `${baseName}.jpg`)),
    suggestedTitle: suggestTitle(baseName),
  };
}

function buildExportMetadata(context, variants) {
  const relativePreview = path.relative(context.jobRoot, variants.jpegPath);
  const relativeWebp = path.relative(context.jobRoot, variants.webpPath);
  const relativeOriginal = path.relative(context.jobRoot, context.originalPath);

  return {
    job_root: context.jobRoot,
    markdown_path: context.markdownPath,
    preview_rel: normalizePath(relativePreview),
    optimized_webp_rel: normalizePath(relativeWebp),
    original_rel: normalizePath(relativeOriginal),
    image_key: context.imageKey,
    title: context.suggestedTitle,
  };
}

async function copyOriginal(sourcePath, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
}

function sanitizeSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function normalizeKey(input) {
  return normalizePath(input || '').toLowerCase();
}

function normalizePath(input) {
  return input.split(path.sep).join('/');
}

function suggestTitle(baseName) {
  const cleaned = baseName.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Untitled Image';
  return cleaned
    .split(' ')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}
