import { Molecule } from 'openchemlib';

import { getAtomRGroup, getRGroups, numberRAtoms } from './rgroups.ts';
import type { CoreInfo, RGroupKey } from './types.ts';
import { R_GROUP_KEYS } from './types.ts';

const EMPTY_ERROR = 'Draw a core structure.';
const NO_R_GROUP_ERROR =
  'The core needs at least one R group. Hover an atom in the editor, type R1 and press Enter.';

/**
 * Describe a core drawing: the pseudo-SMILES the enumeration needs, the R
 * groups it offers and the reason it cannot be used yet.
 * @param molfile - Molfile V2000 of the core, possibly empty.
 * @returns The analysis of the core.
 */
export function analyseCore(molfile: string): CoreInfo {
  const molecule = parseMolfile(molfile);
  if (molecule === null || molecule.getAllAtoms() === 0) {
    return {
      smilesWithR: '',
      rGroups: [],
      atomCount: 0,
      error: EMPTY_ERROR,
    };
  }

  numberRAtoms(molecule);
  const rGroups = getRGroups(molecule);
  const error = findError(molecule, rGroups);
  return {
    smilesWithR: error === null ? molecule.toIsomericSmiles() : '',
    rGroups,
    atomCount: molecule.getAllAtoms(),
    error,
  };
}

/**
 * Parse a molfile into an OpenChemLib molecule.
 * @param molfile - Molfile V2000, possibly empty.
 * @returns The molecule, or `null` when the input is blank or unparsable.
 */
export function parseMolfile(molfile: string): Molecule | null {
  if (molfile.trim() === '') return null;
  try {
    return Molecule.fromMolfile(molfile);
  } catch {
    return null;
  }
}

/**
 * Number the R atoms the editor could not keep numbered. Typing `R` on an atom
 * gives an R group without a number, which a molfile cannot carry, so the atom
 * comes back as `?`; this gives it the lowest free R group instead.
 * @param molfile - Molfile V2000 of the core, as the editor emitted it.
 * @returns A new molfile, or the given one when there was nothing to number.
 */
export function normalizeCoreMolfile(molfile: string): string {
  const molecule = parseMolfile(molfile);
  if (molecule === null || !numberRAtoms(molecule)) return molfile;
  return molecule.toMolfile();
}

function findError(molecule: Molecule, rGroups: RGroupKey[]): string | null {
  if (rGroups.length === 0) return NO_R_GROUP_ERROR;
  const duplicate = findDuplicateRGroup(molecule);
  if (duplicate !== null) {
    return `${duplicate} is used twice. Each R group may only appear once.`;
  }
  return null;
}

function findDuplicateRGroup(molecule: Molecule): RGroupKey | null {
  const counts = new Map<RGroupKey, number>();
  const atomCount = molecule.getAllAtoms();
  for (let atom = 0; atom < atomCount; atom++) {
    const key = getAtomRGroup(molecule, atom);
    if (key === null) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const key of R_GROUP_KEYS) {
    if ((counts.get(key) ?? 0) > 1) return key;
  }
  return null;
}
