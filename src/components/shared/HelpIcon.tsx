import { Icon } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import { HelpTooltip } from './HelpTooltip.tsx';
import type { HelpContent } from './helpContent.tsx';

export interface HelpIconProps {
  /** What the tooltip says. */
  help: HelpContent;
}

/**
 * Small info glyph that reveals a tooltip, vertically centred on the label line.
 * Wrap the label text and this glyph in a `<span className="help-label">`.
 * @param props - Component properties.
 * @param props.help - What the tooltip says.
 * @returns The glyph and the tooltip it opens on hover.
 */
export function HelpIcon(props: HelpIconProps): ReactElement {
  return (
    <HelpTooltip help={props.help} className="help-icon" placement="bottom">
      <Icon icon="info-sign" size={12} />
    </HelpTooltip>
  );
}
