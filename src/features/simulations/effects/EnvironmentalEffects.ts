import * as THREE from 'three';
import { QualityTier } from '../types';
import { FireSystemInstance } from './RealisticFire';

/**
 * Unified Real-Time Environmental Effects System for all 3D literary dioramas:
 * - RealisticWater / RiverFlow / OceanWaves / WaterReflection (GLSL ShaderMaterial)
 * - CloudAnimation
 * - WindAnimation & VegetationAnimation (sways foliage canopies ONLY, trunks stay grounded!)
 * - DustDebrisEffect (for Thần Trụ Trời primordial chaos & shattering pillar rock dust)
 * - DynamicLightingController (smooth mood cross-fades across narrative stages)
 * - EnvironmentalEffectsManager (pauses synchronously with Storytelling Pause)
 */

export interface WaterShaderOptions {
  deepColor?: number;
  shallowColor?: number;
  foamColor?: number;
  flowSpeed?: number;
  waveAmp?: number;
  waveFreq?: number;
  isOcean?: boolean;
  opacity?: number;
}

const WATER_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uWaveAmp;
  uniform float uWaveFreq;
  uniform float uIsOcean;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWaveHeight;

  void main() {
    vUv = uv;
    vec3 pos = position;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);

    float w1 = sin(worldPos.x * uWaveFreq + uTime * 1.9) * cos(worldPos.z * uWaveFreq * 0.85 - uTime * 1.4);
    float w2 = sin((worldPos.x + worldPos.z) * (uWaveFreq * 0.72) + uTime * 2.5) * 0.5;
    float wave = (w1 + w2) * uWaveAmp;

    // Gentle vertical wave swell for ocean & river surfaces
    pos.y += wave * mix(0.42, 1.0, uIsOcean);
    vWaveHeight = wave;

    vec4 finalWorld = modelMatrix * vec4(pos, 1.0);
    vWorldPos = finalWorld.xyz;
    gl_Position = projectionMatrix * viewMatrix * finalWorld;
  }
`;

const WATER_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uFlowSpeed;
  uniform float uIsOcean;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFoamColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWaveHeight;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 flowUv = vec2(vUv.x, vUv.y - uTime * uFlowSpeed);
    vec2 worldUv = vWorldPos.xz * 0.55;

    // Two layered moving ripple fields for realistic shimmering surface & caustics
    float r1 = noise(flowUv * vec2(7.0, 12.0) + vec2(sin(uTime * 0.5), 0.0));
    float r2 = noise(worldUv * 3.8 + vec2(uTime * 0.55, -uTime * 0.42));
    float caustic = pow(clamp(r1 * 0.58 + r2 * 0.55, 0.0, 1.0), 2.4);

    // Riverbank shallow transition vs ocean swell gradient
    float bankEdge = 1.0 - smoothstep(0.0, 0.24, min(vUv.x, 1.0 - vUv.x));
    float depthFactor = mix(bankEdge, clamp(0.45 + vWaveHeight * 3.2, 0.0, 1.0), uIsOcean);

    vec3 baseCol = mix(uDeepColor, uShallowColor, clamp(depthFactor * 0.72 + r2 * 0.25, 0.0, 1.0));

    // Specular sky/sun reflection shimmer ("WaterReflection")
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 approxNormal = normalize(vec3(
      (r1 - 0.5) * 0.35,
      1.0,
      (r2 - 0.5) * 0.35
    ));
    float fresnel = pow(1.0 - max(dot(viewDir, approxNormal), 0.0), 3.0);
    vec3 sunDir = normalize(vec3(0.55, 0.78, 0.45));
    vec3 halfVec = normalize(sunDir + viewDir);
    float spec = pow(max(dot(approxNormal, halfVec), 0.0), 34.0) * 0.75;

    // Foam along riverbanks or wave crests
    float foamMask = mix(
      smoothstep(0.55, 0.92, bankEdge + (r1 - 0.45) * 0.45) * 0.52,
      smoothstep(0.035, 0.095, vWaveHeight + (r1 - 0.5) * 0.04) * 0.65,
      uIsOcean
    );

    vec3 col = baseCol;
    col += vec3(0.75, 0.92, 1.0) * caustic * 0.26;
    col = mix(col, vec3(0.84, 0.95, 1.0), fresnel * 0.38);
    col += vec3(1.0, 0.98, 0.92) * spec;
    col = mix(col, uFoamColor, clamp(foamMask, 0.0, 0.85));

    gl_FragColor = vec4(col, uOpacity);
  }
`;

export function createRealisticWaterMaterial(opts: WaterShaderOptions = {}): THREE.ShaderMaterial {
  const {
    deepColor = 0x11638f,
    shallowColor = 0x2ca6cb,
    foamColor = 0xe8f7ff,
    flowSpeed = 0.28,
    waveAmp = 0.055,
    waveFreq = 1.05,
    isOcean = false,
    opacity = 0.94,
  } = opts;

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFlowSpeed: { value: flowSpeed },
      uWaveAmp: { value: waveAmp },
      uWaveFreq: { value: waveFreq },
      uIsOcean: { value: isOcean ? 1.0 : 0.0 },
      uDeepColor: { value: new THREE.Color(deepColor) },
      uShallowColor: { value: new THREE.Color(shallowColor) },
      uFoamColor: { value: new THREE.Color(foamColor) },
      uOpacity: { value: opacity },
    },
    vertexShader: WATER_VERTEX_SHADER,
    fragmentShader: WATER_FRAGMENT_SHADER,
    transparent: opacity < 0.99,
    side: THREE.DoubleSide,
  });
}

export interface CloudRigItem {
  object: THREE.Object3D;
  baseX: number;
  baseY: number;
  speed: number;
  amplitude: number;
  phase: number;
}

export interface VegetationCanopyItem {
  canopy: THREE.Object3D;
  phase: number;
  amplitude: number;
  baseRotX: number;
  baseRotZ: number;
}

/**
 * DustDebrisEffect — Primordial swirling dust & shattering boulder dust cloud
 * (e.g., Thần Trụ Trời stage 1 chaos & stage 4 pillar shattering)
 */
export class DustDebrisEffect {
  public readonly points: THREE.Points;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.PointsMaterial;
  private readonly maxCount: number;
  private activeCount: number;
  private readonly seeds: Float32Array;
  private readonly radius: number;
  private readonly maxY: number;

  constructor(count = 56, radius = 4.5, maxY = 3.6, color = 0xcbbba0) {
    this.maxCount = count;
    this.activeCount = count;
    this.radius = radius;
    this.maxY = maxY;

    const positions = new Float32Array(count * 3);
    this.seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.seeds[i * 3] = (i / count) * Math.PI * 2; // angle
      this.seeds[i * 3 + 1] = 0.25 + ((i * 31.7) % 100) / 100 * 0.75; // radial frac
      this.seeds[i * 3 + 2] = ((i * 59.3) % 100) / 100; // height phase
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(24, 24, 2, 24, 24, 22);
      g.addColorStop(0, 'rgba(235, 224, 205, 0.82)');
      g.addColorStop(0.55, 'rgba(185, 168, 145, 0.35)');
      g.addColorStop(1, 'rgba(160, 145, 125, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 48, 48);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;

    this.material = new THREE.PointsMaterial({
      map: tex,
      color,
      size: 0.42,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  public setQuality(tier: QualityTier): void {
    const ratio = tier === 'high' ? 1 : tier === 'standard' ? 0.65 : 0.35;
    this.activeCount = Math.max(8, Math.round(this.maxCount * ratio));
    this.geometry.setDrawRange(0, this.activeCount);
  }

  public update(elapsedSec: number, mode: 'swirl' | 'burst' | 'idle', intensity = 0.7): void {
    this.points.visible = intensity > 0.04;
    if (!this.points.visible) return;
    this.material.opacity = Math.min(0.72, intensity * 0.68);

    const attr = this.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < this.activeCount; i++) {
      const a0 = this.seeds[i * 3];
      const rf = this.seeds[i * 3 + 1];
      const hp = this.seeds[i * 3 + 2];

      if (mode === 'burst') {
        const cycle = (elapsedSec * 0.42 + hp) % 1;
        const r = (0.6 + cycle * this.radius * 1.15) * rf;
        arr[i * 3] = Math.cos(a0 + cycle * 0.4) * r;
        arr[i * 3 + 1] = 0.2 + Math.sin(cycle * Math.PI) * this.maxY * 0.65;
        arr[i * 3 + 2] = Math.sin(a0 + cycle * 0.4) * r;
      } else if (mode === 'swirl') {
        const ang = a0 + elapsedSec * (0.28 + (i % 3) * 0.08);
        const r = this.radius * rf;
        arr[i * 3] = Math.cos(ang) * r;
        arr[i * 3 + 1] = 0.35 + ((hp + elapsedSec * 0.08) % 1) * this.maxY;
        arr[i * 3 + 2] = Math.sin(ang) * r;
      } else {
        const ang = a0 + elapsedSec * 0.12;
        const r = this.radius * rf * 0.9;
        arr[i * 3] = Math.cos(ang) * r;
        arr[i * 3 + 1] = 0.25 + ((hp + elapsedSec * 0.05) % 1) * this.maxY * 0.55;
        arr[i * 3 + 2] = Math.sin(ang) * r;
      }
    }
    attr.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.map?.dispose();
    this.material.dispose();
  }
}

export interface LightingMoodPreset {
  background: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  dirColor: number;
  dirIntensity: number;
  fogDensity?: number;
}

export const LIGHTING_MOODS: Record<string, LightingMoodPreset> = {
  'primordial-chaos': {
    background: 0x3a4254,
    hemiSky: 0x94a3b8,
    hemiGround: 0x3f3a34,
    hemiIntensity: 0.72,
    dirColor: 0xdbeafe,
    dirIntensity: 0.85,
    fogDensity: 0.022,
  },
  'primordial-clear': {
    background: 0xdfeefa,
    hemiSky: 0xf8fbff,
    hemiGround: 0xb5c2ab,
    hemiIntensity: 1.05,
    dirColor: 0xfff5de,
    dirIntensity: 1.4,
    fogDensity: 0.007,
  },
  'torch-prison': {
    background: 0x182032,
    hemiSky: 0x64748b,
    hemiGround: 0x3b2f26,
    hemiIntensity: 0.56,
    dirColor: 0xffd7a8,
    dirIntensity: 0.62,
    fogDensity: 0.008,
  },
  'temple-fire': {
    background: 0x262938,
    hemiSky: 0x94a3b8,
    hemiGround: 0x4b3528,
    hemiIntensity: 0.68,
    dirColor: 0xffd4a3,
    dirIntensity: 0.92,
    fogDensity: 0.01,
  },
  'temple-day': {
    background: 0xe6ecf4,
    hemiSky: 0xf8fbff,
    hemiGround: 0xcbd5e1,
    hemiIntensity: 0.98,
    dirColor: 0xfff6e5,
    dirIntensity: 1.32,
    fogDensity: 0.006,
  },
  'daylight-bright': {
    background: 0xe6f2fa,
    hemiSky: 0xf8fbff,
    hemiGround: 0xc7d2c0,
    hemiIntensity: 1.02,
    dirColor: 0xfff7e6,
    dirIntensity: 1.36,
    fogDensity: 0.007,
  },
};

/**
 * EnvironmentalEffectsManager — Centralized controller attached to each diorama scene.
 * Auto-discovers tagged wind canopies (`userData.windCanopy`) and coordinates all water shaders,
 * fires, clouds, dust systems, and quality scaling.
 */
export class EnvironmentalEffectsManager {
  public readonly fires: FireSystemInstance[] = [];
  public readonly waters: THREE.ShaderMaterial[] = [];
  public readonly clouds: CloudRigItem[] = [];
  public readonly canopies: VegetationCanopyItem[] = [];
  public readonly dusts: DustDebrisEffect[] = [];

  public registerFire(fire: FireSystemInstance): FireSystemInstance {
    this.fires.push(fire);
    return fire;
  }

  public registerWater(mat: THREE.ShaderMaterial): THREE.ShaderMaterial {
    this.waters.push(mat);
    return mat;
  }

  public registerCloud(obj: THREE.Object3D, speed = 0.35, amplitude = 0.5, phase = 0): void {
    this.clouds.push({
      object: obj,
      baseX: obj.position.x,
      baseY: obj.position.y,
      speed,
      amplitude,
      phase,
    });
  }

  public collectWindCanopiesFromRoot(root: THREE.Object3D): void {
    let idx = 0;
    root.traverse((obj) => {
      if (obj.userData?.windCanopy === true) {
        this.canopies.push({
          canopy: obj,
          phase: idx * 1.17,
          amplitude: typeof obj.userData.windAmp === 'number' ? obj.userData.windAmp : 0.042,
          baseRotX: obj.rotation.x,
          baseRotZ: obj.rotation.z,
        });
        idx += 1;
      }
    });
  }

  public registerDust(dust: DustDebrisEffect): DustDebrisEffect {
    this.dusts.push(dust);
    return dust;
  }

  public setQuality(tier: QualityTier): void {
    this.fires.forEach((f) => f.setQuality(tier));
    this.dusts.forEach((d) => d.setQuality(tier));
  }

  /**
   * Updates ambient environmental effects (water ripples, cloud drift, canopy-only wind sway).
   * Fires & dust with stage-dependent intensity can also be updated by individual diorama `update()`.
   */
  public updateAmbient(elapsedSec: number, windStrength = 1.0): void {
    for (let i = 0; i < this.waters.length; i++) {
      this.waters[i].uniforms.uTime.value = elapsedSec;
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.object.position.x = c.baseX + Math.sin(elapsedSec * c.speed + c.phase) * c.amplitude;
      c.object.position.y = c.baseY + Math.cos(elapsedSec * c.speed * 0.7 + c.phase) * 0.06;
    }
    for (let i = 0; i < this.canopies.length; i++) {
      const v = this.canopies[i];
      const gust =
        Math.sin(elapsedSec * 1.65 + v.phase) * 0.65 +
        Math.sin(elapsedSec * 3.1 + v.phase * 1.8) * 0.35;
      v.canopy.rotation.z = v.baseRotZ + gust * v.amplitude * windStrength;
      v.canopy.rotation.x = v.baseRotX + Math.cos(elapsedSec * 1.3 + v.phase) * v.amplitude * 0.45 * windStrength;
    }
  }

  public dispose(): void {
    this.fires.forEach((f) => f.dispose());
    this.dusts.forEach((d) => d.dispose());
    this.waters.forEach((w) => w.dispose());
  }
}
