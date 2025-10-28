import config from './config.js';
import { startWatcher } from './watcher.js';

async function main() {
  if (config.processorMode === 'api' && !config.openaiApiKey) {
    console.error(
      'Processor mode is "api" but OPENAI_API_KEY is missing. Add it to your environment or switch PROCESSOR_MODE=manual.'
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Processor mode: ${config.processorMode}`);
  if (config.processorMode === 'manual') {
    console.log(`Manual prompts directory: ${config.manualPromptDir}`);
  }

  await startWatcher();
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
