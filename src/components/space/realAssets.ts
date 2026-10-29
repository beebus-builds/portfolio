"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import type { SectionId } from "@/lib/profile";
import { createBumpNormalMap } from "./textures";

/**
 * Real-world imagery for the flight scene.
 *
 * Every entry points at a NASA-derived equirectangular map in
 * `public/textures/real/` (see docs/ASSET_CREDITS.md — CC BY 4.0). The loader
 * is deliberately forgiving: if a file is missing or the network fails it
 * resolves to `null` and the caller keeps its procedural texture, so the scene
 * degrades instead of showing a hole.
 */

/** World id → the real planetary map that stands in for it. */
export const PLANET_MAPS: Record<SectionId, string> = {
  about: "/textures/real/2k_neptune.jpg",
  skills: "/textures/real/2k_jupiter.jpg",
  projects: "/textures/real/2k_mars.jpg",
  contact: "/textures/real/2k_earth_nightmap.jpg",
  resume: "/textures/real/2k_mercury.jpg",
};

/** Worlds that get a real cloud shell over their surface. */
export const CLOUD_MAPS: Partial<Record<SectionId, string>> = {
  about: "/textures/real/2k_earth_clouds.jpg",
  skills: "/textures/real/2k_earth_clouds.jpg",
};

export const RING_MAP = "/textures/real/2k_saturn_ring_alpha.png";
export const MOON_MAP = "/textures/real/2k_moon.jpg";
export const SUN_MAP = "/textures/real/2k_sun.jpg";
export const SKY_MAP = "/textures/real/2k_stars_milky_way.jpg";

/** How strongly the real sky lights the scene as an environment probe. High
 *  enough that the ship's aft metals reflect a sky instead of a void. */
export const SKY_ENVIRONMENT_INTENSITY = 0.85;

type Loader = THREE.TextureLoader;

const loaders = new WeakMap<HTMLVideoElement | Document, Loader>();

function textureLoader(): Loader {
  const key = typeof document === "undefined" ? undefined : document;
  if (!key) return new THREE.TextureLoader();
  const existing = loaders.get(key);
  if (existing) return existing;
  const created = new THREE.TextureLoader();
  loaders.set(key, created);
  return created;
}

function configure(texture: THREE.Texture, colorSpace: THREE.ColorSpace, repeatWrap: boolean): THREE.Texture {
  texture.colorSpace = colorSpace;
  texture.wrapS = repeatWrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

const cache = new Map<string, THREE.Texture>();

/**
 * Loads an equirectangular colour map, cached per URL. Returns `null` while
 * in flight and stays `null` if the request fails, so callers can fall back.
 */
export function useRealMap(url: string | null | undefined): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    const cached = cache.get(url);
    if (cached) {
      setTexture(cached);
      return;
    }
    let alive = true;
    textureLoader().load(
      url,
      (loaded) => {
        configure(loaded, THREE.SRGBColorSpace, true);
        cache.set(url, loaded);
        if (alive) setTexture(loaded);
      },
      undefined,
      () => {
        if (alive) setTexture(null);
      }
    );
    return () => {
      alive = false;
    };
  }, [url]);

  return texture;
}

/**
 * Loads an equirectangular map intended for an alpha or data channel — the
 * cloud shell and the ring mask. These must stay in linear space so three.js
 * does not gamma-correct values that are being sampled as data.
 */
export function useRealAlphaMap(url: string | null | undefined): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    const cached = cache.get(url);
    if (cached) {
      setTexture(cached);
      return;
    }
    let alive = true;
    textureLoader().load(
      url,
      (loaded) => {
        configure(loaded, THREE.NoColorSpace, true);
        cache.set(url, loaded);
        if (alive) setTexture(loaded);
      },
      undefined,
      () => {
        if (alive) setTexture(null);
      }
    );
    return () => {
      alive = false;
    };
  }, [url]);

  return texture;
}

/**
 * Derives a matching bump normal map from a loaded colour map, so real
 * imagery gets real surface relief instead of looking like a flat decal.
 * The result is cached per source texture and disposed by React.
 */
export function useBumpMap(source: THREE.Texture | null, strength = 2.4): THREE.Texture | null {
  const [bump, setBump] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!source) {
      setBump(null);
      return;
    }
    const key = source;
    const cached = bumpCache.get(key);
    if (cached) {
      setBump(cached);
      return;
    }
    let alive = true;
    // Deriving relief is a few milliseconds of pixel work; do it off the paint
    // path so the first frame never stutters.
    const handle = window.setTimeout(() => {
      const derived = createBumpNormalMap(key, strength);
      if (derived) bumpCache.set(key, derived);
      if (alive) setBump(derived);
    }, 0);

    return () => {
      alive = false;
      window.clearTimeout(handle);
    };
  }, [source, strength]);

  return bump;
}

/** Bump maps are derived once per source and shared for the app's lifetime. */
const bumpCache = new WeakMap<THREE.Texture, THREE.Texture>();

/**
 * Uses the real Milky Way panorama as the scene's image-based lighting.
 *
 * Metals need something to reflect: without an environment probe every metallic
 * surface in the scene collapses into three hard specular dots on black. The
 * sun's glint still comes from the key light — physically the star supplies the
 * specular and the sky supplies the fill — so this only has to provide the sky.
 *
 * Assigning an equirect texture to `scene.environment` is all that is needed:
 * three's WebGLCubeUVMaps pre-filters it into a PMREM internally and caches the
 * result against the texture, so doing it by hand would only duplicate work and
 * fight the renderer. Returns a disposer for use in an effect cleanup.
 */
export function applySkyEnvironment(scene: THREE.Scene, url: string): () => void {
  let disposed = false;

  textureLoader().load(
    url,
    (loaded) => {
      if (disposed) return;
      loaded.mapping = THREE.EquirectangularReflectionMapping;
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.needsUpdate = true;
      scene.environment = loaded;
      scene.environmentIntensity = SKY_ENVIRONMENT_INTENSITY;
    },
    undefined,
    () => {
      /* No sky, no IBL: the scene still renders, just flatter. */
    }
  );

  return () => {
    disposed = true;
    scene.environment = null;
  };
}
