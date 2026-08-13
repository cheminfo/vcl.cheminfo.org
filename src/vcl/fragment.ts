import type { Molecule } from 'openchemlib';

import { parseMolfile } from './core.ts';
import {
  attachRGroup,
  countRGroupAtoms,
  getAtomRGroup,
  isUnnumberedRAtom,
  setAtomPlainR,
  unnumberRAtoms,
} from './rgroups.ts';
import type { FragmentInfo } from './types.ts';

const EMPTY_ERROR = 'Draw a fragment.';
const NO_R_ATOM_ERROR =
  'The fragment needs exactly one R atom to mark where it attaches to the core.';
const R_TOKEN = /\[R[1-4]?\]/u;

/**
 * Describe a fragment drawing: the pseudo-SMILES `combineSmiles` consumes, how
 * many attachment points were drawn and the reason it cannot be used yet.
 * @param molfile - Molfile V2000 of the fragment, possibly empty.
 * @returns The analysis of the fragment.
 */
export function analyseFragment(molfile: string): FragmentInfo {
  const molecule = parseMolfile(molfile);
  if (molecule === null || molecule.getAllAtoms() === 0) {
    return { smilesWithR: '', rCount: 0, atomCount: 0, error: EMPTY_ERROR };
  }

  unnumberRAtoms(molecule);
  const rCount = countRGroupAtoms(molecule);
  const error = findError(rCount);
  return {
    smilesWithR: error === null ? toFragmentSmiles(molecule) : '',
    rCount,
    atomCount: molecule.getAllAtoms(),
    error,
  };
}

/**
 * Make one atom the single point where the fragment attaches to the core, by
 * dropping every R atom the drawing already carries.
 * @param molfile - Molfile V2000 of the fragment.
 * @param atom - Index of the clicked atom.
 * @returns A new molfile, or the given one when the atom is already the single
 * attachment point.
 */
export function setFragmentAttachment(molfile: string, atom: number): string {
  const molecule = parseMolfile(molfile);
  if (molecule === null || atom < 0 || atom >= molecule.getAllAtoms()) {
    return molfile;
  }

  const rAtoms = listRGroupAtoms(molecule);
  const first = rAtoms[0];
  if (rAtoms.length === 1 && first === atom) return molfile;

  // Deleting in descending order keeps the indexes of the atoms not yet
  // deleted, so only the target has to be shifted back.
  let removedBefore = 0;
  for (let index = rAtoms.length - 1; index >= 0; index--) {
    const rAtom = rAtoms[index];
    if (rAtom === undefined || rAtom === atom) continue;
    molecule.deleteAtom(rAtom);
    if (rAtom < atom) removedBefore++;
  }

  const target = atom - removedBefore;
  const rAtom =
    getAtomRGroup(molecule, target) === null
      ? attachRGroup(molecule, target, 'R1')
      : target;
  setAtomPlainR(molecule, rAtom);
  return molecule.toMolfile();
}

/**
 * Make the attachment point the drawing carries read as a plain `R`. The number
 * a molfile forces on an R group means nothing on a fragment, which has a
 * single attachment point, and a `R` typed in the editor comes back as `?`.
 * @param molfile - Molfile V2000 of the fragment, as the editor emitted it.
 * @returns A new molfile, or the given one when nothing had to change.
 */
export function normalizeFragmentMolfile(molfile: string): string {
  const molecule = parseMolfile(molfile);
  if (molecule === null || !unnumberRAtoms(molecule)) return molfile;
  return molecule.toMolfile();
}

function findError(rCount: number): string | null {
  if (rCount === 0) return NO_R_ATOM_ERROR;
  if (rCount > 1) {
    return `The fragment has ${rCount} R atoms; it must have exactly one.`;
  }
  return null;
}

function toFragmentSmiles(molecule: Molecule): string {
  return molecule.toIsomericSmiles().replace(R_TOKEN, '[R]');
}

function listRGroupAtoms(molecule: Molecule): number[] {
  const rAtoms: number[] = [];
  const atomCount = molecule.getAllAtoms();
  for (let atom = 0; atom < atomCount; atom++) {
    const isRAtom =
      getAtomRGroup(molecule, atom) !== null ||
      isUnnumberedRAtom(molecule, atom);
    if (isRAtom) rAtoms.push(atom);
  }
  return rAtoms;
}
