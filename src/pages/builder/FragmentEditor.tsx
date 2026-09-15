import { Callout, Classes, Code, InputGroup } from '@blueprintjs/core';
import type { KeyboardEvent, ReactElement } from 'react';
import { useState } from 'react';
import type { StructureEditorChange } from 'react-cheminfo/structure';
import { StructureEditor } from 'react-cheminfo/structure';
import { MolfileSvgRenderer } from 'react-ocl';

import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import {
  normalizeFragmentMolfile,
  setFragmentAttachment,
} from '../../vcl/fragment.ts';
import type { Fragment, FragmentInfo, RGroupKey } from '../../vcl/types.ts';

import { FragmentTargets } from './FragmentTargets.tsx';
import { FRAGMENT_SMILES_HELP } from './tooltips.ts';

// The shortest the drawing area is ever drawn; the editor raises it further
// when its own tool palette needs more room than that.
const EDITOR_MIN_HEIGHT = 220;

/** What the uncontrolled canvas editor was last loaded with. */
interface EditorSeed {
  /** Bumped whenever the drawing is replaced from outside the editor. */
  revision: number;
  molfile: string;
}

export interface FragmentEditorProps {
  fragment: Fragment;
  info: FragmentInfo;
  /**
   * Called with the whole fragment whenever the drawing, the attachment point,
   * the name or the targets change.
   */
  onChange: (fragment: Fragment) => void;
}

/**
 * The editor of one fragment: its drawing, its attachment point, its name and
 * the R groups it may replace. It is fully controlled, so the same editor drives
 * a fragment of the library and the draft of the add dialog. The caller must
 * give this component a React key derived from `fragment.id`, so editing another
 * fragment reloads the editor with that fragment's drawing.
 * @param props - Fragment being edited, how it was analysed and where the
 * changes go.
 * @returns The fragment editor.
 */
export function FragmentEditor(props: FragmentEditorProps): ReactElement {
  const { fragment, info, onChange } = props;
  const [seed, setSeed] = useState<EditorSeed>(() => ({
    revision: 0,
    molfile: fragment.molfile,
  }));
  const [nameDraft, setNameDraft] = useState(fragment.name);

  function commitName() {
    const name = nameDraft.trim();
    if (name === '') {
      setNameDraft(fragment.name);
      return;
    }
    if (name !== fragment.name) onChange({ ...fragment, name });
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') commitName();
  }

  function handleChange(change: StructureEditorChange) {
    const molfile = normalizeFragmentMolfile(change.molfile);
    onChange({ ...fragment, molfile });
    // Reloading the editor is what puts the `R` back under the user's cursor,
    // so only do it when the drawing really had to be repaired.
    if (molfile !== change.molfile) {
      setSeed((current) => ({ revision: current.revision + 1, molfile }));
    }
  }

  function handleAtomClick(atomId: number) {
    const molfile = setFragmentAttachment(fragment.molfile, atomId);
    if (molfile === fragment.molfile) return;
    onChange({ ...fragment, molfile });
    setSeed((current) => ({ revision: current.revision + 1, molfile }));
  }

  function handleToggleTarget(key: RGroupKey) {
    onChange({
      ...fragment,
      targets: { ...fragment.targets, [key]: !fragment.targets[key] },
    });
  }

  return (
    <div className="fragment-editor">
      <StructureEditor
        inputFormat="molfile"
        value={seed.molfile}
        revision={seed.revision}
        minHeight={EDITOR_MIN_HEIGHT}
        debounce={0}
        onChange={handleChange}
      />
      <div className="fragment-editor__preview">
        {fragment.molfile.trim() === '' ? (
          <span className={Classes.TEXT_MUTED}>Draw the fragment first.</span>
        ) : (
          <MolfileSvgRenderer
            molfile={fragment.molfile}
            width={220}
            height={140}
            autoCrop
            autoCropMargin={6}
            onAtomClick={handleAtomClick}
          />
        )}
      </div>
      <div className="fragment-editor__controls">
        <InputGroup
          value={nameDraft}
          placeholder="Fragment name"
          onValueChange={setNameDraft}
          onBlur={commitName}
          onKeyDown={handleNameKeyDown}
        />
        <FragmentTargets fragment={fragment} onToggle={handleToggleTarget} />
        {info.error !== null && (
          <Callout intent="warning" compact>
            {info.error}
          </Callout>
        )}
        <HelpTooltip help={FRAGMENT_SMILES_HELP} placement="top-start">
          <div className="fragment-editor__smiles">
            <span className={Classes.TEXT_MUTED}>SMILES</span>{' '}
            <Code>{info.smilesWithR === '' ? '—' : info.smilesWithR}</Code>
          </div>
        </HelpTooltip>
      </div>
    </div>
  );
}
