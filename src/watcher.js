import { watch } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import config from './config.js';
import { processImage } from './processor.js';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.tif',
  '.tiff',
  '.bmp',
]);

const processedFiles = new Map();
const queue = [];
let isRunning = false;

export async function startWatcher() {
  console.log(
    `Watching ${config.watchRoot} for new images (log file: ${config.logFilename})`
  );

  await scanDirectory(config.watchRoot);
  drainQueue();

  try {
    const watcher = watch(
      config.watchRoot,
      { recursive: true },
      (eventType, filename) => {
        if (!filename) return;
        const filePath = path.join(config.watchRoot, filename);
        scheduleInspection(filePath);
      }
    );

    watcher.on('error', (error) => {
      console.error('Watcher error:', error);
    });
  } catch (error) {
    console.error(
      'fs.watch could not be started. Falling back to interval scanning only.',
      error
    );
  }

  setInterval(() => {
    scanDirectory(config.watchRoot).catch((error) => {
      console.error('Error during interval scan:', error);
    });
  }, config.pollIntervalMs);
}

function scheduleInspection(filePath) {
  setTimeout(() => {
    inspectFile(filePath).catch((error) => {
      console.error(`Failed to inspect ${filePath}:`, error);
    });
  }, 250);
}

async function inspectFile(filePath) {
  if (!isImageFile(filePath)) return;
  let stats;
  try {
    stats = await stat(filePath);
  } catch {
    return;
  }

  if (!stats.isFile()) return;

  const lastProcessed = processedFiles.get(filePath) ?? 0;
  const modifiedAt = stats.mtimeMs;
  if (modifiedAt <= lastProcessed) return;

  enqueue({ filePath, modifiedAt });
}

async function scanDirectory(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    console.error(`Cannot read directory ${directory}:`, error);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await scanDirectory(fullPath);
      continue;
    }

    await inspectFile(fullPath);
  }
}

function enqueue(item) {
  queue.push(item);
  if (!isRunning) {
    drainQueue();
  }
}

function drainQueue() {
  if (isRunning) return;
  isRunning = true;

  const next = queue.shift();
  if (!next) {
    isRunning = false;
    return;
  }

  processImage(next.filePath)
    .then((result) => {
      processedFiles.set(next.filePath, next.modifiedAt);
      logProcessingResult(next.filePath, result);
    })
    .catch((error) => {
      console.error(`Error processing ${next.filePath}:`, error);
    })
    .finally(() => {
      isRunning = false;
      setImmediate(drainQueue);
    });
}

function isImageFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.has(extension);
}

function logProcessingResult(filePath, result) {
  const status = String(result?.status ?? 'unknown').toUpperCase();
  const basename = path.basename(filePath);
  const notes = result?.notes;
  const docPath = result?.doc_path;

  if (status === 'MANUAL') {
    console.log(
      `[MANUAL] ${basename}: ${notes ?? 'Prompt ready for manual processing.'}`
    );
    return;
  }

  if (status === 'OK') {
    console.log(
      `[OK] ${basename}: Alt text logged to ${docPath ?? 'unknown location'}.`
    );
    return;
  }

  console.log(
    `[${status}] ${basename}: ${notes ?? 'Refer to logs for more details.'}`
  );
}
