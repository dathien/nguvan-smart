import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Award,
  CheckCircle2,
  Download,
  Highlighter,
  Printer,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { db, ensureDatabaseSeeded } from '../database/db';
import { callLiteratureAI } from '../services/aiService';
import {
  Assignment,
  ExamDocument,
  Submission,
  SubmissionHighlight,
} from '../types';
import {
  formatDateTimeVN,
  formatScore,
  generateId,
  roundExact,
} from '../utils/formatters';

export const GradingPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<ExamDocument[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('Tất cả');

  // Inline highlight & comment state
  const [highlightExcerpt, setHighlightExcerpt] = useState('');
  const [highlightComment, setHighlightComment] = useState('');
  const [manualOverride, setManualOverride] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  const loadData = async () => {
    await ensureDatabaseSeeded();
    const [subs, asgs, exms] = await Promise.all([
      db.submissions.toArray(),
      db.assignments.toArray(),
      db.exams.toArray(),
    ]);
    subs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setSubmissions(subs);
    setAssignments(asgs);
    setExams(exms);
    if (!selectedSubId && subs.length > 0) {
      const firstSubmitted =
        subs.find((s) => s.status !== 'Chưa bắt đầu') || subs[0];
      setSelectedSubId(firstSubmitted.id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubs = submissions.filter((s) =>
    filterStatus === 'Tất cả' ? true : s.status === filterStatus
  );

  const selectedSub =
    submissions.find((s) => s.id === selectedSubId) || null;

  const matchedAssignment = selectedSub
    ? assignments.find((a) => a.id === selectedSub.assignmentId) || null
    : null;

  const matchedExam =
    (matchedAssignment &&
      exams.find((e) => e.id === matchedAssignment.targetId)) ||
    exams.find((e) => e.id === selectedSub?.assignmentId) ||
    exams[0] ||
    null;

  const updateSelectedSub = async (patch: Partial<Submission>) => {
    if (!selectedSub) return;
    const next: Submission = {
      ...selectedSub,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await db.submissions.put(next);
    setSubmissions((prev) => prev.map((s) => (s.id === next.id ? next : s)));
  };

  const computeRubricSum = (sub: Submission) => {
    const qSum = Object.values(sub.questionScores || {}).reduce(
      (sum, v) => sum + (Number(v) || 0),
      0
    );
    const rSum = Object.values(sub.rubricScores || {}).reduce(
      (sum, v) => sum + (Number(v) || 0),
      0
    );
    return roundExact(qSum + rSum);
  };

  const handleQuestionScoreChange = async (qId: string, maxPts: number, raw: string) => {
    if (!selectedSub) return;
    const val = Math.max(0, Math.min(maxPts, Number(raw) || 0));
    const nextScores = { ...selectedSub.questionScores, [qId]: val };
    const nextSub: Submission = {
      ...selectedSub,
      status: selectedSub.status === 'Chưa bắt đầu' ? 'Đang chấm' : selectedSub.status,
      questionScores: nextScores,
    };
    const total = computeRubricSum(nextSub);
    await updateSelectedSub({
      status: nextSub.status,
      questionScores: nextScores,
      totalScore: total,
    });
  };

  const handleRubricScoreChange = async (rId: string, maxPts: number, raw: string) => {
    if (!selectedSub) return;
    const val = Math.max(0, Math.min(maxPts, Number(raw) || 0));
    const nextRubric = { ...selectedSub.rubricScores, [rId]: val };
    const nextSub: Submission = {
      ...selectedSub,
      status: selectedSub.status === 'Chưa bắt đầu' ? 'Đang chấm' : selectedSub.status,
      rubricScores: nextRubric,
    };
    const total = computeRubricSum(nextSub);
    await updateSelectedSub({
      status: nextSub.status,
      rubricScores: nextRubric,
      totalScore: total,
    });
  };

  const handleCaptureSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel) {
      setHighlightExcerpt(sel);
    }
  };

  const handleAddHighlight = async () => {
    if (!selectedSub || !highlightExcerpt.trim() || !highlightComment.trim()) return;
    const item: SubmissionHighlight = {
      id: generateId('hl'),
      excerpt: highlightExcerpt.trim(),
      comment: highlightComment.trim(),
    };
    await updateSelectedSub({
      highlights: [...(selectedSub.highlights || []), item],
    });
    setHighlightExcerpt('');
    setHighlightComment('');
  };

  const handleRemoveHighlight = async (hlId: string) => {
    if (!selectedSub) return;
    await updateSelectedSub({
      highlights: (selectedSub.highlights || []).filter((h) => h.id !== hlId),
    });
  };

  const handleApproveAndReturn = async () => {
    if (!selectedSub) return;
    const parsedOverride =
      manualOverride.trim() !== '' ? Number(manualOverride) : undefined;
    const finalTotal =
      typeof parsedOverride === 'number' && !Number.isNaN(parsedOverride)
        ? roundExact(parsedOverride)
        : typeof selectedSub.totalScore === 'number'
        ? roundExact(selectedSub.totalScore)
        : computeRubricSum(selectedSub);

    await updateSelectedSub({
      totalScore: finalTotal,
      status: 'Đã chấm',
      gradedAt: new Date().toISOString(),
    });
    setManualOverride('');
    setStatusNote(
      `Đã duyệt và trả điểm (${formatScore(finalTotal)} điểm) cho học sinh ${selectedSub.studentName}.`
    );
  };

  const handleRequestAISuggestion = async () => {
    if (!selectedSub) return;
    setAiLoading(true);
    const readingText = Object.entries(selectedSub.readingAnswers || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    const writingText = Object.entries(selectedSub.writingAnswers || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    const res = await callLiteratureAI({
      task: 'Gợi ý nhận xét bài làm Ngữ văn THPT (chỉ để giáo viên tham khảo)',
      prompt:
        'Hãy nhận xét ngắn gọn ưu điểm, hạn chế về lập luận, dẫn chứng và diễn đạt của bài làm dưới đây, đồng thời đề xuất hướng cải thiện cho học sinh.',
      context: `Học sinh: ${selectedSub.studentName}\nPhần Đọc hiểu:\n${readingText || '(trống)'}\n\nPhần Viết:\n${writingText || '(trống)'}`,
    });

    if (res.available && res.text) {
      await updateSelectedSub({ aiSuggestedFeedback: res.text });
      setStatusNote(
        'Đã tạo gợi ý nhận xét tham khảo từ AI. Giáo viên toàn quyền chỉnh sửa và quyết định điểm số cuối cùng.'
      );
    } else {
      setStatusNote(
        res.message ||
          'Trợ lý AI hiện không khả dụng. Giáo viên vẫn chấm điểm và nhận xét thủ công bình thường.'
      );
    }
    setAiLoading(false);
  };

  const handleExportExcelGrades = () => {
    const rows = submissions.map((s, idx) => ({
      STT: idx + 1,
      'Học sinh': s.studentName,
      'Trạng thái': s.status,
      'Điểm tổng': typeof s.totalScore === 'number' ? s.totalScore : '',
      'Nhận xét giáo viên': s.teacherComment || '',
      'Thời điểm chấm': s.gradedAt ? formatDateTimeVN(s.gradedAt) : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bang diem');
    XLSX.writeFile(wb, 'ket_qua_cham_bai_ngu_van.xlsx');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Chấm bài và nhận xét
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Chấm bài hai cột: đối chiếu bài làm học sinh bên trái với đáp án, barem và rubric bên phải.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcelGrades}
            disabled={submissions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0F2942] hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Xuất bảng điểm Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E]"
          >
            <Printer className="w-4 h-4" />
            In phiếu nhận xét A4
          </button>
        </div>
      </div>

      {statusNote && (
        <div className="no-print bg-[#0D7A6F]/10 border border-[#0D7A6F]/30 text-[#0F2942] rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span>{statusNote}</span>
          <button
            type="button"
            onClick={() => setStatusNote('')}
            className="text-xs font-semibold text-[#0D7A6F] hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Submission Selector Strip */}
      <div className="no-print bg-white rounded-xl border border-[#E5E0D8] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
          >
            <option value="Tất cả">Tất cả bài ({submissions.length})</option>
            <option value="Đã nộp">Đã nộp</option>
            <option value="Nộp muộn">Nộp muộn</option>
            <option value="Đang chấm">Đang chấm</option>
            <option value="Đã chấm">Đã chấm</option>
            <option value="Đang làm">Đang làm (bản nháp)</option>
          </select>

          <select
            value={selectedSubId}
            onChange={(e) => {
              setSelectedSubId(e.target.value);
              setManualOverride('');
            }}
            className="flex-1 min-w-[240px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
          >
            {filteredSubs.length === 0 ? (
              <option value="">Chưa có bài nộp phù hợp</option>
            ) : (
              filteredSubs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentName} · {s.status}
                  {typeof s.totalScore === 'number'
                    ? ` · ${formatScore(s.totalScore)}đ`
                    : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {selectedSub && (
          <div className="text-xs text-slate-600">
            Trạng thái:{' '}
            <span className="font-semibold text-[#0F2942]">
              {selectedSub.status}
            </span>{' '}
            · Điểm hiện tại:{' '}
            <span className="font-mono tabular-nums font-bold text-[#0D7A6F]">
              {typeof selectedSub.totalScore === 'number'
                ? formatScore(selectedSub.totalScore)
                : '0'}
            </span>
          </div>
        )}
      </div>

      {selectedSub ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Student Submission + Highlight Annotation */}
          <div className="lg:col-span-6 space-y-4">
            <div
              onMouseUp={handleCaptureSelection}
              className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-5"
            >
              <div className="border-b border-[#E5E0D8] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#0F2942]">
                    Bài làm của {selectedSub.studentName}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedSub.submittedAt
                      ? `Nộp lúc ${formatDateTimeVN(selectedSub.submittedAt)}`
                      : 'Chưa nộp chính thức'}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#0D7A6F]">
                  Bôi đen đoạn văn để trích chú thích
                </span>
              </div>

              {/* Reading Answers */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Phần I. Trả lời Đọc hiểu
                </h3>
                {matchedExam ? (
                  matchedExam.readingQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5"
                    >
                      <div className="text-xs font-semibold text-[#0F2942]">
                        Câu {idx + 1} ({formatScore(q.points)}đ): {q.content}
                      </div>
                      <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {selectedSub.readingAnswers?.[q.id] || (
                          <span className="italic text-slate-400">
                            Học sinh bỏ trống câu này.
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  Object.entries(selectedSub.readingAnswers || {}).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                      <div className="text-xs font-semibold text-[#0F2942]">{k}</div>
                      <div className="text-sm whitespace-pre-wrap mt-1">{v}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Writing Answers */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Phần II. Bài làm Viết
                </h3>
                {matchedExam ? (
                  matchedExam.writingPrompts.map((wp, idx) => (
                    <div
                      key={wp.id}
                      className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2"
                    >
                      <div className="text-xs font-semibold text-[#0F2942]">
                        Câu {idx + 1} ({wp.category} – {formatScore(wp.points)}đ)
                      </div>
                      <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {selectedSub.writingAnswers?.[wp.id] || (
                          <span className="italic text-slate-400">
                            Học sinh chưa có bài viết.
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  Object.entries(selectedSub.writingAnswers || {}).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                      <div className="text-xs font-semibold text-[#0F2942]">{k}</div>
                      <div className="text-sm whitespace-pre-wrap mt-1">{v}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Inline Highlight & Excerpt Comments */}
              <div className="no-print pt-3 border-t border-[#E5E0D8] space-y-3">
                <div className="text-xs font-bold text-[#0F2942] inline-flex items-center gap-1.5">
                  <Highlighter className="w-4 h-4 text-[#0D7A6F]" />
                  Đánh dấu đoạn bài làm & nhận xét chi tiết
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={highlightExcerpt}
                    onChange={(e) => setHighlightExcerpt(e.target.value)}
                    placeholder="Trích đoạn trong bài học sinh (hoặc bôi đen ở trên)..."
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={highlightComment}
                      onChange={(e) => setHighlightComment(e.target.value)}
                      placeholder="Nhận xét về cách diễn đạt / lập luận tại đoạn này..."
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E]"
                    >
                      Gắn nhận xét
                    </button>
                  </div>
                </div>

                {(selectedSub.highlights || []).length > 0 && (
                  <div className="space-y-2">
                    {selectedSub.highlights.map((hl) => (
                      <div
                        key={hl.id}
                        className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="italic text-slate-700">“{hl.excerpt}”</div>
                          <div className="font-medium text-[#0F2942] mt-0.5">
                            → {hl.comment}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(hl.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Answer Key, Rubric Scoring & Approval */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                <h2 className="font-serif text-lg font-bold text-[#0F2942]">
                  Hướng dẫn chấm & Bảng điểm Rubric
                </h2>
                <div className="text-base font-bold font-mono tabular-nums text-[#0D7A6F]">
                  Tổng:{' '}
                  {formatScore(
                    typeof selectedSub.totalScore === 'number'
                      ? selectedSub.totalScore
                      : computeRubricSum(selectedSub)
                  )}{' '}
                  đ
                </div>
              </div>

              {/* Reading Questions Scoring */}
              {matchedExam && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Chấm từng câu Đọc hiểu
                  </h3>
                  {matchedExam.readingQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-lg border border-[#E5E0D8] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-[#0F2942]">
                          Câu {idx + 1} (Tối đa {formatScore(q.points)}đ)
                        </span>
                        <input
                          type="number"
                          step="0.25"
                          min={0}
                          max={q.points}
                          value={selectedSub.questionScores?.[q.id] ?? ''}
                          onChange={(e) =>
                            handleQuestionScoreChange(q.id, q.points, e.target.value)
                          }
                          placeholder="0.0"
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm font-mono tabular-nums"
                        />
                      </div>
                      <div className="text-xs text-slate-600 whitespace-pre-wrap bg-[#FAF8F5] p-2 rounded">
                        <strong>Đáp án gợi ý:</strong> {q.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Writing Rubric Scoring */}
              {matchedExam && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Chấm tiêu chí Rubric phần Viết
                  </h3>
                  {matchedExam.writingPrompts.map((wp, idx) => (
                    <div
                      key={wp.id}
                      className="p-3 rounded-lg border border-[#E5E0D8] space-y-2"
                    >
                      <div className="text-xs font-bold text-[#0F2942]">
                        Phần Viết – Câu {idx + 1}: {wp.category} ({formatScore(wp.points)}đ)
                      </div>
                      <div className="space-y-1.5">
                        {wp.rubric.map((rc) => (
                          <div
                            key={rc.id}
                            className="flex items-center justify-between gap-3 py-1 border-b border-slate-100 last:border-0"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-[#0F2942]">
                                {rc.group}: {rc.title}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {rc.description} (Tối đa {formatScore(rc.points)}đ)
                              </div>
                            </div>
                            <input
                              type="number"
                              step="0.25"
                              min={0}
                              max={rc.points}
                              value={selectedSub.rubricScores?.[rc.id] ?? ''}
                              onChange={(e) =>
                                handleRubricScoreChange(rc.id, rc.points, e.target.value)
                              }
                              placeholder="0.0"
                              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm font-mono tabular-nums shrink-0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Teacher Comment & Optional AI Suggestion */}
              <div className="space-y-3 pt-2 border-t border-[#E5E0D8]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F2942]">
                    Nhận xét chung của giáo viên
                  </label>
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleRequestAISuggestion}
                    className="no-print inline-flex items-center gap-1 text-xs font-semibold text-[#0D7A6F] hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiLoading ? 'Đang tạo gợi ý...' : 'Gợi ý nhận xét AI (tham khảo)'}
                  </button>
                </div>

                {selectedSub.aiSuggestedFeedback && (
                  <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-slate-700 space-y-1.5">
                    <div className="font-semibold text-[#0D7A6F]">
                      Gợi ý tham khảo từ AI (giáo viên tự quyết định):
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {selectedSub.aiSuggestedFeedback}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedSub({
                          teacherComment: selectedSub.aiSuggestedFeedback || '',
                        })
                      }
                      className="text-xs font-semibold text-[#0F2942] hover:underline"
                    >
                      Chép sang ô nhận xét của giáo viên để chỉnh sửa
                    </button>
                  </div>
                )}

                <textarea
                  rows={4}
                  value={selectedSub.teacherComment}
                  onChange={(e) =>
                    updateSelectedSub({ teacherComment: e.target.value })
                  }
                  placeholder="Nhập nhận xét chi tiết về ưu điểm, điểm cần khắc phục và lời khuyên rèn luyện cho học sinh..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F2942] focus:outline-none"
                />

                <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">
                      Điều chỉnh tổng điểm trực tiếp:
                    </span>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      max={10}
                      value={manualOverride}
                      onChange={(e) => setManualOverride(e.target.value)}
                      placeholder={formatScore(
                        typeof selectedSub.totalScore === 'number'
                          ? selectedSub.totalScore
                          : computeRubricSum(selectedSub)
                      )}
                      className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApproveAndReturn}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0B665D]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Duyệt & Trả bài cho học sinh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-12 text-center text-sm text-slate-500">
          <Award className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          Chưa có bài làm nào trong hệ thống. Học sinh có thể làm bài tại mục Luyện thi THPT hoặc giáo viên giao bài ở mục Giao bài và kiểm tra.
        </div>
      )}
    </div>
  );
};
