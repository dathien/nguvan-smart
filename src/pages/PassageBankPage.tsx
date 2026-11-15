import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Copy,
  FilePlus2,
  Heart,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  DEFAULT_ADMIN_INFO,
  GRADE_LEVELS,
  PASSAGE_GENRES,
  TEXTBOOK_SERIES,
} from '../config/curriculum';
import {
  deletePassage,
  listPassages,
  saveExam,
  savePassage,
} from '../repositories/examRepository';
import {
  ExamDocument,
  GradeLevel,
  PassageGenre,
  ReadingPassage,
  SourceVerificationStatus,
} from '../types';
import { generateId } from '../utils/formatters';

const STATUS_LIST: SourceVerificationStatus[] = [
  'Đã xác minh',
  'Giáo viên cung cấp',
  'Chưa xác minh',
  'Ngữ liệu tự biên soạn',
];

export const PassageBankPage: React.FC = () => {
  const navigate = useNavigate();
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [selected, setSelected] = useState<ReadingPassage | null>(null);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const items = await listPassages();
    setPassages(items);
    if (!selected && items.length > 0) setSelected(items[0]);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = passages.filter((p) => {
    if (filterGrade !== 'all' && p.grade !== filterGrade) return false;
    if (filterGenre !== 'all' && p.genre !== filterGenre) return false;
    if (filterStatus !== 'all' && p.verificationStatus !== filterStatus) return false;
    if (onlyFavorites && !p.isFavorite) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateNew = async () => {
    const now = new Date().toISOString();
    const created: ReadingPassage = {
      id: generateId('pass'),
      title: 'Ngữ liệu mới',
      author: '',
      genre: 'Thơ',
      grade: '12',
      textbookSeries: 'Kết nối tri thức với cuộc sống',
      topic: '',
      literaryPeriod: 'Văn học hiện đại',
      textType: 'Thơ tự do',
      content: '',
      formatStyle: 'poem',
      origin: 'Giáo viên nhập liệu',
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
    };
    await savePassage(created);
    await load();
    setSelected(created);
  };

  const handleSaveSelected = async (next: ReadingPassage) => {
    setSelected(next);
    await savePassage(next);
    const items = await listPassages();
    setPassages(items);
  };

  const handleCreateExamFromPassage = async (p: ReadingPassage) => {
    const now = new Date().toISOString();
    const newExam: ExamDocument = {
      id: generateId('exam'),
      ownerId: 'teacher-dathien',
      adminInfo: {
        ...DEFAULT_ADMIN_INFO,
        grade: p.grade,
        textbookSeries:
          p.textbookSeries === 'Dùng chung'
            ? 'Kết nối tri thức với cuộc sống'
            : p.textbookSeries,
        title: `ĐỀ KIỂM TRA ĐỌC HIỂU: ${p.title.toUpperCase()}`,
        templateId: 'custom',
      },
      passage: { ...p },
      readingQuestions: [
        {
          id: generateId('q'),
          order: 1,
          part: 'doc-hieu',
          content: `Xác định thể loại và đề tài chính của văn bản "${p.title}".`,
          skill: 'Nhận biết đặc trưng thể loại',
          learningOutcome: p.learningOutcomes[0] || '',
          cognitiveLevel: 'Nhận biết',
          points: 1.0,
          answer: '',
          equivalentAnswers: '',
          partialCreditSteps: [],
          nonQualifyingNotes: '',
        },
      ],
      writingPrompts: [],
      includeHighApplication: false,
      approved: false,
      createdAt: now,
      updatedAt: now,
    };
    await saveExam(newExam);
    navigate(`/soan-de?examId=${newExam.id}`);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list: ReadingPassage[] = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (item.title && item.content) {
          await savePassage({ ...item, id: item.id || generateId('pass') });
        }
      }
      await load();
      setNotice(`Đã nhập ${list.length} ngữ liệu vào kho.`);
    } catch {
      setNotice('Tệp JSON ngữ liệu không hợp lệ.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Ngân hàng ngữ liệu văn học
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý văn bản theo khối lớp, bộ sách, thể loại và trạng thái xác minh nguồn trích dẫn
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Nhập JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm ngữ liệu mới
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-xs text-emerald-800">
          {notice}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm tên văn bản, tác giả, chủ đề, thẻ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs"
          />
        </div>
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
        <select
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
        >
          <option value="all">Tất cả thể loại</option>
          {PASSAGE_GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
          >
            <option value="all">Mọi trạng thái nguồn</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setOnlyFavorites((v) => !v)}
            title="Chỉ hiện yêu thích"
            className={`p-2 rounded-lg border ${
              onlyFavorites
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-slate-300 text-slate-500'
            }`}
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two-Column List & Inline Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-8 text-center text-xs text-slate-500">
              Không tìm thấy ngữ liệu phù hợp bộ lọc.
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  selected?.id === p.id
                    ? 'bg-white border-[#0F2942] shadow-sm'
                    : 'bg-white border-[#E5E0D8] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-[#0F2942]">{p.title}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveSelected({ ...p, isFavorite: !p.isFavorite });
                    }}
                    className={p.isFavorite ? 'text-red-500' : 'text-slate-300'}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {p.author || 'Chưa rõ tác giả'}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                  <span>{p.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>Lớp {p.grade}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#0D7A6F] font-medium">
                    {p.verificationStatus}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inline Passage Detail Editor */}
        <div className="lg:col-span-7">
          {selected ? (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0F2942] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0D7A6F]" />
                  Chi tiết & Biên tập ngữ liệu
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateExamFromPassage(selected)}
                    className="px-3 py-1.5 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D] inline-flex items-center gap-1"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" /> Dùng soạn đề
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const now = new Date().toISOString();
                      const copy: ReadingPassage = {
                        ...selected,
                        id: generateId('pass'),
                        title: `${selected.title} (Bản sao)`,
                        createdAt: now,
                        updatedAt: now,
                      };
                      await savePassage(copy);
                      await load();
                      setSelected(copy);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs hover:bg-slate-50 inline-flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Nhân bản
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deletePassage(selected.id);
                      setSelected(null);
                      await load();
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
                    title="Xóa ngữ liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên văn bản
                  </label>
                  <input
                    type="text"
                    value={selected.title}
                    onChange={(e) =>
                      handleSaveSelected({ ...selected, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tác giả
                  </label>
                  <input
                    type="text"
                    value={selected.author}
                    onChange={(e) =>
                      handleSaveSelected({ ...selected, author: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <select
                  value={selected.grade}
                  onChange={(e) =>
                    handleSaveSelected({
                      ...selected,
                      grade: e.target.value as GradeLevel,
                    })
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
                  value={selected.genre}
                  onChange={(e) =>
                    handleSaveSelected({
                      ...selected,
                      genre: e.target.value as PassageGenre,
                    })
                  }
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                >
                  {PASSAGE_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <select
                  value={selected.textbookSeries}
                  onChange={(e) =>
                    handleSaveSelected({
                      ...selected,
                      textbookSeries: e.target
                        .value as ReadingPassage['textbookSeries'],
                    })
                  }
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs col-span-2"
                >
                  {TEXTBOOK_SERIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Dùng chung">Dùng chung</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung văn bản
                </label>
                <textarea
                  rows={8}
                  value={selected.content}
                  onChange={(e) =>
                    handleSaveSelected({ ...selected, content: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nguồn trích dẫn
                  </label>
                  <input
                    type="text"
                    value={selected.citationSource}
                    onChange={(e) =>
                      handleSaveSelected({
                        ...selected,
                        citationSource: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái xác minh nguồn
                  </label>
                  <select
                    value={selected.verificationStatus}
                    onChange={(e) =>
                      handleSaveSelected({
                        ...selected,
                        verificationStatus: e.target
                          .value as SourceVerificationStatus,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    {STATUS_LIST.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thẻ phân loại (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={selected.tags.join(', ')}
                  onChange={(e) =>
                    handleSaveSelected({
                      ...selected,
                      tags: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-8 text-center text-xs text-slate-500">
              Chọn một ngữ liệu ở cột bên trái để xem hoặc chỉnh sửa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
