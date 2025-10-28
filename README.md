# Alt-Text Folder Watcher

This utility watches a directory for new image files, sends each image through Image Alt Writer 2 (OpenAI), and appends the returned alt text to a running Markdown log in the same folder.

## Quick Start
- **Requirements:** Node.js 20+. An OpenAI API key unlocks fully automated alt text, but a manual-only flow is available if you only have ChatGPT Plus.
- **Install:** No external packages are required.
- **Configure:** Copy `.env.example` to `.env.local` and update the values:
  - `OPENAI_API_KEY` — optional. Leave blank to run in manual mode.
  - `WATCH_ROOT` — defaults to `/Volumes/WPM SSD/INGEST/needs-alt-text`. Point this at any folder that should be monitored. For local testing, use `sample_image/`.
  - `LOG_FILENAME` — optional; defaults to `alt-text-log.md`.
  - `PROJECT_KEYWORDS` — comma-separated list to gently bias the alt text.
  - `PROCESSOR_MODE` — `auto` (default) chooses `api` when a key is present, otherwise `manual`.
  - `MANUAL_PROMPT_DIR` — directory (relative to repo) for generated ChatGPT prompts when running manually.
- **Run:** `npm run watch`

The watcher immediately scans the root directory (and subfolders) for images (`.jpg`, `.png`, `.gif`, `.webp`, `.svg`, `.tif`, `.bmp`) and processes any new or modified files.

## Workflow
1. When an image is detected, the watcher looks for companion text (`<name>.txt` or `<name>.ocr.txt`) to send alongside the request.
2. In API mode, a JSON payload is posted to the OpenAI Chat Completions API using the project-specific instructions from `instructions.md`. In manual mode, an equivalent prompt is written to `pending_prompts/`.
3. The response (or manual placeholder) is appended to `<watch-folder>/<logFilename>` as a bullet with timestamp, file name, status, alt text, and (if supplied) summary/notes.
4. Additional updates to the same image trigger regeneration, ensuring the log stays in sync.

Errors (missing API key, API failures, unreadable files) are logged to the console and noted in the Markdown file with `status: ERROR`.

## Manual Mode (No API Key)
- Leave `OPENAI_API_KEY` blank (or set `PROCESSOR_MODE=manual`). The watcher still detects new images but, instead of calling the OpenAI API, it writes ready-to-use prompt files to `pending_prompts/`.
- Each prompt (`<relative-path>.prompt.md`) contains the Image Alt Writer 2 system instructions plus the JSON payload. Open the file, upload the referenced image in ChatGPT Plus, paste the prompt, and copy the resulting `alt_text` back into the folder log.
- A companion JSON payload (`<relative-path>.payload.json`) mirrors the request body. Keep it untouched unless you need to tweak the metadata.
- The log entry is marked with `Status: MANUAL` until you paste the final alt text. Edit the log file directly once you obtain the GPT response.
- Later, if you acquire API access, run `npm run process-pending` to batch-process any remaining `.payload.json` files and automatically append the results to the log. The script removes the processed prompt and payload files after completion.

## Codex CLI Commands
- `npm run watch` — start the watcher. In manual mode it generates prompt/payload files; in API mode it logs alt text automatically.
- `npm run process-pending` — replay every `.payload.json` in `pending_prompts/` through the OpenAI API. Use this once you have an API key or whenever you want to reprocess updated payloads.
- `npm run process-pending -- --dry-run` — future enhancement; not implemented yet, but feel free to add if auditing payloads becomes necessary.
- To regenerate prompts manually (without waiting for the watcher), drop a new/updated image into the watched directory or bump its timestamp with `touch <file>`.

## Testing Locally
1. Set `WATCH_ROOT=sample_image` in `.env.local`.
2. Add one or more images to `sample_image/` (include optional `.txt` companion files to simulate OCR output).
3. Run `npm run watch` and verify `sample_image/alt-text-log.md` updates when files change.

Deactivate the watcher with `Ctrl+C`. The process is stateless; you can restart it at any time to resume monitoring the configured folder.
