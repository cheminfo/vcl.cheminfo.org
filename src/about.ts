/**
 * What the site says about itself, as the record the shared `AboutPage` draws
 * at `/about`.
 *
 * The prose is the site's; the order of the sections, the credit list and the
 * licence block belong to the family. The paper the approach comes from was a
 * chapter of the manual before it was a citation, and is kept here because a
 * method somebody publishes with has to be citable from the page itself.
 */

import { BUILD_INFO } from 'react-cheminfo/build-info';
import type { AboutContent, CitedWork } from 'react-cheminfo/core';
import { PLATFORM_WORK } from 'react-cheminfo/core';

import { PAPER } from './paper.ts';

/** The article this tool implements, as the work the About asks for. */
const SCREENING_WORK: CitedWork = {
  reference: PAPER,
  what: 'The virtual screening approach',
  note: 'Cite it for the method this tool enumerates and screens with.',
};

/** The record the `/about` page is drawn from. */
export const ABOUT: AboutContent = {
  siteId: 'vcl',
  // Which release, built when, from which commit: the build says so,
  // because a version written by hand is wrong by the next release.
  build: BUILD_INFO,
  what: 'Draw a core carrying R groups and the fragments that may fill them, enumerate every product, and screen the library on predicted properties.',
  can: [
    'Draw a core with up to four R groups, and the fragments each one accepts.',
    'Enumerate every combination in a Web Worker, duplicate structures dropped.',
    'Read eight predicted properties per molecule, the Lipinski four included.',
    'Brush any axis of the parallel coordinates plot to filter the library.',
    'Download the filtered set as SDF, SMILES or CSV.',
    'Open one of four ready-made libraries to see the whole flow at once.',
  ],
  paragraphs: [
    'The approach is the virtual screening of Vanderveen et al., cited below: enumerate a library around a core, then rank it on predicted properties instead of measuring it. The enumeration and the predictions run on the OpenChemLib engine.',
    'The drawing, the enumeration and the property prediction all run in your browser, and nothing is uploaded. Your core and your fragments are kept in this browser alone, so clearing the site data loses them: download a library you want to keep.',
  ],
  credits: [
    'openchemlib',
    'openchemlib-utils',
    'react-ocl',
    'react-mf',
    'blueprint',
    'react-science',
    'react-cheminfo',
    'react',
    'vite',
  ],
  cite: [PLATFORM_WORK, SCREENING_WORK],
};
