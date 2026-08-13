import { expect, test } from 'vitest';

import { analyseCore } from '../../../vcl/core.ts';
import { analyseFragment } from '../../../vcl/fragment.ts';
import type { GenerateInput } from '../../../vcl/generate.ts';
import { countCombinations, generateLibrary } from '../../../vcl/generate.ts';
import type { LibraryExample } from '../data/examples.ts';
import { LIBRARY_EXAMPLES, buildExampleLibrary } from '../data/examples.ts';

/** What each example card claims, so the prose cannot drift from the chemistry. */
const CLAIMED: Record<string, { combinations: number; molecules: number }> = {
  'substituted-pyridine': { combinations: 4096, molecules: 3872 },
  'switchable-hydrophilicity-solvents': { combinations: 216, molecules: 126 },
  'biaryl-amide': { combinations: 121, molecules: 121 },
  'benzene-survey': { combinations: 14, molecules: 14 },
};

test('every example is listed in the claimed counts', () => {
  expect(
    LIBRARY_EXAMPLES.map((example) => example.id).toSorted(),
  ).toStrictEqual(Object.keys(CLAIMED).toSorted());
});

test.for(LIBRARY_EXAMPLES.map((example) => [example.title, example] as const))(
  'example %s builds a usable core and fragments',
  ([, example]: readonly [string, LibraryExample]) => {
    const { coreMolfile, fragments } = buildExampleLibrary(example);

    expect(analyseCore(coreMolfile).error).toBeNull();
    expect(fragments.length).toBeGreaterThan(0);
    for (const fragment of fragments) {
      const info = analyseFragment(fragment.molfile);
      expect(info.error).toBeNull();
      expect(info.rCount).toBe(1);
    }
  },
);

test.for(LIBRARY_EXAMPLES.map((example) => [example.title, example] as const))(
  'example %s enumerates the number of molecules its description claims',
  { timeout: 60_000 },
  async ([, example]: readonly [string, LibraryExample]) => {
    const claimed = CLAIMED[example.id];
    expect(claimed).toBeDefined();

    const input = toGenerateInput(example);
    expect(countCombinations(input)).toBe(claimed?.combinations);

    const molecules = await generateLibrary(input);
    expect(molecules).toHaveLength(claimed?.molecules ?? -1);
    expect(example.description).toContain(String(claimed?.molecules));
  },
);

function toGenerateInput(example: LibraryExample): GenerateInput {
  const { coreMolfile, fragments } = buildExampleLibrary(example);
  const usable: GenerateInput['fragments'] = [];
  for (const fragment of fragments) {
    const info = analyseFragment(fragment.molfile);
    if (info.error !== null) continue;
    usable.push({ smilesWithR: info.smilesWithR, targets: fragment.targets });
  }
  return {
    coreSmilesWithR: analyseCore(coreMolfile).smilesWithR,
    fragments: usable,
  };
}
