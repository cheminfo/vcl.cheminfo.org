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

/**
 * Resolvable address of a reference.
 * @param reference - Reference to link to.
 * @returns The `https://doi.org/…` URL.
 */
export function doiUrl(reference: Reference): string {
  return `https://doi.org/${reference.doi}`;
}
