import * as OCL from 'openchemlib';
import { combineSmiles } from 'openchemlib-utils';

import type { GeneratedMolecule, RGroupKey } from './types.ts';
import { R_GROUP_KEYS } from './types.ts';

/** Everything the enumeration needs to run. */
export interface GenerateInput {
  /** Pseudo-SMILES of the core, carrying `[R1]` to `[R4]`. */
  coreSmilesWithR: string;
  /** Usable fragments only: each `smilesWithR` carries exactly one `[R]`. */
  fragments: GenerateFragment[];
}

/** One building block of the enumeration. */
export interface GenerateFragment {
  /** Pseudo-SMILES whose single attachment point is written `[R]`. */
  smilesWithR: string;
  /** R groups of the core this fragment is allowed to replace. */
  targets: Record<RGroupKey, boolean>;
}

/** Callbacks that observe and interrupt a run. */
export interface GenerateOptions {
  /**
   * Called with the number of combinations enumerated so far.
   * @default undefined
   */
  onProgress?: (done: number, total: number) => void;
  /**
   * Called between chunks; return true to abort the run.
   * @default undefined
   */
  shouldCancel?: () => boolean;
  /**
   * Shortest delay between two `onProgress` calls, in milliseconds. Zero
   * reports every single combination.
   * @default 100
   */
  progressIntervalMs?: number;
}

/** Thrown by `generateLibrary` when `shouldCancel()` returned true. */
export class GenerationCancelledError extends Error {
  constructor() {
    super('The generation was cancelled.');
    this.name = 'GenerationCancelledError';
  }
}

/**
 * Count the combinations a run will enumerate, without enumerating them.
 * @param input - Core and fragments of the run.
 * @returns The number of combinations, capped at `Number.MAX_SAFE_INTEGER`, or
 * 0 when the input cannot produce anything.
 */
export function countCombinations(input: GenerateInput): number {
  const presentGroups = getPresentRGroups(input.coreSmilesWithR);
  if (presentGroups.length === 0) return 0;

  let total = 1;
  for (const key of presentGroups) {
    const count = countFragmentsTargeting(input.fragments, key);
    if (count === 0) return 0;
    if (total > Number.MAX_SAFE_INTEGER / count) return Number.MAX_SAFE_INTEGER;
    total *= count;
  }
  return total;
}

/**
 * Enumerate the library and compute the predicted properties of every distinct
 * molecule it contains.
 * @param input - Core and fragments of the run.
 * @param options - Progress and cancellation callbacks.
 * @returns The distinct molecules, or an empty array when
 * `countCombinations()` is 0.
 * @throws {GenerationCancelledError} When `shouldCancel()` returned true.
 */
export async function generateLibrary(
  input: GenerateInput,
  options: GenerateOptions = {},
): Promise<GeneratedMolecule[]> {
  // combineSmiles never terminates when it has nothing to combine, so the
  // count is the guard that keeps the calling thread alive.
  const total = countCombinations(input);
  if (total === 0) return [];

  const {
    onProgress,
    shouldCancel,
    progressIntervalMs = PROGRESS_INTERVAL_MS,
  } = options;
  const adapted = input.fragments.map((fragment) => ({
    smiles: fragment.smilesWithR,
    ...fragment.targets,
  }));

  // combineSmiles calls onStep once per combination, but the counter it passes
  // never advances, so the steps are counted here instead.
  let done = 0;
  let lastReport = performance.now();
  const onStep = async () => {
    done++;
    if (shouldCancel?.()) throw new GenerationCancelledError();
    const now = performance.now();
    if (now - lastReport < progressIntervalMs) return;
    lastReport = now;
    onProgress?.(Math.min(done, total), total);
    // A macrotask, not a microtask: only this lets a hosting worker read the
    // messages that carry the cancellation.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    if (shouldCancel?.()) throw new GenerationCancelledError();
  };

  const combined: CombinedMolecule[] = await combineSmiles(
    input.coreSmilesWithR,
    adapted,
    OCL,
    { onStep },
  );

  const molecules: GeneratedMolecule[] = [];
  for (const molecule of combined) {
    molecules.push({
      idCode: molecule.idCode,
      smiles: molecule.smiles,
      molfile: molecule.molfile,
      mf: molecule.mf,
      mw: molecule.mw,
      logP: molecule.logP,
      logS: molecule.logS,
      psa: molecule.PSA,
      nbHAcceptor: molecule.nbHAcceptor,
      nbHDonor: molecule.nbHDonor,
      nbRotatable: molecule.nbRottable,
      nbStereoCenter: molecule.nbStereoCenter,
    });
  }
  onProgress?.(total, total);
  return molecules;
}

const PROGRESS_INTERVAL_MS = 100;

/** One entry of what `combineSmiles` resolves to, with its upstream spellings. */
interface CombinedMolecule {
  idCode: string;
  smiles: string;
  molfile: string;
  mf: string;
  mw: number;
  logP: number;
  logS: number;
  PSA: number;
  nbHAcceptor: number;
  nbHDonor: number;
  nbRottable: number;
  nbStereoCenter: number;
}

function getPresentRGroups(coreSmilesWithR: string): RGroupKey[] {
  const present: RGroupKey[] = [];
  for (const key of R_GROUP_KEYS) {
    if (coreSmilesWithR.includes(`[${key}]`)) present.push(key);
  }
  return present;
}

function countFragmentsTargeting(
  fragments: readonly GenerateFragment[],
  key: RGroupKey,
): number {
  let count = 0;
  for (const fragment of fragments) {
    if (fragment.targets[key]) count++;
  }
  return count;
}
