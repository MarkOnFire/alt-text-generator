import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

loadEnvFiles();

function loadEnvFiles() {
  const candidates = ['.env.local', '.env'];
  for (const name of candidates) {
    const filePath = path.join(projectRoot, name);
    if (!existsSync(filePath)) continue;
    const contents = readFileSync(filePath, 'utf8');
    applyEnv(contents);
  }
}

function applyEnv(contents) {
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [rawKey, ...rest] = trimmed.split('=');
    if (!rawKey) continue;
    const key = rawKey.trim();
    const value = rest.join('=').trim();
    if (key && !(key in process.env)) {
      process.env[key] = stripQuotes(value);
    }
  }
}

function stripQuotes(value) {
  if (!value) return '';
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseKeywords(input) {
  if (!input) return [];
  return input
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

const config = {
  projectRoot,
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  watchRoot:
    process.env.WATCH_ROOT ?? '/Volumes/WPM SSD/INGEST/needs-alt-text',
  logFilename: process.env.LOG_FILENAME ?? 'alt-text-log.md',
  pollIntervalMs: Number.parseInt(process.env.POLL_INTERVAL_MS ?? '1000', 10),
  projectKeywords: parseKeywords(process.env.PROJECT_KEYWORDS ?? ''),
  humanNotes: process.env.HUMAN_NOTES ?? '',
  processorMode: resolveProcessorMode(process.env.PROCESSOR_MODE),
  manualPromptDir: path.resolve(
    projectRoot,
    process.env.MANUAL_PROMPT_DIR ?? 'pending_prompts'
  ),
};

if (!Number.isFinite(config.pollIntervalMs) || config.pollIntervalMs < 250) {
  config.pollIntervalMs = 1000;
}

export default config;

function resolveProcessorMode(rawMode) {
  const normalized = (rawMode ?? 'auto').toLowerCase();
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

  if (normalized === 'api' || normalized === 'manual') {
    return normalized;
  }

  return hasApiKey ? 'api' : 'manual';
}
