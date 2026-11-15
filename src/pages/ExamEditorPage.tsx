import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Download,
  FileArchive,
  FileCheck2,
  FilePlus2,
  GripVertical,
  History,
  Maximize2,
  Minimize2,
  Plus,
  Presentation,
  Printer,
  Redo2,
  Save,
  ShieldCheck,
  Trash2,
  Undo2,
} from 'lucide-react';
import { A4PreviewSheet, PreviewMode } from '../components/A4PreviewSheet';
import {
  COGNITIVE_LEVELS_ALL,
  COGNITIVE_LEVELS_BASE,
  DEFAULT_ADMIN_INFO,
  EXAM_TEMPLATES,
  EXAM_TYPES,
  GRADE_LEVELS,
  LEARNING_OUTCOMES_BY_GENRE,
  PASSAGE_GENRES,
  TEXTBOOK_SERIES,
  WRITING_CATEGORIES,
} from '../config/curriculum';
import { db } from '../database/db';
import { useUndoRedo } from '../hooks/useUndoRedo';
import {
  duplicateExam,
  createNumberedExams,
  listExams,
  listPassages,
  saveExam,
  saveExamVersion,
} from '../repositories/examRepository';
import { buildSynchronizedExamData } from '../services/examSyncService';
import { validateExamDocument } from '../services/examValidatorService';
import { convertExamToPresentation } from '../services/slideGeneratorService';
import {
  generateExamDocxBlob,
  generateGradingGuideDocxBlob,
  generateMatrixDocxBlob,
  generateSpecificationDocxBlob,
  makeExamDocxFilename,
  triggerBlobDownload,
} from '../services/wordExportService';
import { exportCompleteExamZip, exportNumberedExamZip } from '../services/zipBundleService';
import {
  AppSettings,
  CognitiveLevel,
  ExamDocument,
  ExamQuestion,
  PassageGenre,
  ReadingPassage,
  SourceVerificationStatus,
  WritingPrompt,
} from '../types';
import { formatScore, generateId, roundExact } from '../utils/formatters';

type EditorTab = 'admin' | 'reading' | 'writing' | 'validate';

const VERIFICATION_STATUSES: SourceVerificationStatus[] = [
  'Đã xác minh',
  'Giáo viên cung cấp',
  'Chưa xác minh',
  'Ngữ liệu tự biên soạn',
];

function createBlankExamFromTemplate(templateId: string, settings?: AppSettings): ExamDocument {
  const tpl =
    EXAM_TEMPLATES.find((t) => t.id === templateId) || EXAM_TEMPLATES[0];
  const now = new Date().toISOString();
  const grade = tpl.applicableGrades.includes('12')
    ? '12'
    : tpl.applicableGrades[0] || '10';

  return {
    id: generateId('exam'),
    ownerId: 'teacher-dathien',
    adminInfo: {
      ...DEFAULT_ADMIN_INFO,
      schoolName: settings?.defaultSchoolName || "TRƯỜNG THPT",
      departmentName: settings?.defaultDepartmentName ?? DEFAULT_ADMIN_INFO.departmentName,
      academicYear: settings?.defaultAcademicYear ?? DEFAULT_ADMIN_INFO.academicYear,
      grade,
      examType: tpl.examType,
      title: `ĐỀ ${tpl.examType.toUpperCase()} MÔN NGỮ VĂN LỚP ${grade}`,
      durationMinutes: tpl.durationMinutes,
      totalPoints: tpl.totalPoints,
      templateId: tpl.id,
      examCode: `NV-${grade}-${Math.floor(10 + Math.random() * 89)}`,
    },
    passage: {
      id: generateId('pass'),
      title: '',
      author: '',
      genre: 'Thơ',
      grade,
      textbookSeries: DEFAULT_ADMIN_INFO.textbookSeries,
      topic: '',
      literaryPeriod: '',
      textType: 'Thơ',
      content: '',
      formatStyle: 'poem',
      origin: '',
      citationSource: '',
      publisher: '',
      publishYear: '',
      verificationStatus: 'Giáo viên cung cấp',
      learningOutcomes: [],
      tags: [],
      isFavorite: false,
      ownerId: 'teacher-dathien',
      createdAt: now,
      updatedAt: now,
    },
    readingQuestions: tpl.readingQuestionPoints.map((pts, idx) => ({
      id: generateId('q'),
      order: idx + 1,
      part: 'doc-hieu',
      content: '',
      skill: 'Đọc hiểu văn bản',
      learningOutcome: '',
      cognitiveLevel: tpl.readingCognitiveDefaults[idx] || 'Thông hiểu',
      points: pts,
      answer: '',
      equivalentAnswers: '',
      partialCreditSteps: [{ id: generateId('step'), description: 'Ý chính', points: pts }],
      nonQualifyingNotes: '',
    })),
    writingPrompts: tpl.writingPromptsConfig.map((cfg, idx) => ({
      id: generateId('w'),
      order: idx + 1,
      category: cfg.category,
      formatType: cfg.formatType,
      wordCountTarget: cfg.wordCountTarget,
      promptText: '',
      points: cfg.points,
      cognitiveLevel: cfg.cognitiveLevel,
      learningOutcome: '',
      suggestedOutline: ['Mở bài / Mở đoạn', 'Thân bài / Thân đoạn', 'Kết bài / Kết đoạn'],
      keyArguments: [],
      rubric: [
        {
          id: generateId('rub'),
          group: 'Đảm bảo cấu trúc',
          title: 'Hình thức & Dung lượng',
          description: `Đảm bảo hình thức ${cfg.formatType.toLowerCase()} khoảng ${cfg.wordCountTarget} chữ.`,
          points: roundExact(cfg.points * 0.125),
        },
        {
          id: generateId('rub'),
          group: 'Triển khai vấn đề',
          title: 'Nội dung trọng tâm & Lập luận',
          description: 'Triển khai đầy đủ luận điểm, dẫn chứng xác đáng.',
          points: roundExact(cfg.points * 0.75),
        },
        {
          id: generateId('rub'),
          group: 'Chính tả và ngữ pháp',
          title: 'Diễn đạt, chính tả',
          description: 'Chuẩn chính tả, ngữ pháp tiếng Việt.',
          points: roundExact(cfg.points - roundExact(cfg.points * 0.125) - roundExact(cfg.points * 0.75)),
        },
      ],
      teacherReferenceEssay: '',
    })),
    includeHighApplication: tpl.id === 'hsg-180',
    approved: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const ExamEditorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    state: exam,
    set: setExamState,
    reset: resetExamHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<ExamDocument | null>(null);

  const [allExams, setAllExams] = useState<ExamDocument[]>([]);
  const [passageBank, setPassageBank] = useState<ReadingPassage[]>([]);
  const [settings, setSettings] = useState<AppSettings | undefined>(undefined);
  const [editorTab, setEditorTab] = useState<EditorTab>('admin');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('exam');
  const [splitPercent, setSplitPercent] = useState(48);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [batchStart, setBatchStart] = useState(101);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [showTemplateBar, setShowTemplateBar] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingSplitRef = useRef(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    (async () => {
      const [examsList, passagesList, appSettings] = await Promise.all([
        listExams(),
        listPassages(),
        db.settings.get('default'),
      ]);
      setAllExams(examsList);
      setPassageBank(passagesList);
      setSettings(appSettings);

      const paramId = searchParams.get('examId');
      const target =
        examsList.find((e) => e.id === paramId) || examsList[0] || null;
      if (target) {
        resetExamHistory(target);
      } else {
        const fresh = createBlankExamFromTemplate('thpt-2025-4-6', appSettings);
        await saveExam(fresh);
        resetExamHistory(fresh);
        setAllExams([fresh]);
      }
    })();
  }, [searchParams, resetExamHistory]);

  // Resizable Split Pane Handlers
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingSplitRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(30, Math.min(70, Math.round(pct))));
    };
    const onMouseUp = () => {
      draggingSplitRef.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (!exam) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Đang tải trình soạn đề thông minh...
      </div>
    );
  }

  const sync = buildSynchronizedExamData(exam);
  const validation = validateExamDocument(exam);
  const availableLevels: CognitiveLevel[] = exam.includeHighApplication
    ? COGNITIVE_LEVELS_ALL
    : COGNITIVE_LEVELS_BASE;

  const updateExam = (updater: (prev: ExamDocument) => ExamDocument) => {
    setExamState((prev) => {
      if (!prev) return prev;
      return updater(prev);
    }, true);
  };

  const handleSave = async () => {
    const saved = await saveExam(exam);
    resetExamHistory(saved);
    const refreshed = await listExams();
    setAllExams(refreshed);
    notify('Đã lưu đề kiểm tra vào IndexedDB.');
  };

  const handleSaveVersion = async () => {
    await saveExam(exam);
    const label = `Phiên bản lúc ${new Date().toLocaleTimeString('vi-VN')}`;
    await saveExamVersion(exam, label);
    notify(`Đã lưu ${label}.`);
  };

  const handleDuplicate = async () => {
    const copy = await duplicateExam(exam);
    const refreshed = await listExams();
    setAllExams(refreshed);
    setSearchParams({ examId: copy.id });
    resetExamHistory(copy);
    notify('Đã nhân bản thành đề mới.');
  };

  const handleCreateNew = async (templateId: string) => {
    const created = createBlankExamFromTemplate(templateId, settings);
    await saveExam(created);
    const refreshed = await listExams();
    setAllExams(refreshed);
    setSearchParams({ examId: created.id });
    resetExamHistory(created);
    setShowTemplateBar(false);
    setEditorTab('admin');
    notify('Đã tạo đề kiểm tra mới theo mẫu đã chọn.');
  };

  const handleConvertToSlides = async () => {
    await saveExam(exam);
    const deck = convertExamToPresentation(exam);
    await db.presentations.put(deck);
    navigate(`/bai-giang?deckId=${deck.id}`);
  };

  const handleSelectPassageFromBank = (passageId: string) => {
    const found = passageBank.find((p) => p.id === passageId);
    if (!found) return;
    updateExam((prev) => ({
      ...prev,
      passage: { ...found },
    }));
    notify(`Đã nạp ngữ liệu "${found.title}".`);
  };

  const handleAddReadingQuestion = () => {
    updateExam((prev) => {
      const nextOrder = prev.readingQuestions.length + 1;
      const newQ: ExamQuestion = {
        id: generateId('q'),
        order: nextOrder,
        part: 'doc-hieu',
        content: '',
        skill: 'Phân tích văn bản',
        learningOutcome: '',
        cognitiveLevel: 'Thông hiểu',
        points: 1.0,
        answer: '',
        equivalentAnswers: '',
        partialCreditSteps: [
          { id: generateId('step'), description: 'Ý trả lời chính', points: 1.0 },
        ],
        nonQualifyingNotes: '',
      };
      return {
        ...prev,
        readingQuestions: [...prev.readingQuestions, newQ],
      };
    });
  };

  const moveReadingQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= exam.readingQuestions.length) return;
    updateExam((prev) => {
      const list = [...prev.readingQuestions];
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      return {
        ...prev,
        readingQuestions: list.map((q, i) => ({ ...q, order: i + 1 })),
      };
    });
  };

  const handleAddWritingPrompt = () => {
    updateExam((prev) => {
      const nextOrder = prev.writingPrompts.length + 1;
      const newW: WritingPrompt = {
        id: generateId('w'),
        order: nextOrder,
        category: 'Nghị luận xã hội',
        formatType: 'Bài văn',
        wordCountTarget: 600,
        promptText: '',
        points: 4.0,
        cognitiveLevel: 'Vận dụng',
        learningOutcome: '',
        suggestedOutline: ['Mở bài', 'Thân bài', 'Kết bài'],
        keyArguments: [],
        rubric: [
          {
            id: generateId('rub'),
            group: 'Đảm bảo cấu trúc',
            title: 'Bố cục bài văn',
            description: 'Đảm bảo cấu trúc 3 phần.',
            points: 0.5,
          },
          {
            id: generateId('rub'),
            group: 'Triển khai vấn đề',
            title: 'Triển khai luận điểm',
            description: 'Lập luận rõ ràng, dẫn chứng thuyết phục.',
            points: 3.0,
          },
          {
            id: generateId('rub'),
            group: 'Chính tả và ngữ pháp',
            title: 'Chính tả, diễn đạt',
            description: 'Chuẩn chính tả, ngữ pháp.',
            points: 0.5,
          },
        ],
        teacherReferenceEssay: '',
      };
      return {
        ...prev,
        writingPrompts: [...prev.writingPrompts, newW],
      };
    });
  };

  const jumpToIssue = (tab: EditorTab, elementId?: string) => {
    setEditorTab(
      tab === 'matrix' || tab === 'spec'
        ? 'validate'
        : tab === 'rubric'
        ? 'reading'
        : tab
    );
    if (tab === 'matrix' || tab === 'spec') {
      navigate(`/ma-tran-dac-ta?examId=${exam.id}`);
      return;
    }
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(`editor-item-${elementId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const applyPassageSnippet = (snippetType: 'stanza' | 'quote' | 'dialogue') => {
    const appendText =
      snippetType === 'stanza'
        ? '\n\n'
        : snippetType === 'quote'
        ? '\n"Trích dẫn..."'
        : '\nNhân vật A: — Lời thoại...';
    updateExam((prev) => ({
      ...prev,
      passage: {
        ...prev.passage,
        content: prev.passage.content + appendText,
      },
    }));
  };

  const suggestedYCCDs =
    LEARNING_OUTCOMES_BY_GENRE[exam.passage.genre]?.[exam.adminInfo.grade] || [];

  return (
    <div
      className={`exam-editor flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#FAF8F5]' : 'min-h-[calc(100vh-3.5rem)]'
      }`}
    >
      {/* Top Action Toolbar */}
      <div className="no-print bg-white border-b border-[#E5E0D8] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={exam.id}
            onChange={(e) => {
              const found = allExams.find((x) => x.id === e.target.value);
              if (found) {
                setSearchParams({ examId: found.id });
                resetExamHistory(found);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium max-w-[230px]"
          >
            {allExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.adminInfo.examCode} – {ex.adminInfo.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowTemplateBar((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <FilePlus2 className="w-3.5 h-3.5" /> Tạo mới
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] inline-flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" /> Lưu đề
          </button>

          <button
            type="button"
            onClick={handleSaveVersion}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50 inline-flex items-center gap-1"
            title="Lưu mốc phiên bản"
          >
            <History className="w-3.5 h-3.5" /> Lưu bản
          </button>

          <button
            type="button"
            onClick={handleDuplicate}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" /> Nhân bản
          </button>

          <button type="button" onClick={() => setBatchOpen(v => !v)} className="px-3 py-2 rounded-lg border border-teal-600 text-teal-700 font-semibold">Tạo nhiều đề</button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Hoàn tác"
              className="p-1.5 hover:bg-slate-100 disabled:opacity-40"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Làm lại"
              className="p-1.5 hover:bg-slate-100 disabled:opacity-40 border-l border-slate-200"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditorTab('validate')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border ${
              validation.status === 'Có lỗi cần sửa'
                ? 'border-red-300 bg-red-50 text-red-700'
                : validation.status === 'Cần kiểm tra'
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Kiểm tra đề ({validation.issues.length})
          </button>

          <button
            type="button"
            onClick={handleConvertToSlides}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <Presentation className="w-3.5 h-3.5" /> Chuyển thành bài giảng
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D] inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Xuất tài liệu
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={async () => {
                    setShowExportMenu(false);
                    const b = await generateExamDocxBlob(exam, settings);
                    triggerBlobDownload(b, makeExamDocxFilename(exam, 'De_kiem_tra'));
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50"
                >
                  Xuất Đề kiểm tra (.docx)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowExportMenu(false);
                    const b = await generateMatrixDocxBlob(exam, settings);
                    triggerBlobDownload(b, makeExamDocxFilename(exam, 'Ma_tran'));
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50"
                >
                  Xuất Ma trận (.docx)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowExportMenu(false);
                    const b = await generateSpecificationDocxBlob(exam, settings);
                    triggerBlobDownload(b, makeExamDocxFilename(exam, 'Ban_dac_ta'));
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50"
                >
                  Xuất Bản đặc tả (.docx)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowExportMenu(false);
                    const b = await generateGradingGuideDocxBlob(exam, settings);
                    triggerBlobDownload(b, makeExamDocxFilename(exam, 'Huong_dan_cham'));
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50"
                >
                  Xuất Hướng dẫn chấm (.docx)
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={async () => {
                    setShowExportMenu(false);
                    const res = await exportCompleteExamZip(exam, settings);
                    notify(
                      `Đã xuất ZIP gồm ${res.packagedFiles.length} tệp: ${res.packagedFiles.join(', ')}`
                    );
                  }}
                  className="w-full text-left px-3.5 py-2 font-semibold text-[#0F2942] hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <FileArchive className="w-3.5 h-3.5 text-[#0D7A6F]" />
                  Xuất trọn bộ hồ sơ (.zip)
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> In / PDF
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            title="Toàn màn hình"
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Inline Template Picker Strip (No Popup!) */}
      {batchOpen && <section className="no-print bg-white border-b p-4 space-y-3">
        <h2 className="font-bold">Tạo nhiều mã đề từ đề đang soạn</h2>
        <p className="text-sm">Các bản sao có nội dung ban đầu giống nhau. Chỉnh sửa từng đề để tạo đề tương đương; không tự đảo câu đọc hiểu.</p>
        <div className="flex flex-wrap items-end gap-3">
          <label>Số lượng (1–50)<input className="block border rounded p-2 w-28" type="number" min={1} max={50} value={batchCount} onChange={e => setBatchCount(Number(e.target.value))}/></label>
          <label>Mã bắt đầu<input className="block border rounded p-2 w-28" type="number" min={1} value={batchStart} onChange={e => setBatchStart(Number(e.target.value))}/></label>
          <button disabled={batchBusy} className="bg-teal-700 text-white rounded px-4 py-2 disabled:opacity-50" onClick={async () => {
            setBatchBusy(true); setBatchError('');
            try { const copies = await createNumberedExams(exam, batchCount, batchStart); setBatchIds(copies.map(c => c.id)); setAllExams(await listExams()); notify(`Đã tạo ${copies.length} mã đề.`); } catch(e) { setBatchError(e instanceof Error ? e.message : 'Không thể tạo đề.'); } finally { setBatchBusy(false); }
          }}>Tạo và lưu đề</button>
          <button disabled={batchBusy || !batchIds.length} className="border rounded px-4 py-2 disabled:opacity-50" onClick={async () => {
            setBatchBusy(true); setBatchError('');
            try { const saved = await db.exams.bulkGet(batchIds); const copies = saved.filter((x): x is ExamDocument => !!x); if (copies.length !== batchIds.length) throw new Error('Một số đề đã bị xóa.'); await exportNumberedExamZip(copies, settings); } catch(e) { setBatchError(e instanceof Error ? e.message : 'Xuất hồ sơ thất bại.'); } finally { setBatchBusy(false); }
          }}>Xuất ZIP các mã đề đã lưu</button>
        </div>
        {batchError && <p role="alert" className="text-red-700">{batchError}</p>}
        <div className="flex flex-wrap gap-2">{allExams.filter(e => batchIds.includes(e.id)).sort((a,b) => Number(a.adminInfo.examCode)-Number(b.adminInfo.examCode)).map(e => <button key={e.id} className="border rounded px-3 py-1" onClick={() => {setSearchParams({examId:e.id}); resetExamHistory(e);}}>Mở đề {e.adminInfo.examCode}</button>)}</div>
        <p className="text-xs text-slate-600">Bấm Lưu đề sau khi chỉnh sửa từng mã, trước khi xuất hàng loạt.</p>
      </section>}
      {showTemplateBar && (
        <div className="no-print bg-slate-50 border-b border-[#E5E0D8] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#0F2942]">
              Chọn mẫu cấu trúc đề để khởi tạo đề mới:
            </span>
            <button
              type="button"
              onClick={() => setShowTemplateBar(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Đóng
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {EXAM_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleCreateNew(tpl.id)}
                className="text-left p-3 rounded-lg bg-white border border-slate-200 hover:border-[#0F2942] transition-colors"
              >
                <div className="text-xs font-bold text-[#0F2942]">{tpl.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {tpl.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="no-print bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toast}
        </div>
      )}

      {/* Main Resizable Split Workspace */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden"
      >
        {/* LEFT PANE: Interactive Editor */}
        <div
          className="no-print flex flex-col border-b lg:border-b-0 lg:border-r border-[#E5E0D8] bg-white overflow-hidden"
          style={{
            width:
              typeof window !== 'undefined' && window.innerWidth >= 1024
                ? `${splitPercent}%`
                : '100%',
          }}
        >
          {/* Editor Sub-Navigation & Score Meter */}
          <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-[#FAF8F5]">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'admin', label: 'Thông tin đề' },
                { id: 'reading', label: 'Phần Đọc hiểu' },
                { id: 'writing', label: 'Phần Viết' },
                { id: 'validate', label: 'Kiểm định & Duyệt' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditorTab(t.id as EditorTab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    editorTab === t.id
                      ? 'bg-[#0F2942] text-white'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="text-xs font-mono tabular-nums font-semibold">
              Tổng:{' '}
              <span
                className={
                  sync.computedTotal === sync.targetTotal
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }
              >
                {formatScore(sync.computedTotal)} / {formatScore(sync.targetTotal)}đ
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* TAB 1: ADMIN INFO */}
            {editorTab === 'admin' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên trường / Đơn vị (có thể chỉnh sửa)
                    </label>
                    <input
                      type="text"
                      value={exam.adminInfo.schoolName}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: { ...p.adminInfo, schoolName: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tổ chuyên môn
                    </label>
                    <input
                      type="text"
                      value={exam.adminInfo.departmentName}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: {
                            ...p.adminInfo,
                            departmentName: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đề kiểm tra
                  </label>
                  <input
                    type="text"
                    value={exam.adminInfo.title}
                    onChange={(e) =>
                      updateExam((p) => ({
                        ...p,
                        adminInfo: { ...p.adminInfo, title: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Khối lớp
                    </label>
                    <select
                      value={exam.adminInfo.grade}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: {
                            ...p.adminInfo,
                            grade: e.target.value as '10' | '11' | '12',
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                    >
                      {GRADE_LEVELS.map((g) => (
                        <option key={g} value={g}>
                          Lớp {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Học kỳ
                    </label>
                    <select
                      value={exam.adminInfo.semester}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: {
                            ...p.adminInfo,
                            semester: e.target.value as
                              | 'Học kỳ I'
                              | 'Học kỳ II'
                              | 'Cả năm',
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                    >
                      <option value="Học kỳ I">Học kỳ I</option>
                      <option value="Học kỳ II">Học kỳ II</option>
                      <option value="Cả năm">Cả năm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Năm học
                    </label>
                    <input
                      type="text"
                      value={exam.adminInfo.academicYear}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: {
                            ...p.adminInfo,
                            academicYear: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã đề
                    </label>
                    <input
                      type="text"
                      value={exam.adminInfo.examCode}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: { ...p.adminInfo, examCode: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bộ sách GDPT 2018
                    </label>
                    <select
                      value={exam.adminInfo.textbookSeries}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: {
                            ...p.adminInfo,
                            textbookSeries: e.target
                              .value as ExamDocument['adminInfo']['textbookSeries'],
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                    >
                      {TEXTBOOK_SERIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Loại kiểm tra
                    </label>
                    <select
                      value={exam.adminInfo.examType}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: {
                            ...p.adminInfo,
                            examType: e.target
                              .value as ExamDocument['adminInfo']['examType'],
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                    >
                      {EXAM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Thời gian (phút)
                    </label>
                    <input
                      type="number"
                      min={15}
                      value={exam.adminInfo.durationMinutes}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: {
                            ...p.adminInfo,
                            durationMinutes: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tổng điểm thang
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      min={1}
                      value={exam.adminInfo.totalPoints}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          adminInfo: {
                            ...p.adminInfo,
                            totalPoints: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs tabular-nums"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exam.includeHighApplication}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          includeHighApplication: e.target.checked,
                        }))
                      }
                    />
                    <span>Bổ sung Vận dụng cao</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phạm vi kiến thức
                  </label>
                  <textarea
                    rows={2}
                    value={exam.adminInfo.knowledgeScope}
                    onChange={(e) =>
                      updateExam((p) => ({
                        ...p,
                        adminInfo: {
                          ...p.adminInfo,
                          knowledgeScope: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yêu cầu cần đạt trọng tâm
                  </label>
                  <textarea
                    rows={2}
                    value={exam.adminInfo.learningOutcomesSummary}
                    onChange={(e) =>
                      updateExam((p) => ({
                        ...p,
                        adminInfo: {
                          ...p.adminInfo,
                          learningOutcomesSummary: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú / Hướng dẫn coi thi
                  </label>
                  <input
                    type="text"
                    value={exam.adminInfo.extraNotes}
                    onChange={(e) =>
                      updateExam((p) => ({
                        ...p,
                        adminInfo: { ...p.adminInfo, extraNotes: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: READING SECTION */}
            {editorTab === 'reading' && (
              <div className="space-y-5">
                {/* Passage Editor */}
                <div className="rounded-xl border border-slate-200 bg-[#FAF8F5]/70 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[#0F2942]">
                      Ngữ liệu Đọc hiểu
                    </h2>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleSelectPassageFromBank(e.target.value);
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs max-w-[240px]"
                    >
                      <option value="">Nạp từ Ngân hàng ngữ liệu...</option>
                      {passageBank.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.genre} - Lớp {p.grade}] {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="Tên văn bản"
                      value={exam.passage.title}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          passage: { ...p.passage, title: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Tác giả"
                      value={exam.passage.author}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          passage: { ...p.passage, author: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <select
                      value={exam.passage.genre}
                      onChange={(e) => {
                        const g = e.target.value as PassageGenre;
                        updateExam((p) => ({
                          ...p,
                          passage: {
                            ...p.passage,
                            genre: g,
                            formatStyle:
                              g === 'Thơ'
                                ? 'poem'
                                : g === 'Kịch'
                                ? 'dialogue'
                                : 'prose',
                          },
                        }));
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    >
                      {PASSAGE_GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Format helpers */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Định dạng hiển thị:</span>
                      {[
                        { id: 'poem', label: 'Thơ (dòng/khổ)' },
                        { id: 'prose', label: 'Văn xuôi (thụt đầu dòng)' },
                        { id: 'dialogue', label: 'Lời thoại / Kịch' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() =>
                            updateExam((p) => ({
                              ...p,
                              passage: {
                                ...p.passage,
                                formatStyle: fmt.id as ReadingPassage['formatStyle'],
                              },
                            }))
                          }
                          className={`px-2 py-0.5 rounded border ${
                            exam.passage.formatStyle === fmt.id
                              ? 'bg-[#0F2942] text-white border-[#0F2942]'
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => applyPassageSnippet('stanza')}
                        className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-50"
                      >
                        + Ngắt khổ/đoạn
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPassageSnippet('quote')}
                        className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-50"
                      >
                        + Trích dẫn
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPassageSnippet('dialogue')}
                        className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-50"
                      >
                        + Lời thoại
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={7}
                    placeholder="Nhập nội dung ngữ liệu (giữ nguyên dòng thơ, khổ thơ hoặc đoạn văn)..."
                    value={exam.passage.content}
                    onChange={(e) =>
                      updateExam((p) => ({
                        ...p,
                        passage: { ...p.passage, content: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Nguồn trích dẫn (sách/tuyển tập/báo)"
                      value={exam.passage.citationSource}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          passage: { ...p.passage, citationSource: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <select
                      value={exam.passage.verificationStatus}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          passage: {
                            ...p.passage,
                            verificationStatus: e.target
                              .value as SourceVerificationStatus,
                          },
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    >
                      {VERIFICATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          Trạng thái nguồn: {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Nhà xuất bản"
                      value={exam.passage.publisher}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          passage: { ...p.passage, publisher: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Năm XB"
                      value={exam.passage.publishYear}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          passage: { ...p.passage, publishYear: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Trang (nếu có)"
                      value={exam.passage.pageNumber || ''}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          passage: { ...p.passage, pageNumber: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Liên kết nguồn (nếu có)"
                      value={exam.passage.sourceUrl || ''}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          passage: { ...p.passage, sourceUrl: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                {/* Reading Questions List (Draggable + Up/Down) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#0F2942]">
                      Danh sách câu hỏi Đọc hiểu ({exam.readingQuestions.length} câu ·{' '}
                      {formatScore(sync.readingTotal)}đ)
                    </h2>
                    <button
                      type="button"
                      onClick={handleAddReadingQuestion}
                      className="px-3 py-1.5 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D] inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm câu đọc hiểu
                    </button>
                  </div>

                  {exam.readingQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      id={`editor-item-${q.id}`}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex !== null && dragIndex !== idx) {
                          moveReadingQuestion(dragIndex, idx);
                        }
                        setDragIndex(null);
                      }}
                      className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 hover:border-[#0F2942]/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                          <span className="text-xs font-bold text-[#0F2942]">
                            Câu {idx + 1}
                          </span>
                          <select
                            value={q.cognitiveLevel}
                            onChange={(e) =>
                              updateExam((p) => ({
                                ...p,
                                readingQuestions: p.readingQuestions.map((item) =>
                                  item.id === q.id
                                    ? {
                                        ...item,
                                        cognitiveLevel: e.target
                                          .value as CognitiveLevel,
                                      }
                                    : item
                                ),
                              }))
                            }
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                          >
                            {availableLevels.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step={0.25}
                              min={0}
                              value={q.points}
                              onChange={(e) =>
                                updateExam((p) => ({
                                  ...p,
                                  readingQuestions: p.readingQuestions.map((item) =>
                                    item.id === q.id
                                      ? { ...item, points: Number(e.target.value) }
                                      : item
                                  ),
                                }))
                              }
                              className="w-16 rounded border border-slate-300 px-2 py-1 text-xs tabular-nums text-center"
                            />
                            <span className="text-xs text-slate-500">điểm</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveReadingQuestion(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                            title="Lên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveReadingQuestion(idx, idx + 1)}
                            disabled={idx === exam.readingQuestions.length - 1}
                            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                            title="Xuống"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateExam((p) => ({
                                ...p,
                                readingQuestions: p.readingQuestions
                                  .filter((item) => item.id !== q.id)
                                  .map((item, i) => ({ ...item, order: i + 1 })),
                              }))
                            }
                            className="p-1 rounded text-slate-400 hover:text-red-600"
                            title="Xóa câu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Nội dung câu hỏi..."
                        value={q.content}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            readingQuestions: p.readingQuestions.map((item) =>
                              item.id === q.id
                                ? { ...item, content: e.target.value }
                                : item
                            ),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Kỹ năng cần đánh giá
                          </label>
                          <input
                            type="text"
                            value={q.skill}
                            onChange={(e) =>
                              updateExam((p) => ({
                                ...p,
                                readingQuestions: p.readingQuestions.map((item) =>
                                  item.id === q.id
                                    ? { ...item, skill: e.target.value }
                                    : item
                                ),
                              }))
                            }
                            className="w-full rounded border border-slate-300 px-2.5 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Chọn nhanh Yêu cầu cần đạt (GDPT 2018)
                          </label>
                          <select
                            value=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              updateExam((p) => ({
                                ...p,
                                readingQuestions: p.readingQuestions.map((item) =>
                                  item.id === q.id
                                    ? { ...item, learningOutcome: e.target.value }
                                    : item
                                ),
                              }));
                            }}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option value="">Chọn YCCĐ phù hợp lớp {exam.adminInfo.grade}...</option>
                            {suggestedYCCDs.map((y, yi) => (
                              <option key={yi} value={y}>
                                {y.slice(0, 75)}...
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Yêu cầu cần đạt cụ thể cho câu hỏi này..."
                        value={q.learningOutcome}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            readingQuestions: p.readingQuestions.map((item) =>
                              item.id === q.id
                                ? { ...item, learningOutcome: e.target.value }
                                : item
                            ),
                          }))
                        }
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs"
                      />

                      <textarea
                        rows={2}
                        placeholder="Đáp án & Hướng dẫn chấm..."
                        value={q.answer}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            readingQuestions: p.readingQuestions.map((item) =>
                              item.id === q.id
                                ? { ...item, answer: e.target.value }
                                : item
                            ),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: WRITING SECTION */}
            {editorTab === 'writing' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#0F2942]">
                    Phần II. Viết ({exam.writingPrompts.length} yêu cầu ·{' '}
                    {formatScore(sync.writingTotal)}đ)
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddWritingPrompt}
                    className="px-3 py-1.5 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D] inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm câu viết
                  </button>
                </div>

                {exam.writingPrompts.map((wp, idx) => (
                  <div
                    key={wp.id}
                    id={`editor-item-${wp.id}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0F2942]">
                        Câu {idx + 1} (Phần Viết)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateExam((p) => ({
                            ...p,
                            writingPrompts: p.writingPrompts.filter(
                              (x) => x.id !== wp.id
                            ),
                          }))
                        }
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <select
                        value={wp.category}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            writingPrompts: p.writingPrompts.map((w) =>
                              w.id === wp.id
                                ? {
                                    ...w,
                                    category: e.target
                                      .value as WritingPrompt['category'],
                                  }
                                : w
                            ),
                          }))
                        }
                        className="rounded border border-slate-300 px-2 py-1.5 text-xs"
                      >
                        {WRITING_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <select
                        value={wp.formatType}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            writingPrompts: p.writingPrompts.map((w) =>
                              w.id === wp.id
                                ? {
                                    ...w,
                                    formatType: e.target.value as
                                      | 'Đoạn văn'
                                      | 'Bài văn',
                                  }
                                : w
                            ),
                          }))
                        }
                        className="rounded border border-slate-300 px-2 py-1.5 text-xs"
                      >
                        <option value="Đoạn văn">Đoạn văn</option>
                        <option value="Bài văn">Bài văn</option>
                      </select>
                      <input
                        type="number"
                        min={50}
                        step={50}
                        value={wp.wordCountTarget}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            writingPrompts: p.writingPrompts.map((w) =>
                              w.id === wp.id
                                ? { ...w, wordCountTarget: Number(e.target.value) }
                                : w
                            ),
                          }))
                        }
                        className="rounded border border-slate-300 px-2 py-1.5 text-xs tabular-nums"
                        title="Dung lượng chữ"
                      />
                      <input
                        type="number"
                        step={0.25}
                        min={0}
                        value={wp.points}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            writingPrompts: p.writingPrompts.map((w) =>
                              w.id === wp.id
                                ? { ...w, points: Number(e.target.value) }
                                : w
                            ),
                          }))
                        }
                        className="rounded border border-slate-300 px-2 py-1.5 text-xs tabular-nums font-semibold"
                        title="Điểm số"
                      />
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Nội dung đề bài phần Viết..."
                      value={wp.promptText}
                      onChange={(e) =>
                        updateExam((p) => ({
                          ...p,
                          writingPrompts: p.writingPrompts.map((w) =>
                            w.id === wp.id
                              ? { ...w, promptText: e.target.value }
                              : w
                          ),
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Yêu cầu cần đạt
                      </label>
                      <input
                        type="text"
                        value={wp.learningOutcome}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            writingPrompts: p.writingPrompts.map((w) =>
                              w.id === wp.id
                                ? { ...w, learningOutcome: e.target.value }
                                : w
                            ),
                          }))
                        }
                        className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Dàn ý gợi ý (mỗi ý một dòng)
                      </label>
                      <textarea
                        rows={3}
                        value={wp.suggestedOutline.join('\n')}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            writingPrompts: p.writingPrompts.map((w) =>
                              w.id === wp.id
                                ? {
                                    ...w,
                                    suggestedOutline: e.target.value.split('\n'),
                                  }
                                : w
                            ),
                          }))
                        }
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tài liệu tham khảo nội bộ dành cho giáo viên (ẩn với học sinh khi thi)
                      </label>
                      <textarea
                        rows={2}
                        value={wp.teacherReferenceEssay}
                        onChange={(e) =>
                          updateExam((p) => ({
                            ...p,
                            writingPrompts: p.writingPrompts.map((w) =>
                              w.id === wp.id
                                ? { ...w, teacherReferenceEssay: e.target.value }
                                : w
                            ),
                          }))
                        }
                        className="w-full rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: VALIDATOR & APPROVAL */}
            {editorTab === 'validate' && (
              <div className="space-y-4">
                <div
                  className={`rounded-xl border p-4 ${
                    validation.status === 'Đạt yêu cầu kỹ thuật'
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : validation.status === 'Cần kiểm tra'
                      ? 'border-amber-200 bg-amber-50/70'
                      : 'border-red-200 bg-red-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-[#0F2942]">
                      Kết quả kiểm định: {validation.status}
                    </div>
                    <button
                      type="button"
                      disabled={
                        validation.status === 'Có lỗi cần sửa' ||
                        sync.conflicts.length > 0
                      }
                      onClick={() =>
                        updateExam((p) => ({ ...p, approved: !p.approved }))
                      }
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                        exam.approved
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#0F2942] text-white disabled:opacity-40'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {exam.approved ? 'Đã duyệt phát hành' : 'Duyệt đề kiểm tra'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Lưu ý: Hệ thống chỉ kiểm tra tính nhất quán kỹ thuật (tổng điểm, cấu trúc, nguồn, barem, ma trận). Giáo viên chịu trách nhiệm rà soát chuyên môn trước khi duyệt đề.
                  </p>
                </div>

                {validation.issues.length === 0 ? (
                  <div className="p-6 text-center text-sm text-emerald-700 bg-white rounded-xl border border-emerald-200">
                    Không phát hiện lỗi kỹ thuật hay sai lệch đồng bộ nào.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {validation.issues.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() =>
                          jumpToIssue(
                            issue.targetTab as EditorTab,
                            issue.targetElementId
                          )
                        }
                        className="w-full text-left p-3 rounded-lg border border-slate-200 bg-white hover:border-[#0F2942] flex items-start gap-2.5 transition-colors"
                      >
                        {issue.severity === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div className="text-xs">
                          <div className="font-bold text-[#0F2942]">
                            {issue.category}
                          </div>
                          <div className="text-slate-600 mt-0.5">{issue.message}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DRAGGABLE RESIZER */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={() => {
            draggingSplitRef.current = true;
          }}
          className="no-print hidden lg:flex w-1.5 cursor-col-resize bg-[#E5E0D8] hover:bg-[#0D7A6F] transition-colors items-center justify-center shrink-0"
          title="Kéo để thay đổi chiều rộng hai vùng"
        />

        {/* RIGHT PANE: Real-Time A4 Preview */}
        <div className="flex-1 flex flex-col bg-[#EDEAE4] overflow-hidden min-w-0">
          <div className="no-print px-4 py-2 bg-white border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'exam', label: 'Đề kiểm tra' },
                { id: 'answers', label: 'Đáp án' },
                { id: 'grading', label: 'Hướng dẫn chấm' },
                { id: 'matrix', label: 'Ma trận' },
                { id: 'spec', label: 'Bản đặc tả' },
                { id: 'dossier', label: 'Hồ sơ tổng hợp' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPreviewMode(m.id as PreviewMode)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    previewMode === m.id
                      ? 'bg-[#0D7A6F] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">Khổ giấy A4 · Xem trước tức thời</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <A4PreviewSheet
              exam={exam}
              mode={previewMode}
              fontFamily={settings?.wordFontFamily}
              fontSizePt={settings?.wordFontSizePt}
              lineSpacing={settings?.wordLineSpacing}
              margins={settings?.wordMarginsMm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
