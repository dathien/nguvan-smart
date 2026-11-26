import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LightingMoodPreset } from '../effects/EnvironmentalEffects';

/**
 * Core Interactive 3D Storytelling Engine Modules:
 * - AnimationController: playback speed (0.5x–2x), synchronous pause/resume, clean reset
 * - SceneTransitionManager: smooth stage-to-stage blend progress
 * - CameraController: auto-fit bounds, smooth damped stage/object framing yielding immediately on user orbit
 * - DynamicLightingRig: smooth lighting & backdrop mood transitions per narrative stage
 */

export class AnimationController {
  public elapsedSec = 0;
  public isPlaying = true;
  public speed = 1.0;

  public tick(rawDt: number, reducedMotion: boolean): number {
    const clampedDt = Math.min(0.05, Math.max(0, rawDt));
    if (!this.isPlaying || reducedMotion) {
      return 0;
    }
    const scaledDt = clampedDt * this.speed;
    this.elapsedSec += scaledDt;
    return scaledDt;
  }

  public reset(): void {
    this.elapsedSec = 0;
  }
}

export class SceneTransitionManager {
  public currentStage = 0;
  public transitionProgress = 1;

  public setStage(stageIndex: number): void {
    if (stageIndex !== this.currentStage) {
      this.currentStage = stageIndex;
      this.transitionProgress = 0;
    }
  }

  public step(dt: number): number {
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + dt * 1.8);
    }
    return this.transitionProgress;
  }
}

export class CameraController {
  private desiredTarget: THREE.Vector3 | null = null;
  private defaultPos = new THREE.Vector3(13.8, 11.4, 13.8);
  private defaultTarget = new THREE.Vector3(0, 1.0, 0);
  public defaultZoom = 0.94;

  constructor(
    private readonly camera: THREE.OrthographicCamera,
    private readonly controls: OrbitControls
  ) {}

  public configureDefault(viewportWidth: number): void {
    this.defaultZoom = viewportWidth < 520 ? 0.78 : 0.94;
    this.camera.position.copy(this.defaultPos);
    this.camera.zoom = this.defaultZoom;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(this.defaultTarget);
    this.controls.update();
  }

  public focusPoint(x: number, y: number, z: number): void {
    this.desiredTarget = new THREE.Vector3(
      THREE.MathUtils.clamp(x * 0.42, -3.2, 3.2),
      THREE.MathUtils.clamp(y * 0.58, 0.6, 2.5),
      THREE.MathUtils.clamp(z * 0.42, -3.2, 3.2)
    );
  }

  public cancelFocus(): void {
    this.desiredTarget = null;
  }

  public reset(): void {
    this.desiredTarget = null;
    this.camera.position.copy(this.defaultPos);
    this.camera.zoom = this.defaultZoom;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(this.defaultTarget);
    this.controls.update();
  }

  public update(dt: number): void {
    if (this.desiredTarget) {
      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.desiredTarget.x, 5.2, dt);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.desiredTarget.y, 5.2, dt);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.desiredTarget.z, 5.2, dt);
      if (this.controls.target.distanceToSquared(this.desiredTarget) < 0.0006) {
        this.desiredTarget = null;
      }
    }
    this.controls.update();
  }
}

export class DynamicLightingRig {
  private readonly tmpBg = new THREE.Color();
  private readonly tmpHemiSky = new THREE.Color();
  private readonly tmpHemiGround = new THREE.Color();
  private readonly tmpDirColor = new THREE.Color();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly hemiLight: THREE.HemisphereLight,
    private readonly dirLight: THREE.DirectionalLight
  ) {}

  public applyMood(mood: LightingMoodPreset, dt: number): void {
    const alpha = Math.min(1, dt * 3.5 + 0.06);
    this.tmpBg.setHex(mood.background);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(this.tmpBg, alpha);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(this.tmpBg, alpha);
      if (mood.fogDensity !== undefined) {
        this.scene.fog.density += (mood.fogDensity - this.scene.fog.density) * alpha;
      }
    }
    this.tmpHemiSky.setHex(mood.hemiSky);
    this.tmpHemiGround.setHex(mood.hemiGround);
    this.tmpDirColor.setHex(mood.dirColor);
    this.hemiLight.color.lerp(this.tmpHemiSky, alpha);
    this.hemiLight.groundColor.lerp(this.tmpHemiGround, alpha);
    this.hemiLight.intensity += (mood.hemiIntensity - this.hemiLight.intensity) * alpha;
    this.dirLight.color.lerp(this.tmpDirColor, alpha);
    this.dirLight.intensity += (mood.dirIntensity - this.dirLight.intensity) * alpha;
  }
}
