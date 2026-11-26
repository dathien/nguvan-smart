import React, { useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Compass,
  GitBranch,
  Layers,
  Minus,
  Plus,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { SimulationDefinition, SimulationHotspot } from '../types';
import { SkillLabs2D } from './SkillLabs2D';
import { LessonThumbnail } from './LessonThumbnails';

export interface Simulation2DViewportHandle {
  exportSvg: () => string | null;
  exportPng: () => Promise<string | null>;
  resetView: () => void;
}

interface Simulation2DViewportProps {
  simulation: SimulationDefinition;
  stageIndex: number;
  onSelectStage: (index: number) => void;
  selectedHotspotId: string | null;
  onSelectHotspot: (hotspot: SimulationHotspot) => void;
  showLabels: boolean;
  onSpeak?: (text: string) => void;
}

type SubView2D = 'diagram' | 'storyboard' | 'spatial';

function isSkillLabType(scene2DType: SimulationDefinition['scene2DType']): boolean {
  return scene2DType.startsWith('skill-');
}

/**
 * Displays each lesson's bespoke 16:9 visual artwork or real 3D diorama render inside Storyboard,
 * keeping stage navigation text cleanly outside the illustration.
 */
const StoryboardIllustration: React.FC<{
  simulation: SimulationDefinition;
  stageIdx: number;
}> = ({ simulation, stageIdx }) => {
  return (
    <div className="space-y-2.5">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
        <LessonThumbnail
          id={simulation.id}
          title={simulation.title}
          scene3DPreset={simulation.scene3DPreset}
          palette={simulation.palette}
          className="max-h-[260px]"
        />
      </div>
      <div className="flex items-center gap-1.5">
        {simulation.stages.map((st, i) => (
          <div
            key={st.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= stageIdx ? 'bg-[#1D63ED]' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export const Simulation2DViewport = React.forwardRef<
  Simulation2DViewportHandle,
  Simulation2DViewportProps
>(
  (
    {
      simulation,
      stageIndex,
      onSelectStage,
      selectedHotspotId,
      onSelectHotspot,
      showLabels,
      onSpeak,
    },
    ref
  ) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [subView, setSubView] = useState<SubView2D>('diagram');
    const [zoom, setZoom] = useState<number>(1);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
      simulation.diagram2D.nodes[0]?.id ?? null
    );
    const dragRef = useRef<{ active: boolean; startX: number; startY: number; origX: number; origY: number }>({
      active: false,
      startX: 0,
      startY: 0,
      origX: 0,
      origY: 0,
    });

    const nodeMap = useMemo(() => {
      const m = new Map(simulation.diagram2D.nodes.map((n) => [n.id, n]));
      return m;
    }, [simulation.diagram2D.nodes]);

    const activeNode = selectedNodeId
      ? nodeMap.get(selectedNodeId) ?? simulation.diagram2D.nodes[0]
      : simulation.diagram2D.nodes[0];

    const activeStage = simulation.stages[stageIndex] ?? simulation.stages[0];

    useImperativeHandle(ref, () => ({
      resetView: () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      },
      exportSvg: () => {
        if (!svgRef.current) return null;
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgRef.current);
      },
      exportPng: async () => {
        if (!svgRef.current) return null;
        try {
          const svgStr = new XMLSerializer().serializeToString(svgRef.current);
          const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const img = new Image();
          return await new Promise<string | null>((resolve) => {
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 1400;
              canvas.height = 840;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#F8FAFC';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
              } else {
                resolve(null);
              }
              URL.revokeObjectURL(url);
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve(null);
            };
            img.src = url;
          });
        } catch {
          return null;
        }
      },
    }));

    // Dedicated interactive skill workbenches for lessons 31..34 and 36..40
    if (isSkillLabType(simulation.scene2DType)) {
      return (
        <div className="flex h-full min-h-[480px] flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-[#F4F7FB] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="inline-block rounded-lg bg-[#1D63ED]/10 px-2.5 py-1 text-[13px] font-bold text-[#1D63ED]">
                Môi trường thực hành tương tác 2D
              </span>
              <h3 className="mt-1 text-[18px] font-bold text-[#0F2942]">{simulation.diagram2D.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => onSpeak?.(simulation.introNarration)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-[#0F2942] shadow-sm hover:bg-blue-50 hover:text-[#1D63ED]"
            >
              <Volume2 className="h-4 w-4" />
              <span>Nghe hướng dẫn</span>
            </button>
          </div>
          <SkillLabs2D scene2DType={simulation.scene2DType} onSpeak={onSpeak} />
        </div>
      );
    }

    const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
      if ((e.target as HTMLElement).closest('[data-node="true"]')) return;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        origX: pan.x,
        origY: pan.y,
      };
    };

    const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current.active) return;
      setPan({
        x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
      });
    };

    const handlePointerUp = () => {
      dragRef.current.active = false;
    };

    return (
      <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#F4F7FB]">
        {/* Top 2D Pedagogical Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Chế độ phân tích 2D">
            <button
              type="button"
              role="tab"
              aria-selected={subView === 'diagram'}
              onClick={() => setSubView('diagram')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[15px] font-bold transition ${
                subView === 'diagram'
                  ? 'bg-[#1D63ED] text-white shadow-sm'
                  : 'bg-slate-100 text-[#0F2942] hover:bg-blue-50'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>Sơ đồ quan hệ & lập luận</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subView === 'storyboard'}
              onClick={() => setSubView('storyboard')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[15px] font-bold transition ${
                subView === 'storyboard'
                  ? 'bg-[#1D63ED] text-white shadow-sm'
                  : 'bg-slate-100 text-[#0F2942] hover:bg-blue-50'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Diễn biến tác phẩm (Storyboard)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subView === 'spatial'}
              onClick={() => setSubView('spatial')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[15px] font-bold transition ${
                subView === 'spatial'
                  ? 'bg-[#1D63ED] text-white shadow-sm'
                  : 'bg-slate-100 text-[#0F2942] hover:bg-blue-50'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Bản đồ điểm khám phá 2D</span>
            </button>
          </div>

          {subView === 'diagram' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100"
                title="Thu nhỏ sơ đồ"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[52px] text-center text-[14px] font-bold text-[#0F2942]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100"
                title="Phóng to sơ đồ"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100"
                title="Đặt lại khung nhìn"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* SUB-VIEW 1: Interactive Knowledge / Character / Argument SVG Graph */}
        {subView === 'diagram' && (
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <div className="relative flex-1 overflow-hidden">
              <svg
                ref={svgRef}
                viewBox="0 0 920 500"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="h-full min-h-[340px] w-full cursor-grab active:cursor-grabbing select-none"
                role="img"
                aria-label={simulation.diagram2D.title}
              >
                <defs>
                  <pattern id="grid-2d" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  </pattern>
                  <marker
                    id="arrow-2d"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                  </marker>
                </defs>

                <rect width="920" height="500" fill="#F8FAFC" />
                <rect width="920" height="500" fill="url(#grid-2d)" />

                {/* Diagram Header Title inside SVG so SVG/PNG exports include title */}
                <text
                  x="28"
                  y="36"
                  fill="#0F2942"
                  fontSize="18"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {simulation.diagram2D.title}
                </text>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {simulation.diagram2D.edges.map((edge, idx) => {
                    const from = nodeMap.get(edge.from);
                    const to = nodeMap.get(edge.to);
                    if (!from || !to) return null;
                    const x1 = 70 + (from.x / 100) * 780;
                    const y1 = 80 + (from.y / 100) * 360;
                    const x2 = 70 + (to.x / 100) * 780;
                    const y2 = 80 + (to.y / 100) * 360;
                    const mx = (x1 + x2) / 2;
                    const my = (y1 + y2) / 2 - 14;
                    const isHighlighted =
                      selectedNodeId === edge.from || selectedNodeId === edge.to;

                    return (
                      <g key={`${edge.from}-${edge.to}-${idx}`}>
                        <path
                          d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                          fill="none"
                          stroke={isHighlighted ? '#1D63ED' : '#64748B'}
                          strokeWidth={isHighlighted ? 3 : 2}
                          strokeDasharray={edge.dashed ? '6 5' : undefined}
                          markerEnd="url(#arrow-2d)"
                        />
                        {showLabels && edge.label && (
                          <g transform={`translate(${mx}, ${my})`}>
                            <rect
                              x={-Math.max(42, edge.label.length * 3.8)}
                              y={-12}
                              width={Math.max(84, edge.label.length * 7.6)}
                              height={22}
                              rx={6}
                              fill="#FFFFFF"
                              stroke="#CBD5E1"
                            />
                            <text
                              textAnchor="middle"
                              y={4}
                              fill="#334155"
                              fontSize="12"
                              fontWeight="600"
                              fontFamily="system-ui, sans-serif"
                            >
                              {edge.label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Interactive Nodes styled with crisp rounded white/blue cards */}
                  {simulation.diagram2D.nodes.map((node) => {
                    const cx = 70 + (node.x / 100) * 780;
                    const cy = 80 + (node.y / 100) * 360;
                    const isSelected = activeNode?.id === node.id;
                    const cardW = Math.min(220, Math.max(142, node.label.length * 8.6 + 28));
                    const cardH = node.role ? 56 : 42;

                    return (
                      <g
                        key={node.id}
                        data-node="true"
                        transform={`translate(${cx}, ${cy})`}
                        onClick={() => {
                          setSelectedNodeId(node.id);
                          const matchedHs = simulation.hotspots.find(
                            (h) =>
                              h.id === node.id ||
                              h.label.toLowerCase().includes(node.label.toLowerCase().slice(0, 8))
                          );
                          if (matchedHs) onSelectHotspot(matchedHs);
                        }}
                        className="cursor-pointer"
                      >
                        <rect
                          x={-cardW / 2}
                          y={-cardH / 2}
                          width={cardW}
                          height={cardH}
                          rx={14}
                          fill={isSelected ? '#1D63ED' : '#FFFFFF'}
                          stroke={isSelected ? '#1D63ED' : node.color || '#CBD5E1'}
                          strokeWidth={isSelected ? 3 : 2}
                        />
                        <circle
                          cx={-cardW / 2 + 16}
                          cy={0}
                          r={6}
                          fill={isSelected ? '#FFFFFF' : node.color || '#1D63ED'}
                        />
                        <text
                          x={6}
                          y={node.role ? -3 : 5}
                          textAnchor="middle"
                          fill={isSelected ? '#FFFFFF' : '#0F2942'}
                          fontSize="14"
                          fontWeight="700"
                          fontFamily="system-ui, sans-serif"
                        >
                          {node.label.length > 23 ? `${node.label.slice(0, 22)}…` : node.label}
                        </text>
                        {node.role && (
                          <text
                            x={6}
                            y={16}
                            textAnchor="middle"
                            fill={isSelected ? '#DBEAFE' : '#475569'}
                            fontSize="12"
                            fontWeight="500"
                            fontFamily="system-ui, sans-serif"
                          >
                            {node.role.length > 26 ? `${node.role.slice(0, 25)}…` : node.role}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Active Node Detail Strip */}
            {activeNode && (
              <div className="border-t border-slate-200 bg-white px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: activeNode.color || '#1D63ED' }}
                    />
                    <span className="text-[16px] font-bold text-[#0F2942]">{activeNode.label}</span>
                    {activeNode.role && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[13px] font-semibold text-slate-600">
                        {activeNode.role}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSpeak?.(`${activeNode.label}. ${activeNode.detail}`)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[13px] font-semibold text-[#1D63ED] hover:bg-blue-100"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Đọc ý này</span>
                  </button>
                </div>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{activeNode.detail}</p>
              </div>
            )}
          </div>
        )}

        {/* SUB-VIEW 2: Interactive Literary Storyboard across all stages */}
        {subView === 'storyboard' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <StoryboardIllustration simulation={simulation} stageIdx={stageIndex} />
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[13px] font-bold uppercase tracking-wide text-[#1D63ED]">
                    Chặng {stageIndex + 1}/{simulation.stages.length} · {activeStage.subtitle}
                  </span>
                  <h4 className="mt-1 text-[20px] font-bold text-[#0F2942]">{activeStage.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => onSpeak?.(activeStage.narration)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D63ED] px-3.5 py-2 text-[14px] font-bold text-white hover:bg-blue-700"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Nghe thuyết minh chặng</span>
                </button>
              </div>
              <p className="mt-2.5 text-[15px] leading-relaxed text-slate-700">
                {activeStage.narration}
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <p className="text-[14px] font-medium text-amber-950">
                  <strong>Điểm neo văn bản:</strong> {activeStage.textualAnchor}
                </p>
              </div>
            </div>

            {/* Horizontal / Grid Storyboard Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {simulation.stages.map((st, idx) => {
                const isCurrent = idx === stageIndex;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStage(idx)}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      isCurrent
                        ? 'border-[#1D63ED] bg-blue-50/80 ring-2 ring-[#1D63ED]/25'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[13px] font-bold ${
                          isCurrent ? 'bg-[#1D63ED] text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Chặng {idx + 1}
                      </span>
                      <span className="truncate text-[13px] text-slate-500">{st.subtitle}</span>
                    </div>
                    <p className="mt-2 text-[15px] font-bold text-[#0F2942]">{st.title}</p>
                    <p className="mt-1 line-clamp-2 text-[14px] text-slate-600">{st.narration}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: 2D Spatial Hotspot Map with Reference-Style Floating Text Cards */}
        {subView === 'spatial' && (
          <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5">
            <div
              className="relative min-h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner"
              style={{
                background: `linear-gradient(145deg, ${simulation.palette.sky} 0%, #EEF4FB 55%, #E2EBF6 100%)`,
              }}
            >
              {/* Subtle isometric grid backdrop */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-45" aria-hidden="true">
                <defs>
                  <pattern id="iso-2d-grid" width="44" height="44" patternUnits="userSpaceOnUse">
                    <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#94A3B8" strokeWidth="0.7" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#iso-2d-grid)" />
              </svg>

              {/* Floating white/blue Vietnamese hotspot labels positioned from position2D */}
              {simulation.hotspots.map((hs) => {
                const isSelected = hs.id === selectedHotspotId;
                const leftPct = Math.min(84, Math.max(16, hs.position2D.x));
                const topPct = Math.min(84, Math.max(16, hs.position2D.y));
                return (
                  <button
                    key={hs.id}
                    type="button"
                    onClick={() => onSelectHotspot(hs)}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl px-3.5 py-2 text-[15px] font-bold transition ${
                      isSelected
                        ? 'z-20 bg-[#1D63ED] text-white shadow-[0_8px_20px_rgba(29,99,237,0.35)] ring-2 ring-white'
                        : 'z-10 border border-slate-200 bg-white text-[#0F2942] shadow-md hover:bg-blue-50 hover:text-[#1D63ED]'
                    }`}
                  >
                    {hs.shortLabel || hs.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {simulation.hotspots.map((hs) => {
                const isSelected = hs.id === selectedHotspotId;
                return (
                  <button
                    key={`card-${hs.id}`}
                    type="button"
                    onClick={() => onSelectHotspot(hs)}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-[#1D63ED] bg-blue-50/75 ring-2 ring-[#1D63ED]/20'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-bold text-[#0F2942]">{hs.label}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-600">
                        {hs.category}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-slate-700">{hs.summary}</p>
                    <p className="mt-1.5 text-[13px] italic text-slate-500">
                      Neo văn bản: {hs.textualDetail}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Simulation2DViewport.displayName = 'Simulation2DViewport';
