import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Database,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Presentation,
  Users,
} from 'lucide-react';
import { db, ensureDatabaseSeeded } from '../database/db';
import { ExamDocument, UserProfile } from '../types';
import { formatDateTimeVN } from '../utils/formatters';

interface DashboardPageProps {
  activeUser: UserProfile;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ activeUser }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    exams: 0,
    passages: 0,
    questions: 0,
    lessonPlans: 0,
    presentations: 0,
    classes: 0,
  });
  const [recentExams, setRecentExams] = useState<ExamDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureDatabaseSeeded();
      const [exams, passages, questions, lessonPlans, presentations, classes] =
        await Promise.all([
          db.exams.orderBy('updatedAt').reverse().toArray(),
          db.passages.count(),
          db.questions.count(),
          db.lessonPlans.count(),
          db.presentations.count(),
          db.classes.count(),
        ]);
      setCounts({
        exams: exams.length,
        passages,
        questions,
        lessonPlans,
        presentations,
        classes,
      });
      setRecentExams(exams.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  const statItems = [
    { label: 'Đề kiểm tra đã lưu', value: counts.exams, path: '/kho-de', icon: FolderArchive },
    { label: 'Ngữ liệu văn học', value: counts.passages, path: '/ngan-hang-ngu-lieu', icon: BookOpen },
    { label: 'Câu hỏi đọc hiểu', value: counts.questions, path: '/ngan-hang-cau-hoi', icon: Database },
    { label: 'Kế hoạch bài dạy', value: counts.lessonPlans, path: '/ke-hoach-bai-day', icon: FileText },
    { label: 'Bài giảng trình chiếu', value: counts.presentations, path: '/bai-giang', icon: Presentation },
    { label: 'Lớp học đang quản lý', value: counts.classes, path: '/lop-hoc', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Tổng quan không gian làm việc
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {activeUser.fullName} · {activeUser.schoolName} · Dữ liệu lưu trữ bền vững trên IndexedDB
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/soan-de')}
            className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-sm font-semibold hover:bg-[#173B5E] transition-colors"
          >
            Soạn đề mới
          </button>
          <button
            type="button"
            onClick={() => navigate('/ma-tran-dac-ta')}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#0F2942] text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Lập Ma trận & Đặc tả
          </button>
        </div>
      </div>

      {/* Real Database Counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className="text-left bg-white rounded-xl border border-[#E5E0D8] p-4 hover:border-[#0F2942]/40 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-500">
                <Icon className="w-4 h-4 text-[#0D7A6F]" />
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div className="mt-3 text-2xl font-bold font-mono tabular-nums text-[#0F2942]">
                {loading ? '—' : item.value}
              </div>
              <div className="mt-1 text-xs text-slate-600">{item.label}</div>
            </button>
          );
        })}
      </div>

      {/* Recent Exams Table */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0F2942]">
            Hồ sơ đề kiểm tra gần đây
          </h2>
          <button
            type="button"
            onClick={() => navigate('/kho-de')}
            className="text-xs font-semibold text-[#0D7A6F] hover:underline"
          >
            Xem toàn bộ kho đề
          </button>
        </div>
        {recentExams.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Chưa có đề kiểm tra nào. Nhấn &ldquo;Soạn đề mới&rdquo; để bắt đầu.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExams.map((exam) => (
              <div
                key={exam.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[#0F2942] truncate">
                    {exam.adminInfo.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>Lớp {exam.adminInfo.grade}</span>
                    <span aria-hidden="true">·</span>
                    <span>{exam.adminInfo.textbookSeries}</span>
                    <span aria-hidden="true">·</span>
                    <span>{exam.adminInfo.examType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{exam.adminInfo.durationMinutes} phút</span>
                    <span aria-hidden="true">·</span>
                    <span>Cập nhật: {formatDateTimeVN(exam.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/soan-de?examId=${exam.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-medium hover:bg-[#173B5E]"
                  >
                    Mở soạn thảo
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/ma-tran-dac-ta?examId=${exam.id}`)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 inline-flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Ma trận
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
