import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Eye,
  FileUp,
  History,
  Presentation,
  Printer,
  Send,
  Trash2,
} from 'lucide-react';
import { A4PreviewSheet } from '../components/A4PreviewSheet';
import { db } from '../database/db';
import {
  deleteExam,
  duplicateExam,
  listExams,
  listExamVersions,
  saveExam,
} from '../repositories/examRepository';
import { convertExamToPresentation } from '../services/slideGeneratorService';
import {
  generateExamDocxBlob,
  makeExamDocxFilename,
  triggerBlobDownload,
} from '../services/wordExportService';
import {
  extractRawTextFromDocxFile,
  parseImportedExamText,
  SmartImportResult,
} from '../services/wordImportService';
import { ExamDocument, ExamVersionSnapshot } from '../types';
import { formatDateTimeVN } from '../utils/formatters';

export const ExamBankPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamDocument[]>([]);
  const [previewExam, setPreviewExam] = useState<ExamDocument | null>(null);
  const [versions, setVersions] = useState<ExamVersionSnapshot[]>([]);
  const [versionOwnerId, setVersionOwnerId] = useState<string | null>(null);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [rawPaste, setRawPaste] = useState('');
  const [importResult, setImportResult] = useState<SmartImportResult | null>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    const all = await listExams();
    setExams(all);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = exams.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.adminInfo.title.toLowerCase().includes(q) ||
      e.adminInfo.examType.toLowerCase().includes(q) ||
      e.passage.title.toLowerCase().includes(q)
    );
  });

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.docx')) {
      const text = await extractRawTextFromDocxFile(file);
      setRawPaste(text);
      setImportResult(parseImportedExamText(text));
    } else {
      const text = await file.text();
      setRawPaste(text);
      setImportResult(parseImportedExamText(text));
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult) return;
    const saved = await saveExam(importResult.examDraft);
    setShowImportPanel(false);
    setImportResult(null);
    setRawPaste('');
    await load();
    setNotice('Đã lưu đề nhập vào Kho đề kiểm tra.');
    navigate(`/soan-de?examId=${saved.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Kho đề kiểm tra & Nhập đề Word thông minh
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý hồ sơ đề kiểm tra, khôi phục phiên bản, xuất Word/PDF và Smart Import từ DOCX
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportPanel((v) => !v)}
            className="px-3.5 py-2 rounded-lg border border-[#0D7A6F] text-[#0D7A6F] bg-white text-xs font-semibold hover:bg-[#0D7A6F]/5 inline-flex items-center gap-1.5"
          >
            <FileUp className="w-4 h-4" /> Nhập đề từ Word / JSON
          </button>
          <button
            type="button"
            onClick={() => navigate('/soan-de')}
            className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E]"
          >
            Soạn đề mới
          </button>
        </div>
      </div>

      {notice && (
        <div className="no-print bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {notice}
        </div>
      )}

      {/* Smart Word Import Panel (Inline, No Modal) */}
      {showImportPanel && (
        <div className="no-print bg-white rounded-xl border border-[#0D7A6F]/40 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0F2942]">
                Nhập đề từ Word – Smart Import
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ tệp .docx, dán văn bản từ Word hoặc dữ liệu JSON. Giữ nguyên xuống dòng, khổ thơ, dấu câu và đánh dấu phần chưa nhận diện.
              </p>
            </div>
            <label className="px-3.5 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5" /> Chọn tệp .DOCX / .TXT / .JSON
              <input
                type="file"
                accept=".docx,.txt,.json"
                onChange={handleDocxUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nội dung gốc (hoặc dán trực tiếp từ Microsoft Word)
              </label>
              <textarea
                rows={12}
                value={rawPaste}
                onChange={(e) => {
                  setRawPaste(e.target.value);
                  if (e.target.value.trim()) {
                    setImportResult(parseImportedExamText(e.target.value));
                  } else {
                    setImportResult(null);
                  }
                }}
                placeholder="Dán nội dung đề thi tại đây hoặc tải tệp .docx..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-700">
                Đối chiếu kết quả phân tích (Giáo viên xác nhận trước khi lưu)
              </div>
              {!importResult ? (
                <div className="h-[250px] rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 p-4 text-center">
                  Khi bạn tải file hoặc dán nội dung bên trái, hệ thống sẽ đối chiếu các phần đã nhận diện và phần cần kiểm tra tại đây.
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                  {importResult.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900"
                    >
                      Cần kiểm tra: {w}
                    </div>
                  ))}
                  {importResult.segments.map((seg) => (
                    <div
                      key={seg.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        seg.recognized
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="font-bold text-[#0F2942]">
                        {seg.kind === 'header' && 'Thông tin đầu đề'}
                        {seg.kind === 'passage' && 'Ngữ liệu Đọc hiểu'}
                        {seg.kind === 'reading-question' && 'Câu hỏi Đọc hiểu'}
                        {seg.kind === 'writing-prompt' && 'Đề bài phần Viết'}
                        {seg.kind === 'answer' && 'Đáp án / Hướng dẫn chấm'}
                        {seg.kind === 'unrecognized' && 'Nội dung chưa nhận diện'}
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-700 mt-1">
                        {seg.rawText.slice(0, 260)}
                        {seg.rawText.length > 260 ? '...' : ''}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {importResult && (
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportPanel(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D]"
              >
                Xác nhận lưu & Mở biên tập chi tiết
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="no-print">
        <input
          type="text"
          placeholder="Tìm đề kiểm tra theo tên đề, loại đề hoặc tên văn bản..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs"
        />
      </div>

      {/* Exam Cards */}
      <div className="no-print space-y-3">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="bg-white rounded-xl border border-[#E5E0D8] p-4 space-y-3"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-base text-[#0F2942]">
                  {ex.adminInfo.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>Lớp {ex.adminInfo.grade}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ex.adminInfo.textbookSeries}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ex.adminInfo.examType}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ex.adminInfo.durationMinutes} phút</span>
                  <span aria-hidden="true">·</span>
                  <span>{ex.approved ? 'Đã duyệt' : 'Bản nháp'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDateTimeVN(ex.updatedAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewExam(ex)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Xem
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/soan-de?examId=${ex.id}`)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0F2942] text-white hover:bg-[#173B5E] inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await duplicateExam(ex);
                    await load();
                    setNotice('Đã nhân bản đề.');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Nhân bản
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const blob = await generateExamDocxBlob(ex);
                    triggerBlobDownload(blob, makeExamDocxFilename(ex, 'De_kiem_tra'));
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất Word
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewExam(ex);
                    setTimeout(() => window.print(), 150);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Xuất PDF
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/giao-bai?examId=${ex.id}`)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Giao cho HS
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const deck = convertExamToPresentation(ex);
                    await db.presentations.put(deck);
                    navigate(`/bai-giang?deckId=${deck.id}`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <Presentation className="w-3.5 h-3.5" /> Bài giảng
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const list = await listExamVersions(ex.id);
                    setVersions(list);
                    setVersionOwnerId(versionOwnerId === ex.id ? null : ex.id);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" /> Phiên bản
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteExam(ex.id);
                    if (previewExam?.id === ex.id) setPreviewExam(null);
                    await load();
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                  title="Xóa đề"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {versionOwnerId === ex.id && (
              <div className="pt-3 border-t border-slate-100 text-xs">
                <div className="font-semibold text-[#0F2942] mb-2">
                  Lịch sử phiên bản đã lưu:
                </div>
                {versions.length === 0 ? (
                  <div className="text-slate-500">
                    Chưa có mốc phiên bản nào. Nhấn &ldquo;Lưu bản&rdquo; trong trình soạn đề để tạo mốc khôi phục.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {versions.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={async () => {
                          await saveExam(v.snapshot);
                          await load();
                          setNotice(`Đã khôi phục đề về mốc "${v.label}".`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F2942]"
                      >
                        Khôi phục: {v.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {previewExam && (
        <div className="space-y-2">
          <div className="no-print flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F2942]">
              Xem trước đề: {previewExam.adminInfo.title}
            </span>
            <button
              type="button"
              onClick={() => setPreviewExam(null)}
              className="text-xs text-slate-600 hover:underline"
            >
              Đóng xem trước
            </button>
          </div>
          <A4PreviewSheet exam={previewExam} mode="exam" />
        </div>
      )}
    </div>
  );
};
