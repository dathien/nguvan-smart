import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, Plus, Printer, Trash2 } from 'lucide-react';
import { A4PreviewSheet } from '../components/A4PreviewSheet';
import { listExams, saveExam } from '../repositories/examRepository';
import {
  generateGradingGuideDocxBlob,
  makeExamDocxFilename,
  triggerBlobDownload,
} from '../services/wordExportService';
import { ExamDocument, RubricCriterion } from '../types';
import { formatScore, generateId, roundExact } from '../utils/formatters';

const RUBRIC_GROUPS: RubricCriterion['group'][] = [
  'Đảm bảo cấu trúc',
  'Xác định đúng vấn đề',
  'Triển khai vấn đề',
  'Lập luận và dẫn chứng',
  'Diễn đạt',
  'Chính tả và ngữ pháp',
  'Sáng tạo',
];

export const RubricGuidePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [exams, setExams] = useState<ExamDocument[]>([]);
  const [activeExam, setActiveExam] = useState<ExamDocument | null>(null);
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    (async () => {
      const all = await listExams();
      setExams(all);
      const paramId = searchParams.get('examId');
      setActiveExam(all.find((e) => e.id === paramId) || all[0] || null);
    })();
  }, [searchParams]);

  if (!activeExam) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center text-slate-600">
        Chưa có đề kiểm tra để thiết kế hướng dẫn chấm.
      </div>
    );
  }

  const persistExam = async (next: ExamDocument, msg = 'Đã lưu thay đổi hướng dẫn chấm.') => {
    setActiveExam(next);
    await saveExam(next);
    setSavedNote(msg);
  };

  const addPartialStep = (qId: string) => {
    const next: ExamDocument = {
      ...activeExam,
      readingQuestions: activeExam.readingQuestions.map((q) =>
        q.id === qId
          ? {
              ...q,
              partialCreditSteps: [
                ...q.partialCreditSteps,
                { id: generateId('step'), description: 'Ý thành phần mới', points: 0.25 },
              ],
            }
          : q
      ),
    };
    persistExam(next);
  };

  const addRubricCriterion = (wId: string) => {
    const next: ExamDocument = {
      ...activeExam,
      writingPrompts: activeExam.writingPrompts.map((w) =>
        w.id === wId
          ? {
              ...w,
              rubric: [
                ...w.rubric,
                {
                  id: generateId('rub'),
                  group: 'Triển khai vấn đề',
                  title: 'Tiêu chí đánh giá mới',
                  description: 'Mô tả biểu hiện đạt yêu cầu.',
                  points: 0.25,
                },
              ],
            }
          : w
      ),
    };
    persistExam(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Hướng dẫn chấm và Trình tạo Rubric
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Chiết điểm từng ý phần Đọc hiểu, phương án diễn đạt tương đương và biểu điểm chi tiết phần Viết
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeExam.id}
            onChange={(e) => {
              const found = exams.find((x) => x.id === e.target.value);
              if (found) setActiveExam(found);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm max-w-xs"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.adminInfo.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={async () => {
              const blob = await generateGradingGuideDocxBlob(activeExam);
              triggerBlobDownload(blob, makeExamDocxFilename(activeExam, 'Huong_dan_cham'));
            }}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0F2942] hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Xuất DOCX
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> In / Lưu PDF
          </button>
        </div>
      </div>

      {savedNote && (
        <div className="no-print bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {savedNote}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Editor */}
        <div className="no-print xl:col-span-6 space-y-5">
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4">
            <h2 className="text-base font-bold text-[#0F2942]">
              Phần I. Đọc hiểu (Đáp án, ý thành phần & cách diễn đạt tương đương)
            </h2>
            {activeExam.readingQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-lg border border-slate-200 bg-[#FAF8F5]/60 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#0F2942]">
                  <span>
                    Câu {idx + 1} ({formatScore(q.points)} điểm)
                  </span>
                  <span className="text-[#0D7A6F]">{q.cognitiveLevel}</span>
                </div>
                <p className="text-xs text-slate-700">{q.content}</p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Ý trả lời chính / Đáp án chuẩn
                  </label>
                  <textarea
                    rows={3}
                    value={q.answer}
                    onChange={(e) => {
                      const next: ExamDocument = {
                        ...activeExam,
                        readingQuestions: activeExam.readingQuestions.map((x) =>
                          x.id === q.id ? { ...x, answer: e.target.value } : x
                        ),
                      };
                      persistExam(next);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Các ý thành phần & hướng dẫn cho điểm một phần
                    </span>
                    <button
                      type="button"
                      onClick={() => addPartialStep(q.id)}
                      className="text-[11px] font-semibold text-[#0D7A6F] inline-flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Thêm ý
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {q.partialCreditSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => {
                            const next: ExamDocument = {
                              ...activeExam,
                              readingQuestions: activeExam.readingQuestions.map((x) =>
                                x.id === q.id
                                  ? {
                                      ...x,
                                      partialCreditSteps: x.partialCreditSteps.map((s) =>
                                        s.id === step.id
                                          ? { ...s, description: e.target.value }
                                          : s
                                      ),
                                    }
                                  : x
                              ),
                            };
                            persistExam(next);
                          }}
                          className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs"
                        />
                        <input
                          type="number"
                          step={0.25}
                          min={0}
                          value={step.points}
                          onChange={(e) => {
                            const next: ExamDocument = {
                              ...activeExam,
                              readingQuestions: activeExam.readingQuestions.map((x) =>
                                x.id === q.id
                                  ? {
                                      ...x,
                                      partialCreditSteps: x.partialCreditSteps.map((s) =>
                                        s.id === step.id
                                          ? { ...s, points: Number(e.target.value) }
                                          : s
                                      ),
                                    }
                                  : x
                              ),
                            };
                            persistExam(next);
                          }}
                          className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs tabular-nums text-center"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next: ExamDocument = {
                              ...activeExam,
                              readingQuestions: activeExam.readingQuestions.map((x) =>
                                x.id === q.id
                                  ? {
                                      ...x,
                                      partialCreditSteps: x.partialCreditSteps.filter(
                                        (s) => s.id !== step.id
                                      ),
                                    }
                                  : x
                              ),
                            };
                            persistExam(next);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Cách diễn đạt tương đương
                    </label>
                    <input
                      type="text"
                      value={q.equivalentAnswers}
                      onChange={(e) => {
                        const next: ExamDocument = {
                          ...activeExam,
                          readingQuestions: activeExam.readingQuestions.map((x) =>
                            x.id === q.id
                              ? { ...x, equivalentAnswers: e.target.value }
                              : x
                          ),
                        };
                        persistExam(next);
                      }}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Trường hợp không đạt yêu cầu
                    </label>
                    <input
                      type="text"
                      value={q.nonQualifyingNotes}
                      onChange={(e) => {
                        const next: ExamDocument = {
                          ...activeExam,
                          readingQuestions: activeExam.readingQuestions.map((x) =>
                            x.id === q.id
                              ? { ...x, nonQualifyingNotes: e.target.value }
                              : x
                          ),
                        };
                        persistExam(next);
                      }}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4">
            <h2 className="text-base font-bold text-[#0F2942]">
              Phần II. Viết (Trình tạo Rubric và Barem chấm điểm)
            </h2>
            {activeExam.writingPrompts.map((wp, idx) => {
              const sum = roundExact(
                wp.rubric.reduce((s, r) => s + (Number(r.points) || 0), 0)
              );
              const matched = sum === roundExact(wp.points);
              return (
                <div
                  key={wp.id}
                  className="p-4 rounded-lg border border-slate-200 bg-[#FAF8F5]/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#0F2942]">
                      Câu {idx + 1}: {wp.category} ({wp.formatType} ~{wp.wordCountTarget} chữ)
                    </div>
                    <div
                      className={`text-xs font-semibold tabular-nums ${
                        matched ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      Tổng rubric: {formatScore(sum)} / {formatScore(wp.points)} điểm
                    </div>
                  </div>

                  <div className="space-y-2">
                    {wp.rubric.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded border border-slate-200 bg-white space-y-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={r.group}
                            onChange={(e) => {
                              const next: ExamDocument = {
                                ...activeExam,
                                writingPrompts: activeExam.writingPrompts.map((w) =>
                                  w.id === wp.id
                                    ? {
                                        ...w,
                                        rubric: w.rubric.map((item) =>
                                          item.id === r.id
                                            ? {
                                                ...item,
                                                group: e.target
                                                  .value as RubricCriterion['group'],
                                              }
                                            : item
                                        ),
                                      }
                                    : w
                                ),
                              };
                              persistExam(next);
                            }}
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium"
                          >
                            {RUBRIC_GROUPS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={r.title}
                            onChange={(e) => {
                              const next: ExamDocument = {
                                ...activeExam,
                                writingPrompts: activeExam.writingPrompts.map((w) =>
                                  w.id === wp.id
                                    ? {
                                        ...w,
                                        rubric: w.rubric.map((item) =>
                                          item.id === r.id
                                            ? { ...item, title: e.target.value }
                                            : item
                                        ),
                                      }
                                    : w
                                ),
                              };
                              persistExam(next);
                            }}
                            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                          <input
                            type="number"
                            step={0.25}
                            min={0}
                            value={r.points}
                            onChange={(e) => {
                              const next: ExamDocument = {
                                ...activeExam,
                                writingPrompts: activeExam.writingPrompts.map((w) =>
                                  w.id === wp.id
                                    ? {
                                        ...w,
                                        rubric: w.rubric.map((item) =>
                                          item.id === r.id
                                            ? { ...item, points: Number(e.target.value) }
                                            : item
                                        ),
                                      }
                                    : w
                                ),
                              };
                              persistExam(next);
                            }}
                            className="w-16 rounded border border-slate-300 px-2 py-1 text-xs text-center tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next: ExamDocument = {
                                ...activeExam,
                                writingPrompts: activeExam.writingPrompts.map((w) =>
                                  w.id === wp.id
                                    ? {
                                        ...w,
                                        rubric: w.rubric.filter((item) => item.id !== r.id),
                                      }
                                    : w
                                ),
                              };
                              persistExam(next);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={r.description}
                          onChange={(e) => {
                            const next: ExamDocument = {
                              ...activeExam,
                              writingPrompts: activeExam.writingPrompts.map((w) =>
                                w.id === wp.id
                                  ? {
                                      ...w,
                                      rubric: w.rubric.map((item) =>
                                        item.id === r.id
                                          ? { ...item, description: e.target.value }
                                          : item
                                      ),
                                    }
                                  : w
                              ),
                            };
                            persistExam(next);
                          }}
                          className="w-full rounded border border-slate-200 px-2.5 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addRubricCriterion(wp.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D7A6F] hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí rubric
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Live A4 Preview */}
        <div className="xl:col-span-6">
          <A4PreviewSheet exam={activeExam} mode="grading" />
        </div>
      </div>
    </div>
  );
};
