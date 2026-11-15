import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, FilePlus2, Plus, Search, Trash2 } from 'lucide-react';
import {
  COGNITIVE_LEVELS_ALL,
  DEFAULT_ADMIN_INFO,
  GRADE_LEVELS,
  PASSAGE_GENRES,
} from '../config/curriculum';
import {
  deleteQuestion,
  listPassages,
  listQuestions,
  saveExam,
  saveQuestion,
} from '../repositories/examRepository';
import {
  CognitiveLevel,
  ExamDocument,
  ExamQuestion,
  GradeLevel,
  PassageGenre,
  ReadingPassage,
} from '../types';
import { formatScore, generateId } from '../utils/formatters';

export const QuestionBankPage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<ExamQuestion | null>(null);

  const load = async () => {
    const [qs, ps] = await Promise.all([listQuestions(), listPassages()]);
    setQuestions(qs);
    setPassages(ps);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = questions.filter((q) => {
    if (filterLevel !== 'all' && q.cognitiveLevel !== filterLevel) return false;
    if (filterGrade !== 'all' && q.grade !== filterGrade) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        q.content.toLowerCase().includes(s) ||
        q.skill.toLowerCase().includes(s) ||
        q.answer.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const handleAddQuestion = async () => {
    const now = new Date().toISOString();
    const created: ExamQuestion = {
      id: generateId('q'),
      order: questions.length + 1,
      part: 'doc-hieu',
      content: 'Câu hỏi đọc hiểu mới...',
      skill: 'Đọc hiểu văn bản',
      learningOutcome: '',
      cognitiveLevel: 'Thông hiểu',
      points: 1.0,
      answer: '',
      equivalentAnswers: '',
      partialCreditSteps: [],
      nonQualifyingNotes: '',
      grade: '12',
      genre: 'Thơ',
      passageId: passages[0]?.id,
      ownerId: 'teacher-dathien',
      createdAt: now,
      updatedAt: now,
    };
    await saveQuestion(created);
    await load();
    setEditing(created);
  };

  const handleBuildExamFromSelected = async () => {
    const picked = questions.filter((q) => selectedIds.includes(q.id));
    if (picked.length === 0) return;
    const firstPassage =
      passages.find((p) => p.id === picked[0].passageId) || passages[0];
    const now = new Date().toISOString();
    const exam: ExamDocument = {
      id: generateId('exam'),
      ownerId: 'teacher-dathien',
      adminInfo: {
        ...DEFAULT_ADMIN_INFO,
        title: `ĐỀ TẠO TỪ NGÂN HÀNG CÂU HỎI (${picked.length} CÂU)`,
        templateId: 'custom',
      },
      passage: firstPassage,
      readingQuestions: picked.map((q, idx) => ({ ...q, order: idx + 1 })),
      writingPrompts: [],
      includeHighApplication: picked.some((q) => q.cognitiveLevel === 'Vận dụng cao'),
      approved: false,
      createdAt: now,
      updatedAt: now,
    };
    await saveExam(exam);
    navigate(`/soan-de?examId=${exam.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Ngân hàng câu hỏi Ngữ văn
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý câu hỏi đọc hiểu gắn ngữ liệu, mức độ nhận thức và yêu cầu cần đạt
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBuildExamFromSelected}
              className="px-3.5 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D] inline-flex items-center gap-1.5"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> Tạo đề từ {selectedIds.length} câu đã chọn
            </button>
          )}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm nội dung câu hỏi, kỹ năng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
        >
          <option value="all">Mọi mức độ nhận thức</option>
          {COGNITIVE_LEVELS_ALL.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
        >
          <option value="all">Tất cả khối lớp</option>
          {GRADE_LEVELS.map((g) => (
            <option key={g} value={g}>
              Lớp {g}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Question List */}
        <div className="lg:col-span-7 space-y-2.5">
          {filtered.map((q) => {
            const checked = selectedIds.includes(q.id);
            const linkedPassage = passages.find((p) => p.id === q.passageId);
            return (
              <div
                key={q.id}
                onClick={() => setEditing(q)}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  editing?.id === q.id
                    ? 'bg-white border-[#0F2942] shadow-sm'
                    : 'bg-white border-[#E5E0D8] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds((prev) =>
                        checked ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                      );
                    }}
                    className={`mt-0.5 ${checked ? 'text-[#0D7A6F]' : 'text-slate-300'}`}
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#0F2942]">
                      {q.content}
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                      <span>{q.cognitiveLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatScore(q.points)} điểm
                      </span>
                      {linkedPassage && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Ngữ liệu: {linkedPassage.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline Editor */}
        <div className="lg:col-span-5">
          {editing ? (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-bold text-[#0F2942]">
                  Chỉnh sửa câu hỏi trực tiếp
                </h2>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteQuestion(editing.id);
                    setEditing(null);
                    await load();
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nội dung câu hỏi
                </label>
                <textarea
                  rows={3}
                  value={editing.content}
                  onChange={async (e) => {
                    const next = { ...editing, content: e.target.value };
                    setEditing(next);
                    await saveQuestion(next);
                    await load();
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={editing.cognitiveLevel}
                  onChange={async (e) => {
                    const next = {
                      ...editing,
                      cognitiveLevel: e.target.value as CognitiveLevel,
                    };
                    setEditing(next);
                    await saveQuestion(next);
                    await load();
                  }}
                  className="rounded border border-slate-300 px-2 py-1.5 text-xs"
                >
                  {COGNITIVE_LEVELS_ALL.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <select
                  value={editing.grade || '12'}
                  onChange={async (e) => {
                    const next = {
                      ...editing,
                      grade: e.target.value as GradeLevel,
                    };
                    setEditing(next);
                    await saveQuestion(next);
                    await load();
                  }}
                  className="rounded border border-slate-300 px-2 py-1.5 text-xs"
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step={0.25}
                  value={editing.points}
                  onChange={async (e) => {
                    const next = { ...editing, points: Number(e.target.value) };
                    setEditing(next);
                    await saveQuestion(next);
                    await load();
                  }}
                  className="rounded border border-slate-300 px-2 py-1.5 text-xs tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ngữ liệu gắn kèm
                </label>
                <select
                  value={editing.passageId || ''}
                  onChange={async (e) => {
                    const next = { ...editing, passageId: e.target.value };
                    setEditing(next);
                    await saveQuestion(next);
                    await load();
                  }}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs"
                >
                  <option value="">-- Chọn ngữ liệu --</option>
                  {passages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.genre})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Yêu cầu cần đạt
                </label>
                <input
                  type="text"
                  value={editing.learningOutcome}
                  onChange={async (e) => {
                    const next = { ...editing, learningOutcome: e.target.value };
                    setEditing(next);
                    await saveQuestion(next);
                    await load();
                  }}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Đáp án dự kiến
                </label>
                <textarea
                  rows={4}
                  value={editing.answer}
                  onChange={async (e) => {
                    const next = { ...editing, answer: e.target.value };
                    setEditing(next);
                    await saveQuestion(next);
                    await load();
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-8 text-center text-xs text-slate-500">
              Chọn một câu hỏi bên trái để chỉnh sửa nhanh.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
