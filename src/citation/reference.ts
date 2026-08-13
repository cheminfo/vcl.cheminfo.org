/** One author of a reference, as the citation styles need them. */
export interface ReferenceAuthor {
  /** Initials or first name, e.g. `J. R.`. */
  given: string;
  /** Family name, e.g. `Vanderveen`. */
  family: string;
}

/** A journal article, with everything the citation formats need. */
export interface Reference {
  authors: readonly ReferenceAuthor[];
  title: string;
  /** Full journal name, e.g. `Green Chemistry`. */
  journal: string;
  /** Abbreviated journal name, e.g. `Green Chem.`. */
  journalAbbreviation: string;
  year: number;
  volume: string;
  issue: string;
  firstPage: string;
  lastPage: string;
  doi: string;
  publisher: string;
}

/** The article this tool implements. Metadata from Crossref. */
export const PAPER: Reference = {
  authors: [
    { given: 'J. R.', family: 'Vanderveen' },
    { given: 'L.', family: 'Patiny' },
    { given: 'C. B.', family: 'Chalifoux' },
    { given: 'M. J.', family: 'Jessop' },
    { given: 'P. G.', family: 'Jessop' },
  ],
  title:
    'A virtual screening approach to identifying the greenest compound for a task: application to switchable-hydrophilicity solvents',
  journal: 'Green Chemistry',
  journalAbbreviation: 'Green Chem.',
  year: 2015,
  volume: '17',
  issue: '12',
  firstPage: '5182',
  lastPage: '5188',
  doi: '10.1039/C5GC01022E',
  publisher: 'Royal Society of Chemistry',
};

/**
 * Resolvable address of a reference.
 * @param reference - Reference to link to.
 * @returns The `https://doi.org/…` URL.
 */
export function doiUrl(reference: Reference): string {
  return `https://doi.org/${reference.doi}`;
}
