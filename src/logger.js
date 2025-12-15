import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function appendResultLog({
  docPath,
  previewPath,
  title,
  altText,
  summary,
  notes,
  status,
  imageKey,
  imagePath,
}) {
  const docDir = path.dirname(docPath);
  const previewRelative = derivePreviewRelative(previewPath, docDir);
  const rowKey = normalizeKey(imageKey || previewRelative || imagePath || title);

  const rows = await readExistingRows(docPath);
  rows.set(rowKey, {
    previewRelative,
    title: title || deriveTitleFromPath(imagePath),
    altText: formatAltText(altText, status, summary, notes),
  });

  const lines = [
    '| Image | Title | Alt Text |',
    '| --- | --- | --- |',
  ];

  for (const [, row] of rows) {
    const previewCell = row.previewRelative
      ? `![${escapeCell(row.title)}](${row.previewRelative})`
      : escapeCell(row.title);
    lines.push(
      `| ${previewCell} | ${escapeCell(row.title)} | ${escapeCell(
        row.altText
      )} |`
    );
  }

  lines.push('');
  await ensureDirectory(docDir);
  await writeFile(docPath, lines.join('\n'), 'utf8');
}

async function ensureDirectory(dir) {
  await mkdir(dir, { recursive: true });
}

function derivePreviewRelative(previewPath, docDir) {
  if (!previewPath) return '';
  const relative = path.relative(docDir, previewPath);
  return normalizePath(relative);
}

function formatAltText(altText, status, summary, notes) {
  if (altText && altText.length > 0) {
    return altText;
  }

  const normalizedStatus = String(status ?? '').toUpperCase();
  if (normalizedStatus === 'MANUAL') {
    return 'Pending manual alt text';
  }
  if (normalizedStatus === 'ERROR') {
    return 'Alt text unavailable';
  }

  const extras = [];
  if (summary) extras.push(summary);
  if (notes) extras.push(notes);
  if (extras.length) return extras.join(' • ');

  return '""';
}

function escapeCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

async function readExistingRows(docPath) {
  let contents = '';
  try {
    contents = await readFile(docPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }

  const lines = contents.split('\n');
  const rows = new Map();
  for (const line of lines) {
    if (
      !line.startsWith('|') ||
      line.startsWith('| ---') ||
      line.toLowerCase().startsWith('| image ')
    ) {
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3) continue;

    const imagePath = extractImagePath(cells[0]);
    const key = normalizeKey(imagePath || cells[1]);
    rows.set(key, {
      previewRelative: imagePath,
      title: cells[1],
      altText: cells[2],
    });
  }
  return rows;
}

function extractImagePath(cell) {
  const match = cell.match(/!\[[^\]]*]\(([^)]+)\)/);
  if (!match) return '';
  return normalizePath(match[1]);
}

function deriveTitleFromPath(filePath) {
  if (!filePath) return 'Untitled Image';
  const base = path.parse(filePath).name;
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || base;
}

function normalizeKey(input) {
  return normalizePath(String(input ?? '')).toLowerCase();
}

function normalizePath(input) {
  return input.split(path.sep).join('/');
}
