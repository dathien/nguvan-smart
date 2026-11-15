import React, { useEffect, useState } from 'react';
import { Download, Plus, Printer, Trash2 } from 'lucide-react';
import { GRADE_LEVELS, TEXTBOOK_SERIES } from '../config/curriculum';
import { db } from '../database/db';
import {
  generateLessonPlanDocxBlob,
  triggerBlobDownload,
} from '../services/wordExportService';
import { GradeLevel, LessonActivity, LessonPlan, TextbookSeries } from '../types';
import { generateId, slugifyFilename } from '../utils/formatters';

const METHODS: LessonActivity['method'][] = [
  'Hợp tác nhóm',
  'Trạm học tập',
  'Dự án',
  'Đàm thoại gợi mở',
  'Trải nghiệm',
];

function createDefaultPlan(): LessonPlan {
  const now = new Date().toISOString();
  return {
    id: generateId('lp'),
    ownerId: 'teacher-dathien',
    title: 'Kế hoạch bài dạy Ngữ văn (Mẫu GDPT 2018)',
    grade: '10',
    textbookSeries: 'Kết nối tri thức với cuộc sống',
    durationPeriods: 2,
    objectives: 'Giúp học sinh hiểu đặc trưng thể loại và rèn luyện năng lực đọc – viết.',
    learningOutcomes:
      'Nhận biết và phân tích được các yếu tố hình thức, chủ đề và thông điệp của văn bản.',
    competencies: 'Năng lực ngôn ngữ, năng lực văn học, năng lực hợp tác và giải quyết vấn đề.',
    qualities: 'Nhân ái, trách nhiệm, chăm chỉ, yêu quê hương đất nước.',
    equipmentAndMaterials: 'Sách giáo khoa, phiếu học tập, máy chiếu, bảng nhóm.',
    activities: [
      {
        id: generateId('act'),
        phase: '1. Mở đầu',
        title: 'Khởi động và kết nối trải nghiệm',
        durationMinutes: 10,
        method: 'Đàm thoại gợi mở',
        objective: 'Tạo tâm thế hứng thú và huy động tri thức nền của học sinh.',
        teacherActivity: 'Nêu câu hỏi gợi mở gắn với chủ đề bài học.',
        studentActivity: 'Suy nghĩ cá nhân, chia sẻ nhanh ý kiến trước lớp.',
        expectedProduct: 'Câu trả lời ngắn của học sinh dẫn vào bài mới.',
        assessmentMethod: 'Quan sát, nhận xét trực tiếp.',
      },
      {
        id: generateId('act'),
        phase: '2. Hình thành kiến thức',
        title: 'Khám phá văn bản theo đặc trưng thể loại',
        durationMinutes: 40,
        method: 'Trạm học tập',
        objective: 'Phân tích các yếu tố nghệ thuật và nội dung tư tưởng của văn bản.',
        teacherActivity: 'Chia lớp thành 4 trạm/nhóm, phát phiếu học tập và theo dõi hỗ trợ.',
        studentActivity: 'Thảo luận nhóm, hoàn thành phiếu học tập và cử đại diện báo cáo.',
        expectedProduct: 'Sản phẩm thảo luận nhóm trên phiếu học tập.',
        assessmentMethod: 'Đánh giá qua bảng kiểm và sản phẩm nhóm.',
      },
      {
        id: generateId('act'),
        phase: '3. Luyện tập',
        title: 'Thực hành đọc hiểu và viết đoạn ngắn',
        durationMinutes: 25,
        method: 'Hợp tác nhóm',
        objective: 'Củng cố kĩ năng phân tích và diễn đạt thành đoạn văn mạch lạc.',
        teacherActivity: 'Giao bài tập luyện viết nhanh 150–200 chữ.',
        studentActivity: 'Thực hành viết và đánh giá chéo theo tiêu chí.',
        expectedProduct: 'Đoạn văn hoàn chỉnh của học sinh.',
        assessmentMethod: 'Đánh giá đồng đẳng và nhận xét của GV.',
      },
      {
        id: generateId('act'),
        phase: '4. Vận dụng',
        title: 'Kết nối thực tiễn và sáng tạo',
        durationMinutes: 15,
        method: 'Dự án',
        objective: 'Vận dụng bài học vào đời sống hoặc sản phẩm truyền thông học đường.',
        teacherActivity: 'Giao nhiệm vụ mở rộng thực hiện tại nhà.',
        studentActivity: 'Lập kế hoạch thực hiện sản phẩm nhóm.',
        expectedProduct: 'Bài viết / infographic / video giới thiệu tác phẩm.',
        assessmentMethod: 'Rubric đánh giá sản phẩm dự án.',
      },
    ],
    postLessonAdjustment: '',
    createdAt: now,
    updatedAt: now,
  };
}

export const LessonPlanPage: React.FC = () => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [active, setActive] = useState<LessonPlan | null>(null);

  const load = async () => {
    const all = await db.lessonPlans.orderBy('updatedAt').reverse().toArray();
    if (all.length === 0) {
      const seed = createDefaultPlan();
      await db.lessonPlans.put(seed);
      setPlans([seed]);
      setActive(seed);
    } else {
      setPlans(all);
      if (!active) setActive(all[0]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const persist = async (next: LessonPlan) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    setActive(updated);
    await db.lessonPlans.put(updated);
    setPlans(await db.lessonPlans.orderBy('updatedAt').reverse().toArray());
  };

  const handleCreateNew = async () => {
    const fresh = createDefaultPlan();
    await db.lessonPlans.put(fresh);
    setPlans(await db.lessonPlans.orderBy('updatedAt').reverse().toArray());
    setActive(fresh);
  };

  if (!active) return null;

  const totalMinutes = active.activities.reduce(
    (s, a) => s + (Number(a.durationMinutes) || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Kế hoạch bài dạy Ngữ văn (GDPT 2018)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Thiết kế tiến trình 4 hoạt động chuẩn Công văn 5512, hỗ trợ dạy học hợp tác, trạm học tập, dự án và xuất Word chỉnh sửa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={active.id}
            onChange={(e) => {
              const found = plans.find((p) => p.id === e.target.value);
              if (found) setActive(found);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs max-w-xs"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (Lớp {p.grade})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo KHBD mới
          </button>
          <button
            type="button"
            onClick={async () => {
              const blob = await generateLessonPlanDocxBlob(active);
              triggerBlobDownload(
                blob,
                `KHBD_${slugifyFilename(active.title)}.docx`
              );
            }}
            className="px-3.5 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Word (.docx)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> In / PDF
          </button>
          <button
            type="button"
            onClick={async () => {
              await db.lessonPlans.delete(active.id);
              setActive(null);
              await load();
            }}
            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"
            title="Xóa kế hoạch này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="print-only-container bg-white rounded-xl border border-[#E5E0D8] p-6 space-y-5">
        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên bài học / Kế hoạch bài dạy
            </label>
            <input
              type="text"
              value={active.title}
              onChange={(e) => persist({ ...active, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Khối lớp
            </label>
            <select
              value={active.grade}
              onChange={(e) =>
                persist({ ...active, grade: e.target.value as GradeLevel })
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
              Bộ sách
            </label>
            <select
              value={active.textbookSeries}
              onChange={(e) =>
                persist({
                  ...active,
                  textbookSeries: e.target.value as TextbookSeries,
                })
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Yêu cầu cần đạt
            </label>
            <textarea
              rows={2}
              value={active.learningOutcomes}
              onChange={(e) =>
                persist({ ...active, learningOutcomes: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Năng lực & Phẩm chất
            </label>
            <textarea
              rows={2}
              value={`${active.competencies}\n${active.qualities}`}
              onChange={(e) =>
                persist({ ...active, competencies: e.target.value, qualities: '' })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Thiết bị dạy học và học liệu
          </label>
          <input
            type="text"
            value={active.equipmentAndMaterials}
            onChange={(e) =>
              persist({ ...active, equipmentAndMaterials: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
        </div>

        {/* 4 Activities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F2942]">
              Tiến trình dạy học (Tổng thời lượng: {totalMinutes} phút)
            </h2>
          </div>

          {active.activities.map((act) => (
            <div
              key={act.id}
              className="rounded-xl border border-slate-200 bg-[#FAF8F5]/60 p-4 space-y-3 avoid-break"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                <div className="md:col-span-3 font-bold text-xs text-[#0F2942]">
                  {act.phase}
                </div>
                <input
                  type="text"
                  value={act.title}
                  onChange={(e) =>
                    persist({
                      ...active,
                      activities: active.activities.map((a) =>
                        a.id === act.id ? { ...a, title: e.target.value } : a
                      ),
                    })
                  }
                  className="md:col-span-4 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                />
                <select
                  value={act.method}
                  onChange={(e) =>
                    persist({
                      ...active,
                      activities: active.activities.map((a) =>
                        a.id === act.id
                          ? { ...a, method: e.target.value as LessonActivity['method'] }
                          : a
                      ),
                    })
                  }
                  className="md:col-span-3 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      PP: {m}
                    </option>
                  ))}
                </select>
                <div className="md:col-span-2 flex items-center gap-1">
                  <input
                    type="number"
                    min={5}
                    value={act.durationMinutes}
                    onChange={(e) =>
                      persist({
                        ...active,
                        activities: active.activities.map((a) =>
                          a.id === act.id
                            ? { ...a, durationMinutes: Number(e.target.value) }
                            : a
                        ),
                      })
                    }
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs tabular-nums text-center"
                  />
                  <span className="text-xs text-slate-500">phút</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Hoạt động của Giáo viên
                  </label>
                  <textarea
                    rows={3}
                    value={act.teacherActivity}
                    onChange={(e) =>
                      persist({
                        ...active,
                        activities: active.activities.map((a) =>
                          a.id === act.id
                            ? { ...a, teacherActivity: e.target.value }
                            : a
                        ),
                      })
                    }
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Hoạt động của Học sinh
                  </label>
                  <textarea
                    rows={3}
                    value={act.studentActivity}
                    onChange={(e) =>
                      persist({
                        ...active,
                        activities: active.activities.map((a) =>
                          a.id === act.id
                            ? { ...a, studentActivity: e.target.value }
                            : a
                        ),
                      })
                    }
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Sản phẩm học tập
                    </label>
                    <input
                      type="text"
                      value={act.expectedProduct}
                      onChange={(e) =>
                        persist({
                          ...active,
                          activities: active.activities.map((a) =>
                            a.id === act.id
                              ? { ...a, expectedProduct: e.target.value }
                              : a
                          ),
                        })
                      }
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Phương pháp đánh giá
                    </label>
                    <input
                      type="text"
                      value={act.assessmentMethod}
                      onChange={(e) =>
                        persist({
                          ...active,
                          activities: active.activities.map((a) =>
                            a.id === act.id
                              ? { ...a, assessmentMethod: e.target.value }
                              : a
                          ),
                        })
                      }
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Điều chỉnh sau bài dạy (nếu có)
          </label>
          <textarea
            rows={2}
            value={active.postLessonAdjustment}
            onChange={(e) =>
              persist({ ...active, postLessonAdjustment: e.target.value })
            }
            placeholder="Ghi chú rút kinh nghiệm sau khi giảng dạy..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
        </div>
      </div>
    </div>
  );
};
