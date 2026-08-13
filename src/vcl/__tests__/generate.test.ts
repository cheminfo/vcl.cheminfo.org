import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import { analyseCore } from '../core.ts';
import {
  DEFAULT_CORE_MOLFILE,
  allTargets,
  createDefaultFragments,
} from '../defaults.ts';
import { analyseFragment } from '../fragment.ts';
import type { GenerateInput } from '../generate.ts';
import {
  GenerationCancelledError,
  countCombinations,
  generateLibrary,
} from '../generate.ts';

const DEFAULT_COMBINATIONS = 4096;
const DEFAULT_MOLECULES = 3872;

test('the default library expands to 4096 combinations', () => {
  const input = buildDefaultInput();
  expect(input.fragments).toHaveLength(8);
  expect(analyseCore(DEFAULT_CORE_MOLFILE).rGroups).toStrictEqual([
    'R1',
    'R2',
    'R3',
    'R4',
  ]);
  expect(countCombinations(input)).toBe(DEFAULT_COMBINATIONS);
});

test(
  'the default library collapses to 3872 distinct molecules',
  { timeout: 60_000 },
  async () => {
    let lastDone = 0;
    let lastTotal = 0;
    const molecules = await generateLibrary(buildDefaultInput(), {
      onProgress: (done, total) => {
        lastDone = done;
        lastTotal = total;
      },
    });

    expect(molecules).toHaveLength(DEFAULT_MOLECULES);
    expect(lastDone).toBe(DEFAULT_COMBINATIONS);
    expect(lastTotal).toBe(DEFAULT_COMBINATIONS);

    const idCodes = new Set<string>();
    let weighed = 0;
    let named = 0;
    for (const molecule of molecules) {
      if (Number.isFinite(molecule.mw) && molecule.mw > 0) weighed++;
      if (molecule.mf.length > 0 && molecule.idCode.length > 0) named++;
      idCodes.add(molecule.idCode);
    }
    expect(weighed).toBe(DEFAULT_MOLECULES);
    expect(named).toBe(DEFAULT_MOLECULES);
    expect(idCodes.size).toBe(DEFAULT_MOLECULES);
  },
);

test('an R group of the core without any fragment enumerates nothing', async () => {
  const input = buildDefaultInput();
  for (const fragment of input.fragments) {
    fragment.targets = { ...fragment.targets, R3: false };
  }

  expect(countCombinations(input)).toBe(0);
  // Resolving at all is the assertion: the generator loops forever when one of
  // the core's R groups has nothing to put there.
  await expect(generateLibrary(input)).resolves.toStrictEqual([]);
});

test('a core without any R group enumerates nothing', async () => {
  const input: GenerateInput = {
    coreSmilesWithR: 'c1ccccc1',
    fragments: [{ smilesWithR: 'C[R]', targets: allTargets(true) }],
  };

  expect(countCombinations(input)).toBe(0);
  await expect(generateLibrary(input)).resolves.toStrictEqual([]);
});

test('two fragments on one R group give toluene and ethylbenzene', async () => {
  const onlyR1 = { ...allTargets(false), R1: true };
  const input: GenerateInput = {
    coreSmilesWithR: '[R1]C1=CC=CC=C1',
    fragments: [
      { smilesWithR: 'C[R]', targets: onlyR1 },
      { smilesWithR: 'CC[R]', targets: onlyR1 },
    ],
  };

  expect(countCombinations(input)).toBe(2);

  const molecules = await generateLibrary(input);
  expect(molecules).toHaveLength(2);

  const found = new Set<string>();
  for (const molecule of molecules) {
    found.add(molecule.smiles);
  }
  expect(found).toStrictEqual(
    new Set([
      Molecule.fromSmiles('Cc1ccccc1').toIsomericSmiles(),
      Molecule.fromSmiles('CCc1ccccc1').toIsomericSmiles(),
    ]),
  );

  const toluene = molecules.find((molecule) => molecule.mf === 'C7H8');
  expect(toluene?.mw).toBeCloseTo(92.1405, 3);
  expect(toluene?.psa).toBe(0);
  expect(toluene?.nbRotatable).toBe(0);
  expect(toluene?.nbHAcceptor).toBe(0);
  expect(toluene?.nbHDonor).toBe(0);
  expect(toluene?.nbStereoCenter).toBe(0);
});

test('progress advances one combination at a time', async () => {
  const onlyR1 = { ...allTargets(false), R1: true };
  const input: GenerateInput = {
    coreSmilesWithR: '[R1]C1=CC=C([R2])C=C1',
    fragments: [
      { smilesWithR: 'C[R]', targets: allTargets(true) },
      { smilesWithR: 'CC[R]', targets: allTargets(true) },
      { smilesWithR: 'CCC[R]', targets: onlyR1 },
    ],
  };
  expect(countCombinations(input)).toBe(6);

  const reported: number[] = [];
  await generateLibrary(input, {
    progressIntervalMs: 0,
    onProgress: (done, total) => {
      expect(total).toBe(6);
      reported.push(done);
    },
  });

  expect(reported).toStrictEqual([1, 2, 3, 4, 5, 6, 6]);
});

test('a run that is cancelled on its first step rejects', async () => {
  await expect(
    generateLibrary(buildDefaultInput(), { shouldCancel: () => true }),
  ).rejects.toThrow(GenerationCancelledError);
});

function buildDefaultInput(): GenerateInput {
  const fragments: GenerateInput['fragments'] = [];
  for (const fragment of createDefaultFragments()) {
    fragments.push({
      smilesWithR: analyseFragment(fragment.molfile).smilesWithR,
      targets: fragment.targets,
    });
  }
  return {
    coreSmilesWithR: analyseCore(DEFAULT_CORE_MOLFILE).smilesWithR,
    fragments,
  };
}
