import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FileText,
  Highlighter,
  Maximize2,
  Minimize2,
  Pen,
  Play,
  Plus,
  Printer,
  Shuffle,
  Trash2,
  Users,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { GRADE_LEVELS } from '../config/curriculum';
import { db } from '../database/db';
import { exportStandaloneOfflineHtml } from '../services/slideGeneratorService';
import {
  GradeLevel,
  PresentationDeck,
  SlideItem,
  SlideTemplateType,
} from '../types';
import { generateId } from '../utils/formatters';

const SLIDE_TEMPLATES: SlideTemplateType[] = [
  'Trang bìa',
  'Mục tiêu bài học',
  'Khởi động',
  'Giới thiệu tác giả',
  'Giới thiệu tác phẩm',
  'Trình chiếu thơ',
  'Trình chiếu đoạn văn',
  'Đọc hiểu',
  'Phân tích nhân vật',
  'Phân tích nghệ thuật',
  'Sơ đồ tư duy',
  'Câu hỏi thảo luận',
  'Phiếu học tập',
  'Luyện viết',
  'Trò chơi',
  'Tổng kết',
  'Dặn dò',
];

function createDefaultDeck(): PresentationDeck {
  const now = new Date().toISOString();
  return {
    id: generateId('deck'),
    ownerId: 'teacher-dathien',
    title: 'Bài giảng Ngữ văn tương tác – Khám phá thơ hiện đại',
    grade: '12',
    slides: [
      {
        id: generateId('slide'),
        template: 'Trang bìa',
        title: 'KHÁM PHÁ THƠ TỰ DO HIỆN ĐẠI',
        subtitle: 'Môn Ngữ văn THPT · Lớp 12 · Chương trình GDPT 2018',
        body: 'Mạch cảm xúc, hình ảnh biểu tượng và thông điệp nhân văn',
        teacherNote: 'Chào lớp, giới thiệu mục tiêu tiết học.',
        themeVariant: 'navy',
      },
      {
        id: generateId('slide'),
        template: 'Mục tiêu bài học',
        title: 'Mục tiêu cần đạt sau tiết học',
        subtitle: 'Năng lực đặc thù & Phẩm chất',
        body: '• Nhận diện được chủ thể trữ tình và mạch cảm xúc.\n• Phân tích được ý nghĩa biểu tượng của hình ảnh trung tâm.\n• Viết được đoạn văn cảm nhận 200 chữ mạch lạc.',
        teacherNote: 'Nhấn mạnh 3 yêu cầu cốt lõi.',
        themeVariant: 'cream',
      },
      {
        id: generateId('slide'),
        template: 'Đọc hiểu',
        title: 'Câu hỏi thảo luận cặp đôi',
        subtitle: 'Thời gian thảo luận: 03 phút',
        body: 'Phân tích tác dụng của biện pháp tu từ so sánh trong dòng thơ: "Thấy dáng cầu cong như nét chữ nghiêng nghiêng."',
        answerText:
          'Gợi ý đáp án:\n- Vế so sánh: dáng cầu cong – nét chữ nghiêng nghiêng.\n- Tác dụng: Tạo hình ảnh mềm mại, nối kết kí ức quê hương với trang vở học trò.',
        teacherNote: 'Bấm phím A để ẩn/hiện đáp án sau khi học sinh trình bày.',
        themeVariant: 'cream',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export const PresentationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [decks, setDecks] = useState<PresentationDeck[]>([]);
  const [deck, setDeck] = useState<PresentationDeck | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [fontSizePx, setFontSizePx] = useState(20);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Classroom interactive tools
  const [timerSec, setTimerSec] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);
  const [pickedStudent, setPickedStudent] = useState('');
  const [pickedGroup, setPickedGroup] = useState('');
  const [studentPool, setStudentPool] = useState<string[]>([
    'Nguyễn Minh An',
    'Trần Gia Bảo',
    'Lê Thảo Vy',
    'Phạm Quốc Huy',
    'Võ Ngọc Hân',
  ]);

  // Drawing annotation overlay
  const [drawTool, setDrawTool] = useState<'none' | 'pen' | 'highlighter'>('none');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const all = await db.presentations.orderBy('updatedAt').reverse().toArray();
      const students = await db.students.toArray();
      if (students.length > 0) {
        setStudentPool(students.map((s) => s.fullName));
      }
      if (all.length === 0) {
        const seed = createDefaultDeck();
        await db.presentations.put(seed);
        setDecks([seed]);
        setDeck(seed);
      } else {
        setDecks(all);
        const paramId = searchParams.get('deckId');
        setDeck(all.find((d) => d.id === paramId) || all[0]);
      }
    })();
  }, [searchParams]);

  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  // Keyboard shortcuts during presentation
  useEffect(() => {
    if (!presenting || !deck) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSlideIdx((i) => Math.min(deck.slides.length - 1, i + 1));
        setShowAnswer(false);
      } else if (e.key === 'ArrowLeft') {
        setSlideIdx((i) => Math.max(0, i - 1));
        setShowAnswer(false);
      } else if (e.key === 'a' || e.key === 'A') {
        setShowAnswer((v) => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) stageRef.current?.requestFullscreen();
        else document.exitFullscreen();
      } else if (e.key === 'Escape') {
        setPresenting(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, deck]);

  if (!deck) return null;

  const currentSlide = deck.slides[slideIdx] || deck.slides[0];
  const isOverflowRisk =
    (currentSlide?.body?.length || 0) > 480 ||
    (currentSlide?.body?.split('\n').length || 0) > 10;

  const persistDeck = async (next: PresentationDeck) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    setDeck(updated);
    await db.presentations.put(updated);
    setDecks(await db.presentations.orderBy('updatedAt').reverse().toArray());
  };

  const updateSlide = (patch: Partial<SlideItem>) => {
    if (!currentSlide) return;
    persistDeck({
      ...deck,
      slides: deck.slides.map((s) =>
        s.id === currentSlide.id ? { ...s, ...patch } : s
      ),
    });
  };

  const handleSplitOverflowSlide = () => {
    if (!currentSlide) return;
    const lines = currentSlide.body.split('\n');
    const mid = Math.ceil(lines.length / 2);
    const firstPart = lines.slice(0, mid).join('\n').trim();
    const secondPart = lines.slice(mid).join('\n').trim();
    if (!secondPart) return;

    const newSlide: SlideItem = {
      ...currentSlide,
      id: generateId('slide'),
      title: `${currentSlide.title} (Tiếp theo)`,
      body: secondPart,
    };
    const nextSlides = [...deck.slides];
    nextSlides[slideIdx] = { ...currentSlide, body: firstPart };
    nextSlides.splice(slideIdx + 1, 0, newSlide);
    persistDeck({ ...deck, slides: nextSlides });
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx?.clearRect(0, 0, c.width, c.height);
  };

  const handleCanvasPointer = (
    e: React.PointerEvent<HTMLCanvasElement>,
    phase: 'down' | 'move' | 'up'
  ) => {
    if (drawTool === 'none' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (phase === 'down') {
      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (phase === 'move' && isDrawingRef.current) {
      ctx.lineCap = 'round';
      ctx.lineWidth = drawTool === 'highlighter' ? 18 : 3;
      ctx.strokeStyle =
        drawTool === 'highlighter'
          ? 'rgba(250, 204, 21, 0.45)'
          : '#DC2626';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (phase === 'up') {
      isDrawingRef.current = false;
    }
  };

  // Presentation Stage View
  if (presenting && currentSlide) {
    const themeCls =
      currentSlide.themeVariant === 'navy'
        ? 'bg-[#0F2942] text-[#FAF8F5]'
        : currentSlide.themeVariant === 'teal'
        ? 'bg-[#0D5C54] text-[#FAF8F5]'
        : 'bg-[#FAF8F5] text-[#102438]';

    return (
      <div
        ref={stageRef}
        className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden"
      >
        {/* Presentation Toolbar */}
        <div className="no-print px-4 py-2 bg-[#0F2942] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPresenting(false)}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Thoát trình chiếu
            </button>
            <span className="font-mono tabular-nums opacity-80">
              Slide {slideIdx + 1} / {deck.slides.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setSlideIdx((i) => Math.max(0, i - 1));
                setShowAnswer(false);
                clearCanvas();
              }}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              ← Trước
            </button>
            <button
              type="button"
              onClick={() => {
                setSlideIdx((i) => Math.min(deck.slides.length - 1, i + 1));
                setShowAnswer(false);
                clearCanvas();
              }}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Tiếp →
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.max(14, s - 2))}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.min(34, s + 2))}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              A+
            </button>

            <button
              type="button"
              onClick={() => {
                if (!timerRunning && timerSec === 0) setTimerSec(180);
                setTimerRunning((r) => !r);
              }}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 inline-flex items-center gap-1 font-mono tabular-nums"
            >
              <Clock className="w-3.5 h-3.5" />
              {Math.floor(timerSec / 60)}:
              {String(timerSec % 60).padStart(2, '0')}
            </button>

            <button
              type="button"
              onClick={() => {
                const name =
                  studentPool[Math.floor(Math.random() * studentPool.length)] ||
                  'Học sinh';
                setPickedStudent(name);
              }}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 inline-flex items-center gap-1"
            >
              <Shuffle className="w-3.5 h-3.5" /> Gọi tên HS
            </button>

            <button
              type="button"
              onClick={() =>
                setPickedGroup(`Nhóm ${Math.floor(1 + Math.random() * 4)}`)
              }
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 inline-flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" /> Chọn nhóm
            </button>

            <button
              type="button"
              onClick={() => setShowAnswer((v) => !v)}
              className="px-2.5 py-1 rounded bg-[#0D7A6F] hover:bg-[#0B665D] inline-flex items-center gap-1"
            >
              {showAnswer ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              Đáp án (A)
            </button>

            <button
              type="button"
              onClick={() => setDrawTool((t) => (t === 'pen' ? 'none' : 'pen'))}
              className={`p-1.5 rounded ${
                drawTool === 'pen' ? 'bg-amber-500 text-black' : 'bg-white/10'
              }`}
              title="Bút đánh dấu"
            >
              <Pen className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setDrawTool((t) =>
                  t === 'highlighter' ? 'none' : 'highlighter'
                )
              }
              className={`p-1.5 rounded ${
                drawTool === 'highlighter'
                  ? 'bg-amber-400 text-black'
                  : 'bg-white/10'
              }`}
              title="Bút tô sáng"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              className="p-1.5 rounded bg-white/10 hover:bg-white/20"
              title="Tẩy nét vẽ"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setZoomScale((z) => (z >= 1.15 ? 1 : 1.15))}
              className="p-1.5 rounded bg-white/10 hover:bg-white/20"
              title="Phóng to"
            >
              {zoomScale > 1 ? (
                <ZoomOut className="w-3.5 h-3.5" />
              ) : (
                <ZoomIn className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Lời dẫn GV
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 rounded bg-white/10 hover:bg-white/20"
              title="In"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement)
                  stageRef.current?.requestFullscreen();
                else document.exitFullscreen();
              }}
              className="p-1.5 rounded bg-white/10 hover:bg-white/20"
              title="Toàn màn hình (F)"
            >
              {document.fullscreenElement ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Live Picker Toast */}
        {(pickedStudent || pickedGroup) && (
          <div className="px-4 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold text-center">
            {pickedStudent && `Học sinh được chọn: ${pickedStudent}`}{' '}
            {pickedGroup && `· ${pickedGroup}`}
          </div>
        )}

        {/* 16:9 Stage (Zero scrollbars!) */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <div
            style={{ transform: `scale(${zoomScale})` }}
            className={`relative w-full max-w-[1120px] aspect-video rounded-2xl p-10 sm:p-14 flex flex-col justify-center overflow-hidden shadow-2xl transition-transform ${themeCls}`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-2">
              {currentSlide.template}
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              {currentSlide.title}
            </h2>
            {currentSlide.subtitle && (
              <p className="text-base opacity-80 mt-2">{currentSlide.subtitle}</p>
            )}
            <div
              style={{ fontSize: `${fontSizePx}px` }}
              className="mt-5 leading-relaxed whitespace-pre-wrap"
            >
              {currentSlide.body}
            </div>
            {showAnswer && currentSlide.answerText && (
              <div className="mt-5 p-4 rounded-xl bg-[#0D7A6F]/15 border border-[#0D7A6F]/40 text-base whitespace-pre-wrap">
                {currentSlide.answerText}
              </div>
            )}
            {showNote && currentSlide.teacherNote && (
              <div className="absolute bottom-4 left-10 right-10 pt-2 border-t border-current/20 text-xs opacity-75">
                Lời dẫn giáo viên: {currentSlide.teacherNote}
              </div>
            )}

            {/* Annotation Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={1120}
              height={630}
              onPointerDown={(e) => handleCanvasPointer(e, 'down')}
              onPointerMove={(e) => handleCanvasPointer(e, 'move')}
              onPointerUp={(e) => handleCanvasPointer(e, 'up')}
              className={`absolute inset-0 w-full h-full ${
                drawTool === 'none' ? 'pointer-events-none' : 'cursor-crosshair'
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  // 3-Pane Slide Designer
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Bài giảng và Trình chiếu 16:9
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Thiết kế trực quan 3 cột không cần viết mã, trình chiếu tương tác và xuất HTML chạy offline độc lập
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={deck.id}
            onChange={(e) => {
              const found = decks.find((d) => d.id === e.target.value);
              if (found) {
                setDeck(found);
                setSlideIdx(0);
              }
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs max-w-[220px]"
          >
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={async () => {
              const fresh = createDefaultDeck();
              await db.presentations.put(fresh);
              setDecks(
                await db.presentations.orderBy('updatedAt').reverse().toArray()
              );
              setDeck(fresh);
              setSlideIdx(0);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Bộ slide mới
          </button>

          <button
            type="button"
            onClick={() => exportStandaloneOfflineHtml(deck)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0F2942] inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Xuất HTML Offline
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAnswer(false);
              setPresenting(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] inline-flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" /> Bắt đầu trình chiếu
          </button>
        </div>
      </div>

      {/* 3-Area Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: Slide List */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E5E0D8] p-3 space-y-2 max-h-[620px] overflow-y-auto">
          <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-[#0F2942]">
              Danh sách Slide ({deck.slides.length})
            </span>
            <button
              type="button"
              onClick={() => {
                const added: SlideItem = {
                  id: generateId('slide'),
                  template: 'Đọc hiểu',
                  title: 'Slide mới',
                  subtitle: '',
                  body: 'Nội dung trình chiếu...',
                  themeVariant: 'cream',
                };
                persistDeck({ ...deck, slides: [...deck.slides, added] });
                setSlideIdx(deck.slides.length);
              }}
              className="text-xs font-semibold text-[#0D7A6F] inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>

          {deck.slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setSlideIdx(idx)}
              className={`cursor-pointer p-2.5 rounded-lg border text-xs transition-colors ${
                idx === slideIdx
                  ? 'border-[#0F2942] bg-[#0F2942]/5'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-[#0F2942] truncate">
                  {idx + 1}. {s.title}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      const arr = [...deck.slides];
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      persistDeck({ ...deck, slides: arr });
                      setSlideIdx(idx - 1);
                    }}
                    className="p-0.5 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === deck.slides.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      const arr = [...deck.slides];
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                      persistDeck({ ...deck, slides: arr });
                      setSlideIdx(idx + 1);
                    }}
                    className="p-0.5 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  {deck.slides.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextSlides = deck.slides.filter((x) => x.id !== s.id);
                        persistDeck({ ...deck, slides: nextSlides });
                        setSlideIdx(Math.max(0, idx - 1));
                      }}
                      className="p-0.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.template}</div>
            </div>
          ))}
        </div>

        {/* CENTER: 16:9 Slide Canvas */}
        <div className="lg:col-span-6 space-y-3">
          {isOverflowRisk && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2 text-xs text-amber-900 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Nội dung slide hơi dài, có thể bị tràn khi trình chiếu.
              </span>
              <button
                type="button"
                onClick={handleSplitOverflowSlide}
                className="px-2.5 py-1 rounded bg-amber-600 text-white font-semibold shrink-0"
              >
                Tách thành 2 slide
              </button>
            </div>
          )}

          {currentSlide && (
            <div
              className={`w-full aspect-video rounded-2xl p-8 flex flex-col justify-center overflow-hidden shadow-sm border border-[#E5E0D8] ${
                currentSlide.themeVariant === 'navy'
                  ? 'bg-[#0F2942] text-[#FAF8F5]'
                  : currentSlide.themeVariant === 'teal'
                  ? 'bg-[#0D5C54] text-[#FAF8F5]'
                  : 'bg-white text-[#102438]'
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
                {currentSlide.template}
              </div>
              <h2 className="font-serif text-2xl font-bold mt-1 leading-snug">
                {currentSlide.title}
              </h2>
              {currentSlide.subtitle && (
                <p className="text-xs opacity-80 mt-1">{currentSlide.subtitle}</p>
              )}
              <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
                {currentSlide.body}
              </div>
              {currentSlide.answerText && (
                <div className="mt-3 p-3 rounded-lg bg-[#0D7A6F]/15 border border-[#0D7A6F]/30 text-xs whitespace-pre-wrap">
                  <strong>Đáp án (ẩn khi mới chiếu):</strong> {currentSlide.answerText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Properties Inspector */}
        {currentSlide && (
          <div className="lg:col-span-3 bg-white rounded-xl border border-[#E5E0D8] p-4 space-y-3 text-xs">
            <div className="font-bold text-sm text-[#0F2942] border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0D7A6F]" /> Thuộc tính Slide
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Tiêu đề bài giảng
              </label>
              <input
                type="text"
                value={deck.title}
                onChange={(e) => persistDeck({ ...deck, title: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Mẫu slide
                </label>
                <select
                  value={currentSlide.template}
                  onChange={(e) =>
                    updateSlide({
                      template: e.target.value as SlideTemplateType,
                    })
                  }
                  className="w-full rounded border border-slate-300 px-2 py-1.5"
                >
                  {SLIDE_TEMPLATES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Khối lớp
                </label>
                <select
                  value={deck.grade}
                  onChange={(e) =>
                    persistDeck({
                      ...deck,
                      grade: e.target.value as GradeLevel,
                    })
                  }
                  className="w-full rounded border border-slate-300 px-2 py-1.5"
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Màu nền Slide
              </label>
              <div className="flex gap-1.5">
                {(['navy', 'cream', 'teal'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateSlide({ themeVariant: v })}
                    className={`flex-1 py-1.5 rounded border text-[11px] font-semibold ${
                      currentSlide.themeVariant === v
                        ? 'border-[#0F2942] bg-[#0F2942] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {v === 'navy' ? 'Navy' : v === 'cream' ? 'Kem sáng' : 'Xanh ngọc'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Tiêu đề Slide
              </label>
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => updateSlide({ title: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Phụ đề
              </label>
              <input
                type="text"
                value={currentSlide.subtitle || ''}
                onChange={(e) => updateSlide({ subtitle: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Nội dung chính
              </label>
              <textarea
                rows={4}
                value={currentSlide.body}
                onChange={(e) => updateSlide({ body: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Đáp án ẩn/hiện (Phím A)
              </label>
              <textarea
                rows={2}
                value={currentSlide.answerText || ''}
                onChange={(e) => updateSlide({ answerText: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Lời dẫn giáo viên
              </label>
              <input
                type="text"
                value={currentSlide.teacherNote || ''}
                onChange={(e) => updateSlide({ teacherNote: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
