import type { TooltipProps } from '@blueprintjs/core';
import type { CSSProperties } from 'react';
import { TooltipHelpContent } from 'react-science/ui';

/** Everything a tooltip of this application may say. */
export interface HelpContent {
  /** First line, in bold: what the thing is, not what its label already says. */
  title: string;
  /** One or two sentences under the title. */
  description?: string;
  /** Short lines listed under the title, typically what a click does. */
  details?: readonly string[];
  /** Keys the action answers to, one box each. */
  shortcuts?: readonly string[];
  /** Target of the "Learn more" link, usually `helpLink(section)`. */
  link?: string;
}

/** The Blueprint props that give a tooltip the shared look and timings. */
export type SharedTooltipProps = Pick<
  TooltipProps,
  | 'content'
  | 'popoverClassName'
  | 'interactionKind'
  | 'hoverOpenDelay'
  | 'hoverCloseDelay'
>;

// Long enough that sweeping the pointer across a row of controls opens nothing.
const HOVER_OPEN_DELAY = 250;
// A tooltip carrying a link has to outlive the pointer leaving its target,
// otherwise the link cannot be reached.
const HOVER_CLOSE_DELAY = 300;
const WIDTH = 280;

/**
 * Blueprint tooltip props rendering `help` in the shared style. Spread them on
 * a `Tooltip`, or pass them as the `tooltipProps` of a react-science `Button`
 * so the tooltip also opens while the button is disabled.
 * @param help - What the tooltip says.
 * @returns The props of the tooltip.
 */
export function helpTooltip(help: HelpContent): SharedTooltipProps {
  const { title, description, details, shortcuts, link } = help;
  const interactive = link !== undefined;

  return {
    content: (
      <TooltipHelpContent
        title={title}
        description={description}
        shortcuts={shortcuts === undefined ? undefined : [...shortcuts]}
        subTitles={details?.map((detail) => ({ title: detail }))}
        link={link}
        style={bodyStyle(help)}
      />
    ),
    popoverClassName: 'help-tooltip',
    hoverOpenDelay: HOVER_OPEN_DELAY,
    hoverCloseDelay: interactive ? HOVER_CLOSE_DELAY : 0,
    interactionKind: interactive ? 'hover' : 'hover-target',
  };
}

function bodyStyle(help: HelpContent): CSSProperties {
  // A tooltip that is only a title has no reason to be as wide as the ones
  // carrying a paragraph.
  const titleOnly =
    help.description === undefined &&
    help.details === undefined &&
    help.link === undefined;

  return {
    // The title inherits the weight; the description and the details reset it
    // in the stylesheet, where a class beats an inherited value.
    fontWeight: 600,
    // Blueprint already pads the popover.
    padding: 0,
    width: titleOnly ? 'max-content' : WIDTH,
    maxWidth: WIDTH,
    // react-science lays the details out above the description; the sentence
    // has to come first, so the stylesheet reorders the two.
    display: 'flex',
    flexDirection: 'column',
  };
}
