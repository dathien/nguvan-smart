import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  LabelDisplayMode,
  QualityTier,
  SimulationDefinition,
  SimulationHotspot,
} from '../types';
import { buildGrade10Diorama, BuiltDioramaScene } from '../engine/dioramaBuildersG10';
import { buildGrade11Diorama } from '../engine/dioramaBuildersG11';
import { buildGrade12AndSkillDiorama } from '../engine/dioramaBuildersG12';
import { createSelectionRing } from '../engine/dioramaPrimitives';
import {
  AnimationController,
  CameraController,
  DynamicLightingRig,
  SceneTransitionManager,
} from '../engine/StorytellingEngine';
import { SmartLabelManager, StableLabelFrameState } from '../labels/SmartLabelManager';

export interface Simulation3DViewportHandle {
  resetCamera: () => void;
  resetScene: () => void;
  capturePng: () => string | null;
}

interface Simulation3DViewportProps {
  simulation: SimulationDefinition;
  stageIndex: number;
  selectedHotspotId: string | null;
  onSelectHotspot: (hotspot: SimulationHotspot) => void;
  labelMode: LabelDisplayMode;
  isPlaying: boolean;
  playbackSpeed: number;
  reducedMotion: boolean;
  qualityTier: QualityTier;
  params: Record<string, number>;
  onWebGLFallback?: () => void;
}

function detectSoftwareWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|WARP|Software|Mesa OffScreen/i.test(renderer);
  } catch {
    return false;
  }
}

export const Simulation3DViewport = React.forwardRef<
  Simulation3DViewportHandle,
  Simulation3DViewportProps
>(
  (
    {
      simulation,
      stageIndex,
      selectedHotspotId,
      onSelectHotspot,
      labelMode,
      isPlaying,
      playbackSpeed,
      reducedMotion,
      qualityTier,
      params,
      onWebGLFallback,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraControllerRef = useRef<CameraController | null>(null);
    const animControllerRef = useRef<AnimationController>(new AnimationController());
    const labelManagerRef = useRef<SmartLabelManager>(new SmartLabelManager());
    const forceSceneSyncRef = useRef<boolean>(true);
    const [webglError, setWebglError] = useState<string | null>(null);

    // Direct DOM refs for zero-jitter, zero-React-re-render 60fps label & leader-line updates
    const labelButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const svgGroupRefs = useRef<Map<string, SVGGElement>>(new Map());
    const svgLineRefs = useRef<Map<string, SVGLineElement>>(new Map());
    const svgDotRefs = useRef<Map<string, SVGCircleElement>>(new Map());

    const stageIndexRef = useRef(stageIndex);
    const selectedIdRef = useRef(selectedHotspotId);
    const labelModeRef = useRef(labelMode);
    const isPlayingRef = useRef(isPlaying);
    const playbackSpeedRef = useRef(playbackSpeed);
    const reducedMotionRef = useRef(reducedMotion);
    const paramsRef = useRef(params);
    const onSelectHotspotRef = useRef(onSelectHotspot);

    // Trigger one-shot diorama sync whenever stage or params change (even when paused)
    if (stageIndexRef.current !== stageIndex || paramsRef.current !== params) {
      forceSceneSyncRef.current = true;
    }

    stageIndexRef.current = stageIndex;
    selectedIdRef.current = selectedHotspotId;
    labelModeRef.current = labelMode;
    isPlayingRef.current = isPlaying;
    playbackSpeedRef.current = playbackSpeed;
    reducedMotionRef.current = reducedMotion;
    paramsRef.current = params;
    onSelectHotspotRef.current = onSelectHotspot;

    const hotspotMap = useMemo(() => {
      const m = new Map<string, SimulationHotspot>();
      simulation.hotspots.forEach((h) => m.set(h.id, h));
      return m;
    }, [simulation.hotspots]);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        cameraControllerRef.current?.reset();
      },
      resetScene: () => {
        animControllerRef.current.reset();
        labelManagerRef.current.resetCache();
        cameraControllerRef.current?.reset();
        forceSceneSyncRef.current = true;
      },
      capturePng: () => {
        const renderer = rendererRef.current;
        if (!renderer) return null;
        try {
          return renderer.domElement.toDataURL('image/png');
        } catch {
          return null;
        }
      },
    }));

    // Smoothly focus camera target toward the real selected object's anchor
    useEffect(() => {
      if (!selectedHotspotId) return;
      const hs = hotspotMap.get(selectedHotspotId);
      if (!hs || !cameraControllerRef.current) return;
      const tmp = new THREE.Vector3();
      labelManagerRef.current.anchors.getWorldAnchor(hs, tmp);
      cameraControllerRef.current.focusPoint(tmp.x, tmp.y, tmp.z);
    }, [selectedHotspotId, hotspotMap]);

    // Smoothly focus OrbitControls target toward current stage focus
    useEffect(() => {
      const stage = simulation.stages[stageIndex];
      if (stage && cameraControllerRef.current) {
        cameraControllerRef.current.focusPoint(
          stage.cameraTarget[0],
          stage.cameraTarget[1],
          stage.cameraTarget[2]
        );
      }
    }, [stageIndex, simulation.stages]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: qualityTier !== 'economy',
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        });
      } catch {
        setWebglError('Thiết bị chưa hỗ trợ WebGL 3D. Đang chuyển sang chế độ 2D tương tác.');
        onWebGLFallback?.();
        return;
      }

      const gl = renderer.getContext();
      const isSoftwareGl = detectSoftwareWebGL(gl);
      const maxDpr = isSoftwareGl
        ? 1
        : qualityTier === 'high'
        ? 2
        : qualityTier === 'standard'
        ? 1.5
        : 1;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      renderer.shadowMap.enabled = !isSoftwareGl && qualityTier !== 'economy';
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      const width = container.clientWidth || 720;
      const height = container.clientHeight || 480;
      renderer.setSize(width, height);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const onContextLost = (e: Event) => {
        e.preventDefault();
      };
      const onContextRestored = () => {
        setWebglError(null);
      };
      renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
      renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);

      const preset = simulation.scene3DPreset ?? 'myth-pillar';
      const built: BuiltDioramaScene =
        buildGrade10Diorama(preset) ||
        buildGrade11Diorama(preset) ||
        buildGrade12AndSkillDiorama(preset) ||
        buildGrade10Diorama('myth-pillar')!;

      built.setQuality?.(qualityTier);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(built.backdropColor);
      if (built.fogDensity && built.fogDensity > 0) {
        scene.fog = new THREE.FogExp2(built.backdropColor, built.fogDensity);
      }

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envTarget.texture;
      scene.environmentIntensity = built.ambientIntensity ? 0.38 : 0.62;

      const hemiLight = new THREE.HemisphereLight(
        0xf8fbff,
        0xcbd5e1,
        built.ambientIntensity !== undefined ? built.ambientIntensity * 1.4 : 0.96
      );
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(
        0xfff6e5,
        built.directionalIntensity !== undefined ? built.directionalIntensity * 1.48 : 1.32
      );
      dirLight.position.set(10.5, 16.5, 11.5);
      if (renderer.shadowMap.enabled) {
        dirLight.castShadow = true;
        const mapSz = qualityTier === 'high' ? 2048 : 1024;
        dirLight.shadow.mapSize.set(mapSz, mapSz);
        dirLight.shadow.camera.left = -9.5;
        dirLight.shadow.camera.right = 9.5;
        dirLight.shadow.camera.top = 9.5;
        dirLight.shadow.camera.bottom = -9.5;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 42;
        dirLight.shadow.bias = -0.0005;
      }
      scene.add(dirLight);

      const rimLight = new THREE.DirectionalLight(0xc7d9f8, 0.44);
      rimLight.position.set(-10, 8, -9);
      scene.add(rimLight);

      scene.add(built.root);

      const lightingRig = new DynamicLightingRig(scene, hemiLight, dirLight);
      const transitionMgr = new SceneTransitionManager();
      const animCtrl = animControllerRef.current;
      animCtrl.reset();
      forceSceneSyncRef.current = true;

      // Initial scene pose before indexing static anchors so stage-0 rest pose is accurate
      built.update(0, stageIndexRef.current, paramsRef.current, 0.016);
      const initialMood = built.getStageMood?.(stageIndexRef.current);
      if (initialMood) {
        lightingRig.applyMood(initialMood, 1.0);
      }

      // Index explicit static anchors, hotspot roots, and ProtectedObjectAreas ONCE
      const labelManager = labelManagerRef.current;
      labelManager.resetCache();
      labelManager.anchors.indexScene(built.root);

      const selectionRing = createSelectionRing(1.0);
      selectionRing.visible = false;
      scene.add(selectionRing);

      const aspect = width / height;
      const frustumSize = 11.8;
      const camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        120
      );

      // Pre-compile shaders to prevent first-frame stall
      renderer.compile(scene, camera);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.08;
      controls.minZoom = 0.55;
      controls.maxZoom = 2.4;
      controls.maxPolarAngle = Math.PI / 2.18;
      controls.minPolarAngle = Math.PI / 6;

      const cameraCtrl = new CameraController(camera, controls);
      cameraCtrl.configureDefault(width);
      cameraControllerRef.current = cameraCtrl;

      const onControlStart = () => {
        cameraCtrl.cancelFocus();
      };
      controls.addEventListener('start', onControlStart);

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerDownPos = { x: 0, y: 0 };

      const getHitHotspotId = (clientX: number, clientY: number): string | null => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(built.root.children, true);
        for (const hit of hits) {
          let cur: THREE.Object3D | null = hit.object;
          while (cur && cur !== built.root) {
            const hsId = cur.userData?.hotspotId;
            if (typeof hsId === 'string') return hsId;
            cur = cur.parent;
          }
        }
        return null;
      };

      const onPointerDown = (e: PointerEvent) => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
      };
      const onPointerUp = (e: PointerEvent) => {
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (dist > 6) return;
        const hsId = getHitHotspotId(e.clientX, e.clientY);
        if (hsId) {
          const found = simulation.hotspots.find((h) => h.id === hsId);
          if (found) onSelectHotspotRef.current(found);
        }
      };
      const onPointerMove = (e: PointerEvent) => {
        const hsId = getHitHotspotId(e.clientX, e.clientY);
        renderer.domElement.style.cursor = hsId ? 'pointer' : 'grab';
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointermove', onPointerMove);

      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || 720;
        const h = container.clientHeight || 480;
        const asp = w / h;
        camera.left = (-frustumSize * asp) / 2;
        camera.right = (frustumSize * asp) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Scratch objects (zero per-frame allocations)
      const tmpBox = new THREE.Box3();
      const tmpSubBox = new THREE.Box3();
      const tmpCenter = new THREE.Vector3();
      const tmpSize = new THREE.Vector3();
      const visibleLookup = new Map<string, StableLabelFrameState>();
      const stageHighlightSet = new Set<string>();

      const applyStableLabelsToDOM = (rawDt: number) => {
        const selId = selectedIdRef.current;
        const curStageIdx = stageIndexRef.current;

        // Update selection footprint halo ring directly on floor
        if (selId && labelModeRef.current !== 'observe') {
          const selHs = simulation.hotspots.find((h) => h.id === selId);
          const inStage =
            selHs &&
            (!selHs.stageRange || selHs.stageRange.length === 0 || selHs.stageRange.includes(curStageIdx));
          if (selHs && inStage && labelManager.anchors.isObjectVisible(selHs.id)) {
            const radius = labelManager.anchors.getSelectionFootprint(
              selHs,
              tmpCenter,
              tmpBox,
              tmpSubBox,
              tmpSize
            );
            selectionRing.visible = true;
            selectionRing.position.set(tmpCenter.x, 0.065, tmpCenter.z);
            selectionRing.userData.baseScale = radius;
          } else {
            selectionRing.visible = false;
          }
        } else {
          selectionRing.visible = false;
        }

        const w = container.clientWidth || 720;
        const h = container.clientHeight || 480;

        stageHighlightSet.clear();
        const activeStage = simulation.stages[curStageIdx];
        if (activeStage) {
          for (let i = 0; i < activeStage.highlightHotspotIds.length; i++) {
            stageHighlightSet.add(activeStage.highlightHotspotIds[i]);
          }
        }

        const states = labelManager.computeFrame({
          hotspots: simulation.hotspots,
          stageIndex: curStageIdx,
          stageHighlightIds: stageHighlightSet,
          selectedHotspotId: selId,
          mode: labelModeRef.current,
          camera,
          viewportWidth: w,
          viewportHeight: h,
          dt: rawDt,
        });

        visibleLookup.clear();
        for (let i = 0; i < states.length; i++) {
          visibleLookup.set(states[i].id, states[i]);
        }

        for (let i = 0; i < simulation.hotspots.length; i++) {
          const hs = simulation.hotspots[i];
          const st = visibleLookup.get(hs.id);
          const btn = labelButtonRefs.current.get(hs.id);
          const svgG = svgGroupRefs.current.get(hs.id);
          const svgLine = svgLineRefs.current.get(hs.id);
          const svgDot = svgDotRefs.current.get(hs.id);

          if (st && st.visible) {
            const lx = Math.round(st.labelX);
            const ly = Math.round(st.labelY);
            const ax = Math.round(st.anchorX);
            const ay = Math.round(st.anchorY);

            if (btn) {
              btn.style.transform = `translate3d(${lx}px, ${ly}px, 0) translate(-50%, -50%)`;
              btn.style.opacity = '1';
              btn.style.pointerEvents = 'auto';
              btn.style.zIndex = st.isSelected ? '20' : '10';
            }

            if (svgG) {
              svgG.style.opacity = '1';
            }
            if (svgLine) {
              const dist = Math.hypot(lx - ax, ly - ay);
              if (dist >= 16) {
                svgLine.setAttribute('x1', String(ax));
                svgLine.setAttribute('y1', String(ay));
                svgLine.setAttribute('x2', String(lx));
                svgLine.setAttribute('y2', String(ly));
                svgLine.style.opacity = '1';
              } else {
                svgLine.style.opacity = '0';
              }
            }
            if (svgDot) {
              svgDot.setAttribute('cx', String(ax));
              svgDot.setAttribute('cy', String(ay));
            }
          } else {
            if (btn) {
              btn.style.opacity = '0';
              btn.style.pointerEvents = 'none';
            }
            if (svgG) {
              svgG.style.opacity = '0';
            }
          }
        }
      };

      let stopped = false;
      let rafId = 0;
      let lastTime = performance.now();

      const afterDraw = (cb: () => void) => {
        if (!isSoftwareGl || !(gl instanceof WebGL2RenderingContext)) {
          rafId = requestAnimationFrame(cb);
          return;
        }
        const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!fence) {
          rafId = requestAnimationFrame(cb);
          return;
        }
        gl.flush();
        const poll = () => {
          if (stopped) {
            gl.deleteSync(fence);
            return;
          }
          const status = gl.clientWaitSync(fence, 0, 0);
          if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
            gl.deleteSync(fence);
            rafId = requestAnimationFrame(cb);
          } else {
            setTimeout(poll, 16);
          }
        };
        setTimeout(poll, 16);
      };

      const renderFrame = () => {
        if (stopped) return;
        const now = performance.now();
        const rawDt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        animCtrl.isPlaying = isPlayingRef.current;
        animCtrl.speed = playbackSpeedRef.current;
        const scaledDt = animCtrl.tick(rawDt, reducedMotionRef.current);

        transitionMgr.setStage(stageIndexRef.current);
        transitionMgr.step(rawDt);

        // Synchronous Pause: freeze ALL storytelling animations & fire/water/nature effects when paused,
        // while still applying one-shot updates when stage or params change!
        if (scaledDt > 0 || forceSceneSyncRef.current) {
          built.update(animCtrl.elapsedSec, stageIndexRef.current, paramsRef.current, scaledDt);
          forceSceneSyncRef.current = false;
        }

        // Smooth stage mood lighting transition (runs on rawDt so stage switches stay responsive even when paused)
        const mood = built.getStageMood?.(stageIndexRef.current);
        if (mood) {
          lightingRig.applyMood(mood, rawDt);
        }

        // Selection halo pulse pauses synchronously with storytelling playback
        if (selectionRing.visible) {
          const baseScale =
            typeof selectionRing.userData.baseScale === 'number'
              ? selectionRing.userData.baseScale
              : 1;
          const pulse = baseScale * (1 + Math.sin(animCtrl.elapsedSec * 4.5) * 0.05);
          selectionRing.scale.setScalar(pulse);
        }

        // OrbitControls & CameraController ALWAYS remain active even when paused!
        cameraCtrl.update(rawDt);
        renderer.render(scene, camera);
        applyStableLabelsToDOM(rawDt);
        afterDraw(renderFrame);
      };

      renderFrame();

      return () => {
        stopped = true;
        cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        controls.removeEventListener('start', onControlStart);
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        controls.dispose();
        envTarget.dispose();
        pmrem.dispose();
        built.dispose?.();

        scene.traverse((obj) => {
          if (
            obj instanceof THREE.Mesh ||
            obj instanceof THREE.Points ||
            obj instanceof THREE.Line
          ) {
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
        renderer.dispose();
        rendererRef.current = null;
        cameraControllerRef.current = null;
      };
    }, [
      simulation.id,
      simulation.scene3DPreset,
      qualityTier,
      onWebGLFallback,
      simulation.hotspots,
      simulation.stages,
    ]);

    if (webglError) {
      return (
        <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl bg-slate-100 p-6 text-center text-slate-700">
          <p className="text-base font-semibold">{webglError}</p>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl select-none">
        <div
          ref={containerRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          aria-label={`Mô phỏng 3D ${simulation.title}`}
        />

        {/* Direct-DOM SVG leader lines (zero per-frame React state updates) */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {simulation.hotspots.map((hs) => {
            const isSelected = hs.id === selectedHotspotId;
            return (
              <g
                key={`line-${hs.id}`}
                ref={(el) => {
                  if (el) svgGroupRefs.current.set(hs.id, el);
                  else svgGroupRefs.current.delete(hs.id);
                }}
                style={{ opacity: 0 }}
              >
                <line
                  ref={(el) => {
                    if (el) svgLineRefs.current.set(hs.id, el);
                    else svgLineRefs.current.delete(hs.id);
                  }}
                  stroke={isSelected ? '#1D63ED' : 'rgba(15, 41, 66, 0.46)'}
                  strokeWidth={isSelected ? 2.2 : 1.5}
                  strokeDasharray={isSelected ? undefined : '4 3'}
                />
                <circle
                  ref={(el) => {
                    if (el) svgDotRefs.current.set(hs.id, el);
                    else svgDotRefs.current.delete(hs.id);
                  }}
                  r={isSelected ? 4.8 : 3.5}
                  fill={isSelected ? '#1D63ED' : '#FFFFFF'}
                  stroke="#0F2942"
                  strokeWidth={1.6}
                />
              </g>
            );
          })}
        </svg>

        {/* Smart Stable Labels: fixed dimensions (zero size shift on select/hover), >=15px crisp Vietnamese font */}
        {simulation.hotspots.map((hs) => {
          const isSelected = hs.id === selectedHotspotId;
          return (
            <button
              key={hs.id}
              ref={(el) => {
                if (el) labelButtonRefs.current.set(hs.id, el);
                else labelButtonRefs.current.delete(hs.id);
              }}
              type="button"
              onClick={() => onSelectHotspot(hs)}
              style={{
                opacity: 0,
                pointerEvents: 'none',
                transform: 'translate3d(-9999px, -9999px, 0)',
              }}
              className={`absolute left-0 top-0 box-border whitespace-nowrap rounded-xl border-2 px-3.5 py-1.5 text-[15px] font-bold leading-snug tracking-tight transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSelected
                  ? 'border-white/90 bg-[#1D63ED] text-white shadow-[0_8px_20px_rgba(29,99,237,0.38)]'
                  : 'border-slate-200 bg-white/95 text-[#0F2942] shadow-[0_4px_14px_rgba(15,41,66,0.16)] hover:bg-blue-50 hover:text-[#1D63ED]'
              }`}
            >
              {hs.shortLabel || hs.label}
            </button>
          );
        })}

        {/* Status badge when paused */}
        {!isPlaying && (
          <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-xl border border-amber-300/80 bg-amber-50/95 px-3 py-1 text-[13px] font-bold text-amber-900 shadow-sm">
            Đang tạm dừng chuyển động · Vẫn xoay/thu phóng tự do
          </div>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-slate-200/80 bg-white/92 px-3 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm">
          Kéo xoay 360° · Cuộn thu phóng · Nhấp nhãn hoặc mô hình để khám phá
        </div>
      </div>
    );
  }
);

Simulation3DViewport.displayName = 'Simulation3DViewport';
