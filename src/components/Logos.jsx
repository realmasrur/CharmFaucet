// Clean, self-drawn marks. To use official brand assets, replace these three components with their SVGs.
export const CharmLogo = ({ className = "" }) => (
  <svg viewBox="230 245 590 590" className={className} aria-hidden="true">
    <g fill="#1fdcc0" stroke="#1fdcc0" strokeWidth="16" strokeLinejoin="round">
      <path d="M540 291Q565 295 565 315V430L398 527L524 599L385 679Q370 688 355 679L305 648Q293 640 293 622V440Q293 420 312 411Z" />
      <path transform="rotate(180 524.5 539.5)" d="M540 291Q565 295 565 315V430L398 527L524 599L385 679Q370 688 355 679L305 648Q293 640 293 622V440Q293 420 312 411Z" />
    </g>
  </svg>
);

const hex = (cx, cy, r) =>
  [[cx, cy - r], [cx + 0.866 * r, cy - r / 2], [cx + 0.866 * r, cy + r / 2], [cx, cy + r], [cx - 0.866 * r, cy + r / 2], [cx - 0.866 * r, cy - r / 2]]
    .map((p) => p.join(",")).join(" ");

export const PolygonLogo = ({ className = "" }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none" stroke="#8247E5" strokeWidth="4.2" strokeLinejoin="round">
    <polygon points={hex(18, 19, 11)} />
    <polygon points={hex(30, 29, 11)} />
  </svg>
);

export const DiscordLogo = ({ className = "" }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path fill="#5865F2" d="M9 14Q9 10 13 9L18 7.500Q24 6.500 30 7.500L35 9Q39 10 39 14L41 31Q41 35 37.500 37L31 39.500L29 36.500Q24 37.500 19 36.500L17 39.500L10.500 37Q7 35 7 31Z" />
    <ellipse cx="18" cy="23.500" rx="3.600" ry="4.300" fill="#fff" />
    <ellipse cx="30" cy="23.500" rx="3.600" ry="4.300" fill="#fff" />
  </svg>
);
