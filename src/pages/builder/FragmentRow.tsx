import { EditableText, Icon, Switch } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { MouseEvent, ReactElement } from 'react';
import { Structure } from 'react-cheminfo/structure';
import { onActivateKey } from 'react-cheminfo/ui';
import { Button } from 'react-science/ui';

import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import { helpTooltip } from '../../components/shared/helpContent.tsx';
import {
  preferences,
  removeFragment,
  renameFragment,
  toggleFragmentEnabled,
} from '../../state/preferences.ts';
import { selectFragment } from '../../state/view.ts';
import type { Fragment, FragmentInfo } from '../../vcl/types.ts';

import { FragmentTargets } from './FragmentTargets.tsx';
import {
  FRAGMENT_NAME_HELP,
  FRAGMENT_REMOVE_HELP,
  fragmentEnabledHelp,
  fragmentErrorHelp,
} from './tooltips.ts';

/** Fallback tint, so an invalid fragment is visible even without the stylesheet. */
const INVALID_TINT = { backgroundColor: 'rgba(205, 66, 70, 0.15)' };

export interface FragmentRowProps {
  fragment: Fragment;
  /** Analysis of this fragment's drawing. */
  info: FragmentInfo;
  selected: boolean;
  /** Called when the row is activated, to open the fragment in the dialog. */
  onEdit: () => void;
}

/**
 * One line of the fragment list: its thumbnail, its name, the R groups it may
 * replace and the controls that enable or delete it. Activating the row selects
 * the fragment and opens it in the dialog.
 * @param props - Fragment to show, how it was analysed and how to edit it.
 * @returns The list row.
 */
export function FragmentRow(props: FragmentRowProps): ReactElement {
  useSignals();
  const { fragment, info, selected, onEdit } = props;
  const position =
    preferences.library.fragments.value.findIndex(
      (candidate) => candidate.id === fragment.id,
    ) + 1;

  return (
    <div
      className={
        info.error === null
          ? 'fragment-row'
          : 'fragment-row fragment-row--invalid'
      }
      style={info.error === null ? undefined : INVALID_TINT}
      data-selected={selected ? 'true' : undefined}
      role="button"
      tabIndex={0}
      onClick={() => {
        selectFragment(fragment.id);
        onEdit();
      }}
      onKeyDown={onActivateKey(() => {
        selectFragment(fragment.id);
        onEdit();
      })}
    >
      <span className="fragment-row__index">{position}</span>
      <div className="fragment-row__thumbnail">
        <Structure
          molfile={fragment.molfile}
          width={120}
          height={70}
          autoCropMargin={6}
          fallback={<span className="fragment-row__empty">Not drawn</span>}
        />
      </div>
      <div className="fragment-row__main">
        <HelpTooltip help={FRAGMENT_NAME_HELP} placement="top-start">
          <div className="fragment-row__name" onClick={stopPropagation}>
            <EditableText
              key={fragment.name}
              defaultValue={fragment.name}
              placeholder="Fragment name"
              onConfirm={(value) => {
                const name = value.trim();
                if (name !== '' && name !== fragment.name) {
                  renameFragment(fragment.id, name);
                }
              }}
            />
          </div>
        </HelpTooltip>
        <FragmentTargets fragment={fragment} />
      </div>
      <div className="fragment-row__actions" onClick={stopPropagation}>
        {info.error !== null && (
          <HelpTooltip help={fragmentErrorHelp(info.error)}>
            <Icon icon="warning-sign" intent="warning" />
          </HelpTooltip>
        )}
        <HelpTooltip help={fragmentEnabledHelp(fragment.enabled)}>
          <Switch
            checked={fragment.enabled}
            onChange={() => {
              toggleFragmentEnabled(fragment.id);
            }}
          />
        </HelpTooltip>
        <Button
          variant="minimal"
          icon="trash"
          intent="danger"
          aria-label="Remove fragment"
          tooltipProps={helpTooltip(FRAGMENT_REMOVE_HELP)}
          onClick={() => {
            removeFragment(fragment.id);
          }}
        />
      </div>
    </div>
  );
}

function stopPropagation(event: MouseEvent<HTMLDivElement>): void {
  event.stopPropagation();
}
