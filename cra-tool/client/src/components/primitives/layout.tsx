import React from 'react';

// Layout primitives — the sustainable replacement for scattered inline
// `display:flex; gap; align` styling. Each primitive centralizes one layout
// concern and pulls spacing from the token scale (--space-*), so gaps stay
// consistent and are tuned in one place. These are the ONLY place raw flex/
// grid style lives; feature components compose these instead of hand-rolling.

type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
const gapVar = (s?: Space) => (s == null ? undefined : `var(--space-${s})`);

type Align   = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around';
const ALIGN:   Record<Align, string>   = { start: 'flex-start', center: 'center', end: 'flex-end', baseline: 'baseline', stretch: 'stretch' };
const JUSTIFY: Record<Justify, string> = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around' };

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Space;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

// Vertical flow — the default container for stacked content.
export function Stack({ gap, align, justify, wrap, as = 'div', style, ...rest }: BoxProps) {
  const Tag = as as any;
  return (
    <Tag
      style={{
        display: 'flex', flexDirection: 'column',
        gap: gapVar(gap),
        alignItems: align && ALIGN[align],
        justifyContent: justify && JUSTIFY[justify],
        flexWrap: wrap ? 'wrap' : undefined,
        minWidth: 0,
        ...style,
      }}
      {...rest}
    />
  );
}

// Horizontal cluster — items in a row, wraps by default so nothing overflows.
export function Row({ gap = 2, align = 'center', justify, wrap = true, as = 'div', style, ...rest }: BoxProps) {
  const Tag = as as any;
  return (
    <Tag
      style={{
        display: 'flex', flexDirection: 'row',
        gap: gapVar(gap),
        alignItems: ALIGN[align],
        justifyContent: justify && JUSTIFY[justify],
        flexWrap: wrap ? 'wrap' : 'nowrap',
        minWidth: 0,
        ...style,
      }}
      {...rest}
    />
  );
}

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Space;
  /** min column width for auto-fit responsive grids, e.g. "240px" */
  min?: string;
  /** fixed column count, e.g. 4 — takes precedence over `min` */
  cols?: number;
}

// Responsive grid — auto-fits columns to `min` width, or a fixed `cols` count.
export function Grid({ gap = 3, min = '240px', cols, style, ...rest }: GridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: gapVar(gap),
        gridTemplateColumns: cols
          ? `repeat(${cols}, minmax(0, 1fr))`
          : `repeat(auto-fit, minmax(${min}, 1fr))`,
        ...style,
      }}
      {...rest}
    />
  );
}

// Pushes following siblings to the far edge inside a Row (margin-left:auto).
export function Spacer() {
  return <div style={{ marginLeft: 'auto' }} />;
}
