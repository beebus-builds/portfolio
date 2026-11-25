/**
 * Shared geometry for the studio monitor.
 *
 * The physical screen, its HTML overlay and the 32:9 stand-in texture must all
 * agree on these dimensions. Keeping the values here prevents the in-monitor
 * browser and media player from drifting away from the 3D screen.
 */

/** The visible screen, in metres. */
export const MONITOR_SCREEN_W = 1.28;
export const MONITOR_SCREEN_H = 0.61;

/** Shared vertical anchors used by the physical screen and its HTML overlay. */
export const MONITOR_DESK_TOP_Y = 0.76;
export const MONITOR_SCREEN_CENTER_Y = 1.15;

/** `distanceFactor={1}` makes one CSS pixel 1/400 of a metre. */
export const MONITOR_DPI = 400;

/** Where an HTML overlay sits on the monitor, relative to the screen centre. */
export const MONITOR_HTML_POSITION: [number, number, number] = [
  0,
  MONITOR_SCREEN_CENTER_Y - MONITOR_DESK_TOP_Y,
  0.021,
];
