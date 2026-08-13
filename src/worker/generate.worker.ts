import type { GenerateInput } from '../vcl/generate.ts';
import { GenerationCancelledError, generateLibrary } from '../vcl/generate.ts';

import type { WorkerRequest, WorkerResponse } from './protocol.ts';

/**
 * The part of the dedicated worker scope this file uses. The project compiles
 * against the DOM library, which does not declare the worker globals.
 */
interface DedicatedWorkerGlobalScope {
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<WorkerRequest>) => void,
  ) => void;
  postMessage: (message: WorkerResponse) => void;
}

const context = globalThis as unknown as DedicatedWorkerGlobalScope;

let cancelled = false;

context.addEventListener('message', (event) => {
  const request = event.data;
  if (request.type === 'cancel') {
    cancelled = true;
    return;
  }
  void run(request.input);
});

async function run(input: GenerateInput): Promise<void> {
  cancelled = false;
  const start = performance.now();
  try {
    const molecules = await generateLibrary(input, {
      onProgress: (done, total) => {
        post({ type: 'progress', done, total });
      },
      shouldCancel: () => cancelled,
    });
    post({
      type: 'result',
      molecules,
      durationMs: performance.now() - start,
    });
  } catch (error) {
    if (error instanceof GenerationCancelledError) {
      post({ type: 'cancelled' });
      return;
    }
    post({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function post(response: WorkerResponse): void {
  context.postMessage(response);
}
