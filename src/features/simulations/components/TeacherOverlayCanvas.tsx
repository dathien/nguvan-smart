import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Highlighter, PenTool, RotateCcw, Timer, Trash2, X } from 'lucide-react';

interface TeacherOverlayCanvasProps {
  active: boolean;
  onClose: () => void;
}

type ToolMode = 'pen' | 'highlighter' | 'eraser';

const COLORS = [
  { id: 'red', value: '#DC2626', label: 'Đỏ nổi bật' },
  { id: 'blue', value: '#1D63ED', label: 'Xanh lam' },
  { id: 'amber', value: '#D97706', label: 'Vàng cam' },
  { id: 'emerald', value: '#059669', label: 'Xanh lục' },
  { id: 'navy', value: '#0F2942', label: 'Xanh đậm' },
];

export const TeacherOverlayCanvas: React.FC<TeacherOverlayCanvasProps> = ({ active, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState<string>('#DC2626');
  const [lineWidth, setLineWidth] = useState<number>(3);

  // Classroom discussion countdown timer
  const [timerSeconds, setTimerSeconds] = useState<number>(180);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const snapshot = canvas.toDataURL();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        if (snapshot && snapshot.length > 100) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, w, h);
          img.src = snapshot;
        }
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [active]);

  if (!active) return null;

  const getLocalPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getLocalPoint(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pt = getLocalPoint(e);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 22;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 18;
      ctx.strokeStyle = color;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();
    lastPointRef.current = pt;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="h-full w-full touch-none cursor-crosshair"
        aria-label="Bảng ghi chú vẽ tay của giáo viên"
      />

      {/* Floating Teacher Annotation & Classroom Timer Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-xl">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold transition ${
              tool === 'pen' ? 'bg-[#1D63ED] text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Bút vẽ"
          >
            <PenTool className="h-4 w-4" />
            <span>Bút</span>
          </button>
          <button
            type="button"
            onClick={() => setTool('highlighter')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold transition ${
              tool === 'highlighter' ? 'bg-amber-500 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Bút dạ quang"
          >
            <Highlighter className="h-4 w-4" />
            <span>Đánh dấu</span>
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold transition ${
              tool === 'eraser' ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Tẩy nét"
          >
            <Eraser className="h-4 w-4" />
            <span>Tẩy</span>
          </button>
        </div>

        {/* Color swatches */}
        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setColor(c.value);
                if (tool === 'eraser') setTool('pen');
              }}
              aria-label={c.label}
              style={{ backgroundColor: c.value }}
              className={`h-6 w-6 rounded-full border-2 transition ${
                color === c.value && tool !== 'eraser'
                  ? 'border-slate-900 scale-110'
                  : 'border-white shadow-sm'
              }`}
            />
          ))}
          <select
            aria-label="Độ dày nét bút"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="ml-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[13px] font-medium text-slate-700"
          >
            <option value={2}>Mảnh</option>
            <option value={3}>Vừa</option>
            <option value={6}>Đậm</option>
          </select>
        </div>

        {/* Classroom Timer */}
        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2">
          <Timer className="h-4 w-4 text-[#0F2942]" />
          <span
            className={`font-mono text-[15px] font-bold ${
              timerSeconds <= 30 && timerRunning ? 'text-red-600' : 'text-[#0F2942]'
            }`}
          >
            {formatTimer(timerSeconds)}
          </span>
          <button
            type="button"
            onClick={() => setTimerRunning((v) => !v)}
            className="rounded-lg bg-slate-100 px-2 py-1 text-[13px] font-semibold text-slate-800 hover:bg-slate-200"
          >
            {timerRunning ? 'Tạm dừng' : 'Đếm giờ'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTimerRunning(false);
              setTimerSeconds(180);
            }}
            title="Đặt lại 3 phút"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={clearCanvas}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[14px] font-semibold text-red-600 hover:bg-red-50"
          title="Xóa toàn bộ nét vẽ"
        >
          <Trash2 className="h-4 w-4" />
          <span>Xóa nét</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[14px] font-semibold text-white hover:bg-slate-700"
          title="Đóng bảng vẽ để tương tác lại mô phỏng"
        >
          <X className="h-4 w-4" />
          <span>Tắt vẽ</span>
        </button>
      </div>
    </div>
  );
};
