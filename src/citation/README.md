# Citation

The Cite entry of a site header: one button opening the work at its DOI,
copying its reference in the style a journal asks for, and saving the files a
reference manager imports.

This folder is **a package in waiting**, kept self-contained so that every
`*.cheminfo.org` site can use the same Cite button. It imports nothing from the
application — no state, no helper, no stylesheet — and **ships no CSS of its
own**: every rule is a module-level `CSSProperties` constant applied with
`style`, the way `react-mf` and `react-plot` do it, so there is nothing for a
consumer to import and no specificity fight with Blueprint. Its only
dependencies are `@blueprintjs/core`, `react-science/ui` and `cheminfo-font`,
which every site already carries.

```tsx
import { CiteButton } from './citation/index.ts';

<CiteButton reference={PAPER} />;
```

The work itself lives outside the folder (`src/paper.ts` here), because it is
the one thing that differs per site.

## What it offers

- **HTML** and **Markdown**, each in the four styles chemists are asked for —
  ACS, Nature, RSC and Wiley. An HTML copy is written to the clipboard in both
  flavours, so Word and Google Docs keep the emphasis while a plain editor
  receives a clean line; that is why plain text is not a separate entry.
- **BibTeX**, **RIS** and the **DOI link**, which carry no style.
- **RIS and BibTeX files**, served with the MIME types Zotero, Mendeley and
  EndNote recognise, so opening the saved file imports it.
- A hover **preview** of exactly what each entry copies or saves.

## Shape

| File                           | Holds                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `reference.ts`                 | The `Reference` model and `doiUrl`.                                                                        |
| `segments.ts`                  | One function per journal style, writing the reference as emphasis-tagged pieces.                           |
| `render.ts`                    | Those pieces as plain text, HTML or Markdown.                                                              |
| `formats.ts`                   | The menu model, `formatCitation`, BibTeX and RIS.                                                          |
| `clipboard.ts` / `download.ts` | Putting a citation on the clipboard, or on disk.                                                           |
| `CiteButton.tsx`               | The header entry. `CitationMenu` and `CitationPreview` are exported for a site that wants its own trigger. |

Adding a style means adding one function in `segments.ts` and one entry in
`CITATION_STYLES` — the three output formats and the preview follow.

## Publishing it

Moving this folder to its own repository is a copy: nothing points back here.
Two decisions are left to whoever does it — whether it becomes a package of its
own (say `cheminfo/react-citation`) or a component of `react-science/ui`, and
whether a site may pass several works rather than one. Neither changes the
files below.
