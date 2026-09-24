/** The R groups a core structure may carry. */
export type RGroupKey = 'R1' | 'R2' | 'R3' | 'R4';

export const R_GROUP_KEYS: readonly RGroupKey[] = ['R1', 'R2', 'R3', 'R4'];

/** A building block that replaces one R group of the core. */
export interface Fragment {
  /** Stable identifier, generated with `crypto.randomUUID()`. */
  id: string;
  /** Human readable label shown next to the drawing. */
  name: string;
  /** Molfile V2000. Valid when it carries exactly one R atom. */
  molfile: string;
  /** R groups of the core this fragment is allowed to replace. */
  targets: Record<RGroupKey, boolean>;
  /** A disabled fragment is kept in the list but excluded from the enumeration. */
  enabled: boolean;
}

/** Everything derived from the core drawing. */
export interface CoreInfo {
  /**
   * Pseudo-SMILES carrying `[R1]` to `[R4]` tokens, as produced by
   * `Molecule.toSmiles()`. Empty when the core is empty or invalid.
   */
  smilesWithR: string;
  /** R groups actually present in the core, ascending. */
  rGroups: RGroupKey[];
  /** Number of atoms, R atoms included. */
  atomCount: number;
  /** Why the core cannot be used, or `null` when it is usable. */
  error: string | null;
}

/** Everything derived from one fragment drawing. */
export interface FragmentInfo {
  /**
   * Pseudo-SMILES whose single attachment point is written `[R]`, ready for
   * `combineSmiles`. Empty when the fragment is invalid.
   */
  smilesWithR: string;
  /** How many R atoms the drawing carries. Exactly one is required. */
  rCount: number;
  /** Number of atoms, the R atom included. */
  atomCount: number;
  /** Why the fragment cannot be used, or `null` when it is usable. */
  error: string | null;
}

/** A molecule produced by the enumeration, with its predicted properties. */
export interface GeneratedMolecule {
  /** OpenChemLib canonical ID code, unique within a library. */
  idCode: string;
  /** Canonical isomeric SMILES. */
  smiles: string;
  /** Molfile V2000. */
  molfile: string;
  /** Molecular formula, e.g. `C7H9N`. */
  mf: string;
  /** Relative molecular weight. */
  mw: number;
  /** Predicted octanol/water partition coefficient. */
  logP: number;
  /** Predicted aqueous solubility. */
  logS: number;
  /** Polar surface area, in square angstroms. */
  psa: number;
  /** Number of hydrogen bond acceptors. */
  nbHAcceptor: number;
  /** Number of hydrogen bond donors. */
  nbHDonor: number;
  /** Number of rotatable bonds. */
  nbRotatable: number;
  /** Number of stereo centers. */
  nbStereoCenter: number;
}

/** The numeric properties that can be plotted, filtered and tabulated. */
export type NumericPropertyKey =
  | 'mw'
  | 'logP'
  | 'logS'
  | 'psa'
  | 'nbHAcceptor'
  | 'nbHDonor'
  | 'nbRotatable'
  | 'nbStereoCenter';

export interface NumericProperty {
  key: NumericPropertyKey;
  /** Short label used on axes and column headers. */
  label: string;
  /** What the value is, spelled out: `Copy the molecular weight (92.14)`. */
  name: string;
  /** Number of decimals used when the value is displayed. */
  decimals: number;
  /** One sentence shown in the help tooltip. */
  help: string;
}

export const NUMERIC_PROPERTIES: readonly NumericProperty[] = [
  {
    key: 'mw',
    label: 'MW',
    name: 'molecular weight',
    decimals: 2,
    help: 'Relative molecular weight, in g/mol. Lipinski asks for at most 500.',
  },
  {
    key: 'logP',
    label: 'logP',
    name: 'logP',
    decimals: 2,
    help: 'Predicted octanol/water partition coefficient: how lipophilic the molecule is. Lipinski asks for at most 5.',
  },
  {
    key: 'logS',
    label: 'logS',
    name: 'logS',
    decimals: 2,
    help: 'Predicted aqueous solubility, as the decimal logarithm of the molar solubility. Higher is more soluble.',
  },
  {
    key: 'psa',
    label: 'PSA',
    name: 'polar surface area',
    decimals: 2,
    help: 'Topological polar surface area, in square angstroms. Above roughly 140 the molecule rarely crosses membranes.',
  },
  {
    key: 'nbHAcceptor',
    label: 'H acceptors',
    name: 'hydrogen bond acceptor count',
    decimals: 0,
    help: 'Number of hydrogen bond acceptors. Lipinski asks for at most 10.',
  },
  {
    key: 'nbHDonor',
    label: 'H donors',
    name: 'hydrogen bond donor count',
    decimals: 0,
    help: 'Number of hydrogen bond donors. Lipinski asks for at most 5.',
  },
  {
    key: 'nbRotatable',
    label: 'Rotatable',
    name: 'rotatable bond count',
    decimals: 0,
    help: 'Number of freely rotatable bonds, a proxy for conformational flexibility.',
  },
  {
    key: 'nbStereoCenter',
    label: 'Stereocenters',
    name: 'stereocenter count',
    decimals: 0,
    help: 'Number of stereo centers. Each one doubles the number of stereoisomers to synthesise.',
  },
];

export const NUMERIC_PROPERTY_BY_KEY: Readonly<
  Record<NumericPropertyKey, NumericProperty>
> = Object.fromEntries(
  NUMERIC_PROPERTIES.map((property) => [property.key, property]),
) as Record<NumericPropertyKey, NumericProperty>;

/** Inclusive `[min, max]` filter applied to one numeric property. */
export type Range = [number, number];
