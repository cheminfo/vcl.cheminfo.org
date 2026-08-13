import type { GenerateInput } from '../vcl/generate.ts';
import type { GeneratedMolecule } from '../vcl/types.ts';

import type {
  CancelRequestMessage,
  GenerateRequestMessage,
  WorkerResponse,
} from './protocol.ts';

/** Callbacks that observe a run driven from the main thread. */
export interface RunGenerationOptions {
  /**
   * Progress callback.
   * @default undefined
   */
  onProgress?: (done: number, total: number) => void;
}

/** What one finished run produced. */
export interface GenerationResult {
  molecules: GeneratedMolecule[];
  durationMs: number;
}

/**
 * Run one generation in a dedicated worker, so the enumeration never blocks the
 * user interface. Starting a run supersedes the previous one, whose promise
 * then resolves to `null`.
 * @param input - Core and fragments of the run.
 * @param options - Progress callback.
 * @returns The library and how long it took, or `null` when the run was
 * cancelled or superseded.
 */
export function runGeneration(
  input: GenerateInput,
  options: RunGenerationOptions = {},
): Promise<GenerationResult | null> {
  activeRun?.abandon();

  const worker = new Worker(new URL('generate.worker.ts', import.meta.url), {
    type: 'module',
  });

  return new Promise<GenerationResult | null>((resolve, reject) => {
    const settle = () => {
      worker.terminate();
      if (activeRun?.worker === worker) activeRun = null;
    };

    activeRun = {
      worker,
      abandon: () => {
        settle();
        resolve(null);
      },
    };

    worker.addEventListener(
      'message',
      (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        if (response.type === 'progress') {
          options.onProgress?.(response.done, response.total);
          return;
        }
        settle();
        if (response.type === 'result') {
          resolve({
            molecules: response.molecules,
            durationMs: response.durationMs,
          });
        } else if (response.type === 'cancelled') {
          resolve(null);
        } else {
          reject(new Error(response.message));
        }
      },
    );

    worker.addEventListener('error', (event) => {
      settle();
      reject(
        new Error(
          event.message === ''
            ? 'The generation worker failed to start.'
            : event.message,
        ),
      );
    });

    const request: GenerateRequestMessage = { type: 'generate', input };
    worker.postMessage(request);
  });
}

/**
 * Ask the run in flight to stop. Its promise resolves to `null` once the worker
 * has observed the request. Does nothing when no run is in flight.
 */
export function cancelGeneration(): void {
  const request: CancelRequestMessage = { type: 'cancel' };
  activeRun?.worker.postMessage(request);
}

interface ActiveRun {
  worker: Worker;
  /** Terminate the worker and resolve its pending promise to `null`. */
  abandon: () => void;
}

let activeRun: ActiveRun | null = null;
