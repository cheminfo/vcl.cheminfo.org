import type { Intent } from '@blueprintjs/core';

import type { RGroupKey } from '../../vcl/types.ts';

/**
 * Colour every panel uses when it names an R group, so a position keeps the
 * same identity in the core summary, the picker and the fragment list.
 */
export const R_GROUP_INTENT: Record<RGroupKey, Intent> = {
  R1: 'primary',
  R2: 'success',
  R3: 'warning',
  R4: 'danger',
};
