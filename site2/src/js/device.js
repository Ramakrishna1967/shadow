/* ── device ─────────────────────────────────────────────────
   one query, used by both the boot split and the mobile
   stylesheet. desktop keeps its fine-pointer, ≥1024px path:
   the coarse-pointer arm only matches touch-first devices, so
   a touchscreen laptop with a real mouse still gets desktop.
────────────────────────────────────────────────────────── */

export const MOBILE_QUERY =
  '(max-width: 1023px), (hover: none) and (pointer: coarse)';

export const isMobile = matchMedia(MOBILE_QUERY).matches;
