import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Download, Printer } from 'lucide-react';
import { db, ensureDatabaseSeeded } from '../database/db';
import {
  Assignment,
  Classroom,
  ExamDocument,
  Submission,
} from '../types';
import { formatDateVN, formatScore, roundExact } from '../utils/formatters';

export const AnalyticsPage: React.FC = () => {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<ExamDocument[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  useEffect(() => {
    (async () => {
      await ensureDatabaseSeeded();
      const [cls, asgs, subs, exms] = await Promise.all([
        db.classes.toArray(),
        db.assignments.toArray(),
        db.submissions.toArray(),
        db.exams.toArray(),
      ]);
      setClasses(cls);
      setAssignments(asgs);
      setSubmissions(subs);
      setExams(exms);
    })();
  }, []);

  const filteredSubs = useMemo(() => {
    return submissions.filter((s) =>
      selectedClassId === 'all' ? true : s.classId === selectedClassId
    );
  }, [submissions, selectedClassId]);

  const gradedSubs = useMemo(
    () =>
      filteredSubs.filter(
        (s) => typeof s.totalScore === 'number' && !Number.isNaN(s.totalScore)
      ),
    [filteredSubs]
  );

  const averageScore = useMemo(() => {
    if (gradedSubs.length === 0) return 0;
    const total = gradedSubs.reduce((sum, s) => sum + (s.totalScore || 0), 0);
    return roundExact(total / gradedSubs.length);
  }, [gradedSubs]);

  const completionRate = useMemo(() => {
    if (filteredSubs.length === 0) return 0;
    const done = filteredSubs.filter(
      (s) =>
        s.status === 'Đã nộp' ||
        s.status === 'Nộp muộn' ||
        s.status === 'Đang chấm' ||
        s.status === 'Đã chấm'
    ).length;
    return Math.round((done / filteredSubs.length) * 100);
  }, [filteredSubs]);

  const scoreDistributionData = useMemo(() => {
    const buckets = [
      { range: '0 - <3,5', count: 0 },
      { range: '3,5 - <5', count: 0 },
      { range: '5 - <6,5', count: 0 },
      { range: '6,5 - <8', count: 0 },
      { range: '8 - 10', count: 0 },
    ];
    gradedSubs.forEach((s) => {
      const sc = s.totalScore || 0;
      if (sc < 3.5) buckets[0].count += 1;
      else if (sc < 5) buckets[1].count += 1;
      else if (sc < 6.5) buckets[2].count += 1;
      else if (sc < 8) buckets[3].count += 1;
      else buckets[4].count += 1;
    });
    return buckets;
  }, [gradedSubs]);

  const classAverageData = useMemo(() => {
    return classes.map((cls) => {
      const clsSubs = submissions.filter(
        (s) => s.classId === cls.id && typeof s.totalScore === 'number'
      );
      const avg =
        clsSubs.length > 0
          ? roundExact(
              clsSubs.reduce((acc, s) => acc + (s.totalScore || 0), 0) /
                clsSubs.length
            )
          : 0;
      return {
        name: cls.name.split('–')[0].trim(),
        avgScore: avg,
        count: clsSubs.length,
      };
    });
  }, [classes, submissions]);

  const timelineProgressData = useMemo(() => {
    const sorted = [...gradedSubs].sort((a, b) =>
      (a.gradedAt || a.updatedAt).localeCompare(b.gradedAt || b.updatedAt)
    );
    return sorted.map((s, idx) => ({
      label: `#${idx + 1} (${formatDateVN(s.gradedAt || s.updatedAt)})`,
      score: roundExact(s.totalScore || 0),
      student: s.studentName,
    }));
  }, [gradedSubs]);

  const skillRadarData = useMemo(() => {
    if (gradedSubs.length === 0) return [];
    let readingTotal = 0;
    let readingMax = 0;
    let writingTotal = 0;
    let writingMax = 0;

    gradedSubs.forEach((s) => {
      const qVals = Object.values(s.questionScores || {});
      readingTotal += qVals.reduce((a, b) => a + (Number(b) || 0), 0);
      readingMax += qVals.length > 0 ? 4 : 0;

      const rVals = Object.values(s.rubricScores || {});
      writingTotal += rVals.reduce((a, b) => a + (Number(b) || 0), 0);
      writingMax += rVals.length > 0 ? 6 : 0;
    });

    const readingPct =
      readingMax > 0 ? Math.min(100, Math.round((readingTotal / readingMax) * 100)) : 0;
    const writingPct =
      writingMax > 0 ? Math.min(100, Math.round((writingTotal / writingMax) * 100)) : 0;
    const avgPct = Math.round((averageScore / 10) * 100);

    return [
      { skill: 'Đọc hiểu', score: readingPct || avgPct },
      { skill: 'Viết nghị luận', score: writingPct || avgPct },
      { skill: 'Hoàn thành bài', score: completionRate },
      { skill: 'Điểm trung bình (%)', score: avgPct },
    ];
  }, [gradedSubs, averageScore, completionRate]);

  const handleExportReportExcel = () => {
    const rows = gradedSubs.map((s, idx) => ({
      STT: idx + 1,
      'Học sinh': s.studentName,
      'Lớp': classes.find((c) => c.id === s.classId)?.name || '—',
      'Trạng thái': s.status,
      'Điểm số': s.totalScore ?? '',
      'Ngày cập nhật': formatDateVN(s.gradedAt || s.updatedAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bao cao thong ke');
    XLSX.writeFile(wb, 'bao_cao_thong_ke_ngu_van.xlsx');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Thống kê và báo cáo
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tổng hợp số liệu thực tế từ kho đề, lớp học và bài đã chấm trong hệ thống.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExportReportExcel}
            disabled={gradedSubs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0F2942] hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E]"
          >
            <Printer className="w-4 h-4" />
            In báo cáo A4
          </button>
        </div>
      </div>

      {/* Summary KPI Cards from Real DB */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-4">
          <div className="text-xs font-semibold text-slate-500">Đề kiểm tra trong kho</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#0F2942] mt-1">
            {exams.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Đợt giao bài: <span className="font-mono tabular-nums">{assignments.length}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-4">
          <div className="text-xs font-semibold text-slate-500">Bài đã có điểm</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#0D7A6F] mt-1">
            {gradedSubs.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tổng bản ghi theo dõi: <span className="font-mono tabular-nums">{filteredSubs.length}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-4">
          <div className="text-xs font-semibold text-slate-500">Điểm trung bình thực tế</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#0F2942] mt-1">
            {gradedSubs.length > 0 ? formatScore(averageScore) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Thang điểm 10</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-4">
          <div className="text-xs font-semibold text-slate-500">Tỉ lệ hoàn thành bài</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#0F2942] mt-1">
            {filteredSubs.length > 0 ? `${completionRate}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Tính trên bài đã giao</div>
        </div>
      </div>

      {gradedSubs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-10 text-center space-y-2">
          <BarChart3 className="w-8 h-8 mx-auto text-slate-400" />
          <h2 className="text-base font-bold text-[#0F2942]">
            Chưa có dữ liệu điểm số thực tế để vẽ biểu đồ
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Hệ thống chỉ thống kê từ bài làm và kết quả chấm thật trong cơ sở dữ liệu (không tạo số liệu giả lập). Hãy giao bài và chấm ít nhất 1 bài ở mục Chấm bài để biểu đồ phổ điểm và tiến bộ tự động hiển thị.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Score Distribution */}
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5">
            <h2 className="text-sm font-bold text-[#0F2942] mb-4">
              Phổ điểm thực tế theo khoảng điểm
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số bài" fill="#0F2942" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Class Averages */}
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5">
            <h2 className="text-sm font-bold text-[#0F2942] mb-4">
              Điểm trung bình theo từng lớp
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classAverageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="avgScore"
                    name="Điểm TB"
                    fill="#0D7A6F"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Progress Line */}
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5">
            <h2 className="text-sm font-bold text-[#0F2942] mb-4">
              Diễn biến điểm số qua các bài đã chấm
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Điểm"
                    stroke="#0F2942"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Skill Radar */}
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5">
            <h2 className="text-sm font-bold text-[#0F2942] mb-4">
              Tổng quan năng lực Đọc hiểu & Viết (%)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillRadarData}>
                  <PolarGrid stroke="#E5E0D8" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Mức đạt (%)"
                    dataKey="score"
                    stroke="#0D7A6F"
                    fill="#0D7A6F"
                    fillOpacity={0.35}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
