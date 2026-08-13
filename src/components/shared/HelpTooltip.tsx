import type { TooltipProps } from '@blueprintjs/core';
import { Tooltip } from '@blueprintjs/core';
import type { ReactElement, ReactNode } from 'react';

import type { HelpContent } from './helpContent.tsx';
import { helpTooltip } from './helpContent.tsx';

export interface HelpTooltipProps {
  help: HelpContent;
  /**
   * Side the tooltip opens on.
   * @default 'auto'
   */
  placement?: TooltipProps['placement'];
  /** Class of the target wrapper, e.g. `help-icon` for an inline glyph. */
  className?: string;
  /** Element the tooltip is attached to. */
  children: ReactNode;
}

/**
 * Attach the shared tooltip to any element. A target that is absolutely
 * positioned needs `Tooltip` with `renderTarget` instead, because the wrapper
 * this component relies on would then have no size to open against.
 * @param props - What the tooltip says and what it is attached to.
 * @returns The target, wrapped in its tooltip.
 */
export function HelpTooltip(props: HelpTooltipProps): ReactElement {
  const { help, placement, className, children } = props;
  return (
    <Tooltip {...helpTooltip(help)} placement={placement} className={className}>
      {children}
    </Tooltip>
  );
}
