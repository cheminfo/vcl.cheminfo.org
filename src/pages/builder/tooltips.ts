import type { HelpContent } from '../../components/shared/helpContent.tsx';
import type { NumericPropertyKey, RGroupKey } from '../../vcl/types.ts';
import { NUMERIC_PROPERTY_BY_KEY } from '../../vcl/types.ts';
import { helpLink } from '../help/data/helpSections.ts';

export const CORE_PANEL_HELP: HelpContent = {
  title: 'Core structure',
  description:
    'The scaffold every molecule of the library keeps. Draw it, then mark up to four of its positions as R1 to R4.',
  details: [
    'Hover an atom in the editor, type R1 to R4, then press Enter',
    'Each number may be used once, so a core varies at four positions',
  ],
  link: helpLink('draw-the-core'),
};

export const CORE_RESET_HELP: HelpContent = {
  title: 'Reset to default',
  description:
    'Puts the example core and the eight default fragments back. Your current core and fragments are lost.',
};

export const CORE_COPY_SMILES_HELP: HelpContent = {
  title: 'Copy SMILES',
  description:
    'Copies the pseudo SMILES of the core, R groups written as [R1] to [R4]. OpenChemLib cannot read those tokens back, so the core itself is kept as a molfile.',
  link: helpLink('limits-and-caveats'),
};

export const FRAGMENTS_PANEL_HELP: HelpContent = {
  title: 'Fragments',
  description:
    'The substituents the R groups of the core are replaced by. Each one needs exactly one R atom, marking the bond to the core.',
  details: [
    'Tick R1 to R4 to choose the positions it may occupy',
    'A lone R atom stands for "no substituent"',
  ],
  link: helpLink('draw-the-fragments'),
};

export const FRAGMENT_ADD_HELP: HelpContent = {
  title: 'Add fragment',
  description:
    'Appends an empty fragment and opens it in the editor, ticked for every R group of the core.',
};

export const FRAGMENTS_ALL_ON_HELP: HelpContent = {
  title: 'Tick every position',
  description:
    'Lets every fragment replace every R group of the core: the largest library the current fragments can produce.',
};

export const FRAGMENTS_ALL_OFF_HELP: HelpContent = {
  title: 'Untick every position',
  description:
    'Clears the R groups of every fragment, so nothing is enumerated until you tick the positions you want.',
};

export const FRAGMENT_NAME_HELP: HelpContent = {
  title: 'Fragment name',
  description:
    'Click to rename it. The name is a label of the list and of the SDF download; it never changes the structure.',
};

export const FRAGMENT_REMOVE_HELP: HelpContent = {
  title: 'Remove fragment',
  description: 'Deletes it from the list. This cannot be undone.',
};

export const FRAGMENT_SMILES_HELP: HelpContent = {
  title: 'Fragment SMILES',
  description:
    'How the enumerator sees this fragment: its attachment point is the [R] token, replaced by the bond to the core.',
};

export const GENERATE_PANEL_HELP: HelpContent = {
  title: 'Generate',
  description:
    'Attaches every enabled fragment to each R group it targets and keeps one entry per distinct molecule.',
  details: [
    'The run happens in a worker, so the page stays responsive',
    'Two combinations giving one molecule are counted once',
  ],
  link: helpLink('generate-the-library'),
};

export const GENERATE_CANCEL_HELP: HelpContent = {
  title: 'Cancel the run',
  description:
    'Stops the worker. The molecules enumerated so far are discarded, and the previous library stays on screen.',
};

export const COMBINATION_COUNT_HELP: HelpContent = {
  title: 'Combinations',
  description:
    'The product of the fragment counts, one factor per R group of the core. Eight fragments on four positions is 8 x 8 x 8 x 8 = 4096.',
  link: helpLink('generate-the-library'),
};

export const RESULTS_PANEL_HELP: HelpContent = {
  title: 'Library',
  description:
    'Every distinct molecule of the enumeration, with the properties OpenChemLib predicts for it.',
  details: [
    'Drag along an axis to keep only that range',
    'Point at a line to highlight its row, or at a row to highlight its line',
    'The table and the downloads follow the selection',
  ],
  link: helpLink('explore-and-filter'),
};

export const RESULTS_CLEAR_FILTERS_HELP: HelpContent = {
  title: 'Clear filters',
  description:
    'Removes every brush of the plot, so the whole library is shown and downloaded again.',
};

export const RESULTS_COLOUR_BY_HELP: HelpContent = {
  title: 'Colour by',
  description:
    'The property mapped to the colour of the polylines, from blue at its lowest value to red at its highest.',
};

export const RESULTS_COLUMNS_HELP: HelpContent = {
  title: 'Columns',
  description:
    'Which predicted properties the table shows. The plot always draws all of them.',
};

/**
 * What one enabled or disabled fragment switch does.
 * @param enabled - Whether the fragment is currently used.
 * @returns The tooltip of the switch.
 */
export function fragmentEnabledHelp(enabled: boolean): HelpContent {
  return {
    title: enabled ? 'Fragment in use' : 'Fragment ignored',
    description: enabled
      ? 'Click to leave it out of the enumeration while keeping it in the list.'
      : 'Click to use it again in the enumeration.',
  };
}

/**
 * Why a fragment cannot be used.
 * @param error - Message produced by the analysis of the drawing.
 * @returns The tooltip of the warning glyph.
 */
export function fragmentErrorHelp(error: string): HelpContent {
  return {
    title: 'This fragment is ignored',
    description: error,
    link: helpLink('draw-the-fragments'),
  };
}

/**
 * What clicking one R group capsule of a fragment does.
 * @param key - R group the capsule stands for.
 * @param active - Whether the fragment may currently occupy it.
 * @returns The tooltip of the capsule.
 */
export function fragmentTargetHelp(
  key: RGroupKey,
  active: boolean,
): HelpContent {
  return {
    title: active ? `Used at ${key}` : `Not used at ${key}`,
    description: active
      ? `Click to keep this fragment out of the ${key} position of the core.`
      : `Click to let this fragment occupy the ${key} position of the core.`,
  };
}

/**
 * How many fragments may occupy one position of the core.
 * @param key - R group of the core.
 * @param count - Fragments ticked for it.
 * @returns The tooltip of the summary capsule.
 */
export function coreRGroupHelp(key: RGroupKey, count: number): HelpContent {
  if (count === 0) {
    return {
      title: `${key} has no fragment`,
      description: `No fragment is ticked for ${key}, so there is nothing to put there and the library cannot be enumerated. Tick ${key} on at least one fragment.`,
      link: helpLink('draw-the-fragments'),
    };
  }
  return {
    title: `${key} varies over ${count} ${count === 1 ? 'fragment' : 'fragments'}`,
    description: `Every molecule of the library carries one of those ${count} at the ${key} position.`,
  };
}

/**
 * Why the enumeration cannot start, or what it is about to do.
 * @param blocker - Why generation is refused, or `null` when it is possible.
 * @param count - Combinations the current setup expands to.
 * @returns The tooltip of the generate button.
 */
export function generateHelp(
  blocker: string | null,
  count: number,
): HelpContent {
  if (blocker !== null) {
    return {
      title: 'Nothing to enumerate',
      description: blocker,
      link: helpLink('generate-the-library'),
    };
  }
  return {
    title: 'Generate library',
    description: `Enumerates the ${count.toLocaleString('en-US')} combinations of the core and the enabled fragments, and keeps the distinct molecules.`,
    link: helpLink('generate-the-library'),
  };
}

export const TABLE_INDEX_HELP: HelpContent = {
  title: 'Row number',
  description:
    'Position in the table as it is currently sorted, not an identifier of the molecule.',
};

export const TABLE_STRUCTURE_HELP: HelpContent = {
  title: 'Structure',
  description:
    'Drawn from the canonical ID code of the molecule. Click a row to keep that molecule selected.',
};

export const TABLE_FORMULA_HELP: HelpContent = {
  title: 'Molecular formula',
  description:
    'Atom counts of the whole molecule, core and fragments together.',
};

/**
 * How much of the library the brushes currently keep.
 * @param filtered - Molecules kept by the brushes.
 * @param total - Molecules the library holds.
 * @returns The tooltip of the count.
 */
export function selectionHelp(filtered: number, total: number): HelpContent {
  if (filtered === total) {
    return {
      title: `${total.toLocaleString('en-US')} distinct molecules`,
      description:
        'The whole library. Drag along an axis of the plot to keep only a range of one property.',
    };
  }
  return {
    title: `${filtered.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} kept`,
    description:
      'The brushes of the plot hide the rest. The table and the downloads only ever contain what is kept.',
  };
}

/**
 * What one predicted property means, wherever it is named.
 * @param key - Property to describe.
 * @param details - Extra lines, e.g. what clicking the header does.
 * @returns The tooltip of the axis, the header or the checkbox.
 */
export function propertyHelp(
  key: NumericPropertyKey,
  details?: readonly string[],
): HelpContent {
  const property = NUMERIC_PROPERTY_BY_KEY[key];
  return {
    title: property.label,
    description: property.help,
    details,
    link: helpLink('predicted-properties'),
  };
}
