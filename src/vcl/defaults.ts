import { normalizeFragmentMolfile } from './fragment.ts';
import type { Fragment, RGroupKey } from './types.ts';
import { R_GROUP_KEYS } from './types.ts';

/**
 * Pyridine bearing R1 to R4, the core used by the original
 * cheminfo visualizer view this application replaces.
 */
export const DEFAULT_CORE_MOLFILE = `
Actelion Java MolfileCreator 1.0

 10 10  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -1.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2990   -2.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.5981   -1.5000    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.5981    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2990    0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2990   -3.7500    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
   -1.2990   -2.2500    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
   -1.2990    0.7500    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
    1.2990    2.2500    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  1  6  1  0  0  0  0
  3  7  1  0  0  0  0
  2  8  1  0  0  0  0
  1  9  1  0  0  0  0
  6 10  1  0  0  0  0
M  RGP  4   7   1   8   2   9   3  10   4
M  END
`;

interface DefaultFragment {
  /** Human readable name, shown as the fragment label. */
  name: string;
  molfile: string;
}

const DEFAULT_FRAGMENTS: readonly DefaultFragment[] = [
  {
    name: 'acetyl',
    molfile: `
Actelion Java MolfileCreator 1.0

  4  3  0  0  0  0  0  0  0  0999 V2000
    1.7321   -0.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.8660    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.8660    1.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -0.5000    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  2  0  0  0  0
  2  4  1  0  0  0  0
M  RGP  1   4   1
M  END
`,
  },
  {
    name: 'hydroxymethyl',
    molfile: `
Actelion Java MolfileCreator 1.0

  3  2  0  0  0  0  0  0  0  0999 V2000
    1.7321   -0.5000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.8660    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -0.5000    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
M  RGP  1   3   1
M  END
`,
  },
  {
    name: 'N-methylaminomethyl',
    molfile: `
Actelion Java MolfileCreator 1.0

  4  3  0  0  0  0  0  0  0  0999 V2000
    2.5981    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.7321   -0.5000    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    0.8660    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -0.5000    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
M  RGP  1   4   1
M  END
`,
  },
  {
    name: 'ethoxymethyl',
    molfile: `
Actelion Java MolfileCreator 1.0

  5  4  0  0  0  0  0  0  0  0999 V2000
    3.4641   -0.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.5981    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.7321   -0.5000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.8660    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -0.5000    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
  4  5  1  0  0  0  0
M  RGP  1   5   1
M  END
`,
  },
  {
    name: 'phenyl',
    molfile: `
Actelion Java MolfileCreator 1.0

  7  7  0  0  0  0  0  0  0  0999 V2000
    3.8971   -0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.8971    1.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.5981    2.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2990    1.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2990    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -0.7500    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
    2.5981   -0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  1  0  0  0  0
  5  7  2  0  0  0  0
  1  7  1  0  0  0  0
M  RGP  1   6   1
M  END
`,
  },
  {
    name: 'ethyl',
    molfile: `
Actelion Java MolfileCreator 1.0

  3  2  0  0  0  0  0  0  0  0999 V2000
    1.7321   -0.5000    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
    0.8660    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -0.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
M  RGP  1   1   1
M  END
`,
  },
  {
    name: 'propyl',
    molfile: `
Actelion Java MolfileCreator 1.0

  4  3  0  0  0  0  0  0  0  0999 V2000
    2.5981    0.0000    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
    1.7321   -0.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.8660    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -0.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
M  RGP  1   1   1
M  END
`,
  },
  {
    name: 'hydrogen (no substituent)',
    molfile: `
Actelion Java MolfileCreator 1.0

  1  0  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
M  RGP  1   1   1
M  END
`,
  },
];

/**
 * Build the fragment list the application starts with. Together with
 * `DEFAULT_CORE_MOLFILE` these eight fragments enumerate 4096 combinations that
 * collapse to 3872 distinct molecules.
 * @returns A fresh array of fragments, every one of them enabled on every R group.
 */
export function createDefaultFragments(): Fragment[] {
  return DEFAULT_FRAGMENTS.map((fragment) => ({
    id: crypto.randomUUID(),
    name: fragment.name,
    molfile: normalizeFragmentMolfile(fragment.molfile),
    targets: allTargets(true),
    enabled: true,
  }));
}

/**
 * Build the fragment a new drawing starts from: no atoms yet, enabled and
 * allowed at every R group.
 * @returns A fresh empty fragment, with its identifier already generated.
 */
export function createEmptyFragment(): Fragment {
  return {
    id: crypto.randomUUID(),
    name: 'New fragment',
    molfile: '',
    targets: allTargets(true),
    enabled: true,
  };
}

/**
 * Build a targets record with every R group set to the same value.
 * @param value - Value given to R1 to R4.
 * @returns The targets record.
 */
export function allTargets(value: boolean): Record<RGroupKey, boolean> {
  const targets = {} as Record<RGroupKey, boolean>;
  for (const key of R_GROUP_KEYS) {
    targets[key] = value;
  }
  return targets;
}
