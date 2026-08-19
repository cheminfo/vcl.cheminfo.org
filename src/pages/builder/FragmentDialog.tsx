import { Callout, H5 } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from 'react-science/ui';

import { HelpIcon } from '../../components/shared/HelpIcon.tsx';
import { createEmptyFragment } from '../../vcl/defaults.ts';
import { analyseFragment } from '../../vcl/fragment.ts';
import type { Fragment } from '../../vcl/types.ts';

import { FragmentEditor } from './FragmentEditor.tsx';
import { FRAGMENTS_PANEL_HELP } from './tooltips.ts';

/** The site's own colour, as the header band of the dialog. */
const HEADER_COLOR = 'var(--accent, #2d72d2)';

export interface FragmentDialogProps {
  /**
   * Fragment to edit. Omit to draw a new one.
   * @default undefined
   */
  fragment?: Fragment;
  /** Called with the drawn fragment when the dialog is saved. */
  onSave: (fragment: Fragment) => void;
  /** Called when the dialog is cancelled or dismissed. */
  onClose: () => void;
}

/**
 * The dialog that draws a fragment, whether it is a new one or one already in
 * the library. The fragment is edited as a draft that only reaches the library
 * when the dialog is saved, so cancelling leaves the library untouched. The
 * caller renders this component only while the dialog is open, so every opening
 * starts from the drawing it was given.
 * @param props - Fragment to edit, where a saved fragment goes and how the
 * dialog is closed.
 * @returns The fragment dialog.
 */
export function FragmentDialog(props: FragmentDialogProps): ReactElement {
  const { fragment, onSave, onClose } = props;
  const [draft, setDraft] = useState<Fragment>(
    () => fragment ?? createEmptyFragment(),
  );
  const info = useMemo(() => analyseFragment(draft.molfile), [draft.molfile]);
  const editing = fragment !== undefined;

  return (
    <ConfirmDialog
      isOpen
      className="fragment-dialog"
      headerColor={HEADER_COLOR}
      saveText={editing ? 'Save fragment' : 'Add fragment'}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={() => {
        onSave(draft);
      }}
    >
      <H5>
        <span className="help-label">
          {editing ? `Edit ${fragment.name}` : 'New fragment'}
          <HelpIcon help={FRAGMENTS_PANEL_HELP} />
        </span>
      </H5>
      <Callout intent="primary" icon="pin" compact>
        Draw the substituent, then say where it bonds to the core: move the
        mouse over that atom and <strong>press R</strong>. The atom becomes the
        attachment point and is drawn as <code>R</code>. Clicking an atom of the
        preview moves the attachment point there instead. A fragment needs
        exactly one.
      </Callout>
      <FragmentEditor fragment={draft} info={info} onChange={setDraft} />
    </ConfirmDialog>
  );
}
