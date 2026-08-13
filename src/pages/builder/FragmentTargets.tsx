import { Classes, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { MouseEvent, ReactElement } from 'react';

import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import { coreInfo } from '../../state/data.ts';
import { toggleFragmentTarget } from '../../state/preferences.ts';
import type { Fragment, RGroupKey } from '../../vcl/types.ts';

import { R_GROUP_INTENT } from './rGroupIntent.ts';
import { fragmentTargetHelp } from './tooltips.ts';

export interface FragmentTargetsProps {
  fragment: Fragment;
  /**
   * Called instead of the library action when a capsule is clicked, so a
   * fragment that is not in the library yet can be edited too.
   */
  onToggle?: (key: RGroupKey) => void;
}

/**
 * The positions of the core a fragment may occupy, one capsule per R group the
 * core actually carries. A filled capsule is a position the fragment is used
 * at, a tinted one a position it is kept out of.
 * @param props - Fragment whose targets are edited.
 * @returns The capsule group, or a hint when the core carries no R group.
 */
export function FragmentTargets(props: FragmentTargetsProps): ReactElement {
  useSignals();
  const { fragment, onToggle } = props;
  const available = coreInfo.value.rGroups;

  if (available.length === 0) {
    return (
      <span className={`fragment-targets-empty ${Classes.TEXT_MUTED}`}>
        Add an R group to the core
      </span>
    );
  }

  return (
    <div className="fragment-targets" onClick={stopPropagation}>
      {available.map((key) => {
        const active = fragment.targets[key];
        return (
          <HelpTooltip key={key} help={fragmentTargetHelp(key, active)}>
            <Tag
              interactive
              round
              minimal={!active}
              intent={R_GROUP_INTENT[key]}
              onClick={() => {
                if (onToggle === undefined) {
                  toggleFragmentTarget(fragment.id, key);
                } else {
                  onToggle(key);
                }
              }}
            >
              {key}
            </Tag>
          </HelpTooltip>
        );
      })}
    </div>
  );
}

function stopPropagation(event: MouseEvent<HTMLDivElement>): void {
  event.stopPropagation();
}
