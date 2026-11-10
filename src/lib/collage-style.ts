export const POSTER_COLORS = {
  paper: "#d3c9c4",
  frame: "#fffefd",
  ink: "#171313",
  titleInk: "#211a18",
  subtitle: "#594b44",
  number: "#a69a92",
  footer: "#75665e",
  flowerPetal: "#f4f5e9",
  flowerStroke: "#e4e8d9",
  flowerCenter: "#e7a52e",
  flowerCenterInner: "#d99222",
  leaf: "#5b9c48",
  shadow: "#493b3428",
  placeholderStart: "#e9dfd7",
  placeholderEnd: "#bcae9f",
} as const;

export const POSTER_TYPOGRAPHY = {
  title: {
    family: "Great Vibes",
    fallback: "cursive",
    sizeScale: (width: number) => (width / 1000) * 76,
    lineHeight: 0.95,
    color: POSTER_COLORS.titleInk,
  },
  subtitle: {
    family: "Playfair Display",
    fallback: "serif",
    size: 12,
    letterSpacing: 3,
    uppercase: true,
    color: POSTER_COLORS.subtitle,
  },
  number: {
    family: "Playfair Display",
    fallback: "serif",
    size: 10,
    letterSpacing: 1,
    color: POSTER_COLORS.number,
  },
  footer: {
    family: "Playfair Display",
    fallback: "serif",
    size: 11,
    letterSpacing: 1,
    color: POSTER_COLORS.footer,
  },
} as const;

export const POSTER_TEXT_DEFAULTS = {
  footerNote: "A COLLECTION OF OUR MEMORIES",
} as const;

export type CollageGridLayout = {
  cols: number;
  rows: number;
  gapX: number;
  gapY: number;
  aspect: number;
  padding: { top: number; right: number; bottom: number; left: number };
  minHeight: number;
  headerMinHeight: number;
  headerMarginBottom: number;
  titleSize: number;
  numberSize: number;
  numberBottom: number;
  polaroidPadding: {
    x: number;
    top: number;
    bottom?: number;
    bottomRatio?: number;
  };
};

const POSTER_PADDING = { top: 38, right: 55, bottom: 70, left: 55 };

export function collageGridLayout(count: number): CollageGridLayout {
  switch (count) {
    case 8:
      return {
        cols: 2,
        rows: 4,
        gapX: 24,
        gapY: 18,
        aspect: 0.9,
        padding: POSTER_PADDING,
        minHeight: 1450,
        headerMinHeight: 125,
        headerMarginBottom: 30,
        titleSize: 76,
        numberSize: 10,
        numberBottom: 7,
        polaroidPadding: { x: 14, top: 14, bottomRatio: 0.13 },
      };
    case 16:
      return {
        cols: 4,
        rows: 4,
        gapX: 13,
        gapY: 13,
        aspect: 0.78,
        padding: POSTER_PADDING,
        minHeight: 1550,
        headerMinHeight: 125,
        headerMarginBottom: 30,
        titleSize: 76,
        numberSize: 8,
        numberBottom: 5,
        polaroidPadding: { x: 7, top: 7, bottom: 20 },
      };
    case 32:
      return {
        cols: 4,
        rows: 8,
        gapX: 10,
        gapY: 10,
        aspect: 0.76,
        padding: POSTER_PADDING,
        minHeight: 1900,
        headerMinHeight: 100,
        headerMarginBottom: 20,
        titleSize: 56,
        numberSize: 7,
        numberBottom: 4,
        polaroidPadding: { x: 6, top: 6, bottom: 17 },
      };
    case 4:
    default: {
      const cols = count > 8 ? 4 : 2;
      const rows = Math.max(1, Math.ceil(count / cols));
      return {
        cols,
        rows,
        gapX: 30,
        gapY: 26,
        aspect: 0.88,
        padding: POSTER_PADDING,
        minHeight: 1100,
        headerMinHeight: 125,
        headerMarginBottom: 30,
        titleSize: 76,
        numberSize: 10,
        numberBottom: 7,
        polaroidPadding: { x: 14, top: 14, bottomRatio: 0.12 },
      };
    }
  }
}

export function collageGrid(count: number): { cols: number; rows: number } {
  const { cols, rows } = collageGridLayout(count);
  return { cols, rows };
}

export const SVG_FLOWERS = {
  top: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220" aria-hidden="true">
  <g transform="translate(110 110)" fill="#f4f5e9" stroke="#e4e8d9" stroke-width="2">
    <ellipse rx="19" ry="55" cy="-49"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(30)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(60)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(90)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(120)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(150)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(180)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(210)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(240)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(270)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(300)"/>
    <ellipse rx="19" ry="55" cy="-49" transform="rotate(330)"/>
  </g>
  <ellipse cx="110" cy="110" rx="37" ry="29" fill="#e7a52e"/>
  <ellipse cx="110" cy="110" rx="28" ry="21" fill="#d99222" opacity=".65"/>
</svg>`,
  side: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 300" width="180" height="300" aria-hidden="true">
  <g fill="none" stroke="#5b9c48" stroke-width="5" stroke-linecap="round">
    <path d="M90 300 Q70 190 30 75 M95 300 Q100 180 130 30 M90 300 Q125 210 165 130"/>
  </g>
  <g fill="#f4f2e7" stroke="#e8dfd0" stroke-width="2">
    <g transform="translate(30 75)">
      <ellipse cy="-20" rx="10" ry="23"/>
      <ellipse cy="-20" rx="10" ry="23" transform="rotate(45)"/>
      <ellipse cy="-20" rx="10" ry="23" transform="rotate(90)"/>
      <ellipse cy="-20" rx="10" ry="23" transform="rotate(135)"/>
      <ellipse cy="-20" rx="10" ry="23" transform="rotate(180)"/>
      <ellipse cy="-20" rx="10" ry="23" transform="rotate(225)"/>
      <ellipse cy="-20" rx="10" ry="23" transform="rotate(270)"/>
      <ellipse cy="-20" rx="10" ry="23" transform="rotate(315)"/>
    </g>
    <g transform="translate(130 30)">
      <ellipse cy="-17" rx="8" ry="20"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(45)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(90)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(135)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(180)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(225)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(270)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(315)"/>
    </g>
    <g transform="translate(165 130)">
      <ellipse cy="-17" rx="8" ry="20"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(45)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(90)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(135)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(180)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(225)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(270)"/>
      <ellipse cy="-17" rx="8" ry="20" transform="rotate(315)"/>
    </g>
  </g>
  <g fill="#e9a52e">
    <circle cx="30" cy="75" r="9"/>
    <circle cx="130" cy="30" r="8"/>
    <circle cx="165" cy="130" r="8"/>
  </g>
</svg>`,
  bottom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 230" width="340" height="230" aria-hidden="true">
  <g fill="none" stroke="#5c9d49" stroke-width="5" stroke-linecap="round">
    <path d="M170 230 Q135 140 35 85 M170 230 Q165 135 105 40 M170 230 Q205 130 210 45 M170 230 Q240 160 300 95 M170 230 Q110 175 90 120"/>
  </g>
  <g fill="#f7f1e7" stroke="#eadfcf" stroke-width="2">
    <g transform="translate(35 85)">
      <ellipse cy="-15" rx="8" ry="18"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(45)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(90)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(135)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(180)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(225)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(270)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(315)"/>
    </g>
    <g transform="translate(105 40)">
      <ellipse cy="-15" rx="8" ry="18"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(45)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(90)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(135)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(180)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(225)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(270)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(315)"/>
    </g>
    <g transform="translate(210 45)">
      <ellipse cy="-15" rx="8" ry="18"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(45)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(90)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(135)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(180)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(225)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(270)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(315)"/>
    </g>
    <g transform="translate(300 95)">
      <ellipse cy="-15" rx="8" ry="18"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(45)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(90)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(135)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(180)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(225)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(270)"/>
      <ellipse cy="-15" rx="8" ry="18" transform="rotate(315)"/>
    </g>
    <g transform="translate(90 120)">
      <ellipse cy="-13" rx="7" ry="16"/>
      <ellipse cy="-13" rx="7" ry="16" transform="rotate(45)"/>
      <ellipse cy="-13" rx="7" ry="16" transform="rotate(90)"/>
      <ellipse cy="-13" rx="7" ry="16" transform="rotate(135)"/>
      <ellipse cy="-13" rx="7" ry="16" transform="rotate(180)"/>
      <ellipse cy="-13" rx="7" ry="16" transform="rotate(225)"/>
      <ellipse cy="-13" rx="7" ry="16" transform="rotate(270)"/>
      <ellipse cy="-13" rx="7" ry="16" transform="rotate(315)"/>
    </g>
  </g>
  <g fill="#e9a52e">
    <circle cx="35" cy="85" r="7"/>
    <circle cx="105" cy="40" r="7"/>
    <circle cx="210" cy="45" r="7"/>
    <circle cx="300" cy="95" r="7"/>
    <circle cx="90" cy="120" r="6"/>
  </g>
</svg>`,
} as const;
