import type { Glossary } from 'react-cheminfo/core';

/**
 * Every term the help prose may mark with `[[term]]`, keyed in lower case. A
 * marker whose key is absent degrades to plain text, so prose may be written
 * before its entry exists.
 */
export const GLOSSARY: Glossary = {
  core: {
    title: 'Core',
    summary:
      'The scaffold every molecule of the library keeps. It carries the R groups the fragments replace, and it is stored as a molfile because R groups cannot be read back from SMILES.',
    examples: [
      { code: '[R4]c(c([R3])c1[R2])cnc1[R1]', note: 'The default core.' },
    ],
  },
  'r group': {
    title: 'R group',
    summary:
      'A numbered placeholder atom, R1 to R4, marking a position of the core a fragment may occupy. OpenChemLib stores them as pseudo atoms whose atomic numbers are not contiguous: R1 is 142 but R4 is 129.',
    examples: [{ code: '[R1]C1=CC=CC=C1', note: 'Benzene, varied once.' }],
  },
  fragment: {
    title: 'Fragment',
    summary:
      'A building block that replaces one R group of the core. It must carry exactly one R atom, and its R1 to R4 checkboxes say which positions of the core it may occupy.',
    examples: [{ code: 'CCOC[R]', note: 'Ethoxymethyl, one of the defaults.' }],
  },
  'attachment point': {
    title: 'Attachment point',
    summary:
      'The single R atom of a fragment: the atom that vanishes when the fragment is bonded to the core. Clicking an atom of a fragment drawing moves the attachment point onto that atom.',
    examples: [{ code: 'CC(=O)[R]', note: 'Acetyl bonds by its carbonyl.' }],
  },
  'combinatorial library': {
    title: 'Combinatorial library',
    summary:
      'Every molecule obtained by putting one allowed fragment at each R group of the core. Its size is the product of the fragment counts, one factor per R group, so it grows very fast.',
    examples: [{ code: '8 x 8 x 8 x 8 = 4096', note: 'Eight on four.' }],
  },
  smiles: {
    title: 'SMILES',
    summary:
      'A one line notation for a structure. OpenChemLib writes R groups into SMILES as [R1] tokens but cannot parse them back, so SMILES drives the enumeration and the downloads and never stores a core.',
    examples: [{ code: 'Cc1ccccc1', note: 'Toluene.' }],
  },
  molfile: {
    title: 'Molfile',
    summary:
      'The MDL connection table: a text block listing atoms, coordinates and bonds. It is the only format here that survives a round trip with R groups, so cores and fragments are kept as molfiles.',
    examples: [{ code: 'M  RGP  1   4   1', note: 'Atom 4 is R1.' }],
  },
  idcode: {
    title: 'ID code',
    summary:
      'The canonical OpenChemLib identifier of a structure. Two drawings of one molecule give the same ID code, which is how the enumeration recognises and drops its duplicates.',
    examples: [{ code: 'gOp@DjWkB@@@', note: 'Toluene, without coordinates.' }],
  },
  logp: {
    title: 'logP',
    summary:
      'The decimal logarithm of the octanol/water partition coefficient, a measure of lipophilicity. OpenChemLib predicts it from atom contributions; positive means the molecule prefers octanol.',
    examples: [{ code: 'logP(toluene) = 2.00', note: 'Clearly lipophilic.' }],
  },
  logs: {
    title: 'logS',
    summary:
      'The decimal logarithm of the aqueous solubility in mol/L, so a higher value is a more soluble compound. It is a prediction, usually good to about one log unit.',
    examples: [{ code: 'logS = -1.50', note: 'Benzyl alcohol, 0.03 mol/L.' }],
  },
  psa: {
    title: 'PSA',
    summary:
      'The topological polar surface area in square angstroms: the surface contributed by the nitrogen and oxygen atoms and the hydrogens they carry. Above roughly 140 a molecule rarely crosses a membrane.',
    examples: [{ code: 'PSA(pyridine) = 12.89', note: 'One aromatic N.' }],
  },
  'hydrogen bond donor': {
    title: 'Hydrogen bond donor',
    summary:
      'An electronegative atom, in practice a nitrogen or an oxygen, carrying a hydrogen it can share with an acceptor. The rule of five asks for at most five of them.',
    examples: [{ code: 'OCc1ccccc1', note: 'Benzyl alcohol: one donor.' }],
  },
  'hydrogen bond acceptor': {
    title: 'Hydrogen bond acceptor',
    summary:
      'A nitrogen or an oxygen with a lone pair free to accept a hydrogen bond. The rule of five asks for at most ten of them.',
    examples: [{ code: 'c1ccncc1', note: 'Pyridine: one acceptor.' }],
  },
  'rotatable bond': {
    title: 'Rotatable bond',
    summary:
      'A single, acyclic bond between two non terminal heavy atoms, around which the two halves of the molecule turn freely. The count is the usual proxy for conformational flexibility.',
    examples: [{ code: 'CCC[R]', note: 'Propyl: two rotatable bonds.' }],
  },
  stereocenter: {
    title: 'Stereocenter',
    summary:
      'An atom whose substituents can be arranged in two non superimposable ways. Every stereocenter doubles the number of isomers that would have to be separated in the laboratory.',
    examples: [{ code: 'CC(N)C(=O)O', note: 'Alanine: two enantiomers.' }],
  },
  "lipinski's rule of five": {
    title: "Lipinski's rule of five",
    summary:
      'A rule of thumb for oral bioavailability: molecular weight at most 500, logP at most 5, at most 5 hydrogen bond donors and at most 10 acceptors. All four are axes of the plot.',
    examples: [{ code: 'MW <= 500, logP <= 5', note: 'Two of the four.' }],
  },
  sdf: {
    title: 'SDF',
    summary:
      'A structure data file: molfiles separated by a $$$$ line, each followed by named data fields. The download writes every predicted property as one field, so the file opens in any chemistry package.',
    examples: [{ code: '>  <logP>', note: 'The tag line of one field.' }],
  },
  'parallel coordinates': {
    title: 'Parallel coordinates',
    summary:
      'A plot with one vertical axis per property, where each molecule is a polyline crossing every axis at its own value. Thousands of molecules fit on one screen and correlations show up as bundles of parallel segments.',
    examples: [{ code: 'MW | logP | logS | PSA', note: 'Four of the axes.' }],
  },
  brushing: {
    title: 'Brushing',
    summary:
      'Dragging along an axis to keep only the molecules whose value falls inside the dragged interval. Brushes on several axes combine, and the table and the downloads follow the brushed selection.',
    examples: [{ code: '250 <= MW <= 400', note: 'One drag on the MW axis.' }],
  },
  openchemlib: {
    title: 'OpenChemLib',
    summary:
      'The open source cheminformatics toolkit that draws the structures, enumerates the combinations and predicts the properties. It runs entirely in the browser, compiled to JavaScript.',
    examples: [{ code: 'Molecule.fromSmiles(s)', note: 'Its entry point.' }],
  },
};
