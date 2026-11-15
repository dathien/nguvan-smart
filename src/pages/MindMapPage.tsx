import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Plus,
  Printer,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { db } from '../database/db';
import { triggerBlobDownload } from '../services/wordExportService';
import { MindMapDocument, MindMapNode } from '../types';
import { generateId, slugifyFilename } from '../utils/formatters';

const CATEGORIES: MindMapDocument['category'][] = [
  'Tác giả',
  'Tác phẩm',
  'Nhân vật',
  'Chủ đề',
  'Cốt truyện',
  'Hình ảnh thơ',
  'Luận điểm',
  'Dàn ý bài văn',
];

const NODE_COLORS = ['#0F2942', '#0D7A6F', '#B45309', '#4338CA', '#9F1239'];

function createDefaultMindMap(): MindMapDocument {
  const now = new Date().toISOString();
  const rootId = generateId('node');
  const b1 = generateId('node');
  const b2 = generateId('node');
  const b3 = generateId('node');
  return {
    id: generateId('mm'),
    ownerId: 'teacher-dathien',
    title: 'Sơ đồ phân tích bài thơ "Nhịp cầu qua mùa gió"',
    category: 'Tác phẩm',
    grade: '12',
    nodes: [
      { id: rootId, parentId: null, label: 'Nhịp cầu qua mùa gió', color: '#0F2942', x: 420, y: 240 },
      { id: b1, parentId: rootId, label: 'Khổ 1: Kí ức cầu tre & mẹ', color: '#0D7A6F', x: 140, y: 120 },
      { id: b2, parentId: rootId, label: 'Khổ 2: So sánh cầu – nét chữ', color: '#B45309', x: 140, y: 360 },
      { id: b3, parentId: rootId, label: 'Khổ 3: Hành trang giữ cội nguồn', color: '#4338CA', x: 700, y: 240 },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export const MindMapPage: React.FC = () => {
  const [maps, setMaps] = useState<MindMapDocument[]>([]);
  const [active, setActive] = useState<MindMapDocument | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const draggingNodeId = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    (async () => {
      const all = await db.mindMaps.orderBy('updatedAt').reverse().toArray();
      if (all.length === 0) {
        const seed = createDefaultMindMap();
        await db.mindMaps.put(seed);
        setMaps([seed]);
        setActive(seed);
        setSelectedNodeId(seed.nodes[0].id);
      } else {
        setMaps(all);
        setActive(all[0]);
        setSelectedNodeId(all[0].nodes[0]?.id || null);
      }
    })();
  }, []);

  if (!active) return null;

  const persist = async (next: MindMapDocument) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    setActive(updated);
    await db.mindMaps.put(updated);
    setMaps(await db.mindMaps.orderBy('updatedAt').reverse().toArray());
  };

  const selectedNode = active.nodes.find((n) => n.id === selectedNodeId) || null;

  const isNodeHidden = (node: MindMapNode): boolean => {
    let currParent = node.parentId;
    while (currParent) {
      const p = active.nodes.find((x) => x.id === currParent);
      if (!p) break;
      if (p.collapsed) return true;
      currParent = p.parentId;
    }
    return false;
  };

  const handleAutoLayout = () => {
    const root = active.nodes.find((n) => n.parentId === null) || active.nodes[0];
    if (!root) return;
    const children = active.nodes.filter((n) => n.parentId === root.id);
    const updated = active.nodes.map((n) => {
      if (n.id === root.id) return { ...n, x: 440, y: 250 };
      const cIdx = children.findIndex((c) => c.id === n.id);
      if (cIdx !== -1) {
        const angle = (cIdx / Math.max(1, children.length)) * Math.PI * 2;
        return {
          ...n,
          x: Math.round(440 + Math.cos(angle) * 230),
          y: Math.round(250 + Math.sin(angle) * 165),
        };
      }
      const parent = active.nodes.find((p) => p.id === n.parentId);
      if (parent) {
        const siblings = active.nodes.filter((s) => s.parentId === parent.id);
        const sIdx = siblings.findIndex((s) => s.id === n.id);
        const dirX = parent.x >= 440 ? 180 : -180;
        return {
          ...n,
          x: Math.max(80, Math.min(840, parent.x + dirX)),
          y: Math.max(50, Math.min(460, parent.y + (sIdx - (siblings.length - 1) / 2) * 75)),
        };
      }
      return n;
    });
    persist({ ...active, nodes: updated });
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            triggerBlobDownload(blob, `${slugifyFilename(active.title)}.png`);
          }
          URL.revokeObjectURL(url);
        });
      }
    };
    img.src = url;
  };

  return (
    <div
      className={`${
        fullscreen ? 'fixed inset-0 z-50 bg-[#FAF8F5] p-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
      } space-y-4`}
    >
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E0D8] pb-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Sơ đồ tư duy văn học tương tác
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Kéo thả nhánh, thêm/xóa nhánh, thu gọn/mở rộng, đổi màu, tự căn bố cục và xuất PNG/PDF/JSON
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={active.id}
            onChange={(e) => {
              const found = maps.find((m) => m.id === e.target.value);
              if (found) {
                setActive(found);
                setSelectedNodeId(found.nodes[0]?.id || null);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs max-w-[200px]"
          >
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={async () => {
              const fresh = createDefaultMindMap();
              await db.mindMaps.put(fresh);
              setMaps(await db.mindMaps.orderBy('updatedAt').reverse().toArray());
              setActive(fresh);
              setSelectedNodeId(fresh.nodes[0].id);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Mới
          </button>
          <button
            type="button"
            onClick={handleAutoLayout}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium inline-flex items-center gap-1"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Căn bố cục
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            className="px-2.5 py-1.5 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Xuất PNG
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(active, null, 2)], {
                type: 'application/json',
              });
              triggerBlobDownload(blob, `${slugifyFilename(active.title)}.json`);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
          >
            Xuất JSON
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold inline-flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            className="p-1.5 rounded-lg border border-slate-300 bg-white"
          >
            {fullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Interactive SVG Canvas */}
        <div className="print-only-container lg:col-span-9 bg-white rounded-xl border border-[#E5E0D8] overflow-hidden relative">
          <div className="no-print absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 border border-slate-200 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono tabular-nums px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <svg
            ref={svgRef}
            viewBox="0 0 920 520"
            className="w-full h-[480px] select-none bg-[#FAF8F5]/40"
            onMouseMove={(e) => {
              if (!draggingNodeId.current || !svgRef.current) return;
              const rect = svgRef.current.getBoundingClientRect();
              const x = Math.max(
                60,
                Math.min(860, ((e.clientX - rect.left) / rect.width) * 920)
              );
              const y = Math.max(
                40,
                Math.min(480, ((e.clientY - rect.top) / rect.height) * 520)
              );
              const id = draggingNodeId.current;
              setActive((prev) =>
                prev
                  ? {
                      ...prev,
                      nodes: prev.nodes.map((n) =>
                        n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n
                      ),
                    }
                  : prev
              );
            }}
            onMouseUp={() => {
              if (draggingNodeId.current) {
                draggingNodeId.current = null;
                persist(active);
              }
            }}
          >
            <g transform={`scale(${zoom})`}>
              {/* Curved Connectors */}
              {active.nodes
                .filter((n) => n.parentId && !isNodeHidden(n))
                .map((n) => {
                  const parent = active.nodes.find((p) => p.id === n.parentId);
                  if (!parent) return null;
                  const midX = (parent.x + n.x) / 2;
                  return (
                    <path
                      key={`edge-${n.id}`}
                      d={`M ${parent.x} ${parent.y} C ${midX} ${parent.y}, ${midX} ${n.y}, ${n.x} ${n.y}`}
                      fill="none"
                      stroke={n.color}
                      strokeWidth={2.5}
                      strokeOpacity={0.65}
                    />
                  );
                })}

              {/* Nodes */}
              {active.nodes
                .filter((n) => !isNodeHidden(n))
                .map((n) => {
                  const isSelected = n.id === selectedNodeId;
                  const width = Math.max(120, Math.min(220, n.label.length * 7.5 + 24));
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x - width / 2}, ${n.y - 22})`}
                      onMouseDown={() => {
                        draggingNodeId.current = n.id;
                        setSelectedNodeId(n.id);
                      }}
                      className="cursor-move"
                    >
                      <rect
                        width={width}
                        height={44}
                        rx={10}
                        fill={n.color}
                        stroke={isSelected ? '#F59E0B' : '#FFFFFF'}
                        strokeWidth={isSelected ? 3 : 1.5}
                      />
                      <text
                        x={width / 2}
                        y={26}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="Be Vietnam Pro, sans-serif"
                      >
                        {n.label.slice(0, 26)}
                      </text>
                    </g>
                  );
                })}
            </g>
          </svg>
        </div>

        {/* Right Node Inspector */}
        <div className="no-print lg:col-span-3 bg-white rounded-xl border border-[#E5E0D8] p-4 space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên sơ đồ tư duy
            </label>
            <input
              type="text"
              value={active.title}
              onChange={(e) => persist({ ...active, title: e.target.value })}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Chủ đề sơ đồ
            </label>
            <select
              value={active.category}
              onChange={(e) =>
                persist({
                  ...active,
                  category: e.target.value as MindMapDocument['category'],
                })
              }
              className="w-full rounded border border-slate-300 px-2 py-1.5"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {selectedNode && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="font-bold text-[#0F2942]">
                Nhánh đang chọn
              </div>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) =>
                  persist({
                    ...active,
                    nodes: active.nodes.map((n) =>
                      n.id === selectedNode.id
                        ? { ...n, label: e.target.value }
                        : n
                    ),
                  })
                }
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-medium"
              />

              <div className="flex items-center gap-2">
                {NODE_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() =>
                      persist({
                        ...active,
                        nodes: active.nodes.map((n) =>
                          n.id === selectedNode.id ? { ...n, color: col } : n
                        ),
                      })
                    }
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedNode.color === col
                        ? 'border-amber-400 scale-110'
                        : 'border-white'
                    }`}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const child: MindMapNode = {
                      id: generateId('node'),
                      parentId: selectedNode.id,
                      label: 'Nhánh con mới',
                      color: '#0D7A6F',
                      x: Math.min(820, selectedNode.x + 150),
                      y: Math.min(450, selectedNode.y + 60),
                    };
                    persist({
                      ...active,
                      nodes: [...active.nodes, child],
                    });
                    setSelectedNodeId(child.id);
                  }}
                  className="px-2.5 py-1.5 rounded bg-[#0F2942] text-white font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm nhánh con
                </button>

                <button
                  type="button"
                  onClick={() =>
                    persist({
                      ...active,
                      nodes: active.nodes.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, collapsed: !n.collapsed }
                          : n
                      ),
                    })
                  }
                  className="px-2.5 py-1.5 rounded border border-slate-300"
                >
                  {selectedNode.collapsed ? 'Mở rộng' : 'Thu gọn'}
                </button>

                {selectedNode.parentId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = new Set<string>([selectedNode.id]);
                      let added = true;
                      while (added) {
                        added = false;
                        active.nodes.forEach((n) => {
                          if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
                            toDelete.add(n.id);
                            added = true;
                          }
                        });
                      }
                      const remaining = active.nodes.filter((n) => !toDelete.has(n.id));
                      persist({ ...active, nodes: remaining });
                      setSelectedNodeId(remaining[0]?.id || null);
                    }}
                    className="px-2.5 py-1.5 rounded border border-red-200 text-red-600 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa nhánh
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
