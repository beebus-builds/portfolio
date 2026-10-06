export type CameraMode = "chase" | "side" | "top" | "free";

export const CAMERA_MODES: CameraMode[] = ["chase", "side", "top", "free"];

export interface FlightInput {
  /** Forward / reverse thrust, -1 to 1. */
  thrust: number;
  /** Yaw left / right, -1 to 1. */
  yaw: number;
  /** Pitch down / up, -1 to 1. */
  pitch: number;
  /** Roll left / right, -1 to 1. */
  roll: number;
  boost: boolean;
  brake: boolean;
  /** Accumulated horizontal camera offset in radians. */
  cameraYaw: number;
  /** Accumulated vertical camera offset in radians. */
  cameraPitch: number;
  /** True while the pointer is dragging the camera. */
  dragging: boolean;
  /** Set when a drag just happened, so a click can be ignored. */
  suppressClick: boolean;
  /** Active chase-camera angle. */
  cameraMode: CameraMode;
  /** Mouse-look target set from cursor position (no click needed). */
  lookYaw: number;
  /** Mouse-look target set from cursor position (no click needed). */
  lookPitch: number;
  /** Engine audio mute switch (HUD button). */
  muted: boolean;
}

export const flightInput: FlightInput = {
  thrust: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  boost: false,
  brake: false,
  cameraYaw: 0,
  cameraPitch: 0,
  dragging: false,
  suppressClick: false,
  cameraMode: "chase",
  lookYaw: 0,
  lookPitch: 0,
  muted: false,
};

export function resetFlightInput(): void {
  flightInput.thrust = 0;
  flightInput.yaw = 0;
  flightInput.pitch = 0;
  flightInput.roll = 0;
  flightInput.boost = false;
  flightInput.brake = false;
  flightInput.cameraYaw = 0;
  flightInput.cameraPitch = 0;
  flightInput.dragging = false;
  flightInput.suppressClick = false;
  flightInput.cameraMode = "chase";
  flightInput.lookYaw = 0;
  flightInput.lookPitch = 0;
}

export function isFlightKey(code: string): boolean {
  return (
    code === "KeyW" ||
    code === "KeyA" ||
    code === "KeyS" ||
    code === "KeyD" ||
    code === "KeyQ" ||
    code === "KeyE" ||
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "Space" ||
    code === "ShiftLeft" ||
    code === "ShiftRight"
  );
}
