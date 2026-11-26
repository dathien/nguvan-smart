import * as THREE from 'three';
import { LabelDisplayMode, SimulationHotspot } from '../types';

/**
 * Smart Stable Label System (All 40 lessons)
 *
 * Guarantees:
 * - Zero label jumping/jittering when camera is stationary or while fire/water/trees animate
 * - Dead Zone (3px) + Accumulated Drift Reset + Exponential Smoothing (Position Smoothing)
 * - Hysteresis slot stability + Position Caching
 * - Stable Anchor (prioritizes static `userData.labelAnchorId` nodes over animated Box3 bounds!)
 * - Protected Object Area avoidance (never covers character faces, torsos, silk scroll, or flames)
 * - 3 Visibility Modes: 'explore' (Khám phá), 'presentation' (Trình chiếu), 'observe' (Quan sát mô hình)
 * - Stage-scoped visibility (`hotspot.stageRange`) so labels only appear when object exists in that stage
 * - Minimum 12px spacing between labels & 12px viewport edge margins
 */

export interface ProtectedRect {
  id: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface StableLabelFrameState {
  id: string;
  text: string;
  anchorX: number;
  anchorY: number;
  labelX: number;
  labelY: number;
  width: number;
  height: number;
  visible: boolean;
  isSelected: boolean;
  priority: 1 | 2 | 3;
}

interface LabelCacheEntry {
  committedAnchorX: number;
  committedAnchorY: number;
  smoothAnchorX: number;
  smoothAnchorY: number;
  smoothLabelX: number;
  smoothLabelY: number;
  slotIndex: number;
  initialized: boolean;
  visibleFrames: number;
}

const DEAD_ZONE_PX = 3.2;
const MIN_LABEL_GAP = 12;
const EDGE_PADDING = 12;
const LABEL_HEIGHT = 36; // Fixed consistent height (>=15px font + generous padding; NEVER changes on select)

/**
 * Candidate offset vectors (dx, dy) around an object's 2D anchor.
 * Strongly prefers clean upper, left/right flank, and outer-margin positions
 * so labels never sit on top of faces, torsos, or central action.
 */
const CANDIDATE_SLOTS: [number, number][] = [
  [0, -56],
  [-92, -46],
  [92, -46],
  [-128, -14],
  [128, -14],
  [0, -96],
  [-108, 38],
  [108, 38],
  [0, 56],
  [-155, -72],
  [155, -72],
  [0, -132],
  [-155, 68],
  [155, 68],
];

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  gap: number
): boolean {
  return !(
    ax + aw * 0.5 + gap < bx - bw * 0.5 ||
    ax - aw * 0.5 - gap > bx + bw * 0.5 ||
    ay + ah * 0.5 + gap < by - bh * 0.5 ||
    ay - ah * 0.5 - gap > by + bh * 0.5
  );
}

function estimateLabelWidth(text: string): number {
  // Generous estimation for 15px bold Vietnamese diacritic text so collision boxes never underestimate real DOM width
  return Math.min(265, Math.max(106, Math.round(text.length * 8.9 + 34)));
}

/**
 * ObjectAnchorManager — Indexes explicit static `labelAnchorId` nodes, hotspot object roots,
 * and `protectedArea` nodes once on scene build (zero per-frame traversal!).
 */
export class ObjectAnchorManager {
  public readonly explicitAnchors = new Map<string, THREE.Object3D>();
  public readonly hotspotObjects = new Map<string, THREE.Object3D[]>();
  public readonly protectedObjects: { id: string; obj: THREE.Object3D; pad: number }[] = [];
  private readonly staticLocalOffsets = new Map<string, THREE.Vector3>();

  public indexScene(root: THREE.Object3D): void {
    this.explicitAnchors.clear();
    this.hotspotObjects.clear();
    this.protectedObjects.length = 0;
    this.staticLocalOffsets.clear();

    const visit = (node: THREE.Object3D, parentHsId?: string) => {
      const anchorId = node.userData?.labelAnchorId;
      if (typeof anchorId === 'string') {
        this.explicitAnchors.set(anchorId, node);
      }

      const hsId = typeof node.userData?.hotspotId === 'string' ? node.userData.hotspotId : undefined;
      if (hsId && hsId !== parentHsId) {
        const list = this.hotspotObjects.get(hsId);
        if (list) list.push(node);
        else this.hotspotObjects.set(hsId, [node]);
      }

      if (node.userData?.protectedArea === true) {
        this.protectedObjects.push({
          id: hsId || node.name || `prot-${this.protectedObjects.length}`,
          obj: node,
          pad: typeof node.userData.protectedPad === 'number' ? node.userData.protectedPad : 10,
        });
      }

      for (let i = 0; i < node.children.length; i++) {
        visit(node.children[i], hsId ?? parentHsId);
      }
    };

    root.updateMatrixWorld(true);
    visit(root);

    // Pre-compute static rest-pose local anchor offset for every hotspot object without an explicit anchor
    // so animated fire particles or swaying canopies NEVER cause Box3 anchor jitter!
    const tmpBox = new THREE.Box3();
    const tmpSub = new THREE.Box3();
    const tmpCenter = new THREE.Vector3();
    const tmpSize = new THREE.Vector3();
    const tmpWorldPos = new THREE.Vector3();

    this.hotspotObjects.forEach((objs, hsId) => {
      if (this.explicitAnchors.has(hsId) || objs.length === 0) return;
      tmpBox.makeEmpty();
      let hasAny = false;
      for (const obj of objs) {
        tmpSub.setFromObject(obj);
        if (!tmpSub.isEmpty()) {
          if (!hasAny) {
            tmpBox.copy(tmpSub);
            hasAny = true;
          } else {
            tmpBox.union(tmpSub);
          }
        }
      }
      if (hasAny) {
        tmpBox.getCenter(tmpCenter);
        tmpBox.getSize(tmpSize);
        const primaryObj = objs[0];
        primaryObj.getWorldPosition(tmpWorldPos);
        const anchorY =
          tmpSize.y < 0.45 ? tmpBox.max.y + 0.14 : tmpCenter.y + tmpSize.y * 0.34;
        // Store static offset relative to primaryObj world origin
        this.staticLocalOffsets.set(
          hsId,
          new THREE.Vector3(
            tmpCenter.x - tmpWorldPos.x,
            anchorY - tmpWorldPos.y,
            tmpCenter.z - tmpWorldPos.z
          )
        );
      }
    });
  }

  /**
   * Returns whether the hotspot's 3D object is currently visible in the scene hierarchy.
   */
  public isObjectVisible(hsId: string): boolean {
    const anchor = this.explicitAnchors.get(hsId);
    if (anchor) {
      let cur: THREE.Object3D | null = anchor;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    }
    const objs = this.hotspotObjects.get(hsId);
    if (!objs || objs.length === 0) return true;
    return objs.some((o) => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    });
  }

  /**
   * Computes rock-solid world anchor position for a hotspot using pre-allocated vector.
   */
  public getWorldAnchor(hs: SimulationHotspot, out: THREE.Vector3): void {
    const explicit = this.explicitAnchors.get(hs.id);
    if (explicit) {
      explicit.getWorldPosition(out);
      return;
    }
    const objs = this.hotspotObjects.get(hs.id);
    if (objs && objs.length > 0) {
      objs[0].getWorldPosition(out);
      const offset = this.staticLocalOffsets.get(hs.id);
      if (offset) {
        out.add(offset);
      }
      return;
    }
    out.set(hs.position3D[0], hs.position3D[1], hs.position3D[2]);
  }

  /**
   * Computes center & footprint radius for the selection halo ring.
   */
  public getSelectionFootprint(
    hs: SimulationHotspot,
    outCenter: THREE.Vector3,
    tmpBox: THREE.Box3,
    tmpSub: THREE.Box3,
    tmpSize: THREE.Vector3
  ): number {
    const objs = this.hotspotObjects.get(hs.id);
    if (objs && objs.length > 0) {
      tmpBox.makeEmpty();
      let hasAny = false;
      for (const obj of objs) {
        if (!obj.visible) continue;
        tmpSub.setFromObject(obj);
        if (!tmpSub.isEmpty()) {
          if (!hasAny) {
            tmpBox.copy(tmpSub);
            hasAny = true;
          } else {
            tmpBox.union(tmpSub);
          }
        }
      }
      if (hasAny) {
        tmpBox.getCenter(outCenter);
        tmpBox.getSize(tmpSize);
        return Math.max(0.55, Math.min(2.15, Math.max(tmpSize.x, tmpSize.z) * 0.52));
      }
    }
    this.getWorldAnchor(hs, outCenter);
    return 0.85;
  }
}

/**
 * SmartLabelManager — Full anti-jitter, protected-area-aware, hysteresis-stabilized 3D->2D label engine.
 */
export class SmartLabelManager {
  public readonly anchors = new ObjectAnchorManager();
  private readonly cache = new Map<string, LabelCacheEntry>();

  // Scratch vectors (zero per-frame heap allocations)
  private readonly tmpWorld = new THREE.Vector3();
  private readonly tmpProj = new THREE.Vector3();
  private readonly tmpBox = new THREE.Box3();
  private readonly tmpCorner = new THREE.Vector3();
  private readonly protectedRects: ProtectedRect[] = [];
  private lastViewportW = 0;
  private lastViewportH = 0;
  private lastStageIndex = -1;

  public resetCache(): void {
    this.cache.clear();
  }

  /**
   * Projects all tagged ProtectedObjectAreas (characters' heads/torsos, silk scroll, active duel core)
   * into 2D screen rectangles so labels never cover faces or focal art elements.
   */
  private computeProtectedAreas(camera: THREE.Camera, w: number, h: number): void {
    this.protectedRects.length = 0;
    const list = this.anchors.protectedObjects;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      // Skip hidden objects
      let vis = true;
      let cur: THREE.Object3D | null = item.obj;
      while (cur) {
        if (!cur.visible) {
          vis = false;
          break;
        }
        cur = cur.parent;
      }
      if (!vis) continue;

      this.tmpBox.setFromObject(item.obj);
      if (this.tmpBox.isEmpty()) continue;

      const min = this.tmpBox.min;
      const max = this.tmpBox.max;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      // Project 8 corners of the object's AABB
      for (let cx = 0; cx <= 1; cx++) {
        for (let cy = 0; cy <= 1; cy++) {
          for (let cz = 0; cz <= 1; cz++) {
            this.tmpCorner.set(
              cx ? max.x : min.x,
              cy ? max.y : min.y,
              cz ? max.z : min.z
            );
            this.tmpCorner.project(camera);
            const sx = (this.tmpCorner.x * 0.5 + 0.5) * w;
            const sy = (-this.tmpCorner.y * 0.5 + 0.5) * h;
            if (sx < minX) minX = sx;
            if (sx > maxX) maxX = sx;
            if (sy < minY) minY = sy;
            if (sy > maxY) maxY = sy;
          }
        }
      }

      const rw = Math.min(220, Math.max(24, maxX - minX + item.pad * 2));
      const rh = Math.min(220, Math.max(24, maxY - minY + item.pad * 2));
      this.protectedRects.push({
        id: item.id,
        cx: (minX + maxX) * 0.5,
        cy: (minY + maxY) * 0.5,
        w: rw,
        h: rh,
      });
    }
  }

  public computeFrame(params: {
    hotspots: SimulationHotspot[];
    stageIndex: number;
    stageHighlightIds: Set<string>;
    selectedHotspotId: string | null;
    mode: LabelDisplayMode;
    camera: THREE.Camera;
    viewportWidth: number;
    viewportHeight: number;
    dt: number;
  }): StableLabelFrameState[] {
    const {
      hotspots,
      stageIndex,
      stageHighlightIds,
      selectedHotspotId,
      mode,
      camera,
      viewportWidth,
      viewportHeight,
      dt,
    } = params;

    const safeW = Math.max(280, viewportWidth);
    const safeH = Math.max(220, viewportHeight);

    // If viewport resized or stage changed, flush dead-zone snap smoothly
    const layoutReset =
      Math.abs(safeW - this.lastViewportW) > 6 ||
      Math.abs(safeH - this.lastViewportH) > 6 ||
      stageIndex !== this.lastStageIndex;
    this.lastViewportW = safeW;
    this.lastViewportH = safeH;
    this.lastStageIndex = stageIndex;

    // Mode 3: Observe Model -> hide all floating labels completely
    if (mode === 'observe') {
      return [];
    }

    this.computeProtectedAreas(camera, safeW, safeH);

    // Mode 2: Presentation -> ONLY show currently selected hotspot label
    const activeHotspots = hotspots.filter((hs) => {
      // Stage-scoped filter: never show label for objects absent in current stage!
      if (hs.stageRange && hs.stageRange.length > 0 && !hs.stageRange.includes(stageIndex)) {
        return false;
      }
      if (!this.anchors.isObjectVisible(hs.id)) {
        return false;
      }
      if (mode === 'presentation') {
        return hs.id === selectedHotspotId;
      }
      return true;
    });

    // Safe viewport margins keeping clear of top HUD & bottom hint bar
    const padLeft = EDGE_PADDING;
    const padRight = EDGE_PADDING;
    const padTop = 58;
    const padBottom = 64;
    const maxVisible =
      mode === 'presentation'
        ? 1
        : safeW < 520
        ? 4
        : safeW < 820
        ? 6
        : 9;

    // Sort deterministically: selected first -> stage highlighted -> priority -> id (stable tiebreaker!)
    const sorted = [...activeHotspots].sort((a, b) => {
      const aSel = a.id === selectedHotspotId ? 1 : 0;
      const bSel = b.id === selectedHotspotId ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      const aHi = stageHighlightIds.has(a.id) ? 1 : 0;
      const bHi = stageHighlightIds.has(b.id) ? 1 : 0;
      if (aHi !== bHi) return bHi - aHi;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id.localeCompare(b.id);
    });

    const placed: StableLabelFrameState[] = [];
    let visibleCount = 0;
    const smoothAlpha = layoutReset ? 1 : 1 - Math.exp(-12.5 * Math.min(dt, 0.05));

    for (let i = 0; i < sorted.length; i++) {
      const hs = sorted[i];
      const text = hs.shortLabel || hs.label;
      const estW = estimateLabelWidth(text);
      const estH = LABEL_HEIGHT;
      const isSelected = hs.id === selectedHotspotId;

      this.anchors.getWorldAnchor(hs, this.tmpWorld);
      this.tmpProj.copy(this.tmpWorld).project(camera);

      const rawAnchorX = (this.tmpProj.x * 0.5 + 0.5) * safeW;
      const rawAnchorY = (-this.tmpProj.y * 0.5 + 0.5) * safeH;

      const outOfBounds =
        this.tmpProj.z > 1.0 ||
        rawAnchorX < -24 ||
        rawAnchorX > safeW + 24 ||
        rawAnchorY < -24 ||
        rawAnchorY > safeH + 24;

      if ((!isSelected && outOfBounds) || (!isSelected && visibleCount >= maxVisible)) {
        continue;
      }

      let entry = this.cache.get(hs.id);
      if (!entry) {
        entry = {
          committedAnchorX: rawAnchorX,
          committedAnchorY: rawAnchorY,
          smoothAnchorX: rawAnchorX,
          smoothAnchorY: rawAnchorY,
          smoothLabelX: rawAnchorX,
          smoothLabelY: rawAnchorY - 56,
          slotIndex: 0,
          initialized: false,
          visibleFrames: 0,
        };
        this.cache.set(hs.id, entry);
      }

      // Dead Zone (3.2px) + Accumulated Drift Prevention:
      // Ignore tiny sub-pixel wobble while camera is still; commit immediately if real movement exceeds threshold
      const driftX = rawAnchorX - entry.committedAnchorX;
      const driftY = rawAnchorY - entry.committedAnchorY;
      const driftDist = Math.hypot(driftX, driftY);

      if (!entry.initialized || layoutReset || driftDist > DEAD_ZONE_PX) {
        entry.committedAnchorX = rawAnchorX;
        entry.committedAnchorY = rawAnchorY;
      }

      const anchorX = entry.committedAnchorX;
      const anchorY = entry.committedAnchorY;

      // Evaluate candidate slots with collision avoidance + ProtectedObjectArea avoidance + Hysteresis
      let bestSlot = entry.slotIndex;
      let bestX = anchorX;
      let bestY = anchorY - 56;
      let bestScore = Infinity;
      let foundNonColliding = false;

      for (let s = 0; s < CANDIDATE_SLOTS.length; s++) {
        const [dx, dy] = CANDIDATE_SLOTS[s];
        const cx = Math.max(
          padLeft + estW * 0.5,
          Math.min(safeW - padRight - estW * 0.5, anchorX + dx)
        );
        const cy = Math.max(
          padTop + estH * 0.5,
          Math.min(safeH - padBottom - estH * 0.5, anchorY + dy)
        );

        // Hard check: must NOT overlap any already-placed label (min 12px gap)
        let collidesLabel = false;
        for (let p = 0; p < placed.length; p++) {
          const ex = placed[p];
          if (rectsOverlap(cx, cy, estW, estH, ex.labelX, ex.labelY, ex.width, ex.height, MIN_LABEL_GAP)) {
            collidesLabel = true;
            break;
          }
        }
        if (collidesLabel) continue;

        foundNonColliding = true;

        // Soft penalty for overlapping any ProtectedObjectArea (characters' faces, silk scroll, flames)
        let protectedPenalty = 0;
        for (let r = 0; r < this.protectedRects.length; r++) {
          const pr = this.protectedRects[r];
          if (rectsOverlap(cx, cy, estW, estH, pr.cx, pr.cy, pr.w, pr.h, 6)) {
            protectedPenalty += 420;
          }
        }

        // Line length cost + edge clamp distortion cost + Hysteresis bonus (stay in previous slot if still clean!)
        const lineLen = Math.hypot(cx - anchorX, cy - anchorY);
        const clampShift = Math.hypot(cx - (anchorX + dx), cy - (anchorY + dy));
        const hysteresisBonus = entry.initialized && s === entry.slotIndex ? -85 : 0;
        const score = protectedPenalty + lineLen * 0.9 + clampShift * 1.4 + s * 6 + hysteresisBonus;

        if (score < bestScore) {
          bestScore = score;
          bestSlot = s;
          bestX = cx;
          bestY = cy;
        }
      }

      if (!foundNonColliding && !isSelected) {
        // Hide secondary label cleanly rather than overlapping another label
        continue;
      }

      entry.slotIndex = bestSlot;

      if (!entry.initialized || layoutReset) {
        entry.smoothAnchorX = anchorX;
        entry.smoothAnchorY = anchorY;
        entry.smoothLabelX = bestX;
        entry.smoothLabelY = bestY;
        entry.initialized = true;
      } else {
        // Smooth damping only if target moved meaningfully (> 1px) so resting pixels never shimmer
        if (Math.hypot(anchorX - entry.smoothAnchorX, anchorY - entry.smoothAnchorY) > 0.8) {
          entry.smoothAnchorX += (anchorX - entry.smoothAnchorX) * smoothAlpha;
          entry.smoothAnchorY += (anchorY - entry.smoothAnchorY) * smoothAlpha;
        }
        if (Math.hypot(bestX - entry.smoothLabelX, bestY - entry.smoothLabelY) > 0.8) {
          entry.smoothLabelX += (bestX - entry.smoothLabelX) * smoothAlpha;
          entry.smoothLabelY += (bestY - entry.smoothLabelY) * smoothAlpha;
        }
      }

      visibleCount += 1;
      placed.push({
        id: hs.id,
        text,
        anchorX: entry.smoothAnchorX,
        anchorY: entry.smoothAnchorY,
        labelX: entry.smoothLabelX,
        labelY: entry.smoothLabelY,
        width: estW,
        height: estH,
        visible: true,
        isSelected,
        priority: hs.priority,
      });
    }

    return placed;
  }
}

const LABEL_MODE_STORAGE_KEY = 'smartlit-label-mode-v1';

export function loadSavedLabelMode(): LabelDisplayMode {
  try {
    const raw = localStorage.getItem(LABEL_MODE_STORAGE_KEY);
    if (raw === 'explore' || raw === 'presentation' || raw === 'observe') return raw;
  } catch {
    // ignore storage restriction
  }
  return 'explore';
}

export function saveLabelMode(mode: LabelDisplayMode): void {
  try {
    localStorage.setItem(LABEL_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage restriction
  }
}
