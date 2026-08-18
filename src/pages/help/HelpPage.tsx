import { Button, H4, H5 } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { Fragment, useEffect, useSyncExternalStore } from 'react';

import { GlossaryText } from '../../components/shared/GlossaryText.tsx';
import { pathWithoutBase, withBase } from '../../state/site.ts';
import { parseRoute } from '../../state/view.ts';

import { GLOSSARY } from './data/glossary.ts';
import { HELP_SECTIONS } from './data/helpSections.ts';

const GLOSSARY_SECTION_ID = 'glossary';

const TOC_ENTRIES: ReadonlyArray<{ id: string; title: string }> = [
  ...HELP_SECTIONS.map((section) => ({ id: section.id, title: section.title })),
  { id: GLOSSARY_SECTION_ID, title: 'Glossary' },
];

const FIRST_SECTION_ID = HELP_SECTIONS[0]?.id ?? GLOSSARY_SECTION_ID;

// A chapter counts as the one being read once its heading reaches the header.
const ACTIVE_SECTION_OFFSET = 72;

/**
 * The embedded manual: a sticky table of contents on the left, every help
 * section rendered with its inline definitions, then the whole glossary as a
 * browsable list.
 * @returns The Help tab.
 */
export function HelpPage(): ReactElement {
  const activeSection = useActiveSection();

  // A tooltip links to /help/<chapter>; open the manual there, and follow the
  // address while it changes, so the back button walks the chapters too.
  useEffect(() => {
    function scrollToAddressedSection(): void {
      const section = parseRoute(
        pathWithoutBase(window.location.pathname),
      ).section;
      if (section !== null) scrollToSection(section);
    }
    scrollToAddressedSection();
    window.addEventListener('popstate', scrollToAddressedSection);
    return () => {
      window.removeEventListener('popstate', scrollToAddressedSection);
    };
  }, []);

  return (
    <div className="help-page">
      <nav className="help-toc">
        <H5>Contents</H5>
        <div className="help-toc-links">
          {TOC_ENTRIES.map((entry) => (
            <Button
              key={entry.id}
              variant="minimal"
              alignText="start"
              fill
              active={entry.id === activeSection}
              text={entry.title}
              onClick={() => showSection(entry.id)}
            />
          ))}
        </div>
      </nav>

      <div className="help-content">
        {HELP_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="help-section">
            <H4>{section.title}</H4>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                <GlossaryText text={paragraph} />
              </p>
            ))}
          </section>
        ))}

        <GlossaryList />
      </div>
    </div>
  );
}

function useActiveSection(): string {
  return useSyncExternalStore(subscribeToScroll, readActiveSection);
}

function subscribeToScroll(onScroll: () => void): () => void {
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    window.removeEventListener('scroll', onScroll);
  };
}

function readActiveSection(): string {
  let current: string = FIRST_SECTION_ID;
  for (const entry of TOC_ENTRIES) {
    const top = document
      .querySelector(`#${entry.id}`)
      ?.getBoundingClientRect().top;
    if (top === undefined || top > ACTIVE_SECTION_OFFSET) break;
    current = entry.id;
  }
  return current;
}

function GlossaryList(): ReactElement {
  const entries = Object.values(GLOSSARY).toSorted((first, second) =>
    first.title.localeCompare(second.title),
  );

  return (
    <section id={GLOSSARY_SECTION_ID} className="help-section help-glossary">
      <H4>Glossary</H4>
      <p>
        Every term the help underlines. Hovering one anywhere on this page shows
        the same definition without leaving the paragraph.
      </p>
      <dl>
        {entries.map((entry) => (
          <Fragment key={entry.title}>
            <dt>{entry.title}</dt>
            <dd>
              <p>{entry.summary}</p>
              <ul>
                {entry.examples.map((example) => (
                  <li key={example.code}>
                    <code>{example.code}</code> <em>{example.note}</em>
                  </li>
                ))}
              </ul>
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}

function showSection(id: string): void {
  // The address keeps the chapter shareable; the scroll also has to happen
  // here, because pushing the address the page is already on fires no event.
  window.history.pushState(null, '', withBase(`/help/${id}`));
  scrollToSection(id);
}

function scrollToSection(id: string): void {
  document
    .querySelector(`#${id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
