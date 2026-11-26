/**
 * Shared anti-overlap label placement engine & Vietnamese search normalizer
 * Enforces Section XV across all 40 2D and 3D simulations.
 */

export interface RawLabelPoint {
  id: string;
  text: string;
  anchorX: number; // pixel X within viewport
  anchorY: number; // pixel Y within viewport
  priority: 1 | 2 | 3;
  isSelected: boolean;
  occluded?: boolean;
}

export interface PlacedLabel {
  id: string;
  text: string;
  anchorX: number;
  anchorY: number;
  labelX: number; // center X of label box
  labelY: number; // center Y of label box
  width: number;
  height: number;
  visible: boolean;
  isSelected: boolean;
  priority: 1 | 2 | 3;
}

export function normalizeVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function matchesVietnameseQuery(haystack: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (haystack.toLowerCase().includes(q.toLowerCase())) return true;
  return normalizeVietnamese(haystack).includes(normalizeVietnamese(q));
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  gap = 8
): boolean {
  return !(
    a.x + a.w / 2 + gap < b.x - b.w / 2 ||
    a.x - a.w / 2 - gap > b.x + b.w / 2 ||
    a.y + a.h / 2 + gap < b.y - b.h / 2 ||
    a.y - a.h / 2 - gap > b.y + b.h / 2
  );
}

/**
 * Resolves overlapping labels using priority sorting, candidate radial offsets,
 * viewport safe-bounds clamping, occlusion filtering, and density capping.
 */
export function resolveLabelCollisions(
  points: RawLabelPoint[],
  viewportWidth: number,
  viewportHeight: number,
  options?: {
    maxVisibleLabels?: number;
    paddingX?: number;
    paddingTop?: number;
    paddingBottom?: number;
  }
): PlacedLabel[] {
  const safeW = Math.max(280, viewportWidth);
  const safeH = Math.max(220, viewportHeight);
  const padX = options?.paddingX ?? 16;
  const padTop = options?.paddingTop ?? 54;
  const padBottom = options?.paddingBottom ?? 82;
  const maxVisible =
    options?.maxVisibleLabels ?? (safeW < 520 ? 4 : safeW < 840 ? 6 : 8);

  // Sort: selected first, then priority (1 highest), then anchorY
  const sorted = [...points].sort((a, b) => {
    if (a.isSelected !== b.isSelected) return a.isSelected ? -1 : 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.anchorY - b.anchorY;
  });

  const placed: PlacedLabel[] = [];
  let visibleCount = 0;

  const candidateOffsets: [number, number][] = [
    [0, -34],
    [0, 34],
    [76, -28],
    [-76, -28],
    [76, 28],
    [-76, 28],
    [0, -64],
    [0, 64],
    [110, 0],
    [-110, 0],
  ];

  for (const pt of sorted) {
    const charW = 7.6;
    const estW = Math.min(220, Math.max(96, pt.text.length * charW + 26));
    const estH = 30;

    // Hide occluded non-selected points or outside viewport anchor
    const anchorOutOfBounds =
      pt.anchorX < -20 ||
      pt.anchorX > safeW + 20 ||
      pt.anchorY < -20 ||
      pt.anchorY > safeH + 20;

    if (
      (!pt.isSelected && (pt.occluded || anchorOutOfBounds)) ||
      (!pt.isSelected && visibleCount >= maxVisible)
    ) {
      placed.push({
        id: pt.id,
        text: pt.text,
        anchorX: pt.anchorX,
        anchorY: pt.anchorY,
        labelX: pt.anchorX,
        labelY: pt.anchorY,
        width: estW,
        height: estH,
        visible: false,
        isSelected: pt.isSelected,
        priority: pt.priority,
      });
      continue;
    }

    let chosenX = pt.anchorX;
    let chosenY = pt.anchorY - 34;
    let foundCleanSpot = false;

    for (const [dx, dy] of candidateOffsets) {
      const cx = Math.max(
        padX + estW / 2,
        Math.min(safeW - padX - estW / 2, pt.anchorX + dx)
      );
      const cy = Math.max(
        padTop + estH / 2,
        Math.min(safeH - padBottom - estH / 2, pt.anchorY + dy)
      );

      const candidateRect = { x: cx, y: cy, w: estW, h: estH };
      const collides = placed.some(
        (existing) =>
          existing.visible &&
          rectsOverlap(candidateRect, {
            x: existing.labelX,
            y: existing.labelY,
            w: existing.width,
            h: existing.height,
          })
      );

      if (!collides) {
        chosenX = cx;
        chosenY = cy;
        foundCleanSpot = true;
        break;
      }
    }

    // If still colliding and not selected, hide secondary label to guarantee zero overlap
    if (!foundCleanSpot && !pt.isSelected) {
      placed.push({
        id: pt.id,
        text: pt.text,
        anchorX: pt.anchorX,
        anchorY: pt.anchorY,
        labelX: chosenX,
        labelY: chosenY,
        width: estW,
        height: estH,
        visible: false,
        isSelected: pt.isSelected,
        priority: pt.priority,
      });
      continue;
    }

    visibleCount += 1;
    placed.push({
      id: pt.id,
      text: pt.text,
      anchorX: pt.anchorX,
      anchorY: pt.anchorY,
      labelX: chosenX,
      labelY: chosenY,
      width: estW,
      height: estH,
      visible: true,
      isSelected: pt.isSelected,
      priority: pt.priority,
    });
  }

  return placed;
}
