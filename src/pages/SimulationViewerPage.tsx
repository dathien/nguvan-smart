import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  Heart,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  PenTool,
  Play,
  Presentation,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Tag,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SIMULATION_CATALOG } from '../features/simulations/data/registry';
import {
  QualityTier,
  SimulationDefinition,
  SimulationHotspot,
  SimulationProgressRecord,
} from '../features/simulations/types';
import {
  Simulation2DViewport,
  Simulation2DViewportHandle,
} from '../features/simulations/components/Simulation2DViewport';
import type { Simulation3DViewportHandle } from '../features/simulations/components/Simulation3DViewport';
import {
  InspectorTab,
  SimulationActivitiesPanel,
} from '../features/simulations/components/SimulationActivitiesPanel';
import { TeacherOverlayCanvas } from '../features/simulations/components/TeacherOverlayCanvas';
import { useVietnameseSpeech } from '../features/simulations/hooks/useVietnameseSpeech';
import {
  computeProgressPercent,
  createEmptyProgress,
  downloadSingleOfflinePack,
  getOfflinePack,
  getSimulationProgress,
  loadSimulationOfflineFirst,
  resetSimulationProgress,
  saveSimulationProgress,
} from '../features/simulations/services/simulationStorage';
import {
  downloadSimulationWordHandout,
  exportSimulationToMindMap,
  exportSimulationToPresentation,
  exportSimulationToQuestionBank,
  exportSimulationToWorksheet,
} from '../features/simulations/services/simulationIntegrationService';
import { db } from '../database/db';

const LazySimulation3DViewport = React.lazy(async () => {
  const mod = await import('../features/simulations/components/Simulation3DViewport');
  return { default: mod.Simulation3DViewport };
});

export default function SimulationViewerPage() {
  const { simId } = useParams<{ simId: string }>();
  const navigate = useNavigate();
  const rootStageRef = useRef<HTMLDivElement | null>(null);
  const viewport3DRef = useRef<Simulation3DViewportHandle | null>(null);
  const viewport2DRef = useRef<Simulation2DViewportHandle | null>(null);

  const [simulation, setSimulation] = useState<SimulationDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InspectorTab>('explore');
  const [progress, setProgress] = useState<SimulationProgressRecord>(() =>
    createEmptyProgress(simId || 'sim-01')
  );

  // Playback & visual settings
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showLabels, setShowLabels] = useState(true);
  const [qualityTier, setQualityTier] = useState<QualityTier>('standard');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [params, setParams] = useState<Record<string, number>>({});

  // Teacher presentation & classroom tools
  const [presentationMode, setPresentationMode] = useState(false);
  const [hideAnswersForClass, setHideAnswersForClass] = useState(false);
  const [annotationActive, setAnnotationActive] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOfflineCached, setIsOfflineCached] = useState(false);

  const speech = useVietnameseSpeech();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  // Load simulation definition + saved progress
  useEffect(() => {
    let active = true;
    if (!simId) return;
    setLoading(true);
    speech.stop();

    Promise.all([
      loadSimulationOfflineFirst(simId),
      getSimulationProgress(simId),
      getOfflinePack(simId),
    ]).then(([sim, prog, pack]) => {
      if (!active) return;
      if (!sim) {
        setSimulation(null);
        setLoading(false);
        return;
      }
      setSimulation(sim);
      setIsOfflineCached(Boolean(pack));
      setViewMode(sim.mode === '2d' ? '2d' : '3d');
      const safeStage = Math.min(prog.lastStageIndex ?? 0, Math.max(0, sim.stages.length - 1));
      setStageIndex(safeStage);
      setSelectedHotspotId(sim.hotspots[0]?.id ?? null);

      const defaultParams: Record<string, number> = {};
      sim.parameters.forEach((p) => {
        defaultParams[p.id] = p.defaultValue;
      });
      setParams(defaultParams);

      // Mark initial stage visited
      const initialStageId = sim.stages[safeStage]?.id;
      const mergedStages = initialStageId
        ? Array.from(new Set([...prog.completedStages, initialStageId]))
        : prog.completedStages;
      const merged: SimulationProgressRecord = {
        ...prog,
        completedStages: mergedStages,
        progressPercent: computeProgressPercent({ ...prog, completedStages: mergedStages }, sim),
      };
      setProgress(merged);
      saveSimulationProgress(merged);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [simId]);

  // Auto-advance stages timer
  useEffect(() => {
    if (!autoAdvance || !simulation) return;
    const ms = Math.round(7000 / playbackSpeed);
    const id = window.setInterval(() => {
      setStageIndex((prev) => {
        const next = prev + 1;
        if (next >= simulation.stages.length) {
          setAutoAdvance(false);
          return prev;
        }
        return next;
      });
    }, ms);
    return () => window.clearInterval(id);
  }, [autoAdvance, playbackSpeed, simulation]);

  // Persist stage visits when stageIndex changes
  useEffect(() => {
    if (!simulation) return;
    const st = simulation.stages[stageIndex];
    if (!st) return;

    setProgress((prev) => {
      const completedStages = Array.from(new Set([...prev.completedStages, st.id]));
      const next: SimulationProgressRecord = {
        ...prev,
        lastStageIndex: stageIndex,
        completedStages,
        progressPercent: computeProgressPercent({ ...prev, completedStages }, simulation),
      };
      saveSimulationProgress(next);
      return next;
    });

    if (st.highlightHotspotIds.length > 0) {
      setSelectedHotspotId(st.highlightHotspotIds[0]);
    }
  }, [stageIndex, simulation]);

  const currentCatalogIndex = useMemo(
    () => SIMULATION_CATALOG.findIndex((c) => c.id === simId),
    [simId]
  );
  const prevSim = currentCatalogIndex > 0 ? SIMULATION_CATALOG[currentCatalogIndex - 1] : null;
  const nextSim =
    currentCatalogIndex >= 0 && currentCatalogIndex < SIMULATION_CATALOG.length - 1
      ? SIMULATION_CATALOG[currentCatalogIndex + 1]
      : null;

  const selectedHotspot = useMemo(() => {
    if (!simulation) return null;
    return simulation.hotspots.find((h) => h.id === selectedHotspotId) ?? simulation.hotspots[0] ?? null;
  }, [simulation, selectedHotspotId]);

  const handleSelectHotspot = useCallback(
    (hs: SimulationHotspot) => {
      setSelectedHotspotId(hs.id);
      if (activeTab !== 'explore') setActiveTab('explore');
      if (!simulation) return;
      setProgress((prev) => {
        const visitedHotspots = Array.from(new Set([...prev.visitedHotspots, hs.id]));
        const next: SimulationProgressRecord = {
          ...prev,
          visitedHotspots,
          progressPercent: computeProgressPercent({ ...prev, visitedHotspots }, simulation),
        };
        saveSimulationProgress(next);
        return next;
      });
    },
    [simulation, activeTab]
  );

  const handleUpdateAnswer = (qId: string, value: string) => {
    if (!simulation) return;
    setProgress((prev) => {
      const answers = { ...prev.answers, [qId]: value };
      const next: SimulationProgressRecord = {
        ...prev,
        answers,
        progressPercent: computeProgressPercent({ ...prev, answers }, simulation),
      };
      saveSimulationProgress(next);
      return next;
    });
  };

  const handleCompleteTask = (taskId: string) => {
    if (!simulation) return;
    setProgress((prev) => {
      const completedTasks = Array.from(new Set([...prev.completedTasks, taskId]));
      const next: SimulationProgressRecord = {
        ...prev,
        completedTasks,
        progressPercent: computeProgressPercent({ ...prev, completedTasks }, simulation),
      };
      saveSimulationProgress(next);
      return next;
    });
  };

  const handleUpdateNotes = (notes: string) => {
    setProgress((prev) => {
      const next = { ...prev, notes };
      saveSimulationProgress(next);
      return next;
    });
  };

  const handleUpdateCustomTeacherText = (customTeacherText: string) => {
    setProgress((prev) => {
      const next = { ...prev, customTeacherText };
      saveSimulationProgress(next);
      return next;
    });
  };

  const handleToggleFavorite = () => {
    setProgress((prev) => {
      const next = { ...prev, favorite: !prev.favorite };
      saveSimulationProgress(next);
      showToast(next.favorite ? 'Đã thêm vào danh sách Yêu thích.' : 'Đã bỏ khỏi Yêu thích.');
      return next;
    });
  };

  const handleResetSimulation = async () => {
    if (!simulation) return;
    setStageIndex(0);
    setAutoAdvance(false);
    setSelectedHotspotId(simulation.hotspots[0]?.id ?? null);
    viewport3DRef.current?.resetCamera();
    viewport2DRef.current?.resetView();
    const cleaned = await resetSimulationProgress(simulation.id);
    setProgress(cleaned);
    showToast('Đã đặt lại trạng thái mô phỏng từ đầu.');
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && rootStageRef.current) {
        await rootStageRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      showToast('Trình duyệt hạn chế toàn màn hình trong khung xem này.');
    }
  };

  const handleCacheOffline = async () => {
    if (!simulation) return;
    await downloadSingleOfflinePack(simulation.id);
    setIsOfflineCached(true);
    showToast('Đã lưu mô phỏng vào bộ nhớ offline trên thiết bị.');
  };

  const handleCaptureImage = async () => {
    if (!simulation) return;
    let dataUrl: string | null = null;
    if (viewMode === '3d') {
      dataUrl = viewport3DRef.current?.capturePng() ?? null;
    } else {
      dataUrl = (await viewport2DRef.current?.exportPng()) ?? null;
    }
    if (!dataUrl) {
      showToast('Chưa thể chụp khung hình ở chế độ hiện tại. Hãy chuyển sang Sơ đồ 2D hoặc 3D.');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Mo-phong-${simulation.id}-${viewMode}.png`;
    a.click();
    showToast('Đã tải xuống ảnh PNG của mô phỏng.');
  };

  const handleExportSvg = () => {
    if (!simulation) return;
    const svgStr = viewport2DRef.current?.exportSvg();
    if (!svgStr) {
      showToast('Hãy chuyển sang chế độ 2D (tab Sơ đồ quan hệ) để xuất file SVG sắc nét.');
      return;
    }
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So-do-${simulation.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống sơ đồ SVG.');
  };

  const handleExportIntegration = async (
    target: 'worksheet' | 'presentation' | 'mindmap' | 'questions' | 'word'
  ) => {
    if (!simulation) return;
    setShowExportMenu(false);
    try {
      if (target === 'worksheet') {
        await exportSimulationToWorksheet(simulation);
        showToast('Đã tạo Phiếu học tập mới trong phân hệ Phiếu học tập.');
      } else if (target === 'presentation') {
        await exportSimulationToPresentation(simulation);
        showToast('Đã tạo Bộ bài giảng trình chiếu trong phân hệ Bài giảng.');
      } else if (target === 'mindmap') {
        await exportSimulationToMindMap(simulation);
        showToast('Đã tạo Sơ đồ tư duy mới trong phân hệ Sơ đồ tư duy.');
      } else if (target === 'questions') {
        const count = await exportSimulationToQuestionBank(simulation);
        showToast(`Đã đưa ${count} câu hỏi đọc hiểu vào Ngân hàng câu hỏi.`);
      } else if (target === 'word') {
        const settings = await db.settings.get('default');
        await downloadSimulationWordHandout(
          simulation,
          settings?.defaultSchoolName || 'TRƯỜNG THPT'
        );
        showToast('Đã xuất Phiếu học tập Word (.docx).');
      }
    } catch {
      showToast('Có lỗi khi tạo học liệu. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1D63ED] border-t-transparent" />
        <p className="text-[16px] font-semibold">Đang tải không gian Khám phá Ngữ văn 2D/3D...</p>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <h1 className="text-xl font-bold text-[#0F2942]">Không tìm thấy bài mô phỏng yêu cầu</h1>
        <Link
          to="/kham-pha-2d-3d"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1D63ED] px-5 py-2.5 text-[15px] font-bold text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Danh mục 40 bài Khám phá 2D/3D</span>
        </Link>
      </div>
    );
  }

  const activeStage = simulation.stages[stageIndex] ?? simulation.stages[0];
  const has3D = simulation.mode === 'both' || simulation.mode === '3d';

  return (
    <div
      ref={rootStageRef}
      className={`mx-auto max-w-[1440px] space-y-4 pb-8 ${
        presentationMode ? 'bg-slate-100 p-4 rounded-2xl' : ''
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-[#0F2942] px-4 py-3 text-[15px] font-semibold text-white shadow-2xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ZONE 1: HEADER BAR */}
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/kham-pha-2d-3d"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[14px] font-bold text-[#0F2942] hover:bg-blue-50 hover:text-[#1D63ED]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Danh mục 40 bài</span>
              </Link>
              <span className="rounded-lg bg-[#0F2942] px-2.5 py-1 text-[13px] font-bold text-white">
                Bài #{String(simulation.number).padStart(2, '0')}
              </span>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[13px] font-bold text-[#1D63ED]">
                Lớp {simulation.grades.join(', ')} · {simulation.genre}
              </span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[13px] font-bold text-emerald-800">
                Tiến độ: {progress.progressPercent}%
              </span>
            </div>

            <h1
              className={`font-extrabold tracking-tight text-[#0F2942] ${
                presentationMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}
            >
              {simulation.title}
            </h1>
            <p className="text-[14px] text-slate-600">
              <strong>{simulation.workTitle}</strong> — {simulation.author} · {simulation.volumeAndUnit}
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 3D / 2D Switcher */}
            {has3D && (
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-bold transition ${
                    viewMode === '3d'
                      ? 'bg-[#1D63ED] text-white shadow-sm'
                      : 'text-slate-700 hover:text-[#0F2942]'
                  }`}
                >
                  <Box className="h-4 w-4" />
                  <span>Không gian 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-bold transition ${
                    viewMode === '2d'
                      ? 'bg-[#1D63ED] text-white shadow-sm'
                      : 'text-slate-700 hover:text-[#0F2942]'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Sơ đồ &amp; Phân tích 2D</span>
                </button>
              </div>
            )}

            {/* Teacher Presentation Mode */}
            <button
              type="button"
              onClick={() => setPresentationMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[14px] font-bold transition ${
                presentationMode
                  ? 'border-[#0F2942] bg-[#0F2942] text-white'
                  : 'border-slate-200 bg-white text-[#0F2942] hover:bg-slate-50'
              }`}
            >
              <Presentation className="h-4 w-4" />
              <span>{presentationMode ? 'Thoát trình chiếu' : 'Trình chiếu dạy học'}</span>
            </button>

            {/* Offline Save */}
            <button
              type="button"
              onClick={handleCacheOffline}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[14px] font-bold transition ${
                isOfflineCached
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>{isOfflineCached ? 'Đã lưu offline' : 'Lưu offline'}</span>
            </button>

            {/* Favorite */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label="Yêu thích"
              className={`rounded-xl border p-2 transition ${
                progress.favorite
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-rose-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${progress.favorite ? 'fill-current' : ''}`} />
            </button>

            {/* Export & Integrate Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D63ED] px-3.5 py-2 text-[14px] font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4" />
                <span>Tạo học liệu / Xuất</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-40 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleExportIntegration('worksheet')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-[#0F2942] hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 text-[#1D63ED]" />
                    <span>Tạo Phiếu học tập (Lưu kho)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportIntegration('presentation')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-[#0F2942] hover:bg-blue-50"
                  >
                    <Presentation className="h-4 w-4 text-[#1D63ED]" />
                    <span>Tạo Bài giảng trình chiếu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportIntegration('mindmap')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-[#0F2942] hover:bg-blue-50"
                  >
                    <GitBranch className="h-4 w-4 text-[#1D63ED]" />
                    <span>Tạo Sơ đồ tư duy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportIntegration('questions')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-[#0F2942] hover:bg-blue-50"
                  >
                    <BookOpen className="h-4 w-4 text-[#1D63ED]" />
                    <span>Đưa câu hỏi vào Ngân hàng</span>
                  </button>
                  <hr className="my-1 border-slate-200" />
                  <button
                    type="button"
                    onClick={() => handleExportIntegration('word')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    <Download className="h-4 w-4 text-emerald-600" />
                    <span>Xuất Phiếu học tập Word (.docx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      handleCaptureImage();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <ImageIcon className="h-4 w-4 text-slate-600" />
                    <span>Tải ảnh mô phỏng (PNG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      handleExportSvg();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Layers className="h-4 w-4 text-slate-600" />
                    <span>Tải sơ đồ 2D (SVG)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teacher Presentation Quick Controls */}
        {presentationMode && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#0F2942] px-3.5 py-2.5 text-white">
            <span className="text-[14px] font-bold text-blue-200">Công cụ lớp học:</span>
            <button
              type="button"
              onClick={() => setAnnotationActive((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-bold transition ${
                annotationActive ? 'bg-amber-500 text-white' : 'bg-white/15 hover:bg-white/25'
              }`}
            >
              <PenTool className="h-4 w-4" />
              <span>{annotationActive ? 'Đang bật bảng vẽ' : 'Bật bút ghi chú & đồng hồ'}</span>
            </button>
            <button
              type="button"
              onClick={() => setHideAnswersForClass((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-bold transition ${
                hideAnswersForClass ? 'bg-emerald-500 text-white' : 'bg-white/15 hover:bg-white/25'
              }`}
            >
              {hideAnswersForClass ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{hideAnswersForClass ? 'Hiện lại đáp án mẫu' : 'Ẩn đáp án cho lớp thảo luận'}</span>
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[14px] font-bold hover:bg-white/25"
            >
              <Maximize2 className="h-4 w-4" />
              <span>Toàn màn hình</span>
            </button>
            <button
              type="button"
              onClick={handleResetSimulation}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-[14px] font-bold hover:bg-white/25"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Đặt lại bài giảng</span>
            </button>
          </div>
        )}

        {/* 6-Step Student Flow Guide Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[13px] font-semibold">
          {[
            { step: 1, label: 'Mục tiêu & Bối cảnh', tab: 'explore' as InspectorTab },
            { step: 2, label: 'Quan sát mô phỏng', tab: 'explore' as InspectorTab },
            { step: 3, label: 'Thực hành tương tác', tab: 'tasks' as InspectorTab },
            { step: 4, label: 'Câu hỏi đọc hiểu', tab: 'quiz' as InspectorTab },
            { step: 5, label: 'Vận dụng & Tổng kết', tab: 'apply' as InspectorTab },
            { step: 6, label: 'Hướng dẫn giáo viên', tab: 'teacher' as InspectorTab },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveTab(s.tab)}
              className={`rounded-lg px-2.5 py-1 transition ${
                activeTab === s.tab
                  ? 'bg-blue-100 text-[#1D63ED] font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.step}. {s.label}
            </button>
          ))}
        </div>
      </header>

      {/* ZONE 2 & 3: MAIN STAGE (70%) + RIGHT INSPECTOR PANEL (30%) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT MAIN STAGE (8 cols on lg ~67–70%) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Interactive 3D / 2D Stage Container */}
          <div className="relative h-[460px] sm:h-[540px] lg:h-[580px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#EEF4FB] shadow-sm">
            {viewMode === '3d' && has3D ? (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-[15px] font-semibold text-slate-600">
                    Đang dựng không gian 3D cho {simulation.title}...
                  </div>
                }
              >
                <LazySimulation3DViewport
                  ref={viewport3DRef}
                  simulation={simulation}
                  stageIndex={stageIndex}
                  selectedHotspotId={selectedHotspot?.id ?? null}
                  onSelectHotspot={handleSelectHotspot}
                  showLabels={showLabels}
                  isPlaying={isPlaying}
                  reducedMotion={reducedMotion}
                  qualityTier={qualityTier}
                  params={params}
                  onWebGLFallback={() => setViewMode('2d')}
                />
              </Suspense>
            ) : (
              <Simulation2DViewport
                ref={viewport2DRef}
                simulation={simulation}
                stageIndex={stageIndex}
                onSelectStage={(idx) => setStageIndex(idx)}
                selectedHotspotId={selectedHotspot?.id ?? null}
                onSelectHotspot={handleSelectHotspot}
                showLabels={showLabels}
                onSpeak={(txt) => speech.speak(txt)}
              />
            )}

            {/* Transparent Classroom Annotation & Countdown Timer Overlay */}
            <TeacherOverlayCanvas
              active={annotationActive}
              onClose={() => setAnnotationActive(false)}
            />
          </div>

          {/* Stage Narration Caption + Playback Controls Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            {/* Stage timeline pills */}
            <div className="flex flex-wrap items-center gap-2">
              {simulation.stages.map((st, idx) => {
                const active = idx === stageIndex;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setAutoAdvance(false);
                      setStageIndex(idx);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-[14px] font-bold transition ${
                      active
                        ? 'bg-[#1D63ED] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#1D63ED]'
                    }`}
                  >
                    Chặng {idx + 1}: {st.title}
                  </button>
                );
              })}
            </div>

            {/* Active Stage Caption Text */}
            {speech.state.showCaption && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`font-bold text-[#0F2942] ${
                      presentationMode ? 'text-[19px]' : 'text-[16px]'
                    }`}
                  >
                    {activeStage.title} — <span className="text-[#1D63ED]">{activeStage.subtitle}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => speech.speak(activeStage.narration)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D63ED] px-3 py-1.5 text-[13px] font-bold text-white hover:bg-blue-700"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Đọc lời dẫn chặng này</span>
                  </button>
                </div>
                <p
                  className={`leading-relaxed text-slate-700 ${
                    presentationMode ? 'text-[17px]' : 'text-[15px]'
                  }`}
                >
                  {activeStage.narration}
                </p>
                <p className="text-[13px] font-medium text-amber-900">
                  <strong>Điểm neo văn bản:</strong> {activeStage.textualAnchor}
                </p>
                {!speech.state.hasVietnameseVoice && (
                  <p className="text-[12px] text-slate-500">{speech.state.statusMessage}</p>
                )}
              </div>
            )}

            {/* Playback & Accessibility Control Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={stageIndex === 0}
                  onClick={() => setStageIndex((s) => Math.max(0, s - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-bold text-[#0F2942] hover:bg-slate-50 disabled:opacity-40"
                >
                  <SkipBack className="h-4 w-4" />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (autoAdvance) {
                      setAutoAdvance(false);
                    } else {
                      setIsPlaying(true);
                      setAutoAdvance(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-3.5 py-2 text-[14px] font-bold text-white hover:bg-slate-800"
                >
                  {autoAdvance ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{autoAdvance ? 'Tạm dừng tự chạy' : 'Tự chạy các chặng'}</span>
                </button>
                <button
                  type="button"
                  disabled={stageIndex >= simulation.stages.length - 1}
                  onClick={() =>
                    setStageIndex((s) => Math.min(simulation.stages.length - 1, s + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-bold text-[#0F2942] hover:bg-slate-50 disabled:opacity-40"
                >
                  <span>Sau</span>
                  <SkipForward className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    viewport3DRef.current?.resetCamera();
                    viewport2DRef.current?.resetView();
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
                  title="Đặt lại góc nhìn"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Góc nhìn gốc</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowLabels((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-[14px] font-bold ${
                    showLabels
                      ? 'border-blue-200 bg-blue-50 text-[#1D63ED]'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <Tag className="h-4 w-4" />
                  <span>{showLabels ? 'Đang hiện nhãn' : 'Đã ẩn nhãn'}</span>
                </button>

                <button
                  type="button"
                  onClick={speech.toggleMute}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
                  title={speech.state.muted ? 'Bật âm thanh lời dẫn' : 'Tắt âm thanh lời dẫn'}
                >
                  {speech.state.muted ? (
                    <VolumeX className="h-4 w-4 text-rose-600" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-[#1D63ED]" />
                  )}
                  <span>{speech.state.muted ? 'Tắt tiếng' : 'Lời dẫn'}</span>
                </button>

                <select
                  aria-label="Tốc độ chuyển chặng"
                  value={playbackSpeed}
                  onChange={(e) => {
                    const sp = Number(e.target.value);
                    setPlaybackSpeed(sp);
                    speech.setRate(sp);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[13px] font-bold text-slate-700"
                >
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                </select>

                {viewMode === '3d' && has3D && (
                  <select
                    aria-label="Chất lượng đồ họa 3D"
                    value={qualityTier}
                    onChange={(e) => setQualityTier(e.target.value as QualityTier)}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[13px] font-bold text-slate-700"
                  >
                    <option value="economy">Tiết kiệm</option>
                    <option value="standard">Chuẩn</option>
                    <option value="high">Cao</option>
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setReducedMotion((v) => !v)}
                  className={`rounded-xl border px-2.5 py-2 text-[13px] font-bold ${
                    reducedMotion
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {reducedMotion ? 'Đã giảm chuyển động' : 'Giảm chuyển động'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                  title="Toàn màn hình"
                >
                  {document.fullscreenElement ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR PANEL (4 cols on lg ~30–33%) */}
        <div className="lg:col-span-4 lg:h-[760px]">
          <SimulationActivitiesPanel
            simulation={simulation}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={handleSelectHotspot}
            progress={progress}
            onUpdateAnswer={handleUpdateAnswer}
            onCompleteTask={handleCompleteTask}
            onUpdateNotes={handleUpdateNotes}
            onUpdateCustomTeacherText={handleUpdateCustomTeacherText}
            params={params}
            onChangeParam={(id, val) => setParams((prev) => ({ ...prev, [id]: val }))}
            hideAnswersForClass={hideAnswersForClass}
            presentationMode={presentationMode}
            onSpeak={(txt) => speech.speak(txt)}
          />
        </div>
      </div>

      {/* Prev / Next Lesson Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        {prevSim ? (
          <button
            type="button"
            onClick={() => navigate(`/kham-pha-2d-3d/${prevSim.id}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[14px] font-bold text-[#0F2942] hover:border-blue-300 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-[#1D63ED]" />
            <span>
              Bài #{String(prevSim.number).padStart(2, '0')}: {prevSim.title}
            </span>
          </button>
        ) : (
          <div />
        )}

        {nextSim && (
          <button
            type="button"
            onClick={() => navigate(`/kham-pha-2d-3d/${nextSim.id}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1D63ED] px-4 py-2.5 text-right text-[14px] font-bold text-white hover:bg-blue-700"
          >
            <span>
              Bài #{String(nextSim.number).padStart(2, '0')}: {nextSim.title}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        )}
      </nav>
    </div>
  );
}
