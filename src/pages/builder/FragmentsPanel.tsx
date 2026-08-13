import { ButtonGroup, Card, Classes, H5 } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from 'react-science/ui';

import { HelpIcon } from '../../components/shared/HelpIcon.tsx';
import { helpTooltip } from '../../components/shared/helpContent.tsx';
import { fragmentInfos } from '../../state/data.ts';
import {
  addFragment,
  preferences,
  setFragmentTargets,
  updateFragment,
} from '../../state/preferences.ts';
import { selectFragment, view } from '../../state/view.ts';
import { allTargets } from '../../vcl/defaults.ts';
import type { Fragment } from '../../vcl/types.ts';

import { FragmentDialog } from './FragmentDialog.tsx';
import { FragmentRow } from './FragmentRow.tsx';
import {
  FRAGMENTS_ALL_OFF_HELP,
  FRAGMENTS_ALL_ON_HELP,
  FRAGMENTS_PANEL_HELP,
  FRAGMENT_ADD_HELP,
} from './tooltips.ts';

/** Which fragment the dialog is drawing, if it is open at all. */
type DialogState = { mode: 'add' } | { mode: 'edit'; id: string };

/**
 * Step 2 of the builder: the list of fragments, the dialog that draws one and
 * the bulk helpers that turn every target on or off.
 * @returns The fragments card.
 */
export function FragmentsPanel(): ReactElement {
  useSignals();
  const fragments = preferences.library.fragments.value;
  const infos = fragmentInfos.value;
  const selectedId = view.selectedFragmentId.value;

  const [dialog, setDialog] = useState<DialogState | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fragmentsRef = useRef<Fragment[]>(fragments);
  const selectedIdRef = useRef<string | null>(selectedId);
  const dialogOpenRef = useRef<boolean>(dialog !== null);

  useLayoutEffect(() => {
    fragmentsRef.current = fragments;
    selectedIdRef.current = selectedId;
    dialogOpenRef.current = dialog !== null;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (dialogOpenRef.current) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      ) {
        return;
      }
      const list = fragmentsRef.current;
      if (list.length === 0) return;
      event.preventDefault();
      const currentIndex = list.findIndex(
        (fragment) => fragment.id === selectedIdRef.current,
      );
      const nextIndex =
        event.key === 'ArrowDown'
          ? Math.min(currentIndex + 1, list.length - 1)
          : Math.max(currentIndex - 1, 0);
      if (nextIndex === currentIndex) return;
      const next = list[nextIndex];
      if (next !== undefined) selectFragment(next.id);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  const editedFragment =
    dialog?.mode === 'edit'
      ? (fragments.find((fragment) => fragment.id === dialog.id) ?? null)
      : null;

  return (
    <Card className="fragments-panel">
      <div className="panel-heading">
        <H5>
          <span className="help-label">
            2. Fragments
            <HelpIcon help={FRAGMENTS_PANEL_HELP} />
          </span>
        </H5>
      </div>

      <div ref={listRef} className="fragment-list">
        {fragments.length === 0 ? (
          <span className={Classes.TEXT_MUTED}>
            No fragment yet. Add one to start building the library.
          </span>
        ) : (
          fragments.map((fragment) => {
            const info = infos.get(fragment.id);
            if (info === undefined) return null;
            return (
              <FragmentRow
                key={fragment.id}
                fragment={fragment}
                info={info}
                selected={fragment.id === selectedId}
                onEdit={() => {
                  setDialog({ mode: 'edit', id: fragment.id });
                }}
              />
            );
          })
        )}
      </div>

      <div className="fragments-panel__footer">
        <Button
          icon="add"
          text="Add fragment"
          tooltipProps={helpTooltip(FRAGMENT_ADD_HELP)}
          onClick={() => {
            setDialog({ mode: 'add' });
          }}
        />
        <ButtonGroup>
          <Button
            icon="tick"
            text="All on"
            tooltipProps={helpTooltip(FRAGMENTS_ALL_ON_HELP)}
            onClick={() => {
              setEveryTarget(true);
            }}
          />
          <Button
            icon="cross"
            text="All off"
            tooltipProps={helpTooltip(FRAGMENTS_ALL_OFF_HELP)}
            onClick={() => {
              setEveryTarget(false);
            }}
          />
        </ButtonGroup>
      </div>

      {dialog !== null &&
        (dialog.mode === 'add' || editedFragment !== null) && (
          <FragmentDialog
            key={dialog.mode === 'add' ? 'add' : dialog.id}
            fragment={editedFragment ?? undefined}
            onClose={() => {
              setDialog(null);
            }}
            onSave={(fragment) => {
              if (dialog.mode === 'add') addFragment(fragment);
              else updateFragment(fragment.id, fragment);
              selectFragment(fragment.id);
              setDialog(null);
            }}
          />
        )}
    </Card>
  );
}

function setEveryTarget(value: boolean): void {
  for (const fragment of preferences.library.fragments.value) {
    setFragmentTargets(fragment.id, allTargets(value));
  }
}
