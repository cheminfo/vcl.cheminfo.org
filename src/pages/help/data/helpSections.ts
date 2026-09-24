/** One numbered chapter of the embedded help. */
export interface HelpSection {
  id: string;
  title: string;
  /** Paragraphs, each of which may contain [[term]] markers. */
  paragraphs: readonly string[];
}

/** The whole manual, in reading order. */
export const HELP_SECTIONS = [
  {
    id: 'what-this-tool-does',
    title: 'What this tool does',
    paragraphs: [
      'Draw one [[core]] structure carrying up to four [[R group]] positions, draw the [[fragment]] structures allowed to take those positions, and every allowed combination is enumerated into a [[combinatorial library]]. Each molecule of the result comes with its predicted properties, ready to be filtered and downloaded.',
      'Nothing is installed and nothing is uploaded: the drawing, the enumeration and the property prediction all run inside your browser with [[OpenChemLib]]. A library of a few thousand molecules takes a couple of seconds.',
      'The Examples tab loads four ready made libraries. Loading one replaces the core and the fragments you currently have, so it is the quickest way to see the whole flow before drawing your own.',
    ],
  },
  {
    id: 'draw-the-core',
    title: '1. Draw the core',
    paragraphs: [
      'The [[core]] is the part every member of the library keeps. Draw it in the editor of the first card exactly as you would draw any structure, then mark the positions you want to vary.',
      'An [[R group]] is placed in the editor like any other atom label: move the mouse over the atom, type R1, R2, R3 or R4, and press Enter. The atom becomes that R group, and typing a normal element over it turns it back. A core takes at most four R groups and must use each number at most once.',
      'The core is kept as a [[molfile]] and never as [[SMILES]], because R groups do not survive a SMILES round trip. That is also why the built in examples are authored with iodine placeholders that are turned into R groups the moment they are loaded.',
    ],
  },
  {
    id: 'draw-the-fragments',
    title: '2. Draw the fragments',
    paragraphs: [
      'A [[fragment]] is one substituent. It needs exactly one R atom marking its [[attachment point]], the atom that disappears when the fragment is bonded to the core. Draw the fragment, then click the atom that should carry the new bond: the R atom moves there and any other R atom of the drawing is dropped.',
      'The coloured capsules next to a fragment choose where it may go, one per R group the core carries: a filled capsule is a position the fragment is used at, a pale one a position it is kept out of. Draw a core with only R1 and R2 and only those two capsules appear. Switching every capsule off, or disabling the fragment, keeps it in the list but leaves it out of the enumeration.',
      'A fragment made of a single R atom stands for "no substituent": that position simply keeps its hydrogen. It is one of the eight defaults, and it is what lets a library contain its own partially substituted members.',
    ],
  },
  {
    id: 'generate-the-library',
    title: '3. Generate the library',
    paragraphs: [
      'The bar under the two cards shows how many combinations the current setup expands to: the product of the fragment counts, one factor per R group of the core. Eight fragments on four R groups is 8 x 8 x 8 x 8 = 4096 combinations.',
      'Press Generate and the number of distinct molecules appears. It is usually smaller than the number of combinations, because two combinations that put the same fragments on symmetry equivalent positions give one and the same molecule; duplicates are recognised by their [[idcode]] and kept once. The default library goes from 4096 combinations down to 3872 distinct molecules.',
      'The enumeration runs in a Web Worker, so the page stays responsive and a long run can be cancelled at any moment. Generation is refused when the count is zero, that is when the core has no R group at all or when one of its R groups has no fragment ticked for it, because the enumerator would then never stop.',
    ],
  },
  {
    id: 'explore-and-filter',
    title: '4. Explore and filter',
    paragraphs: [
      'The library is drawn as a [[parallel coordinates]] plot: one vertical axis per property, one polyline per molecule. Bundles of parallel segments are correlated properties; segments that cross between two axes are the opposite.',
      '[[Brushing]] an axis, that is dragging along it, keeps only the molecules whose value falls inside the interval. Brushes on several axes combine, so three drags are enough to isolate the light, soluble and rigid corner of a library. Drag the brush away to remove it.',
      'The table under the plot lists exactly the molecules the brushes keep and scrolls through thousands of rows without slowing down. Clicking a formula or a value copies it, and clicking a drawing copies the SMILES of that molecule; clicking the row number keeps that molecule highlighted in the plot above.',
    ],
  },
  {
    id: 'download',
    title: '5. Download',
    paragraphs: [
      'Three formats are offered: an [[SDF]] carrying every property as a data field, a plain list of [[SMILES]] with one molecule per line, and a CSV whose first row names the columns.',
      'A download always contains the filtered set, that is what the brushes currently keep, and not the whole library. Clear the brushes first when you want everything.',
    ],
  },
  {
    id: 'predicted-properties',
    title: 'Predicted properties',
    paragraphs: [
      'Eight numbers are computed for every molecule: the molecular weight, [[logP]], [[logS]], [[PSA]], the number of [[hydrogen bond donor]] and [[hydrogen bond acceptor]] atoms, the number of [[rotatable bond]]s and the number of [[stereocenter]]s.',
      "The first ones together cover [[Lipinski's rule of five]]: molecular weight at most 500, logP at most 5, at most 5 donors and at most 10 acceptors. Brushing those four axes leaves the compliant part of a library on screen.",
      'Every value is a prediction computed by [[OpenChemLib]] from the connection table alone. They are meant to rank and to triage; they are not measurements, and no conformation, tautomer or salt form is taken into account.',
    ],
  },
  {
    id: 'limits-and-caveats',
    title: 'Limits and caveats',
    paragraphs: [
      'R groups cannot be written in [[SMILES]] — OpenChemLib refuses to parse an [R1] token — so a [[core]] is always stored as a [[molfile]]. The pseudo SMILES carrying [R1] to [R4] that the interface sometimes shows is produced from that molfile and is only ever consumed by the enumerator.',
      'A core takes at most four R groups and a fragment exactly one [[attachment point]]. Fragments are placed independently of one another: the tool does not know that two bulky neighbours would clash, nor that a given combination cannot be synthesised.',
      'The size of a library is a product, so it explodes: ten fragments on four positions is already ten thousand molecules. Start small, look at the plot, then widen. Everything runs in the browser and nothing is uploaded, which also means a very large library is limited by your own machine.',
      'Your core and fragments are saved in the local storage of this browser only. Clearing the site data loses them, so use the downloads to keep a library.',
    ],
  },
] as const satisfies readonly HelpSection[];

/** Anchor of one chapter, narrowed to the chapters that exist. */
export type HelpSectionId = (typeof HELP_SECTIONS)[number]['id'];

/**
 * Address opening the manual at one of its chapters, for the "Learn more" link
 * of a tooltip.
 * @param section - Chapter to open.
 * @returns The path, e.g. `/help/draw-the-core`.
 */
export function helpLink(section: HelpSectionId): string {
  return `/help/${section}`;
}
