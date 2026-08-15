/** Where the three fragments attach to the core, in the 32×32 box. */
const ATTACHMENTS = [
  { cx: 16, cy: 4.6 },
  { cx: 25.6, cy: 21.2 },
  { cx: 6.4, cy: 21.2 },
] as const;

export interface BrandMarkProps {
  /**
   * Edge of the square the mark is drawn in, in pixels.
   * @default 26
   */
  size?: number;
}

/**
 * The mark: a core carrying three R groups, which is what the tool combines.
 * The core is drawn in the plate's negative space and the fragments all take
 * the second brand colour, so the mark reads as one core and three
 * substituents rather than as a handful of unrelated dots at 16 px.
 *
 * Kept in step with `public/favicon.svg`, which is the same geometry written
 * out with literal colours because a file served on its own cannot read the
 * page's custom properties.
 * @param props - The mark size.
 * @param props.size - Edge of the square the mark is drawn in, in pixels.
 * @returns The mark, as an inline SVG.
 */
export function BrandMark(props: BrandMarkProps) {
  const { size = 26 } = props;

  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="6" fill="var(--brand)" />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 9.5 10.8 12.5 10.8 18.5 16 21.5 21.2 18.5 21.2 12.5Z" />
        <path d="M16 9.5 16 5.5M21.2 18.5 24.8 20.6M10.8 18.5 7.2 20.6" />
      </g>
      {ATTACHMENTS.map((attachment) => (
        <circle
          key={`${attachment.cx},${attachment.cy}`}
          cx={attachment.cx}
          cy={attachment.cy}
          r="2.6"
          fill="var(--brand-alt)"
        />
      ))}
    </svg>
  );
}

export interface WordmarkProps {
  /**
   * Extra class names, for sizing or spacing at the place it is used.
   * @default undefined
   */
  className?: string;
}

/**
 * The name, in the two colours this site owns — the way chemcalc.org writes
 * `ChemCalc`. Always lowercase, and always the whole address minus the `.org`,
 * because the address is the name here.
 *
 * The mark's orange reaches about 3.2:1 on white, short of what text needs, so
 * the second half is set in a darkened one of the same hue.
 * @param props - The wordmark options.
 * @param props.className - Extra class names, for sizing or spacing.
 * @returns The site name, in its two colours.
 */
export function Wordmark(props: WordmarkProps) {
  const { className } = props;

  return (
    <span className={className ? `wordmark ${className}` : 'wordmark'}>
      <span className="wordmark__lead">vcl</span>
      <span className="wordmark__dot">.</span>
      <span className="wordmark__alt">cheminfo</span>
    </span>
  );
}
