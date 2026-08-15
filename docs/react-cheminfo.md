# react-cheminfo — a package of assembled components for our sites

Status: **plan only**. Nothing is created; the name `react-cheminfo` was free on
npm on 2026-08-15. The working prototype of the first component lives in
[`src/citation/`](../src/citation/) of this repository and is already shaped to
move.

## 1. Why a second package

`react-science` gives us **primitives**: `Toolbar`, `Accordion`, `SplitPane`,
`Table`, `Button`, `DOI`. They carry no data and no opinion, which is what makes
them reusable in a workbench, a viewer or a form.

What every `*.cheminfo.org` site rebuilds instead is one level up: **assemblies**
— a component you hand data to and it delivers a whole feature, its copy, its
interactions and its logic included. A Cite button is not a primitive; it is a
menu, four journal styles, two clipboard flavours, two file formats and a
preview. Today each site writes its own, or copies one.

`react-cheminfo` is that layer. A site will normally depend on **both**.

|             | `react-science`            | `react-cheminfo`                          |
| ----------- | -------------------------- | ----------------------------------------- |
| Holds       | primitives                 | assemblies                                |
| Knows about | layout and interaction     | our domain, our sites, our conventions    |
| Data        | none                       | passed in as props                        |
| Example     | `<Toolbar>`, `<DOI value>` | `<CiteButton reference>`, `<ShareDialog>` |

## 2. The dependency contract

These six rules are what keep the two packages composable instead of the second
one slowly forking the first.

1. **`react`, `react-dom`, `@blueprintjs/core` and `react-science` are peer
   dependencies**, never bundled. Two copies of `react-science` mean two
   Blueprint style trees and two emotion runtimes — the same failure class as
   the duplicate-React blank page, and just as hard to read from the symptom.
2. **Inline style objects by default, emotion only where they cannot reach —
   and no stylesheet for the consumer to import.** This is what zakodium-oss
   already does (§2.1). A component that ships no CSS has no import step, no
   bundler configuration, no load-order surprise, and — because an inline rule
   outranks every selector — no specificity fight with Blueprint. Reach for
   `@emotion/styled` when a component genuinely needs a pseudo-class
   (`:hover`, `:focus`), a media query, or a rule on an element it does not
   render itself; then use emotion's `&&` to double specificity, since a bare
   emotion class is `(0,1,0)` and loses to anything like
   `.bp6-submenu .bp6-popover-target`.
3. **Never re-implement a `react-science` primitive.** When one is missing or
   simply not exported — `DoiLogo` is the live example — the fix is a pull
   request upstream. This is the single rule that stops "++" becoming a fork.
4. **Two entry points**: `react-cheminfo/ui` for React, `react-cheminfo/core`
   for the framework-free logic (citation formats, share-config parsing, the
   glossary model). A backend serving an RIS endpoint, and every unit test of
   that logic, then load no React at all.
5. **Data in props, no globals.** No signals, no module singleton, no store
   inside the package: application state stays in the application, so two
   instances on one page never share anything.
6. **Site identity through CSS variables** (`--brand`, `--brand-alt`,
   `--accent`). A component never hard-codes a colour, so each site keeps the
   two colours it owns. An inline style reads one with
   `color: 'var(--accent)'`, so this composes with rule 2.

### 2.1 How zakodium-oss actually styles its components

Surveyed on 2026-08-15, over the published React libraries of the org:

| Repository                                               | Styling                                                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `react-mf`                                               | inline `style` objects only, no CSS, no dependency                                                                                         |
| `react-well-plates`                                      | inline only, no CSS file at all                                                                                                            |
| `react-roi`                                              | inline only; its single `.css` is Storybook's                                                                                              |
| `react-plot`                                             | inline only; its single `.css` is Storybook's                                                                                              |
| `react-d3-utils`, `react-heatmap`, `react-iframe-bridge` | no styling                                                                                                                                 |
| `react-science`                                          | `@emotion/styled` in 37 of 93 component files — **and inline `style` in 30 of them**; the `css` prop in none; one optional `preflight.css` |
| `react-ocl`                                              | `@emotion/styled`                                                                                                                          |
| `react-kbs`                                              | Tailwind (with headlessui)                                                                                                                 |

So the house style for a **published component library** is inline style
objects held as module-level `CSSProperties` constants — `react-mf` is the
cleanest example — with emotion appearing only in the two largest libraries,
where components need pseudo-classes and deeper selectors. Tailwind is a
one-off. Nothing in the org asks a consumer to import a component stylesheet.

## 3. Shape of the repository

Standard published TypeScript library per the cheminfo generator: `type:
module`, `exports`, vitest with coverage, release-please, typedoc, CI on the
shared zakodium workflows. Being a published library it takes
`eslint-config-cheminfo-typescript`, not the app config.

```
src/
  core/                     # framework-free, exported as react-cheminfo/core
    citation/               #   reference model, styles, renderers, formats
    share/                  #   embed / hide vocabulary, parse + clamp
    glossary/               #   [[term]] parsing
  ui/                       # React, exported as react-cheminfo/ui
    citation/               #   CiteButton, CitationMenu, CitationPreview
    share/                  #   ShareDialog
    chrome/                 #   AppHeader, Wordmark, NavLink
    help/                   #   HelpTooltip, GlossaryText
    about/                  #   AboutDialog
```

Every `ui/*` folder is allowed to import from `core/*`, never the other way.

## 4. The component queue

Ordered by how much duplication each one removes today.

| #   | Component                                                       | State of play                                                                        | Sketch                                                    |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| 1   | **Site chrome** — `AppHeader`, `Wordmark`, `NavLink`, tokens    | copied verbatim into every site's `index.css`                                        | `<AppHeader brand={<BrandMark/>} name="vcl" items={…}/>`  |
| 2   | **`ShareDialog`** + `shareConfig`                               | required of every public tool; chemcalc has the reference implementation, others lag | `<ShareDialog options={pageOptions}/>`                    |
| 3   | **`HelpTooltip`** + `GlossaryText` (`[[term]]`)                 | vcl, regexp and iupac each have their own                                            | `<GlossaryText glossary={GLOSSARY}>{text}</GlossaryText>` |
| 4   | **`CiteButton`**                                                | working prototype here                                                               | `<CiteButton reference={PAPER}/>`                         |
| 5   | **`AboutDialog`**                                               | hand-written per app                                                                 | `<AboutDialog logo={…} credits={…} licence={…}/>`         |
| 6   | **Pedagogic kit** — tutorial steps, exercise engine, cheatsheet | regexp and iupac share a structure, not code                                         | later, once 1–5 have settled the conventions              |

**Item 1 carries a decision**: today `rules/visual-identity.md` says the tokens
are copied verbatim into each site. If the package owns them, that rule changes
— a site would import a stylesheet and set only its two brand colours. That is
the whole point of the item, but it is a deliberate change to a standing rule,
not a detail to slip in.

## 5. The pilot: citation

[`src/citation/`](../src/citation/) is already self-contained: prop-driven, no
import from the application, its own `download.ts` and its own stylesheet. It
covers HTML and Markdown in four journal styles (ACS, Nature, RSC, Wiley),
BibTeX, RIS, the DOI link, RIS/BibTeX file downloads with the MIME types Zotero
and Mendeley recognise, and a hover preview of what each entry produces.

It already follows rule 2: **it ships no stylesheet**. Every rule is a
module-level `CSSProperties` constant, `react-mf` style. That also disposed of
the one rule that had needed a CSS file — the submenu row — because the element
Blueprint was out-specifying is one we render ourselves, so `style={{ display:
'flex' }}` on the `MenuItem` outranks `.bp6-submenu .bp6-popover-target`
outright.

Moving it therefore costs two mechanical changes:

- `SvgLogoDoi` from `cheminfo-font` and our `doiUrl` give way to
  `react-science`'s DOI component — which needs `DoiLogo` exported upstream
  first, since `<DOI>` is an anchor and cannot sit in a `MenuItem` icon slot.
- Local imports take the `.js` extension `react-science` compiles with.

Its tests move unchanged; they already run against a `Reference` passed in.

## 6. How a site adopts it

```sh
npm install react-cheminfo   # react-science, Blueprint and React already present
```

```tsx
import { AppHeader, CiteButton } from 'react-cheminfo/ui';
import { PAPER } from './paper.ts';

<AppHeader name="vcl" items={TABS}>
  <CiteButton reference={PAPER} />
</AppHeader>;
```

Order of adoption: **vcl first** — it is where the prototype was written and it
uses both packages — then one pedagogic site (regexp or iupac) to prove the
glossary and share pieces against a second set of conventions, then the rest.

## 7. Open questions

- **Tokens**: does the package own the shared visual identity (§4, item 1)?
- **One work or several**: `CiteButton` takes a single `reference`. Sites citing
  two papers would want `references`; additive, but the menu shape changes.
- **`core` as its own package?** Keeping it a subpath is simpler; splitting it
  only pays off if a backend ever depends on it without React in the tree.
- **Styles beyond four**: `@citation-js/core` with CSL gives thousands of
  journal styles at a real bundle cost. Our four are ~150 lines and no
  dependency — the right trade for a header button, worth revisiting only if
  someone asks for Vancouver or a numbered style.

## 8. Risks

| Risk                                                | Mitigation                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| Two copies of `react-science` or emotion in one app | peer dependencies, and `npm ls react-science` in the adoption checklist    |
| Blueprint's selectors out-specify emotion classes   | `&&`, and measure the rendered DOM rather than trusting the cascade        |
| Upstream latency when a primitive must be exported  | copy locally with a `TODO` naming the pull request; never a permanent fork |
| Release cadences coupling the two packages          | peer range on `react-science` stays wide (`^21`), bumped deliberately      |
| The package becoming a dumping ground               | an assembly earns its place only once two sites need it                    |
