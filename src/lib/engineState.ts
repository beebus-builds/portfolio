/**
 * Shared engine state between the flight loop and the exhaust shaders. The
 * simulation writes it once per frame; the plume reads it at a later priority
 * so the visuals always lag a frame behind the physics at worst. Kept as a
 * module singleton for the same reason `flightInput` is: this runs inside the
 * render loop and must not trigger React renders.
 */
export const engineState = {
  /** 0 when cold, up to ~1.4 on a full burn. */
  throttle: 0,
  /** 0..1 while the afterburner is lit. */
  boost: 0,
};