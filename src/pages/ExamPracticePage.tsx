import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Flag,
  Lock,
  Play,
  RotateCcw,
} from 'lucide-react';
import { db } from '../database/db';
import { listExams } from '../repositories/examRepository';
import { ExamDocument, Submission } from '../types';
import { countWords, generateId } from '../utils/formatters';

export const ExamPracticePage: React.FC = () => {
  const [exams, setExams] = useState<ExamDocument[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamDocument | null>(null);
  const [practiceMode, setPracticeMode] = useState<
    'full-120' | 'reading-only' | 'writing-only'
  >('full-120');

  const [inProgress, setInProgress] = useState(false);
  const [locked, setLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120 * 60);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [writingAnswers, setWritingAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});
  const [submittedNotice, setSubmittedNotice] = useState('');

  useEffect(() => {
    (async () => {
      const all = await listExams();
      setExams(all);
      if (all.length > 0) {
        setSelectedExam(all[0]);
        // Restore unfinished draft if stored
        const savedDraft = await db.submissions
          .where('status')
          .equals('Đang làm')
          .first();
        if (savedDraft) {
          const matching = all.find((e) => e.id === savedDraft.assignmentId);
          if (matching) setSelectedExam(matching);
          setReadingAnswers(savedDraft.readingAnswers || {});
          setWritingAnswers(savedDraft.writingAnswers || {});
        }
      }
    })();
  }, []);

  // Auto-save draft continuously to IndexedDB so offline/refresh never loses work
  useEffect(() => {
    if (!inProgress || !selectedExam || locked) return;
    const t = setTimeout(async () => {
      const draft: Submission = {
        id: `draft-${selectedExam.id}`,
        assignmentId: selectedExam.id,
        classId: 'class-12a1-sample',
        studentId: 'student-demo-12a1',
        studentName: 'Nguyễn Minh An (Học sinh mẫu)',
        status: 'Đang làm',
        readingAnswers,
        writingAnswers,
        questionScores: {},
        rubricScores: {},
        highlights: [],
        teacherComment: '',
        updatedAt: new Date().toISOString(),
      };
      await db.submissions.put(draft);
    }, 600);
    return () => clearTimeout(t);
  }, [inProgress, selectedExam, readingAnswers, writingAnswers, locked]);

  // Countdown timer
  useEffect(() => {
    if (!inProgress || locked) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [inProgress, locked]);

  const handleStart = () => {
    if (!selectedExam) return;
    const mins =
      practiceMode === 'full-120'
        ? selectedExam.adminInfo.durationMinutes
        : practiceMode === 'reading-only'
        ? 35
        : 85;
    setSecondsLeft(mins * 60);
    setLocked(false);
    setSubmittedNotice('');
    setInProgress(true);
  };

  const handleSubmit = async () => {
    if (!selectedExam) return;
    setLocked(true);
    const submission: Submission = {
      id: generateId('sub'),
      assignmentId: selectedExam.id,
      classId: 'class-12a1-sample',
      studentId: 'student-demo-12a1',
      studentName: 'Nguyễn Minh An (Học sinh mẫu)',
      status: 'Đã nộp',
      readingAnswers,
      writingAnswers,
      questionScores: {},
      rubricScores: {},
      highlights: [],
      teacherComment: '',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.submissions.put(submission);
    await db.submissions.delete(`draft-${selectedExam.id}`);
    setSubmittedNotice(
      'Đã nộp bài thành công! Bài làm đã được chuyển sang khu vực Chấm bài của giáo viên (đáp án chỉ hiển thị khi giáo viên cho phép).'
    );
  };

  if (!selectedExam) return null;

  const minsDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secsDisplay = String(secondsLeft % 60).padStart(2, '0');

  if (!inProgress) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="border-b border-[#E5E0D8] pb-4">
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Phòng luyện thi THPT trực tuyến
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Làm bài theo cấu trúc thi thử 120 phút hoặc luyện riêng Đọc hiểu / Viết; tự động lưu bài làm ngay cả khi mất kết nối
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn đề luyện tập
            </label>
            <select
              value={selectedExam.id}
              onChange={(e) => {
                const found = exams.find((x) => x.id === e.target.value);
                if (found) setSelectedExam(found);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.adminInfo.title} (Lớp {ex.adminInfo.grade} · {ex.adminInfo.durationMinutes} phút)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế độ làm bài
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                { id: 'full-120', label: `Đề tổng hợp (${selectedExam.adminInfo.durationMinutes} phút)` },
                { id: 'reading-only', label: 'Chỉ luyện Đọc hiểu (35 phút)' },
                { id: 'writing-only', label: 'Chỉ luyện Viết (85 phút)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setPracticeMode(m.id as 'full-120' | 'reading-only' | 'writing-only')
                  }
                  className={`p-3 rounded-lg border font-semibold text-left ${
                    practiceMode === m.id
                      ? 'border-[#0F2942] bg-[#0F2942] text-white'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Đáp án được ẩn hoàn toàn trong suốt thời gian làm bài.
            </span>
            <button
              type="button"
              onClick={handleStart}
              className="px-5 py-2.5 rounded-lg bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0B665D] inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Sticky Exam Timer Bar */}
      <div className="sticky top-14 z-30 bg-white border border-[#E5E0D8] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="text-xs font-bold text-[#0F2942] truncate max-w-md">
          {selectedExam.adminInfo.title}
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono tabular-nums text-sm font-bold text-[#0F2942] inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#0D7A6F]" />
            {minsDisplay}:{secsDisplay}
          </div>
          {locked ? (
            <button
              type="button"
              onClick={() => setInProgress(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Chọn đề khác
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E]"
            >
              Nộp bài
            </button>
          )}
        </div>
      </div>

      {submittedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {submittedNotice}
        </div>
      )}

      {locked && !submittedNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Lock className="w-4 h-4" /> Đã hết thời gian làm bài. Phần chỉnh sửa đã được khóa.
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1.5 rounded bg-[#0F2942] text-white font-semibold"
          >
            Xác nhận nộp bài
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Passage */}
        {practiceMode !== 'writing-only' && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3 lg:sticky lg:top-28">
            <h2 className="font-serif text-lg font-bold text-[#0F2942]">
              {selectedExam.passage.title || 'Ngữ liệu Đọc hiểu'}
            </h2>
            <div className="text-sm leading-relaxed whitespace-pre-line text-slate-800">
              {selectedExam.passage.content}
            </div>
            <div className="text-xs italic text-slate-500 text-right">
              ({selectedExam.passage.author} – {selectedExam.passage.citationSource})
            </div>
          </div>
        )}

        {/* Right: Questions & Student Inputs */}
        <div
          className={`${
            practiceMode === 'writing-only' ? 'lg:col-span-12' : 'lg:col-span-7'
          } space-y-4`}
        >
          {practiceMode !== 'writing-only' &&
            selectedExam.readingQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-[#E5E0D8] p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-[#0F2942]">
                    Phần I – Câu {idx + 1}: {q.content}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFlaggedIds((p) => ({ ...p, [q.id]: !p[q.id] }))
                    }
                    title="Đánh dấu cần xem lại"
                    className={`p-1 rounded ${
                      flaggedIds[q.id] ? 'text-amber-600 bg-amber-50' : 'text-slate-300'
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={3}
                  disabled={locked}
                  placeholder="Nhập câu trả lời của bạn..."
                  value={readingAnswers[q.id] || ''}
                  onChange={(e) =>
                    setReadingAnswers((p) => ({ ...p, [q.id]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
            ))}

          {practiceMode !== 'reading-only' &&
            selectedExam.writingPrompts.map((wp, idx) => {
              const txt = writingAnswers[wp.id] || '';
              return (
                <div
                  key={wp.id}
                  className="bg-white rounded-xl border border-[#E5E0D8] p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-[#0F2942]">
                      Phần II – Câu {idx + 1}: {wp.promptText}
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                      {countWords(txt)} / ~{wp.wordCountTarget} chữ
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    disabled={locked}
                    placeholder="Viết bài làm của bạn..."
                    value={txt}
                    onChange={(e) =>
                      setWritingAnswers((p) => ({ ...p, [wp.id]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed disabled:bg-slate-50"
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
