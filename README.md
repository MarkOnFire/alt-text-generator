# Alt-Text Folder Watcher

Watches a designated ingest folder for new images, generates alt text using the Image Alt Writer 2 instructions, and builds export-ready bundles. Each drop (single image or folder) is mirrored into `EXPORTS/<set-name>/` with the original files, optimized JPEG/WebP variants (max 3000 px long side), and a Markdown table of previews, titles, and alt tags.

## Setup (new machine)
- Install Node.js 20+. On macOS: `brew install node@20`.
- Clone the repo and install dependencies: `npm install`.
- Copy `.env.example` to `.env.local` and set:
  - `WATCH_ROOT` — folder to drop images/folders into.
  - `EXPORT_ROOT` — where processed sets land (defaults to a sibling `EXPORTS` next to `WATCH_ROOT`).
  - `OPENAI_API_KEY` — optional; leave blank for manual mode.
- Sharp ships prebuilt binaries, but if you hit issues run: `brew install vips`.

## Running & automation
- Start manually with `npm run watch` (uses API when a key is set, otherwise writes manual prompts to `pending_prompts/`).
- To auto-start at login, use the launchd snippet in `docs/startup.md` to create a `~/Library/LaunchAgents/com.alttext.watcher.plist` that runs `npm run watch` from this repo.
- Replay manual payloads later with `npm run process-pending` after adding an API key.

## Standard (non-CLI) workflow
1. Drop a single image or a folder of images into `WATCH_ROOT` (e.g., `needs-alt-text/`).
2. The watcher creates `EXPORT_ROOT/<set-name>/` where `<set-name>` is the folder name or the file stem for single images.
   - `ORIGINALS/` holds untouched copies.
   - `OPTIMIZED/` holds `.jpg` and `.webp` versions, resized to a 3000 px max long side and optimized for the web.
3. The top-level `images.md` (configurable via `EXPORT_MARKDOWN_FILENAME`) contains a table:
   - Column 1: embedded preview of the optimized JPEG.
   - Column 2: suggested Title derived from the filename/folder context.
   - Column 3: generated alt text following `instructions.md` (or a clear “pending” note in manual mode).
4. Open the export folder in Finder/Obsidian and use the optimized assets and alt/title values directly—no CLI interaction required.

## Useful commands
- `npm run watch` — start the watcher/exporter.
- `npm run process-pending` — process queued `.payload.json` files from manual runs.

The project follows Conventional Commits (see `/Users/mriechers/Developer/workspace_ops/conventions/COMMIT_CONVENTIONS.md`) and targets Node.js 20 in strict, bias-aware alt text generation.
