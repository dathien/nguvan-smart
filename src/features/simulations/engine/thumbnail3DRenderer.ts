import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Scene3DPreset } from '../types';
import { buildGrade10Diorama } from './dioramaBuildersG10';
import { buildGrade11Diorama } from './dioramaBuildersG11';
import { buildGrade12AndSkillDiorama } from './dioramaBuildersG12';

/**
 * Shared single-context sequential offscreen Three.js 16:9 thumbnail renderer.
 * Captures genuine high-resolution 16:9 snapshots directly from all 26 upgraded 3D diorama scenes
 * with ZERO text overlays, immediate GPU disposal after each frame, and in-memory caching.
 */
const thumbnailCache = new Map<Scene3DPreset, string>();
const pendingCallbacks = new Map<Scene3DPreset, Array<(url: string | null) => void>>();
const renderQueue: Scene3DPreset[] = [];
let isProcessingQueue = false;
let webglUnavailable = false;

let sharedRenderer: THREE.WebGLRenderer | null = null;
let sharedPmrem: THREE.PMREMGenerator | null = null;
let sharedEnvTarget: THREE.WebGLRenderTarget | null = null;

function ensureOffscreenRenderer(): boolean {
  if (webglUnavailable) return false;
  if (sharedRenderer) return true;
  try {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'default',
    });
    renderer.setPixelRatio(1);
    renderer.setSize(640, 360, false); // Exact 16:9 crisp thumbnail resolution
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = false; // Fast crisp studio rendering for catalog previews

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);

    sharedRenderer = renderer;
    sharedPmrem = pmrem;
    sharedEnvTarget = envTarget;
    return true;
  } catch {
    webglUnavailable = true;
    return false;
  }
}

function renderPresetOnce(preset: Scene3DPreset): string | null {
  if (!ensureOffscreenRenderer() || !sharedRenderer || !sharedEnvTarget) return null;

  const built =
    buildGrade10Diorama(preset) ||
    buildGrade11Diorama(preset) ||
    buildGrade12AndSkillDiorama(preset);
  if (!built) return null;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(built.backdropColor);
  scene.environment = sharedEnvTarget.texture;
  scene.environmentIntensity = built.ambientIntensity ? 0.42 : 0.68;

  const hemi = new THREE.HemisphereLight(
    0xf8fbff,
    0xcbd5e1,
    built.ambientIntensity !== undefined ? built.ambientIntensity * 1.45 : 1.0
  );
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(
    0xfff6e5,
    built.directionalIntensity !== undefined ? built.directionalIntensity * 1.55 : 1.38
  );
  dir.position.set(10, 16, 11);
  scene.add(dir);

  const rim = new THREE.DirectionalLight(0xc7d9f8, 0.48);
  rim.position.set(-10, 8, -9);
  scene.add(rim);

  scene.add(built.root);
  // Step once at t=1.2s with dt=0.016 so GLSL water/fire/clouds/poses render cleanly
  const previewStage = preset === 'temple-ghost' ? 0 : 1;
  built.update(1.2, previewStage, {}, 0.016);
  const mood = built.getStageMood?.(previewStage);
  if (mood) {
    scene.background = new THREE.Color(mood.background);
    hemi.color.setHex(mood.hemiSky);
    hemi.groundColor.setHex(mood.hemiGround);
    hemi.intensity = mood.hemiIntensity;
    dir.color.setHex(mood.dirColor);
    dir.intensity = mood.dirIntensity;
  }

  // Exact 16:9 isometric OrthographicCamera framing the full diorama cleanly
  const aspect = 640 / 360;
  const frustum = 9.2;
  const camera = new THREE.OrthographicCamera(
    (-frustum * aspect) / 2,
    (frustum * aspect) / 2,
    frustum / 2,
    -frustum / 2,
    0.1,
    120
  );
  camera.position.set(13.2, 10.6, 13.2);
  camera.lookAt(0, 1.05, 0);
  camera.zoom = 1.06;
  camera.updateProjectionMatrix();

  sharedRenderer.render(scene, camera);
  let dataUrl: string | null = null;
  try {
    dataUrl = sharedRenderer.domElement.toDataURL('image/jpeg', 0.88);
  } catch {
    dataUrl = null;
  }

  // Dispose temporary scene resources cleanly to keep GPU memory flat across all scenes
  built.dispose?.();
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!m) return;
        const std = m as THREE.MeshStandardMaterial;
        std.map?.dispose();
        std.normalMap?.dispose();
        std.roughnessMap?.dispose();
        m.dispose();
      });
    }
  });

  return dataUrl;
}

function processNextInQueue() {
  if (renderQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }
  isProcessingQueue = true;
  const preset = renderQueue.shift()!;

  const result = thumbnailCache.has(preset)
    ? thumbnailCache.get(preset)!
    : renderPresetOnce(preset);

  if (result) {
    thumbnailCache.set(preset, result);
  }

  const cbs = pendingCallbacks.get(preset) || [];
  pendingCallbacks.delete(preset);
  cbs.forEach((cb) => cb(result));

  // Yield briefly between captures so UI scrolling stays silky-smooth
  setTimeout(processNextInQueue, 28);
}

export function getCached3DThumbnail(preset: Scene3DPreset): string | null {
  return thumbnailCache.get(preset) ?? null;
}

export function request3DThumbnail(
  preset: Scene3DPreset,
  onReady: (dataUrl: string | null) => void
): () => void {
  const existing = thumbnailCache.get(preset);
  if (existing) {
    onReady(existing);
    return () => {};
  }
  if (webglUnavailable) {
    onReady(null);
    return () => {};
  }

  const list = pendingCallbacks.get(preset);
  if (list) {
    list.push(onReady);
  } else {
    pendingCallbacks.set(preset, [onReady]);
    renderQueue.push(preset);
  }

  if (!isProcessingQueue) {
    setTimeout(processNextInQueue, 16);
  }

  return () => {
    const arr = pendingCallbacks.get(preset);
    if (!arr) return;
    const idx = arr.indexOf(onReady);
    if (idx >= 0) arr.splice(idx, 1);
  };
}

export function disposeSharedThumbnailRenderer() {
  sharedEnvTarget?.dispose();
  sharedPmrem?.dispose();
  sharedRenderer?.dispose();
  sharedEnvTarget = null;
  sharedPmrem = null;
  sharedRenderer = null;
}
