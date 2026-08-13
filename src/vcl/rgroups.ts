import { Molecule } from 'openchemlib';

import type { RGroupKey } from './types.ts';
import { R_GROUP_KEYS } from './types.ts';

/**
 * OpenChemLib atomic number of every R group we support. The numbers are not
 * contiguous (R1 is 142 but R4 is 129), so they must always be looked up rather
 * than derived from the index.
 */
const ATOMIC_NO_BY_KEY: Readonly<Record<RGroupKey, number>> =
  Object.fromEntries(
    R_GROUP_KEYS.map((key) => [
      key,
      Molecule.getAtomicNoFromLabel(key, Molecule.cPseudoAtomsRGroups),
    ]),
  ) as Record<RGroupKey, number>;

const KEY_BY_ATOMIC_NO = new Map<number, RGroupKey>(
  R_GROUP_KEYS.map((key) => [ATOMIC_NO_BY_KEY[key], key]),
);

/**
 * Atomic number of the unnumbered `R` the editor creates when the user types
 * `R` on an atom. A molfile numbers R groups from 1, so this one is written as
 * `M  RGP … 0`, which every reader — OpenChemLib included — ignores, leaving a
 * plain `?` atom behind. It therefore only ever lives inside the editor.
 */
const PLAIN_R_ATOMIC_NO = Molecule.getAtomicNoFromLabel(
  'R',
  Molecule.cPseudoAtomR,
);

/** Atomic number of `?`, what an unnumbered `R` decays to through a molfile. */
const ANY_ATOM_ATOMIC_NO = 0;

/** The R group a fragment's single attachment point is stored as. */
const FRAGMENT_R_GROUP: RGroupKey = 'R1';

/** Custom label that makes a stored `R1` read as a plain `R`. */
const PLAIN_R_LABEL = 'R';

/**
 * Get the OpenChemLib atomic number that renders as the given R group.
 * @param key - R group to look up.
 * @returns The pseudo atom's atomic number.
 */
export function getRGroupAtomicNo(key: RGroupKey): number {
  return ATOMIC_NO_BY_KEY[key];
}

/**
 * Tell which R group an atom represents.
 * @param molecule - Molecule the atom belongs to.
 * @param atom - Index of the atom.
 * @returns The R group, or `null` when the atom is a regular one.
 */
export function getAtomRGroup(
  molecule: Molecule,
  atom: number,
): RGroupKey | null {
  return KEY_BY_ATOMIC_NO.get(molecule.getAtomicNo(atom)) ?? null;
}

/**
 * List the R groups carried by a molecule, ascending and without duplicates.
 * @param molecule - Molecule to inspect.
 * @returns The R groups found.
 */
export function getRGroups(molecule: Molecule): RGroupKey[] {
  const found = new Set<RGroupKey>();
  const atomCount = molecule.getAllAtoms();
  for (let atom = 0; atom < atomCount; atom++) {
    const key = getAtomRGroup(molecule, atom);
    if (key !== null) found.add(key);
  }
  return R_GROUP_KEYS.filter((key) => found.has(key));
}

/**
 * Count how many atoms of a molecule are R groups.
 * @param molecule - Molecule to inspect.
 * @returns The number of R atoms.
 */
export function countRGroupAtoms(molecule: Molecule): number {
  let count = 0;
  const atomCount = molecule.getAllAtoms();
  for (let atom = 0; atom < atomCount; atom++) {
    if (getAtomRGroup(molecule, atom) !== null) count++;
  }
  return count;
}

/**
 * Attach a new R group atom to an existing atom, placing it in the widest gap
 * between that atom's current neighbours so the drawing stays readable.
 * @param molecule - Molecule to modify in place.
 * @param atom - Atom the R group is bonded to.
 * @param key - R group to attach.
 * @returns Index of the atom that was added.
 */
export function attachRGroup(
  molecule: Molecule,
  atom: number,
  key: RGroupKey,
): number {
  const bondLength = molecule.getAverageBondLength(true) || 1;
  const angle = findWidestGapAngle(molecule, atom);
  const added = molecule.addAtom(ATOMIC_NO_BY_KEY[key]);
  molecule.setAtomX(
    added,
    molecule.getAtomX(atom) + bondLength * Math.cos(angle),
  );
  molecule.setAtomY(
    added,
    molecule.getAtomY(atom) + bondLength * Math.sin(angle),
  );
  molecule.setAtomZ(added, 0);
  molecule.addBond(atom, added);
  return added;
}

/**
 * Change which R group an existing R atom represents.
 * @param molecule - Molecule to modify in place.
 * @param atom - Index of an R atom.
 * @param key - R group it should become.
 */
export function setAtomRGroup(
  molecule: Molecule,
  atom: number,
  key: RGroupKey,
): void {
  molecule.setAtomicNo(atom, ATOMIC_NO_BY_KEY[key]);
  molecule.setAtomCustomLabel(atom, null);
}

/**
 * Tell whether an atom is an R the user typed but that carries no number: the
 * editor's own `R`, or the `?` it decays to once written to a molfile.
 * @param molecule - Molecule the atom belongs to.
 * @param atom - Index of the atom.
 * @returns Whether the atom is an unnumbered R.
 */
export function isUnnumberedRAtom(molecule: Molecule, atom: number): boolean {
  const atomicNo = molecule.getAtomicNo(atom);
  return atomicNo === PLAIN_R_ATOMIC_NO || atomicNo === ANY_ATOM_ATOMIC_NO;
}

/**
 * Make an atom the attachment point of a fragment. A fragment has a single one,
 * so its number carries no meaning: the atom is stored as an `R1`, the only
 * spelling a molfile round trips, and carries a custom label so it reads `R`.
 * @param molecule - Molecule to modify in place.
 * @param atom - Index of the atom.
 */
export function setAtomPlainR(molecule: Molecule, atom: number): void {
  molecule.setAtomicNo(atom, ATOMIC_NO_BY_KEY[FRAGMENT_R_GROUP]);
  molecule.setAtomCustomLabel(atom, PLAIN_R_LABEL);
}

/**
 * Give a number to every unnumbered R atom of a core, taking the lowest R group
 * still free each time. Atoms left over once R1 to R4 are all taken keep their
 * `?`, so the core reports them as unusable rather than silently losing them.
 * @param molecule - Molecule to modify in place.
 * @returns Whether anything was numbered.
 */
export function numberRAtoms(molecule: Molecule): boolean {
  let changed = false;
  const atomCount = molecule.getAllAtoms();
  for (let atom = 0; atom < atomCount; atom++) {
    if (!isUnnumberedRAtom(molecule, atom)) continue;
    const used = new Set(getRGroups(molecule));
    const free = R_GROUP_KEYS.find((key) => !used.has(key));
    if (free === undefined) break;
    setAtomRGroup(molecule, atom, free);
    changed = true;
  }
  return changed;
}

/**
 * Turn every R atom of a fragment into the plain `R` the user drew, whatever
 * number it happens to be stored with.
 * @param molecule - Molecule to modify in place.
 * @returns Whether anything changed.
 */
export function unnumberRAtoms(molecule: Molecule): boolean {
  let changed = false;
  const atomCount = molecule.getAllAtoms();
  for (let atom = 0; atom < atomCount; atom++) {
    const isRAtom =
      getAtomRGroup(molecule, atom) !== null ||
      isUnnumberedRAtom(molecule, atom);
    if (!isRAtom || isPlainRAtom(molecule, atom)) continue;
    setAtomPlainR(molecule, atom);
    changed = true;
  }
  return changed;
}

function isPlainRAtom(molecule: Molecule, atom: number): boolean {
  return (
    molecule.getAtomicNo(atom) === ATOMIC_NO_BY_KEY[FRAGMENT_R_GROUP] &&
    molecule.getAtomCustomLabel(atom) === PLAIN_R_LABEL
  );
}

function findWidestGapAngle(molecule: Molecule, atom: number): number {
  const neighbourCount = molecule.getConnAtoms(atom);
  const unsorted: number[] = [];
  for (let i = 0; i < neighbourCount; i++) {
    const neighbour = molecule.getConnAtom(atom, i);
    unsorted.push(
      Math.atan2(
        molecule.getAtomY(neighbour) - molecule.getAtomY(atom),
        molecule.getAtomX(neighbour) - molecule.getAtomX(atom),
      ),
    );
  }

  const angles = unsorted.toSorted((a, b) => a - b);
  const first = angles[0];
  if (first === undefined) return 0;
  if (angles.length === 1) return first + Math.PI;

  let widest = -1;
  let best = 0;
  for (let i = 0; i < angles.length; i++) {
    const from = angles[i];
    if (from === undefined) continue;
    const next = angles[i + 1];
    const to = next === undefined ? first + 2 * Math.PI : next;
    const gap = to - from;
    if (gap > widest) {
      widest = gap;
      best = (from + to) / 2;
    }
  }
  return best;
}
