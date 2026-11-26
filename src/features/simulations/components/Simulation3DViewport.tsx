import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { QualityTier, SimulationDefinition, SimulationHotspot } from '../types';
import { PlacedLabel, RawLabelPoint, resolveLabelCollisions } from '../utils/labelLayout';
import { buildGrade10Diorama, BuiltDioramaScene } from '../engine/dioramaBuildersG10';
import { buildGrade11Diorama } from '../engine/dioramaBuildersG11';
import { buildGrade12AndSkillDiorama } from '../engine/dioramaBuildersG12';
import { createSelectionRing } from '../engine/dioramaPrimitives';

export interface Simulation3DViewportHandle {
  resetCamera: () => void;
  capturePng: () => string | null;
}

interface Simulation3DViewportProps {
  simulation: SimulationDefinition;
  stageIndex: number;
  selectedHotspotId: string | null;
  onSelectHotspot: (hotspot: SimulationHotspot) => void;
  showLabels: boolean;
  isPlaying: boolean;
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

/**
 * Collects the top-most tagged Object3D nodes for every hotspotId inside a built diorama root.
 * Enables true live Box3 world-space label anchoring and accurate selection ring footprint sizing.
 */
function collectHotspotObjects(root: THREE.Group): Map<string, THREE.Object3D[]> {
  const map = new Map<string, THREE.Object3D[]>();
  const visit = (node: THREE.Object3D, parentHotspotId?: string) => {
    const hsId = typeof node.userData?.hotspotId === 'string' ? node.userData.hotspotId : undefined;
    if (hsId && hsId !== parentHotspotId) {
      const list = map.get(hsId);
      if (list) list.push(node);
      else map.set(hsId, [node]);
    }
    for (const child of node.children) {
      visit(child, hsId ?? parentHotspotId);
    }
  };
  visit(root);
  return map;
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
      showLabels,
      isPlaying,
      reducedMotion,
      qualityTier,
      params,
      onWebGLFallback,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const selectionRingRef = useRef<THREE.Mesh | null>(null);
    const hotspotObjectsRef = useRef<Map<string, THREE.Object3D[]>>(new Map());
    const desiredTargetRef = useRef<THREE.Vector3 | null>(null);
    const defaultOrthoZoomRef = useRef<number>(1.0);
    const [webglError, setWebglError] = useState<string | null>(null);
    const [resolvedLabels, setResolvedLabels] = useState<PlacedLabel[]>([]);

    const stageIndexRef = useRef(stageIndex);
    const selectedIdRef = useRef(selectedHotspotId);
    const showLabelsRef = useRef(showLabels);
    const isPlayingRef = useRef(isPlaying);
    const reducedMotionRef = useRef(reducedMotion);
    const paramsRef = useRef(params);
    const onSelectHotspotRef = useRef(onSelectHotspot);

    stageIndexRef.current = stageIndex;
    selectedIdRef.current = selectedHotspotId;
    showLabelsRef.current = showLabels;
    isPlayingRef.current = isPlaying;
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
        desiredTargetRef.current = null;
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(13.8, 11.4, 13.8);
          cameraRef.current.zoom = defaultOrthoZoomRef.current;
          cameraRef.current.updateProjectionMatrix();
          controlsRef.current.target.set(0, 1.0, 0);
          controlsRef.current.update();
        }
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

    // Smoothly focus camera target toward the real selected object's world center
    useEffect(() => {
      if (!selectedHotspotId) return;
      const objs = hotspotObjectsRef.current.get(selectedHotspotId);
      if (objs && objs.length > 0) {
        const box = new THREE.Box3();
        const subBox = new THREE.Box3();
        let hasAny = false;
        for (const obj of objs) {
          if (!obj.visible) continue;
          subBox.setFromObject(obj);
          if (!subBox.isEmpty()) {
            if (!hasAny) {
              box.copy(subBox);
              hasAny = true;
            } else {
              box.union(subBox);
            }
          }
        }
        if (hasAny) {
          const center = new THREE.Vector3();
          box.getCenter(center);
          desiredTargetRef.current = new THREE.Vector3(
            center.x * 0.42,
            Math.max(0.7, Math.min(2.2, center.y * 0.65)),
            center.z * 0.42
          );
          return;
        }
      }
      const hs = hotspotMap.get(selectedHotspotId);
      if (hs) {
        desiredTargetRef.current = new THREE.Vector3(
          hs.position3D[0] * 0.4,
          Math.max(0.7, hs.position3D[1] * 0.55),
          hs.position3D[2] * 0.4
        );
      }
    }, [selectedHotspotId, hotspotMap]);

    // Smoothly focus OrbitControls target toward current stage focus
    useEffect(() => {
      const stage = simulation.stages[stageIndex];
      if (stage) {
        desiredTargetRef.current = new THREE.Vector3(
          stage.cameraTarget[0] * 0.42,
          Math.max(0.65, stage.cameraTarget[1] * 0.52),
          stage.cameraTarget[2] * 0.42
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
      const maxDpr = isSoftwareGl ? 1 : qualityTier === 'high' ? 2 : qualityTier === 'standard' ? 1.5 : 1;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = !isSoftwareGl && qualityTier !== 'economy';
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      const width = container.clientWidth || 720;
      const height = container.clientHeight || 480;
      renderer.setSize(width, height);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // WebGL context loss resilience
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

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(built.backdropColor);
      if (built.fogDensity && built.fogDensity > 0) {
        scene.fog = new THREE.FogExp2(built.backdropColor, built.fogDensity);
      }

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envTarget.texture;
      scene.environmentIntensity = built.ambientIntensity ? 0.36 : 0.62;

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

      // Index all real 3D hotspot objects once for live Box3 anchoring
      const objMap = collectHotspotObjects(built.root);
      hotspotObjectsRef.current = objMap;

      const selectionRing = createSelectionRing(1.0);
      selectionRing.visible = false;
      scene.add(selectionRing);
      selectionRingRef.current = selectionRing;

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
      camera.position.set(13.8, 11.4, 13.8);
      camera.lookAt(0, 1.0, 0);
      defaultOrthoZoomRef.current = width < 520 ? 0.78 : 0.94;
      camera.zoom = defaultOrthoZoomRef.current;
      camera.updateProjectionMatrix();
      cameraRef.current = camera;

      // Pre-compile shaders to prevent first-frame stall
      renderer.compile(scene, camera);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.08;
      controls.minZoom = 0.55;
      controls.maxZoom = 2.4;
      controls.maxPolarAngle = Math.PI / 2.18;
      controls.minPolarAngle = Math.PI / 6;
      controls.target.set(0, 1.0, 0);
      controls.update();
      controlsRef.current = controls;

      // Cancel smooth camera transition immediately whenever the user starts dragging/zooming
      const onControlStart = () => {
        desiredTargetRef.current = null;
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
          const hsId = hit.object.userData?.hotspotId;
          if (typeof hsId === 'string') return hsId;
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

      // Pre-allocated scratch math objects (ZERO per-frame allocations)
      const projVec = new THREE.Vector3();
      const tmpBox = new THREE.Box3();
      const tmpSubBox = new THREE.Box3();
      const tmpCenter = new THREE.Vector3();
      const tmpSize = new THREE.Vector3();
      let lastLabelSync = 0;

      /**
       * Computes live world Box3 bounds for any hotspotId from its real 3D Object3D meshes.
       */
      const computeLiveHotspotBounds = (
        hs: SimulationHotspot,
        outCenter: THREE.Vector3,
        outSize: THREE.Vector3
      ): number => {
        const objs = objMap.get(hs.id);
        if (objs && objs.length > 0) {
          let hasAny = false;
          for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            if (!obj.visible) continue;
            tmpSubBox.setFromObject(obj);
            if (!tmpSubBox.isEmpty()) {
              if (!hasAny) {
                tmpBox.copy(tmpSubBox);
                hasAny = true;
              } else {
                tmpBox.union(tmpSubBox);
              }
            }
          }
          if (hasAny) {
            tmpBox.getCenter(outCenter);
            tmpBox.getSize(outSize);
            return tmpBox.max.y;
          }
        }
        outCenter.set(hs.position3D[0], hs.position3D[1], hs.position3D[2]);
        outSize.set(1.2, 1.2, 1.2);
        return hs.position3D[1] + 0.45;
      };

      const projectLabels = (nowMs: number) => {
        if (nowMs - lastLabelSync < (isSoftwareGl ? 130 : 42)) return;
        lastLabelSync = nowMs;

        // Also update live selection ring directly to the selected object's real world footprint
        const selId = selectedIdRef.current;
        if (selId) {
          const selHs = simulation.hotspots.find((h) => h.id === selId);
          if (selHs) {
            computeLiveHotspotBounds(selHs, tmpCenter, tmpSize);
            selectionRing.visible = true;
            selectionRing.position.set(tmpCenter.x, 0.065, tmpCenter.z);
            const footprintRadius = Math.max(0.65, Math.min(2.2, Math.max(tmpSize.x, tmpSize.z) * 0.54));
            selectionRing.userData.baseScale = footprintRadius;
          } else {
            selectionRing.visible = false;
          }
        } else {
          selectionRing.visible = false;
        }

        if (!showLabelsRef.current) {
          setResolvedLabels([]);
          return;
        }

        const w = container.clientWidth || 720;
        const h = container.clientHeight || 480;
        const activeStage = simulation.stages[stageIndexRef.current];
        const stageHighlighted = new Set(activeStage?.highlightHotspotIds ?? []);

        const candidates: RawLabelPoint[] = simulation.hotspots.map((hs) => {
          const topY = computeLiveHotspotBounds(hs, tmpCenter, tmpSize);
          // Anchor precisely near the visual upper crown of the real 3D object
          const anchorYWorld =
            tmpSize.y < 0.45
              ? topY + 0.16 // flat feature like river/lane
              : tmpCenter.y + tmpSize.y * 0.36;
          projVec.set(tmpCenter.x, anchorYWorld, tmpCenter.z);
          projVec.project(camera);

          const x = (projVec.x * 0.5 + 0.5) * w;
          const y = (-projVec.y * 0.5 + 0.5) * h;
          const isSelected = hs.id === selId;
          const isPrimary = hs.priority === 1 || stageHighlighted.has(hs.id);
          const occluded = !(projVec.z <= 1.0 && x > -30 && x < w + 30 && y > -30 && y < h + 30);
          return {
            id: hs.id,
            text: hs.shortLabel || hs.label,
            anchorX: x,
            anchorY: y,
            priority: isPrimary ? 1 : hs.priority,
            isSelected,
            occluded,
          };
        });

        const maxVisible = w < 640 ? 4 : 6;
        const resolved = resolveLabelCollisions(candidates, w, h, { maxVisibleLabels: maxVisible });
        setResolvedLabels(resolved.filter((item) => item.visible));
      };

      let stopped = false;
      let rafId = 0;
      let elapsed = 0;
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
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        if (isPlayingRef.current && !reducedMotionRef.current) {
          elapsed += dt;
        }
        built.update(elapsed, stageIndexRef.current, paramsRef.current);

        // Smoothly damp OrbitControls target toward selected object/stage without fighting user drag
        const desired = desiredTargetRef.current;
        if (desired) {
          controls.target.x = THREE.MathUtils.damp(controls.target.x, desired.x, 5.5, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, desired.y, 5.5, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, desired.z, 5.5, dt);
          if (controls.target.distanceToSquared(desired) < 0.0005) {
            desiredTargetRef.current = null;
          }
        }

        if (selectionRing.visible) {
          const baseScale = typeof selectionRing.userData.baseScale === 'number' ? selectionRing.userData.baseScale : 1;
          const pulse = baseScale * (1 + Math.sin(now * 0.005) * 0.055);
          selectionRing.scale.setScalar(pulse);
        }

        controls.update();
        renderer.render(scene, camera);
        projectLabels(now);
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

        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
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
      };
    }, [simulation.id, simulation.scene3DPreset, qualityTier, onWebGLFallback, simulation.hotspots]);

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

        {/* Crisp SVG leader lines directly anchored to the real 3D objects */}
        {showLabels && resolvedLabels.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {resolvedLabels.map((lbl) => {
              const dist = Math.hypot(lbl.labelX - lbl.anchorX, lbl.labelY - lbl.anchorY);
              const isSelected = lbl.id === selectedHotspotId;
              return (
                <g key={`line-${lbl.id}`}>
                  {dist >= 16 && (
                    <line
                      x1={lbl.anchorX}
                      y1={lbl.anchorY}
                      x2={lbl.labelX}
                      y2={lbl.labelY}
                      stroke={isSelected ? '#1D63ED' : 'rgba(15, 41, 66, 0.42)'}
                      strokeWidth={isSelected ? 2.2 : 1.5}
                      strokeDasharray={isSelected ? undefined : '4 3'}
                    />
                  )}
                  <circle
                    cx={lbl.anchorX}
                    cy={lbl.anchorY}
                    r={isSelected ? 4.8 : 3.4}
                    fill={isSelected ? '#1D63ED' : '#FFFFFF'}
                    stroke="#0F2942"
                    strokeWidth={1.6}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Crisp Isometric Floating Labels anchored to real 3D objects */}
        {showLabels &&
          resolvedLabels.map((lbl) => {
            const isSelected = lbl.id === selectedHotspotId;
            const hotspot = hotspotMap.get(lbl.id);
            if (!hotspot) return null;
            return (
              <button
                key={lbl.id}
                type="button"
                onClick={() => onSelectHotspot(hotspot)}
                style={{
                  transform: `translate3d(${Math.round(lbl.labelX)}px, ${Math.round(lbl.labelY)}px, 0) translate(-50%, -50%)`,
                }}
                className={`absolute left-0 top-0 z-10 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-[15px] font-bold leading-snug tracking-tight transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'bg-[#1D63ED] text-white shadow-[0_8px_20px_rgba(29,99,237,0.38)] ring-2 ring-white/85'
                    : 'bg-white text-[#0F2942] shadow-[0_4px_14px_rgba(15,41,66,0.16)] border border-slate-200/90 hover:bg-blue-50 hover:text-[#1D63ED]'
                }`}
              >
                {lbl.text}
              </button>
            );
          })}

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-white/92 px-3 py-1.5 text-[13px] font-medium text-slate-700 shadow-sm border border-slate-200/80">
          Kéo xoay 360° · Cuộn thu phóng · Nhấp nhãn hoặc mô hình để khám phá
        </div>
      </div>
    );
  }
);

Simulation3DViewport.displayName = 'Simulation3DViewport';
