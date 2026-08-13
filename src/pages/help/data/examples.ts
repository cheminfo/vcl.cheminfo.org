import { Molecule } from 'openchemlib';

import { allTargets } from '../../../vcl/defaults.ts';
import { normalizeFragmentMolfile } from '../../../vcl/fragment.ts';
import { getRGroupAtomicNo } from '../../../vcl/rgroups.ts';
import type { Fragment, RGroupKey } from '../../../vcl/types.ts';
import { R_GROUP_KEYS } from '../../../vcl/types.ts';

/** One building block of a built in example, authored as SMILES. */
export interface ExampleFragment {
  /** Label the fragment gets once the example is loaded. */
  name: string;
  /**
   * SMILES carrying exactly one iodine atom, which stands for the attachment
   * point and becomes the single R atom of the fragment.
   */
  smiles: string;
}

/** A ready made library the Examples tab can load into the builder. */
export interface LibraryExample {
  id: string;
  title: string;
  description: string;
  /**
   * SMILES of the core. R groups cannot be parsed from SMILES, so every
   * attachment point is written as an iodine atom; the iodines become R1, R2,
   * R3 then R4 in the order the atoms appear.
   */
  coreSmiles: string;
  fragments: ExampleFragment[];
}

/**
 * Expand an example into the core drawing and the fragment list the builder
 * works with, replacing every iodine placeholder by an R group.
 * @param example - Example to expand.
 * @returns A molfile for the core and freshly identified fragments, each of
 * them enabled on every R group of the core.
 */
export function buildExampleLibrary(example: LibraryExample): {
  coreMolfile: string;
  fragments: Fragment[];
} {
  const fragments: Fragment[] = [];
  for (const fragment of example.fragments) {
    fragments.push({
      id: crypto.randomUUID(),
      name: fragment.name,
      molfile: normalizeFragmentMolfile(
        toRGroupMolfile(fragment.smiles, SINGLE_R_GROUP),
      ),
      targets: allTargets(true),
      enabled: true,
    });
  }
  return {
    coreMolfile: toRGroupMolfile(example.coreSmiles, R_GROUP_KEYS),
    fragments,
  };
}

/** The libraries offered on the Examples tab, smallest last. */
export const LIBRARY_EXAMPLES: readonly LibraryExample[] = [
  {
    id: 'substituted-pyridine',
    title: 'Substituted pyridine',
    description:
      'The library the application starts with: a pyridine substituted at four positions by eight fragments. 4096 combinations, collapsing to 3872 distinct molecules because the ring is symmetric once the position next to the nitrogen carries no substituent.',
    coreSmiles: 'Ic1ncc(I)c(I)c1I',
    fragments: [
      { name: 'acetyl', smiles: 'CC(=O)I' },
      { name: 'hydroxymethyl', smiles: 'OCI' },
      { name: 'N-methylaminomethyl', smiles: 'CNCI' },
      { name: 'ethoxymethyl', smiles: 'CCOCI' },
      { name: 'phenyl', smiles: 'Ic1ccccc1' },
      { name: 'ethyl', smiles: 'CCI' },
      { name: 'propyl', smiles: 'CCCI' },
      { name: 'hydrogen (no substituent)', smiles: 'I' },
    ],
  },
  {
    id: 'switchable-hydrophilicity-solvents',
    title: 'Switchable-hydrophilicity solvents',
    description:
      'An acetamidine varied at its three nitrogen substituents by six alkyl groups, in the spirit of the Green Chem. 2015 screening cited under Credits. 216 combinations giving 126 distinct molecules, because the two substituents of the amine nitrogen are interchangeable.',
    coreSmiles: 'CC(=NI)N(I)I',
    fragments: [
      { name: 'methyl', smiles: 'CI' },
      { name: 'ethyl', smiles: 'CCI' },
      { name: 'propyl', smiles: 'CCCI' },
      { name: 'isopropyl', smiles: 'CC(C)I' },
      { name: 'butyl', smiles: 'CCCCI' },
      { name: 'cyclohexyl', smiles: 'C1CCCCC1I' },
    ],
  },
  {
    id: 'biaryl-amide',
    title: 'Biaryl amide scaffold',
    description:
      'A benzanilide varied on both of its rings by eleven substituents, aryl and alkyl mixed with halogens and small polar groups. 121 combinations and 121 distinct molecules: the two positions sit on different rings, so nothing collapses.',
    coreSmiles: 'O=C(Nc1ccc(I)cc1)c1ccc(I)cc1',
    fragments: [
      { name: 'hydrogen (no substituent)', smiles: 'I' },
      { name: 'methyl', smiles: 'CI' },
      { name: 'ethyl', smiles: 'CCI' },
      { name: 'isopropyl', smiles: 'CC(C)I' },
      { name: 'tert-butyl', smiles: 'CC(C)(C)I' },
      { name: 'phenyl', smiles: 'Ic1ccccc1' },
      { name: 'methoxy', smiles: 'IOC' },
      { name: 'trifluoromethyl', smiles: 'FC(F)(F)I' },
      { name: 'chloro', smiles: 'ClI' },
      { name: 'fluoro', smiles: 'FI' },
      { name: 'cyano', smiles: 'N#CI' },
    ],
  },
  {
    id: 'benzene-survey',
    title: 'Simple benzene survey',
    description:
      'One position on a benzene ring and fourteen everyday substituents: 14 combinations and 14 distinct molecules, enumerated instantly. The quickest way to see what the plot, the table and the downloads do.',
    coreSmiles: 'Ic1ccccc1',
    fragments: [
      { name: 'methyl', smiles: 'CI' },
      { name: 'ethyl', smiles: 'CCI' },
      { name: 'isopropyl', smiles: 'CC(C)I' },
      { name: 'tert-butyl', smiles: 'CC(C)(C)I' },
      { name: 'methoxy', smiles: 'IOC' },
      { name: 'hydroxy', smiles: 'OI' },
      { name: 'amino', smiles: 'NI' },
      { name: 'fluoro', smiles: 'FI' },
      { name: 'chloro', smiles: 'ClI' },
      { name: 'bromo', smiles: 'BrI' },
      { name: 'cyano', smiles: 'N#CI' },
      { name: 'nitro', smiles: '[N+](=O)([O-])I' },
      { name: 'trifluoromethyl', smiles: 'FC(F)(F)I' },
      { name: 'carboxy', smiles: 'OC(=O)I' },
    ],
  },
];

const IODINE_ATOMIC_NO = 53;

const SINGLE_R_GROUP: readonly RGroupKey[] = ['R1'];

function toRGroupMolfile(smiles: string, keys: readonly RGroupKey[]): string {
  const molecule = Molecule.fromSmiles(smiles);
  const atomCount = molecule.getAllAtoms();
  let next = 0;
  for (let atom = 0; atom < atomCount; atom++) {
    if (molecule.getAtomicNo(atom) !== IODINE_ATOMIC_NO) continue;
    const key = keys[next];
    if (key === undefined) break;
    next++;
    molecule.setAtomicNo(atom, getRGroupAtomicNo(key));
  }
  molecule.inventCoordinates();
  return molecule.toMolfile();
}
