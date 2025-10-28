import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function appendResultLog({
  docPath,
  imagePath,
  altText,
  summary,
  notes,
  status,
}) {
  const timestamp = new Date().toISOString();
  const basename = path.basename(imagePath);
  const lines = [];
  const normalizedStatus = String(status ?? '').toUpperCase();
  const displayAlt = formatAltText(altText, normalizedStatus);

  lines.push(
    `- ${timestamp} • ${basename} • Status: ${normalizedStatus} • Alt: ${displayAlt}`
  );

  if (summary) {
    lines.push(`  Summary: ${summary}`);
  }
  if (notes) {
    lines.push(`  Notes: ${notes}`);
  }

  lines.push(''); // trailing newline

  await ensureDirectory(path.dirname(docPath));
  await appendFile(docPath, lines.join('\n'), 'utf8');
}

async function ensureDirectory(dir) {
  await mkdir(dir, { recursive: true });
}

function formatAltText(altText, normalizedStatus) {
  if (altText && altText.length > 0) {
    return altText;
  }

  if (normalizedStatus === 'MANUAL') {
    return '(pending manual response)';
  }

  return '""';
}
