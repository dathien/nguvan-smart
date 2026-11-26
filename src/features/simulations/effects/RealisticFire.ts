import * as THREE from 'three';
import { QualityTier } from '../types';

/**
 * Realistic Real-Time Fire System (GLSL ShaderMaterial + Embers + Smoke + DynamicFireLight).
 * Completely eliminates cone/sphere placeholder flames across all 3D dioramas.
 *
 * Modules exported:
 * - createRealisticFire
 * - createTorchFire
 * - createHandheldFire
 * - createCampfire
 * - createBuildingFire
 * - FireEmbers
 * - FireSmoke
 * - DynamicFireLight
 */

export interface RealisticFireOptions {
  width?: number;
  height?: number;
  seed?: number;
  emberCount?: number;
  smokeCount?: number;
  withLight?: boolean;
  lightIntensity?: number;
  lightDistance?: number;
  lightColor?: number;
  castShadow?: boolean;
  windBias?: number;
}

export interface FireSystemInstance {
  group: THREE.Group;
  /** Static non-animated anchor node at flame emitter origin for rock-solid SmartLabelManager anchoring */
  anchorNode: THREE.Object3D;
  light: THREE.PointLight | null;
  update: (dt: number, elapsedSec: number, active: boolean, intensity?: number) => void;
  setQuality: (tier: QualityTier) => void;
  dispose: () => void;
}

let cachedSoftParticleTexture: THREE.CanvasTexture | null = null;
let cachedSmokeParticleTexture: THREE.CanvasTexture | null = null;

function getSoftEmberTexture(): THREE.CanvasTexture {
  if (cachedSoftParticleTexture) return cachedSoftParticleTexture;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255, 255, 235, 1)');
    g.addColorStop(0.32, 'rgba(255, 190, 60, 0.92)');
    g.addColorStop(0.7, 'rgba(255, 92, 16, 0.35)');
    g.addColorStop(1, 'rgba(255, 40, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSoftParticleTexture = tex;
  return tex;
}

function getSoftSmokeTexture(): THREE.CanvasTexture {
  if (cachedSmokeParticleTexture) return cachedSmokeParticleTexture;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    g.addColorStop(0, 'rgba(72, 68, 66, 0.62)');
    g.addColorStop(0.45, 'rgba(92, 86, 82, 0.32)');
    g.addColorStop(1, 'rgba(60, 56, 54, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSmokeParticleTexture = tex;
  return tex;
}

const FIRE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uWind;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Taper & organic upper tongue sway (keeps emitter base pinned tightly!)
    float h = clamp(uv.y, 0.0, 1.0);
    float sway = sin(uTime * 6.2 + h * 5.2 + uSeed * 3.1) * 0.14 * h * h
               + cos(uTime * 10.4 - h * 7.0 + uSeed * 1.7) * 0.06 * h;
    pos.x += (sway + uWind * h * h * 0.22) * uIntensity;
    pos.z += cos(uTime * 5.4 + h * 4.5 + uSeed * 2.3) * 0.08 * h * h * uIntensity;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FIRE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.52;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = rot * p * 2.06 + vec2(0.17, -0.31);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    if (uIntensity <= 0.01) discard;

    vec2 uv = vUv;
    float t = uTime * 2.35 + uSeed * 5.1;

    // Organic rising turbulence distorting flame silhouette
    float n1 = fbm(vec2(uv.x * 3.6 + uSeed, uv.y * 2.8 - t * 1.15));
    float n2 = fbm(vec2(uv.x * 6.8 - uSeed * 0.7, uv.y * 5.2 - t * 1.85));
    float turb = (n1 * 0.65 + n2 * 0.35) - 0.48;

    // Tapered teardrop flame mask with licking tips
    float centerDist = abs((uv.x - 0.5) * 2.0 + turb * (0.35 + uv.y * 0.75));
    float widthProfile = mix(0.76, 0.06, pow(uv.y, 0.78));
    float radialMask = smoothstep(widthProfile + 0.16, widthProfile - 0.24, centerDist);

    // Base rounding + dancing jagged top fade
    float baseFade = smoothstep(0.0, 0.16, uv.y);
    float tipThreshold = 0.72 + n1 * 0.36;
    float topFade = smoothstep(tipThreshold, tipThreshold - 0.42, uv.y);

    float flame = radialMask * baseFade * topFade;
    flame = clamp(flame * (0.82 + n2 * 0.65), 0.0, 1.0);

    // Multi-zone physically inspired fire palette:
    // White-yellow luminous core -> rich golden-orange body -> deep red-orange dancing rim
    vec3 colOuter = vec3(0.86, 0.16, 0.02);
    vec3 colMid   = vec3(1.00, 0.56, 0.07);
    vec3 colCore  = vec3(1.00, 0.96, 0.76);

    float coreMask = smoothstep(0.42, 0.88, flame) * (1.0 - uv.y * 0.58);
    vec3 col = mix(colOuter, colMid, smoothstep(0.12, 0.58, flame));
    col = mix(col, colCore, coreMask);

    float alpha = smoothstep(0.08, 0.56, flame) * clamp(uIntensity, 0.0, 1.25);
    if (alpha < 0.02) discard;

    gl_FragColor = vec4(col * (1.1 + coreMask * 0.45), alpha);
  }
`;

/**
 * DynamicFireLight — Multi-harmonic organic flickering PointLight
 */
export class DynamicFireLight {
  public readonly light: THREE.PointLight;
  private baseIntensity: number;
  private seed: number;

  constructor(color = 0xff8a2b, intensity = 12, distance = 14, seed = 1, castShadow = false) {
    this.light = new THREE.PointLight(color, intensity, distance, 1.55);
    this.light.castShadow = castShadow;
    this.baseIntensity = intensity;
    this.seed = seed;
  }

  public update(elapsedSec: number, active: boolean, intensityScale = 1): void {
    if (!active || intensityScale <= 0.01) {
      this.light.intensity = 0;
      return;
    }
    // Incommensurate frequencies create natural non-mechanical fire flicker
    const flicker =
      0.86 +
      Math.sin(elapsedSec * 9.7 + this.seed) * 0.08 +
      Math.sin(elapsedSec * 17.3 + this.seed * 2.1) * 0.05 +
      Math.cos(elapsedSec * 25.1 - this.seed * 1.4) * 0.035;
    this.light.intensity = this.baseIntensity * intensityScale * flicker;
  }
}

/**
 * FireEmbers — Rising glowing spark particles
 */
export class FireEmbers {
  public readonly points: THREE.Points;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.PointsMaterial;
  private readonly maxCount: number;
  private activeCount: number;
  private readonly seeds: Float32Array;
  private readonly spreadX: number;
  private readonly maxHeight: number;

  constructor(count = 24, spreadX = 0.45, maxHeight = 1.8) {
    this.maxCount = Math.max(4, count);
    this.activeCount = this.maxCount;
    this.spreadX = spreadX;
    this.maxHeight = maxHeight;

    const positions = new Float32Array(this.maxCount * 3);
    this.seeds = new Float32Array(this.maxCount * 3);
    for (let i = 0; i < this.maxCount; i++) {
      this.seeds[i * 3] = ((i * 73.13) % 100) / 100; // phase
      this.seeds[i * 3 + 1] = (((i * 37.91 + 19) % 100) / 100 - 0.5) * 2; // x bias
      this.seeds[i * 3 + 2] = (((i * 53.47 + 41) % 100) / 100 - 0.5) * 2; // z bias
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setDrawRange(0, this.activeCount);

    this.material = new THREE.PointsMaterial({
      map: getSoftEmberTexture(),
      color: 0xffb84d,
      size: Math.max(0.08, Math.min(0.18, spreadX * 0.28)),
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  public setQuality(tier: QualityTier): void {
    const ratio = tier === 'high' ? 1 : tier === 'standard' ? 0.65 : 0.35;
    this.activeCount = Math.max(3, Math.round(this.maxCount * ratio));
    this.geometry.setDrawRange(0, this.activeCount);
  }

  public update(elapsedSec: number, active: boolean, intensity = 1): void {
    this.points.visible = active && intensity > 0.05;
    if (!this.points.visible) return;
    this.material.opacity = Math.min(0.95, 0.85 * intensity);

    const attr = this.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < this.activeCount; i++) {
      const phase = this.seeds[i * 3];
      const bx = this.seeds[i * 3 + 1];
      const bz = this.seeds[i * 3 + 2];
      const life = (elapsedSec * (0.48 + (i % 4) * 0.11) + phase) % 1;
      const swirl = elapsedSec * 2.4 + i * 1.7;
      arr[i * 3] = bx * this.spreadX * (0.45 + life * 0.9) + Math.sin(swirl) * 0.12 * life;
      arr[i * 3 + 1] = 0.1 + life * this.maxHeight * (0.7 + intensity * 0.35);
      arr[i * 3 + 2] = bz * this.spreadX * (0.45 + life * 0.9) + Math.cos(swirl * 0.85) * 0.12 * life;
    }
    attr.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * FireSmoke — Gentle drifting translucent smoke wisps rising above flame
 */
export class FireSmoke {
  public readonly points: THREE.Points;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.PointsMaterial;
  private readonly maxCount: number;
  private activeCount: number;
  private readonly seeds: Float32Array;
  private readonly spreadX: number;
  private readonly startY: number;
  private readonly riseHeight: number;

  constructor(count = 14, spreadX = 0.42, startY = 0.65, riseHeight = 1.9) {
    this.maxCount = Math.max(3, count);
    this.activeCount = this.maxCount;
    this.spreadX = spreadX;
    this.startY = startY;
    this.riseHeight = riseHeight;

    const positions = new Float32Array(this.maxCount * 3);
    this.seeds = new Float32Array(this.maxCount * 3);
    for (let i = 0; i < this.maxCount; i++) {
      this.seeds[i * 3] = ((i * 61.3) % 100) / 100;
      this.seeds[i * 3 + 1] = (((i * 29.7 + 11) % 100) / 100 - 0.5) * 2;
      this.seeds[i * 3 + 2] = (((i * 43.1 + 27) % 100) / 100 - 0.5) * 2;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setDrawRange(0, this.activeCount);

    this.material = new THREE.PointsMaterial({
      map: getSoftSmokeTexture(),
      color: 0x9ca3af,
      size: Math.max(0.35, spreadX * 1.1),
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  public setQuality(tier: QualityTier): void {
    const ratio = tier === 'high' ? 1 : tier === 'standard' ? 0.65 : 0.3;
    this.activeCount = Math.max(2, Math.round(this.maxCount * ratio));
    this.geometry.setDrawRange(0, this.activeCount);
  }

  public update(elapsedSec: number, active: boolean, intensity = 1): void {
    this.points.visible = active && intensity > 0.08;
    if (!this.points.visible) return;
    this.material.opacity = Math.min(0.42, 0.3 * intensity);

    const attr = this.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < this.activeCount; i++) {
      const phase = this.seeds[i * 3];
      const bx = this.seeds[i * 3 + 1];
      const bz = this.seeds[i * 3 + 2];
      const life = (elapsedSec * 0.24 + phase) % 1;
      arr[i * 3] = bx * this.spreadX * (0.5 + life * 1.4) + Math.sin(elapsedSec * 0.9 + i) * 0.16 * life;
      arr[i * 3 + 1] = this.startY + life * this.riseHeight;
      arr[i * 3 + 2] = bz * this.spreadX * (0.5 + life * 1.4) + Math.cos(elapsedSec * 0.8 + i) * 0.12 * life;
    }
    attr.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * Core volumetric multi-plane GLSL ShaderMaterial fire builder.
 * Uses 3 intersecting subdivided planes (0°, 60°, 120°) so flames look natural & rich
 * from every orbit camera angle without ever looking flat or conical.
 */
export function createRealisticFire(opts: RealisticFireOptions = {}): FireSystemInstance {
  const {
    width = 0.68,
    height = 1.15,
    seed = 1.0,
    emberCount = 18,
    smokeCount = 10,
    withLight = true,
    lightIntensity = 12,
    lightDistance = 14,
    lightColor = 0xff8528,
    castShadow = false,
    windBias = 0.18,
  } = opts;

  const group = new THREE.Group();
  group.userData.isFireEffect = true;

  // Static anchor node at the base/origin of the flame for rock-solid SmartLabelManager anchoring
  const anchorNode = new THREE.Object3D();
  anchorNode.position.set(0, height * 0.32, 0);
  group.add(anchorNode);

  const flameMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seed },
      uWind: { value: windBias },
      uIntensity: { value: 1.0 },
    },
    vertexShader: FIRE_VERTEX_SHADER,
    fragmentShader: FIRE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const flameGeo = new THREE.PlaneGeometry(width, height, 6, 12);
  // Shift pivot to base (y = 0) so flame grows upward from emitter
  flameGeo.translate(0, height * 0.5, 0);

  const flameContainer = new THREE.Group();
  const angles = [0, Math.PI / 3, (Math.PI * 2) / 3];
  angles.forEach((ang, idx) => {
    const plane = new THREE.Mesh(flameGeo, flameMat);
    plane.rotation.y = ang;
    // Slight scale variation per intersecting slice for organic volumetric fullness
    plane.scale.set(1 - idx * 0.04, 0.96 + (idx % 2) * 0.08, 1);
    flameContainer.add(plane);
  });
  group.add(flameContainer);

  const embers = emberCount > 0 ? new FireEmbers(emberCount, width * 0.58, height * 1.75) : null;
  if (embers) group.add(embers.points);

  const smoke = smokeCount > 0 ? new FireSmoke(smokeCount, width * 0.65, height * 0.68, height * 1.65) : null;
  if (smoke) group.add(smoke.points);

  const dynamicLight = withLight
    ? new DynamicFireLight(lightColor, lightIntensity, lightDistance, seed, castShadow)
    : null;
  if (dynamicLight) {
    dynamicLight.light.position.set(0, height * 0.62, 0.12);
    group.add(dynamicLight.light);
  }

  let currentIntensity = 1.0;

  return {
    group,
    anchorNode,
    light: dynamicLight ? dynamicLight.light : null,
    update: (dt, elapsedSec, active, targetIntensity = 1.0) => {
      const desired = active ? Math.max(0, targetIntensity) : 0;
      currentIntensity += (desired - currentIntensity) * Math.min(1, dt * 8 + 0.12);
      const visible = currentIntensity > 0.015;
      flameContainer.visible = visible;
      if (visible) {
        flameMat.uniforms.uTime.value = elapsedSec;
        flameMat.uniforms.uIntensity.value = currentIntensity;
        const sc = 0.65 + currentIntensity * 0.38;
        flameContainer.scale.set(sc, 0.6 + currentIntensity * 0.45, sc);
      }
      embers?.update(elapsedSec, visible, currentIntensity);
      smoke?.update(elapsedSec, visible, currentIntensity);
      dynamicLight?.update(elapsedSec, visible, currentIntensity);
    },
    setQuality: (tier) => {
      embers?.setQuality(tier);
      smoke?.setQuality(tier);
    },
    dispose: () => {
      flameGeo.dispose();
      flameMat.dispose();
      embers?.dispose();
      smoke?.dispose();
    },
  };
}

/**
 * TorchFire — Warm oil-soaked torch flame with tight core, rising sparks, gentle smoke & flickering wall light
 * Used in: Chữ người tử tù (bó đuốc tẩm dầu), Ngô Tử Văn, Cửu Trùng Đài, Prô-mê-tê altar
 */
export function createTorchFire(opts: Partial<RealisticFireOptions> = {}): FireSystemInstance {
  return createRealisticFire({
    width: opts.width ?? 0.52,
    height: opts.height ?? 0.92,
    seed: opts.seed ?? 2.3,
    emberCount: opts.emberCount ?? 18,
    smokeCount: opts.smokeCount ?? 10,
    withLight: opts.withLight ?? true,
    lightIntensity: opts.lightIntensity ?? 18,
    lightDistance: opts.lightDistance ?? 15,
    lightColor: opts.lightColor ?? 0xff8c32,
    castShadow: opts.castShadow ?? false,
    windBias: opts.windBias ?? 0.14,
  });
}

/**
 * HandheldFire — Compact luminous sacred flame carried by Prometheus or scholar
 */
export function createHandheldFire(opts: Partial<RealisticFireOptions> = {}): FireSystemInstance {
  return createRealisticFire({
    width: opts.width ?? 0.36,
    height: opts.height ?? 0.62,
    seed: opts.seed ?? 4.7,
    emberCount: opts.emberCount ?? 12,
    smokeCount: opts.smokeCount ?? 4,
    withLight: opts.withLight ?? true,
    lightIntensity: opts.lightIntensity ?? 11,
    lightDistance: opts.lightDistance ?? 11,
    lightColor: opts.lightColor ?? 0xff9d3b,
    windBias: opts.windBias ?? 0.1,
  });
}

/**
 * Campfire — Village festival firepit with charred logs, stone ring, dancing flames, embers & warm communal light
 * Used in: Đăm Săn lễ hội cồng chiêng Tây Nguyên
 */
export function createCampfire(opts: Partial<RealisticFireOptions> = {}): FireSystemInstance {
  const fire = createRealisticFire({
    width: opts.width ?? 0.95,
    height: opts.height ?? 1.35,
    seed: opts.seed ?? 6.1,
    emberCount: opts.emberCount ?? 26,
    smokeCount: opts.smokeCount ?? 14,
    withLight: opts.withLight ?? true,
    lightIntensity: opts.lightIntensity ?? 15,
    lightDistance: opts.lightDistance ?? 16,
    lightColor: opts.lightColor ?? 0xff7b22,
    windBias: opts.windBias ?? 0.18,
  });

  // Grounded stone fire ring & crossed charred timber logs
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.92, flatShading: true });
  const logMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.95 });
  const emberBed = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 16),
    new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      emissive: 0xea580c,
      emissiveIntensity: 0.9,
      roughness: 0.85,
    })
  );
  emberBed.rotation.x = -Math.PI / 2;
  emberBed.position.y = 0.035;
  fire.group.add(emberBed);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), stoneMat);
    stone.scale.set(1.15, 0.65, 1.0);
    stone.position.set(Math.cos(a) * 0.56, 0.08, Math.sin(a) * 0.56);
    fire.group.add(stone);
  }
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.92, 7), logMat);
    log.rotation.z = Math.PI / 2 - 0.16;
    log.rotation.y = (i / 3) * Math.PI;
    log.position.y = 0.12;
    fire.group.add(log);
  }

  return fire;
}

/**
 * BuildingFire — Multi-plume blazing structure fire with thick rising smoke, wide ember burst & strong orange glow
 * Used in: Đền Tản Viên (Stage 1: Ngô Tử Văn đốt đền tà), Vĩnh biệt Cửu Trùng Đài (Stage 3: đốt đài)
 */
export function createBuildingFire(opts: {
  plumeOffsets?: [number, number, number][];
  scale?: number;
  lightIntensity?: number;
} = {}): FireSystemInstance {
  const {
    plumeOffsets = [
      [-0.85, 0.0, 0.2],
      [0.0, 0.25, 0.35],
      [0.85, 0.05, 0.15],
    ],
    scale = 1.0,
    lightIntensity = 22,
  } = opts;

  const group = new THREE.Group();
  group.userData.isFireEffect = true;

  const anchorNode = new THREE.Object3D();
  anchorNode.position.set(0, 0.9 * scale, 0.2);
  group.add(anchorNode);

  const subFires: FireSystemInstance[] = plumeOffsets.map((pos, idx) => {
    const f = createRealisticFire({
      width: (0.95 + (idx === 1 ? 0.32 : 0)) * scale,
      height: (1.55 + (idx === 1 ? 0.45 : 0)) * scale,
      seed: 1.7 + idx * 2.9,
      emberCount: idx === 1 ? 26 : 12,
      smokeCount: idx === 1 ? 16 : 8,
      withLight: false,
      windBias: 0.24,
    });
    f.group.position.set(pos[0], pos[1], pos[2]);
    group.add(f.group);
    return f;
  });

  const mainLight = new DynamicFireLight(0xff6b14, lightIntensity, 18, 3.4, false);
  mainLight.light.position.set(0, 1.4 * scale, 0.9);
  group.add(mainLight.light);

  return {
    group,
    anchorNode,
    light: mainLight.light,
    update: (dt, elapsedSec, active, intensity = 1.0) => {
      subFires.forEach((f, i) => {
        f.update(dt, elapsedSec, active, intensity * (i === 1 ? 1.08 : 0.92));
      });
      mainLight.update(elapsedSec, active, intensity);
    },
    setQuality: (tier) => {
      subFires.forEach((f) => f.setQuality(tier));
    },
    dispose: () => {
      subFires.forEach((f) => f.dispose());
    },
  };
}
