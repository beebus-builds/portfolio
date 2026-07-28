export const GAME = {
  SHIP_SENSITIVITY: 10,
  SHIP_BOUNDS: 4.5,
  SHIP_TILT_FACTOR: 0.4,
  SHIP_CAMERA_OFFSET: { x: 0.5, y: 2.5, z: 6 },
  SHIP_CAMERA_LOOKAHEAD: { x: 0.8, z: -5 },
  SHIP_ORBIT_FLOAT_SPEED: 2,
  SHIP_ORBIT_FLOAT_AMPLITUDE: 0.1,

  PLAYER_SPEED: 5,
  PLAYER_BOUNDS: 12,
  PLAYER_PROXIMITY_DISTANCE: 3,
  PLAYER_BOB_SPEED: 2,
  PLAYER_BOB_AMPLITUDE: 0.1,
  PLAYER_CAMERA_OFFSET: { x: 0.4, y: 11, z: 9 },

  UNIVERSE_SPAWN_INTERVAL: 0.6,
  UNIVERSE_OBJECT_SPEED: 15,
  UNIVERSE_COLLISION_DISTANCE: 0.8,
  UNIVERSE_ASTEROID_CHANCE: 0.3,
  UNIVERSE_SPAWN_RANGE_X: 5,
  UNIVERSE_DESPAWN_Z: 5,
  UNIVERSE_SPAWN_Z: -60,

  DECRYPTION_GAIN_PER_COLLECT: 10,
  SHIELD_LOSS_PER_HIT: 20,
  DECRYPTION_TARGET: 100,

  CAMERA_LERP_SPEED: 0.1,
  ORBIT_CAMERA_LERP_SPEED: 0.05,
  ORBIT_CAMERA_POSITION: { x: 0, y: 3, z: 7 },

  NEBULA_COUNT: 3,
  STAR_COUNT: 10000,
  PARTICLE_COUNT: 150,
} as const;

export const PLANETS = [
  { id: 'about', position: { x: -20, z: -30 }, label: 'S-1: CORE_MEMORIES', color: '#a855f7' },
  { id: 'skills', position: { x: 20, z: -25 }, label: 'S-2: TECH_LAB', color: '#3b82f6' },
  { id: 'experience', position: { x: 30, z: 15 }, label: 'S-3: TEMPORAL_GRID', color: '#10b981' },
  { id: 'projects', position: { x: -30, z: 15 }, label: 'S-4: THE_FORGE', color: '#6366f1' },
  { id: 'contact', position: { x: 0, z: 35 }, label: 'S-5: SIGNAL_BEACON', color: '#ec4899' },
] as const;

export const WORLD_ZONES = [
  { id: 'about', position: [-7, 0, -6] as const, color: '#a855f7', label: 'CORE_MEMORIES' },
  { id: 'projects', position: [7, 0, -6] as const, color: '#6366f1', label: 'DATA_Spires' },
  { id: 'contact', position: [0, 0, 7] as const, color: '#ec4899', label: 'LINK_SATELLITE' },
] as const;
