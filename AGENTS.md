# Repository Guidelines

## Git Commit Convention

**IMPORTANT**: This project follows workspace-wide commit conventions.

**See**: `/Users/mriechers/Developer/workspace_ops/conventions/COMMIT_CONVENTIONS.md`

## Project Structure & Module Organization
- `src/` holds the TypeScript agent code: the prompt builder, OpenAI client wrapper, and UX helpers. Keep the primary entry point in `src/index.ts` and group reusable logic under `src/lib/`.
- `prompts/` stores curated prompt fragments and persona definitions; mirror the naming of the instructions in `instructions.md` so reviewers can trace changes quickly.
- `tests/` contains Jest specs and fixtures. Co-locate integration scenarios under `tests/integration/` to exercise the full request path.
- `assets/` is reserved for sample inputs (image URLs, captions) that double as regression fixtures. Keep everything under 1 MB to avoid bloating the repository.
- `docs/` is optional but recommended for long-form guides (playbooks, UX notes). Link back to this guide from any onboarding doc.
- `pending_prompts/` (generated) collects ChatGPT-ready prompt files when running without API credentials; add to `.gitignore`.

## Build, Test, and Development Commands
- `npm install` installs dependencies; rerun when you pull new prompt utilities or tooling.
- `npm run watch` monitors the configured folder for new images. Without an API key it drops manual prompts in `pending_prompts/`; with a key it logs results automatically.
- `npm run process-pending` replays queued manual prompts (`.payload.json`). Requires `OPENAI_API_KEY`.
- `npm run build` compiles TypeScript to `dist/` and validates prompt JSON (future use).
- `npm test` runs the Jest suite, including lint, unit, and integration checks (add coverage when modules stabilize).

## Coding Style & Naming Conventions
- Target Node.js 20 and TypeScript strict mode. Use ES module syntax and 2-space indentation.
- Export shared utilities with `camelCase` function names; default-export the main agent factory as `createAltTextAgent`.
- Run `npm run lint` (ESLint + Prettier) before committing; it enforces formatting, import ordering, and forbids untyped `any`.
- Keep prompts in lowercase kebab-case files (e.g., `image-alt-general.txt`) and document intent in the header comment.

## Testing Guidelines
- Jest powers both unit and integration tests. Prefer `describe` blocks that mirror module names (e.g., `altTextBuilder`).
- Name test files `*.test.ts` and store mock responses in `tests/fixtures/`.
- Aim for ≥90 % branch coverage on prompt builders and response parsers; track progress with `npm test -- --coverage`.
- When adding a new prompt pattern, add at least one integration test that stubs the OpenAI SDK and validates final alt text length.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `docs:`) so changelogs stay machine-readable.
- Reference issue IDs in the footer (`Refs #123`) and summarize behavioral impact in the body.
- Pull requests must include: purpose, screenshots of CLI output if applicable, new commands introduced, and testing notes.
- Request review from another agent maintainer when touching `src/lib/` or `prompts/`; use draft PRs for work-in-progress prompt tuning.

## Security & Configuration Tips
- Store credentials (OpenAI keys, analytics tokens) in `.env.local` and load them through `dotenv`; never commit secrets.
- Use `PROCESSOR_MODE=manual` when no API key is available; prompts will be staged in `pending_prompts/` for manual ChatGPT runs.
- Rotate API keys quarterly and document changes in `docs/security.md`.
- Sanitize any sample image URLs before committing to avoid PII leaks, and prefer Creative Commons assets for fixtures.
