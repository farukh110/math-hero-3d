import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const PlayIcon = (p: P) => (<svg {...base} fill="currentColor" stroke="none" {...p}><path d="M7 4v16l13-8z" /></svg>);
export const BookIcon = (p: P) => (<svg {...base} {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 21V5M9 7h6" /></svg>);
export const CapIcon = (p: P) => (<svg {...base} {...p}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>);
export const GearIcon = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></svg>);
export const StarIcon = (p: P) => (<svg {...base} fill="currentColor" {...p}><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" /></svg>);
export const ExitIcon = (p: P) => (<svg {...base} {...p}><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9" /></svg>);
export const MenuIcon = (p: P) => (<svg {...base} {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>);
export const SoundIcon = (p: P) => (<svg {...base} {...p}><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></svg>);
export const MuteIcon = (p: P) => (<svg {...base} {...p}><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l5 6M22 9l-5 6" /></svg>);
export const HelpIcon = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01" /></svg>);

export const CoinIcon = (p: P) => (
  <svg viewBox="0 0 32 32" {...p}><circle cx="16" cy="16" r="13" fill="#ffd23f" stroke="#b8860b" strokeWidth="2.5" /><circle cx="16" cy="16" r="8.5" fill="none" stroke="#e0a800" strokeWidth="2" /><path d="M16 9v14M12.5 12.5h5a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h5" stroke="#b8860b" strokeWidth="2" fill="none" /></svg>
);
export const GemIcon = (p: P) => (
  <svg viewBox="0 0 32 32" {...p}><path d="M16 3l11 9-11 17L5 12z" fill="#4fc3ff" stroke="#1565c0" strokeWidth="2" strokeLinejoin="round" /><path d="M5 12h22M16 3l-4 9 4 17 4-17z" stroke="#e3f6ff" strokeWidth="1.4" fill="none" /></svg>
);
export const BigStar = (p: P) => (
  <svg viewBox="0 0 32 32" {...p}><path d="M16 3l3.8 8 8.7 1.2-6.3 6.1 1.5 8.7L16 22.7 8.3 27l1.5-8.7L3.5 12.2l8.7-1.2z" fill="#ffc400" stroke="#b86e00" strokeWidth="2" strokeLinejoin="round" /></svg>
);
export const HeartIcon = (p: P) => (<svg viewBox="0 0 32 32" {...p}><path d="M16 28S4 20 4 12a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 8-12 16-12 16z" fill="#ff4d5e" stroke="#a31526" strokeWidth="2" /></svg>);
export const ChestIcon = (p: P) => (<svg viewBox="0 0 32 32" {...p}><rect x="3" y="12" width="26" height="15" rx="2" fill="#a8691f" stroke="#5e3a17" strokeWidth="2" /><path d="M3 12a13 8 0 0 1 26 0z" fill="#c98a33" stroke="#5e3a17" strokeWidth="2" /><rect x="13" y="14" width="6" height="7" rx="1" fill="#ffd23f" stroke="#5e3a17" strokeWidth="1.5" /></svg>);
export const LeafIcon = (p: P) => (<svg viewBox="0 0 32 32" {...p}><path d="M5 27C5 12 14 5 28 5c0 14-7 22-20 22z" fill="#5fe08a" stroke="#1d7a3c" strokeWidth="2" /><path d="M5 27L20 12" stroke="#1d7a3c" strokeWidth="2" /></svg>);
export const TempleIcon = (p: P) => (<svg viewBox="0 0 32 32" {...p}><path d="M3 12L16 4l13 8z" fill="#c9553d" stroke="#6b2a1c" strokeWidth="2" strokeLinejoin="round" /><path d="M6 14h20v3H6zM8 17v9M14 17v9M20 17v9M26 17v9M4 27h24" stroke="#6b2a1c" strokeWidth="2" fill="#e8d9b5" /></svg>);

/** Original character portrait: teal explorer with safari helmet and goggles. */
export function Portrait() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <rect width="64" height="64" fill="#2a5a94" />
      <ellipse cx="32" cy="64" rx="24" ry="14" fill="#12b5a6" />
      <rect x="25" y="46" width="14" height="8" rx="3" fill="#e83e8c" />
      <circle cx="32" cy="34" r="15" fill="#f3b48c" />
      <path d="M17 29c0-12 8-17 15-17s15 5 15 17z" fill="#e8d3a2" />
      <ellipse cx="32" cy="28" rx="21" ry="3.2" fill="#e8d3a2" stroke="#b79b62" strokeWidth="1" />
      <rect x="17" y="24" width="30" height="4" fill="#8a5a2b" />
      <circle cx="26" cy="20" r="4" fill="#7fe3ff" stroke="#3a6a80" strokeWidth="1.5" />
      <circle cx="38" cy="20" r="4" fill="#7fe3ff" stroke="#3a6a80" strokeWidth="1.5" />
      <circle cx="26" cy="36" r="2.6" fill="#fff" /><circle cx="38" cy="36" r="2.6" fill="#fff" />
      <circle cx="26.5" cy="36.4" r="1.4" fill="#2a1a14" /><circle cx="38.5" cy="36.4" r="1.4" fill="#2a1a14" />
      <path d="M27 42q5 5 10 0" stroke="#2a1a14" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
