import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { A4PreviewSheet } from '../components/A4PreviewSheet';
import { listExams, saveExam } from '../repositories/examRepository';
import { buildSynchronizedExamData } from '../services/examSyncService';
import {
  generateMatrixDocxBlob,
  generateSpecificationDocxBlob,
  makeExamDocxFilename,
  triggerBlobDownload,
} from '../services/wordExportService';
import { CognitiveLevel, ExamDocument } from '../types';
import { formatScore, roundExact } from '../utils/formatters';

export const MatrixSpecPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamDocument[]>([]);
  const [activeExam, setActiveExam] = useState<ExamDocument | null>(null);
  const [workflowMode, setWorkflowMode] = useState<'workflow1' | 'workflow2'>('workflow1');
  const [viewTab, setViewTab] = useState<'matrix' | 'spec' | 'preview'>('matrix');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    (async () => {
      const all = await listExams();
      setExams(all);
      const paramId = searchParams.get('examId');
      const found = all.find((e) => e.id === paramId) || all[0] || null;
      setActiveExam(found);
    })();
  }, [searchParams]);

  if (!activeExam) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <p className="text-slate-600">Chưa có đề kiểm tra để lập ma trận.</p>
        <button
          type="button"
          onClick={() => navigate('/soan-de')}
          className="mt-4 px-4 py-2 rounded-lg bg-[#0F2942] text-white text-sm font-semibold"
        >
          Tạo đề kiểm tra mới
        </button>
      </div>
    );
  }

  const sync = buildSynchronizedExamData(activeExam);

  const handleUpdateQuestionField = async (
    qId: string,
    field: 'cognitiveLevel' | 'points' | 'learningOutcome',
    value: string | number
  ) => {
    const next: ExamDocument = {
      ...activeExam,
      readingQuestions: activeExam.readingQuestions.map((q) =>
        q.id === qId ? { ...q, [field]: value } : q
      ),
    };
    setActiveExam(next);
    await saveExam(next);
    setStatusMessage('Đã đồng bộ câu hỏi, ma trận và bản đặc tả.');
  };

  const handleUpdateWritingField = async (
    wId: string,
    field: 'cognitiveLevel' | 'points' | 'learningOutcome',
    value: string | number
  ) => {
    const next: ExamDocument = {
      ...activeExam,
      writingPrompts: activeExam.writingPrompts.map((w) =>
        w.id === wId ? { ...w, [field]: value } : w
      ),
    };
    setActiveExam(next);
    await saveExam(next);
    setStatusMessage('Đã đồng bộ phần Viết, ma trận và bản đặc tả.');
  };

  const toggleHighApplication = async () => {
    const next: ExamDocument = {
      ...activeExam,
      includeHighApplication: !activeExam.includeHighApplication,
    };
    setActiveExam(next);
    await saveExam(next);
  };

  const toggleManualOverride = async () => {
    const enabled = !activeExam.matrixOverride?.enabled;
    const next: ExamDocument = {
      ...activeExam,
      matrixOverride: {
        enabled,
        rows: enabled
          ? JSON.parse(JSON.stringify(sync.matrixRows))
          : activeExam.matrixOverride?.rows || [],
      },
    };
    setActiveExam(next);
    await saveExam(next);
  };

  const handleManualCellChange = async (
    rowId: string,
    lvl: CognitiveLevel,
    kind: 'counts' | 'points',
    val: number
  ) => {
    if (!activeExam.matrixOverride?.enabled) return;
    const nextRows = activeExam.matrixOverride.rows.map((r) => {
      if (r.id !== rowId) return r;
      const updatedCounts = { ...r.counts };
      const updatedPoints = { ...r.points };
      if (kind === 'counts') updatedCounts[lvl] = Math.max(0, Math.round(val));
      else updatedPoints[lvl] = Math.max(0, roundExact(val));

      const totalQuestions = sync.levelsUsed.reduce(
        (s, l) => s + updatedCounts[l],
        0
      );
      const totalPoints = roundExact(
        sync.levelsUsed.reduce((s, l) => s + updatedPoints[l], 0)
      );
      const percentage =
        sync.targetTotal > 0 ? roundExact((totalPoints / sync.targetTotal) * 100) : 0;

      return {
        ...r,
        counts: updatedCounts,
        points: updatedPoints,
        totalQuestions,
        totalPoints,
        percentage,
      };
    });

    const next: ExamDocument = {
      ...activeExam,
      matrixOverride: { enabled: true, rows: nextRows },
    };
    setActiveExam(next);
    await saveExam(next);
  };

  const resetSyncToExam = async () => {
    const next: ExamDocument = {
      ...activeExam,
      matrixOverride: { enabled: false, rows: [] },
    };
    setActiveExam(next);
    await saveExam(next);
    setStatusMessage('Đã đồng bộ lại ma trận trực tiếp từ đề kiểm tra.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header & Controls */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Ma trận và Bản đặc tả đề kiểm tra
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Đồng bộ một nguồn dữ liệu duy nhất với đề thi và hướng dẫn chấm · Không tự làm tròn sai lệch tổng điểm
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
                {ex.adminInfo.title} (Lớp {ex.adminInfo.grade})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={async () => {
              const blob = await generateMatrixDocxBlob(activeExam);
              triggerBlobDownload(blob, makeExamDocxFilename(activeExam, 'Ma_tran'));
            }}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0F2942] hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Ma trận DOCX
          </button>

          <button
            type="button"
            onClick={async () => {
              const blob = await generateSpecificationDocxBlob(activeExam);
              triggerBlobDownload(blob, makeExamDocxFilename(activeExam, 'Ban_dac_ta'));
            }}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0F2942] hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Đặc tả DOCX
          </button>

          <button
            type="button"
            onClick={() => {
              setViewTab('preview');
              setTimeout(() => window.print(), 150);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> In / Lưu PDF
          </button>
        </div>
      </div>

      {/* Workflow Selector & Options */}
      <div className="no-print bg-white rounded-xl border border-[#E5E0D8] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWorkflowMode('workflow1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              workflowMode === 'workflow1'
                ? 'bg-[#0F2942] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Quy trình 1: Ma trận → Đặc tả → Đề → Hướng dẫn chấm
          </button>
          <button
            type="button"
            onClick={() => setWorkflowMode('workflow2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              workflowMode === 'workflow2'
                ? 'bg-[#0F2942] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Quy trình 2: Từ đề có sẵn → Trích xuất → Ma trận & Đặc tả
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeExam.includeHighApplication}
              onChange={toggleHighApplication}
              className="rounded border-slate-300"
            />
            <span>Bổ sung mức Vận dụng cao</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(activeExam.matrixOverride?.enabled)}
              onChange={toggleManualOverride}
              className="rounded border-slate-300"
            />
            <span>Chế độ bảng ma trận tùy chỉnh</span>
          </label>
          {activeExam.matrixOverride?.enabled && (
            <button
              type="button"
              onClick={resetSyncToExam}
              className="inline-flex items-center gap-1 text-[#0D7A6F] font-semibold hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Khớp lại theo đề
            </button>
          )}
        </div>
      </div>

      {/* Conflict Alert */}
      {sync.conflicts.length > 0 && (
        <div className="no-print bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Phát hiện mâu thuẫn giữa Ma trận tùy chỉnh và Đề kiểm tra hiện tại
          </div>
          <ul className="list-disc pl-6 mt-1.5 space-y-1 text-xs">
            {sync.conflicts.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {statusMessage && (
        <div className="no-print bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="no-print flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setViewTab('matrix')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold ${
            viewTab === 'matrix'
              ? 'bg-white text-[#0F2942] shadow-sm'
              : 'text-slate-600'
          }`}
        >
          Bảng Ma trận tương tác
        </button>
        <button
          type="button"
          onClick={() => setViewTab('spec')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold ${
            viewTab === 'spec'
              ? 'bg-white text-[#0F2942] shadow-sm'
              : 'text-slate-600'
          }`}
        >
          Bản đặc tả chi tiết
        </button>
        <button
          type="button"
          onClick={() => setViewTab('preview')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold ${
            viewTab === 'preview'
              ? 'bg-white text-[#0F2942] shadow-sm'
              : 'text-slate-600'
          }`}
        >
          Xem trước khổ A4
        </button>
      </div>

      {viewTab === 'matrix' && (
        <div className="space-y-5">
          {/* Interactive Matrix Summary Table */}
          <div className="bg-white rounded-xl border border-[#E5E0D8] overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#0F2942] text-white">
                  <th className="p-3 text-center">STT</th>
                  <th className="p-3 text-left">Kỹ năng</th>
                  <th className="p-3 text-left">Nội dung / Đơn vị kiến thức</th>
                  {sync.levelsUsed.map((lvl) => (
                    <th key={lvl} className="p-3 text-center">
                      {lvl}
                      <div className="font-normal text-[11px] opacity-80">
                        Số câu / Điểm
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-center">Tổng câu</th>
                  <th className="p-3 text-center">Tổng điểm</th>
                  <th className="p-3 text-center">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(activeExam.matrixOverride?.enabled
                  ? activeExam.matrixOverride.rows
                  : sync.matrixRows
                ).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center tabular-nums">{row.stt}</td>
                    <td className="p-3 font-semibold text-[#0F2942]">{row.skill}</td>
                    <td className="p-3">{row.contentUnit}</td>
                    {sync.levelsUsed.map((lvl) => (
                      <td key={lvl} className="p-3 text-center tabular-nums">
                        {activeExam.matrixOverride?.enabled ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={row.counts[lvl]}
                              onChange={(e) =>
                                handleManualCellChange(
                                  row.id,
                                  lvl,
                                  'counts',
                                  Number(e.target.value)
                                )
                              }
                              className="w-12 px-1.5 py-1 border border-slate-300 rounded text-center"
                            />
                            <span>/</span>
                            <input
                              type="number"
                              min={0}
                              step={0.25}
                              value={row.points[lvl]}
                              onChange={(e) =>
                                handleManualCellChange(
                                  row.id,
                                  lvl,
                                  'points',
                                  Number(e.target.value)
                                )
                              }
                              className="w-14 px-1.5 py-1 border border-slate-300 rounded text-center"
                            />
                          </div>
                        ) : (
                          <span>
                            {row.counts[lvl]} câu / {formatScore(row.points[lvl])}đ
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="p-3 text-center font-semibold tabular-nums">
                      {row.totalQuestions}
                    </td>
                    <td className="p-3 text-center font-bold text-[#0D7A6F] tabular-nums">
                      {formatScore(row.totalPoints)}
                    </td>
                    <td className="p-3 text-center tabular-nums">
                      {formatScore(row.percentage)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold text-[#0F2942]">
                  <td colSpan={3} className="p-3 text-right">
                    TỔNG CỘNG TOÀN ĐỀ
                  </td>
                  {sync.levelsUsed.map((lvl) => (
                    <td key={lvl} className="p-3 text-center tabular-nums">
                      {sync.levelTotals[lvl].count} câu /{' '}
                      {formatScore(sync.levelTotals[lvl].points)}đ (
                      {formatScore(sync.levelTotals[lvl].percent)}%)
                    </td>
                  ))}
                  <td className="p-3 text-center tabular-nums">
                    {activeExam.readingQuestions.length +
                      activeExam.writingPrompts.length}
                  </td>
                  <td className="p-3 text-center tabular-nums">
                    {formatScore(sync.computedTotal)} / {formatScore(sync.targetTotal)}
                  </td>
                  <td className="p-3 text-center tabular-nums">
                    {sync.targetTotal > 0
                      ? formatScore((sync.computedTotal / sync.targetTotal) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Direct Question-Level Synchronizer */}
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#0F2942] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#0D7A6F]" />
                {workflowMode === 'workflow1'
                  ? 'Điều chỉnh trực tiếp mức độ và điểm số từng câu (tự động cập nhật đề thi)'
                  : 'Câu hỏi trích xuất từ đề thi (kiểm duyệt mức độ và yêu cầu cần đạt)'}
              </h2>
              <button
                type="button"
                onClick={() => navigate(`/soan-de?examId=${activeExam.id}`)}
                className="text-xs font-semibold text-[#0F2942] hover:underline"
              >
                Mở trong trình soạn đề →
              </button>
            </div>
            <div className="space-y-2.5">
              {activeExam.readingQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg border border-slate-200 bg-[#FAF8F5]/60 text-xs"
                >
                  <div className="md:col-span-5 font-medium text-[#0F2942]">
                    <span className="font-bold">Đọc hiểu – Câu {idx + 1}:</span>{' '}
                    {q.content}
                  </div>
                  <div className="md:col-span-3">
                    <select
                      value={q.cognitiveLevel}
                      onChange={(e) =>
                        handleUpdateQuestionField(
                          q.id,
                          'cognitiveLevel',
                          e.target.value as CognitiveLevel
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    >
                      {sync.levelsUsed.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      step={0.25}
                      min={0}
                      value={q.points}
                      onChange={(e) =>
                        handleUpdateQuestionField(
                          q.id,
                          'points',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white tabular-nums"
                    />
                  </div>
                  <div className="md:col-span-2 text-right text-slate-500">
                    {q.learningOutcome ? 'Đã gắn YCCĐ' : 'Chưa gắn YCCĐ'}
                  </div>
                </div>
              ))}

              {activeExam.writingPrompts.map((w, idx) => (
                <div
                  key={w.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg border border-slate-200 bg-[#FAF8F5]/60 text-xs"
                >
                  <div className="md:col-span-5 font-medium text-[#0F2942]">
                    <span className="font-bold">Viết – Câu {idx + 1}:</span>{' '}
                    {w.category} ({w.formatType} ~{w.wordCountTarget} chữ)
                  </div>
                  <div className="md:col-span-3">
                    <select
                      value={w.cognitiveLevel}
                      onChange={(e) =>
                        handleUpdateWritingField(
                          w.id,
                          'cognitiveLevel',
                          e.target.value as CognitiveLevel
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    >
                      {sync.levelsUsed.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      step={0.25}
                      min={0}
                      value={w.points}
                      onChange={(e) =>
                        handleUpdateWritingField(
                          w.id,
                          'points',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white tabular-nums"
                    />
                  </div>
                  <div className="md:col-span-2 text-right text-slate-500">
                    {w.learningOutcome ? 'Đã gắn YCCĐ' : 'Chưa gắn YCCĐ'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewTab === 'spec' && (
        <div className="bg-white rounded-xl border border-[#E5E0D8] overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#0F2942] text-white">
                <th className="p-3 text-center">STT</th>
                <th className="p-3 text-left">Kỹ năng</th>
                <th className="p-3 text-left">Nội dung / Đơn vị kiến thức</th>
                <th className="p-3 text-left">Yêu cầu cần đạt (GDPT 2018)</th>
                <th className="p-3 text-left">Biểu hiện cần đánh giá</th>
                <th className="p-3 text-center">Mức độ</th>
                <th className="p-3 text-center">Số câu / Điểm</th>
                <th className="p-3 text-center">Câu hỏi tương ứng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sync.specRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="p-3 text-center tabular-nums">{row.stt}</td>
                  <td className="p-3 font-semibold text-[#0F2942]">{row.skill}</td>
                  <td className="p-3">{row.contentUnit}</td>
                  <td className="p-3 leading-relaxed">{row.learningOutcome}</td>
                  <td className="p-3 leading-relaxed text-slate-600">
                    {row.evaluationIndicators}
                  </td>
                  <td className="p-3 text-center font-medium">{row.cognitiveLevel}</td>
                  <td className="p-3 text-center tabular-nums">
                    {row.questionCount} câu ({formatScore(row.points)}đ)
                  </td>
                  <td className="p-3 text-center font-medium text-[#0D7A6F]">
                    {row.questionLabels.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewTab === 'preview' && <A4PreviewSheet exam={activeExam} mode="matrix" />}
    </div>
  );
};
