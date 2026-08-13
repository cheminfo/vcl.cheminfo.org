import { computed, effect, signal } from '@preact/signals-react';

import { analyseCore } from '../vcl/core.ts';
import { analyseFragment } from '../vcl/fragment.ts';
import type { GenerateInput } from '../vcl/generate.ts';
import { countCombinations } from '../vcl/generate.ts';
import type {
  CoreInfo,
  Fragment,
  FragmentInfo,
  GeneratedMolecule,
  NumericPropertyKey,
} from '../vcl/types.ts';
import { NUMERIC_PROPERTIES, R_GROUP_KEYS } from '../vcl/types.ts';
import { cancelGeneration, runGeneration } from '../worker/client.ts';

import { preferences } from './preferences.ts';
import {
  clearBrushRanges,
  clearHoveredMolecules,
  selectMolecule,
  view,
} from './view.ts';

/** Where the enumeration currently stands. */
export type GenerationStatus =
  'idle' | 'running' | 'done' | 'cancelled' | 'error';

/** The enumerated library and the progress of the run that produced it. */
export const data = {
  molecules: signal<GeneratedMolecule[]>([]),
  status: signal<GenerationStatus>('idle'),
  progressDone: signal<number>(0),
  progressTotal: signal<number>(0),
  durationMs: signal<number | null>(null),
  error: signal<string | null>(null),
};

/** Everything derived from the core drawing. */
export const coreInfo = computed<CoreInfo>(() =>
  analyseCore(preferences.library.coreMolfile.value),
);

/** Analysis of every fragment drawing, keyed by fragment id. */
export const fragmentInfos = computed<Map<string, FragmentInfo>>(() => {
  const infos = new Map<string, FragmentInfo>();
  for (const fragment of preferences.library.fragments.value) {
    infos.set(fragment.id, analyseFragment(fragment.molfile));
  }
  return infos;
});

/** The fragments that are enabled and whose drawing can actually be combined. */
export const usableFragments = computed<Fragment[]>(() => {
  const infos = fragmentInfos.value;
  const usable: Fragment[] = [];
  for (const fragment of preferences.library.fragments.value) {
    if (!fragment.enabled) continue;
    const info = infos.get(fragment.id);
    if (info?.error !== null) continue;
    usable.push(fragment);
  }
  return usable;
});

/** The core and fragment SMILES handed to the enumeration. */
export const generateInput = computed<GenerateInput>(() => {
  const infos = fragmentInfos.value;
  const fragments: GenerateInput['fragments'] = [];
  for (const fragment of usableFragments.value) {
    const info = infos.get(fragment.id);
    if (info === undefined) continue;
    fragments.push({
      smilesWithR: info.smilesWithR,
      targets: fragment.targets,
    });
  }
  return { coreSmilesWithR: coreInfo.value.smilesWithR, fragments };
});

/**
 * How many combinations the current library expands to. Zero means the
 * enumeration must not be started: the generator would never terminate.
 */
export const combinationCount = computed<number>(() => {
  if (coreInfo.value.error !== null) return 0;
  return countCombinations(generateInput.value);
});

/**
 * What the enumeration would produce, as a string. Editing a drawing, moving an
 * attachment point, retargeting or disabling a fragment changes it; renaming one
 * does not.
 */
export const generationSignature = computed<string>(() => {
  const input = generateInput.value;
  const parts: string[] = [input.coreSmilesWithR];
  for (const fragment of input.fragments) {
    let targets = '';
    for (const key of R_GROUP_KEYS) {
      targets += fragment.targets[key] ? '1' : '0';
    }
    parts.push(`${targets} ${fragment.smilesWithR}`);
  }
  return parts.join('\n');
});

/** Why generation is impossible right now, or null. */
export const generationBlocker = computed<string | null>(() => {
  const error = coreInfo.value.error;
  if (error !== null) return error;
  if (combinationCount.value === 0) {
    return 'Add at least one fragment for every R group of the core.';
  }
  return null;
});

interface ActiveRange {
  key: NumericPropertyKey;
  minimum: number;
  maximum: number;
}

/** The molecules kept by the current parallel-coordinates brushes. */
export const filteredMolecules = computed<GeneratedMolecule[]>(() => {
  const molecules = data.molecules.value;
  const ranges = view.brushRanges.value;

  const active: ActiveRange[] = [];
  for (const property of NUMERIC_PROPERTIES) {
    const range = ranges[property.key];
    if (range === undefined) continue;
    active.push({ key: property.key, minimum: range[0], maximum: range[1] });
  }
  if (active.length === 0) return molecules;

  const kept: GeneratedMolecule[] = [];
  for (const molecule of molecules) {
    let inside = true;
    for (const range of active) {
      const value = molecule[range.key];
      if (value < range.minimum || value > range.maximum) {
        inside = false;
        break;
      }
    }
    if (inside) kept.push(molecule);
  }
  return kept;
});

/**
 * Enumerate the library in the worker, tracking progress and duration. A second
 * call while a run is in flight is ignored.
 */
export async function runGenerationAction(): Promise<void> {
  if (data.status.value === 'running') return;

  const input = generateInput.value;
  const token = ++runToken;
  data.status.value = 'running';
  data.error.value = null;
  data.durationMs.value = null;
  data.progressDone.value = 0;
  data.progressTotal.value = combinationCount.value;

  try {
    const result = await runGeneration(input, {
      onProgress(done: number, total: number) {
        if (token !== runToken) return;
        data.progressDone.value = done;
        data.progressTotal.value = total;
      },
    });
    // The run was disowned while it was in flight, e.g. because the library it
    // enumerates was edited: its molecules describe drawings that are gone.
    if (token !== runToken) return;
    if (result === null) {
      data.status.value = 'cancelled';
      return;
    }
    clearBrushRanges();
    selectMolecule(null);
    clearHoveredMolecules();
    data.molecules.value = result.molecules;
    data.durationMs.value = result.durationMs;
    data.status.value = 'done';
  } catch (error) {
    if (token !== runToken) return;
    data.status.value = 'error';
    data.error.value =
      error instanceof Error ? error.message : 'The generation failed.';
  }
}

let runToken = 0;

/** Ask the worker to stop the run in flight. */
export function cancelGenerationAction(): void {
  cancelGeneration();
}

/**
 * Throw the enumerated library away and go back to the idle state. A run in
 * flight is stopped and disowned, so it can no longer fill the results back in.
 */
export function clearResults(): void {
  runToken++;
  cancelGeneration();
  clearBrushRanges();
  selectMolecule(null);
  clearHoveredMolecules();
  data.molecules.value = [];
  data.status.value = 'idle';
  data.progressDone.value = 0;
  data.progressTotal.value = 0;
  data.durationMs.value = null;
  data.error.value = null;
}

/**
 * Throw the library away as soon as the core or the fragments it was enumerated
 * from change, so the molecule count and the duration on screen always describe
 * the drawings on screen.
 * @returns A function that stops watching.
 */
export function watchLibraryEdits(): () => void {
  let previous = generationSignature.peek();
  return effect(() => {
    const signature = generationSignature.value;
    if (signature === previous) return;
    previous = signature;
    if (hasResults()) clearResults();
  });
}

function hasResults(): boolean {
  return (
    data.status.peek() !== 'idle' ||
    data.molecules.peek().length > 0 ||
    data.error.peek() !== null
  );
}
