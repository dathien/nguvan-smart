import React, { useEffect, useState } from 'react';
import { Download, Plus, Printer, Trash2 } from 'lucide-react';
import { GRADE_LEVELS, TEXTBOOK_SERIES } from '../config/curriculum';
import { db } from '../database/db';
import {
  generateWorksheetDocxBlob,
  triggerBlobDownload,
} from '../services/wordExportService';
import {
  GradeLevel,
  TextbookSeries,
  WorksheetBlock,
  WorksheetDocument,
  WorksheetType,
} from '../types';
import { generateId, slugifyFilename } from '../utils/formatters';

const WORKSHEET_TYPES: WorksheetType[] = [
  'Phiếu đọc hiểu',
  'Phiếu phân tích thơ',
  'Phiếu phân tích truyện',
  'Phiếu tìm hiểu nhân vật',
  'Phiếu thảo luận nhóm',
  'Phiếu phân tích lập luận',
  'Phiếu lập dàn ý',
  'Phiếu tự đánh giá',
  'Phiếu đánh giá đồng đẳng',
  'Phiếu luyện viết',
];

const BLOCK_TYPES: WorksheetBlock['blockType'][] = [
  'Câu hỏi tự luận',
  'Điền khuyết',
  'Ghép nối',
  'Bảng so sánh',
  'Sơ đồ',
  'Ô ghi chú',
  'Checklist',
  'Khung viết đoạn văn',
];

function createDefaultWorksheet(): WorksheetDocument {
  const now = new Date().toISOString();
  return {
    id: generateId('ws'),
    ownerId: 'teacher-dathien',
    title: 'Phiếu học tập số 01 – Khám phá hình ảnh thơ',
    worksheetType: 'Phiếu phân tích thơ',
    grade: '12',
    textbookSeries: 'Kết nối tri thức với cuộc sống',
    passageTitle: 'Nhịp cầu qua mùa gió (Ngữ liệu thực hành)',
    blocks: [
      {
        id: generateId('wb'),
        blockType: 'Câu hỏi tự luận',
        prompt: 'Xác định các hình ảnh xuất hiện trong hai khổ thơ đầu và nêu cảm nhận chung.',
        teacherGuide: 'Học sinh nêu đúng ít nhất 4 hình ảnh (sương giăng, cầu tre, bờ lau, bàn chân mẹ...).',
      },
      {
        id: generateId('wb'),
        blockType: 'Bảng so sánh',
        prompt: 'So sánh không gian quê hương ở khổ đầu và không gian thành phố ở khổ cuối.',
        teacherGuide: 'Quê hương: yên bình, gắn bó; Thành phố: rộng mở, nhộn nhịp nhưng cần giữ điểm tựa tinh thần.',
        rowsOrItems: ['Không gian quê hương | Hình ảnh tiêu biểu | Cảm xúc', 'Không gian đô thị | Hình ảnh tiêu biểu | Thông điệp'],
      },
      {
        id: generateId('wb'),
        blockType: 'Khung viết đoạn văn',
        prompt: 'Viết đoạn văn ngắn (100 – 150 chữ) về thông điệp giữ gìn cội nguồn.',
        teacherGuide: 'Đúng hình thức đoạn văn, diễn đạt mạch lạc, bám sát ngữ liệu.',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export const WorksheetPage: React.FC = () => {
  const [sheets, setSheets] = useState<WorksheetDocument[]>([]);
  const [active, setActive] = useState<WorksheetDocument | null>(null);
  const [previewRole, setPreviewRole] = useState<'student' | 'teacher'>('student');

  const load = async () => {
    const all = await db.worksheets.orderBy('updatedAt').reverse().toArray();
    if (all.length === 0) {
      const seed = createDefaultWorksheet();
      await db.worksheets.put(seed);
      setSheets([seed]);
      setActive(seed);
    } else {
      setSheets(all);
      if (!active) setActive(all[0]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!active) return null;

  const persist = async (next: WorksheetDocument) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    setActive(updated);
    await db.worksheets.put(updated);
    setSheets(await db.worksheets.orderBy('updatedAt').reverse().toArray());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Tạo Phiếu học tập Ngữ văn
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Hỗ trợ 10 dạng phiếu, hai phiên bản Học sinh / Giáo viên và xuất Word, PDF khổ A4
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={active.id}
            onChange={(e) => {
              const found = sheets.find((s) => s.id === e.target.value);
              if (found) setActive(found);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs max-w-xs"
          >
            {sheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={async () => {
              const fresh = createDefaultWorksheet();
              await db.worksheets.put(fresh);
              await load();
              setActive(fresh);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo phiếu mới
          </button>
          <button
            type="button"
            onClick={async () => {
              const blob = await generateWorksheetDocxBlob(active, previewRole);
              triggerBlobDownload(
                blob,
                `Phieu_${previewRole === 'student' ? 'HocSinh' : 'GiaoVien'}_${slugifyFilename(active.title)}.docx`
              );
            }}
            className="px-3.5 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Word ({previewRole === 'student' ? 'Bản HS' : 'Bản GV'})
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> In / PDF A4
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Builder */}
        <div className="no-print lg:col-span-6 bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề phiếu học tập
            </label>
            <input
              type="text"
              value={active.title}
              onChange={(e) => persist({ ...active, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              value={active.worksheetType}
              onChange={(e) =>
                persist({
                  ...active,
                  worksheetType: e.target.value as WorksheetType,
                })
              }
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
            >
              {WORKSHEET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={active.grade}
              onChange={(e) =>
                persist({ ...active, grade: e.target.value as GradeLevel })
              }
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
            >
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  Lớp {g}
                </option>
              ))}
            </select>
            <select
              value={active.textbookSeries}
              onChange={(e) =>
                persist({
                  ...active,
                  textbookSeries: e.target.value as TextbookSeries,
                })
              }
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
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
              Văn bản / Chủ đề áp dụng
            </label>
            <input
              type="text"
              value={active.passageTitle}
              onChange={(e) =>
                persist({ ...active, passageTitle: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F2942]">
                Các nhiệm vụ trong phiếu ({active.blocks.length})
              </span>
              <button
                type="button"
                onClick={() =>
                  persist({
                    ...active,
                    blocks: [
                      ...active.blocks,
                      {
                        id: generateId('wb'),
                        blockType: 'Câu hỏi tự luận',
                        prompt: 'Nhiệm vụ học tập mới...',
                        teacherGuide: '',
                      },
                    ],
                  })
                }
                className="text-xs font-semibold text-[#0D7A6F] inline-flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm nhiệm vụ
              </button>
            </div>

            {active.blocks.map((b, idx) => (
              <div
                key={b.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-[#FAF8F5]/70 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#0F2942]">
                    Nhiệm vụ {idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={b.blockType}
                      onChange={(e) =>
                        persist({
                          ...active,
                          blocks: active.blocks.map((item) =>
                            item.id === b.id
                              ? {
                                  ...item,
                                  blockType: e.target
                                    .value as WorksheetBlock['blockType'],
                                }
                              : item
                          ),
                        })
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                    >
                      {BLOCK_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        persist({
                          ...active,
                          blocks: active.blocks.filter((item) => item.id !== b.id),
                        })
                      }
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={b.prompt}
                  onChange={(e) =>
                    persist({
                      ...active,
                      blocks: active.blocks.map((item) =>
                        item.id === b.id ? { ...item, prompt: e.target.value } : item
                      ),
                    })
                  }
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Hướng dẫn / Gợi ý đáp án dành cho giáo viên..."
                  value={b.teacherGuide}
                  onChange={(e) =>
                    persist({
                      ...active,
                      blocks: active.blocks.map((item) =>
                        item.id === b.id
                          ? { ...item, teacherGuide: e.target.value }
                          : item
                      ),
                    })
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right A4 Preview with Student/Teacher Switch */}
        <div className="lg:col-span-6 space-y-3">
          <div className="no-print flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-[#E5E0D8]">
            <span className="text-xs font-bold text-[#0F2942]">
              Xem trước khổ A4
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewRole('student')}
                className={`px-3 py-1 rounded-md text-xs font-medium ${
                  previewRole === 'student'
                    ? 'bg-[#0F2942] text-white'
                    : 'text-slate-600'
                }`}
              >
                Bản Học sinh
              </button>
              <button
                type="button"
                onClick={() => setPreviewRole('teacher')}
                className={`px-3 py-1 rounded-md text-xs font-medium ${
                  previewRole === 'teacher'
                    ? 'bg-[#0D7A6F] text-white'
                    : 'text-slate-600'
                }`}
              >
                Bản Hướng dẫn GV
              </button>
            </div>
          </div>

          <div className="print-only-container bg-white border border-slate-200 shadow-sm p-8 font-a4 text-[12.5pt] leading-relaxed text-black">
            <h2 className="text-center font-bold uppercase text-[14pt]">
              {previewRole === 'student'
                ? 'PHIẾU HỌC TẬP HỌC SINH'
                : 'HƯỚNG DẪN PHIẾU HỌC TẬP (GIÁO VIÊN)'}
            </h2>
            <p className="text-center font-bold text-[13pt] mt-1">{active.title}</p>
            <p className="text-center italic text-[11pt] mb-4">
              Lớp {active.grade} · {active.textbookSeries} · {active.worksheetType} · Ngữ liệu: {active.passageTitle}
            </p>
            {previewRole === 'student' && (
              <p className="mb-4 text-[11.5pt]">
                Họ và tên học sinh: ........................................................... Lớp: .............
              </p>
            )}
            <div className="space-y-4">
              {active.blocks.map((b, idx) => (
                <div key={b.id} className="avoid-break border border-slate-400 p-3 rounded">
                  <div className="font-bold">
                    Nhiệm vụ {idx + 1} [{b.blockType}]: {b.prompt}
                  </div>
                  {previewRole === 'student' ? (
                    <div className="mt-3 space-y-3 text-slate-400">
                      <div className="border-b border-dotted border-slate-400 h-5" />
                      <div className="border-b border-dotted border-slate-400 h-5" />
                      <div className="border-b border-dotted border-slate-400 h-5" />
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[11.5pt] text-slate-800">
                      <strong>Gợi ý đáp án / Đánh giá:</strong>{' '}
                      {b.teacherGuide || 'Chưa nhập hướng dẫn.'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
