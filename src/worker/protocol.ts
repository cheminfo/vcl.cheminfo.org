import type { GenerateInput } from '../vcl/generate.ts';
import type { GeneratedMolecule } from '../vcl/types.ts';

/** Ask the worker to enumerate a library. */
export interface GenerateRequestMessage {
  type: 'generate';
  input: GenerateInput;
}

/** Ask the worker to abort the run in flight. */
export interface CancelRequestMessage {
  type: 'cancel';
}

/** Everything the main thread may post to the worker. */
export type WorkerRequest = GenerateRequestMessage | CancelRequestMessage;

/** How many combinations have been enumerated so far. */
export interface ProgressResponseMessage {
  type: 'progress';
  done: number;
  total: number;
}

/** The finished library, with the wall clock time the run took. */
export interface ResultResponseMessage {
  type: 'result';
  molecules: GeneratedMolecule[];
  durationMs: number;
}

/** The run stopped because a cancellation was requested. */
export interface CancelledResponseMessage {
  type: 'cancelled';
}

/** The run failed. */
export interface ErrorResponseMessage {
  type: 'error';
  message: string;
}

/** Everything the worker may post back to the main thread. */
export type WorkerResponse =
  | ProgressResponseMessage
  | ResultResponseMessage
  | CancelledResponseMessage
  | ErrorResponseMessage;
