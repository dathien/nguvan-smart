import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { db, ensureDatabaseSeeded } from '../database/db';
import {
  Assignment,
  AssignmentKind,
  Classroom,
  ExamDocument,
  ReadingPassage,
  StudentRecord,
  Submission,
  UserProfile,
  WorksheetDocument,
} from '../types';
import { formatDateTimeVN, generateId } from '../utils/formatters';

interface AssignmentsPageProps {
  activeUser: UserProfile;
}

const ASSIGNMENT_KINDS: AssignmentKind[] = [
  'Đề kiểm tra',
  'Bài đọc hiểu',
  'Bài luyện viết',
  'Phiếu học tập',
  'Trò chơi',
];

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({ activeUser }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [exams, setExams] = useState<ExamDocument[]>([]);
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [worksheets, setWorksheets] = useState<WorksheetDocument[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AssignmentKind>('Đề kiểm tra');
  const [classId, setClassId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [startAt, setStartAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [allowViewAnswersAfter, setAllowViewAnswersAfter] = useState<
    'never' | 'after-submit' | 'after-grading'
  >('after-grading');
  const [allowViewScoreAfter, setAllowViewScoreAfter] = useState<
    'after-submit' | 'after-grading'
  >('after-grading');
  const [allowLate, setAllowLate] = useState(false);
  const [notice, setNotice] = useState('');

  const loadAll = async () => {
    await ensureDatabaseSeeded();
    const [asgList, clsList, examList, pasList, wsList, subList, stuList] =
      await Promise.all([
        db.assignments.toArray(),
        db.classes.filter((c) => !c.archived).toArray(),
        db.exams.toArray(),
        db.passages.toArray(),
        db.worksheets.toArray(),
        db.submissions.toArray(),
        db.students.toArray(),
      ]);
    asgList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setAssignments(asgList);
    setClasses(clsList);
    setExams(examList);
    setPassages(pasList);
    setWorksheets(wsList);
    setSubmissions(subList);
    setStudents(stuList);

    if (!classId && clsList.length > 0) setClassId(clsList[0].id);
    if (!targetId && examList.length > 0) setTargetId(examList[0].id);
    if (!selectedAssignmentId && asgList.length > 0) {
      setSelectedAssignmentId(asgList[0].id);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const getTargetOptions = () => {
    if (kind === 'Đề kiểm tra') {
      return exams.map((e) => ({ id: e.id, label: e.adminInfo.title }));
    }
    if (kind === 'Bài đọc hiểu') {
      return passages.map((p) => ({
        id: p.id,
        label: `${p.title} (${p.genre} – Lớp ${p.grade})`,
      }));
    }
    if (kind === 'Phiếu học tập') {
      return worksheets.map((w) => ({
        id: w.id,
        label: `${w.title} (Lớp ${w.grade})`,
      }));
    }
    if (kind === 'Bài luyện viết') {
      return [
        { id: 'writing-nlxh-600', label: 'Nghị luận xã hội (khoảng 600 chữ)' },
        { id: 'writing-nlvh-200', label: 'Đoạn văn nghị luận văn học (200 chữ)' },
        { id: 'writing-nlvh-600', label: 'Bài văn phân tích tác phẩm (600 chữ)' },
      ];
    }
    return [
      { id: 'game-tu-tu', label: 'Nhận diện biện pháp tu từ' },
      { id: 'game-tac-gia', label: 'Ai là tác giả?' },
      { id: 'game-sap-xep', label: 'Sắp xếp cốt truyện / khổ thơ' },
    ];
  };

  const targetOptions = getTargetOptions();

  const handleKindChange = (nextKind: AssignmentKind) => {
    setKind(nextKind);
    setTargetId('');
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) {
      setNotice('Vui lòng chọn lớp học trước khi giao bài.');
      return;
    }
    const chosenTargetId = targetId || targetOptions[0]?.id || 'custom';
    const chosenTargetLabel =
      targetOptions.find((t) => t.id === chosenTargetId)?.label || kind;
    const now = new Date().toISOString();

    const created: Assignment = {
      id: generateId('asg'),
      ownerId: activeUser.id,
      title: title.trim() || `${kind}: ${chosenTargetLabel}`,
      kind,
      classId,
      targetId: chosenTargetId,
      startAt: new Date(startAt).toISOString(),
      dueAt: new Date(dueAt).toISOString(),
      durationMinutes: Number(durationMinutes) || 45,
      maxAttempts: Number(maxAttempts) || 1,
      allowViewAnswersAfter,
      allowViewScoreAfter,
      allowLate,
      createdAt: now,
      updatedAt: now,
    };

    await db.assignments.put(created);

    // Pre-create tracking rows ("Chưa bắt đầu") for students currently in the class
    const classStudents = students.filter((s) => s.classId === classId);
    if (classStudents.length > 0) {
      const initialSubs: Submission[] = classStudents.map((stu) => ({
        id: generateId('sub'),
        assignmentId: created.id,
        classId,
        studentId: stu.id,
        studentName: stu.fullName,
        status: 'Chưa bắt đầu',
        readingAnswers: {},
        writingAnswers: {},
        questionScores: {},
        rubricScores: {},
        highlights: [],
        teacherComment: '',
        updatedAt: now,
      }));
      await db.submissions.bulkPut(initialSubs);
    }

    setShowCreateForm(false);
    setTitle('');
    setSelectedAssignmentId(created.id);
    setNotice(`Đã giao bài "${created.title}" cho lớp thành công.`);
    await loadAll();
  };

  const handleDeleteAssignment = async (id: string) => {
    await db.assignments.delete(id);
    await db.submissions.where('assignmentId').equals(id).delete();
    if (selectedAssignmentId === id) setSelectedAssignmentId('');
    setNotice('Đã xóa bài giao và dữ liệu theo dõi liên quan.');
    await loadAll();
  };

  const selectedAssignment =
    assignments.find((a) => a.id === selectedAssignmentId) || null;
  const selectedSubs = selectedAssignment
    ? submissions.filter((s) => s.assignmentId === selectedAssignment.id)
    : [];

  const getClassName = (cid: string) =>
    classes.find((c) => c.id === cid)?.name || 'Lớp học';

  const statusCounts = {
    total: selectedSubs.length,
    notStarted: selectedSubs.filter((s) => s.status === 'Chưa bắt đầu').length,
    inProgress: selectedSubs.filter((s) => s.status === 'Đang làm').length,
    submitted: selectedSubs.filter(
      (s) => s.status === 'Đã nộp' || s.status === 'Nộp muộn'
    ).length,
    graded: selectedSubs.filter((s) => s.status === 'Đã chấm').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Giao bài và kiểm tra
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Giao đề kiểm tra, bài đọc hiểu, luyện viết, phiếu học tập hoặc trò chơi tới từng lớp và theo dõi tiến độ nộp bài.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F2942] text-white text-sm font-semibold hover:bg-[#173B5E]"
        >
          <Plus className="w-4 h-4" />
          Tạo đợt giao bài mới
        </button>
      </div>

      {notice && (
        <div className="bg-[#0D7A6F]/10 border border-[#0D7A6F]/30 text-[#0F2942] rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-xs font-semibold text-[#0D7A6F] hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleCreateAssignment}
          className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F2942]">
              Thiết lập bài giao mới
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-slate-500 hover:underline"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu đề đợt giao bài
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Để trống sẽ tự đặt theo tên học liệu đã chọn"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F2942] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lớp nhận bài
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại bài giao
              </label>
              <select
                value={kind}
                onChange={(e) => handleKindChange(e.target.value as AssignmentKind)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {ASSIGNMENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nội dung / Tài liệu nguồn
              </label>
              <select
                value={targetId || targetOptions[0]?.id || ''}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {targetOptions.length === 0 ? (
                  <option value="">Chưa có học liệu loại này trong kho</option>
                ) : (
                  targetOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thời gian mở bài
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hạn nộp bài
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số lần làm
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Xem đáp án
              </label>
              <select
                value={allowViewAnswersAfter}
                onChange={(e) =>
                  setAllowViewAnswersAfter(
                    e.target.value as 'never' | 'after-submit' | 'after-grading'
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="after-grading">Sau khi giáo viên chấm xong</option>
                <option value="after-submit">Ngay sau khi nộp bài</option>
                <option value="never">Không mở đáp án</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Xem điểm số
              </label>
              <select
                value={allowViewScoreAfter}
                onChange={(e) =>
                  setAllowViewScoreAfter(
                    e.target.value as 'after-submit' | 'after-grading'
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="after-grading">Sau khi giáo viên công bố điểm</option>
                <option value="after-submit">Ngay sau khi nộp bài</option>
              </select>
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                />
                Cho phép nộp muộn (ghi nhận trạng thái Nộp muộn)
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0B665D]"
            >
              <Send className="w-4 h-4" />
              Phát hành bài giao
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assignment list */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-4 space-y-3">
            <h2 className="text-sm font-bold text-[#0F2942]">
              Các đợt đã giao ({assignments.length})
            </h2>
            {assignments.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                <ClipboardList className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                Chưa có đợt giao bài nào.
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignments.map((asg) => {
                  const active = asg.id === selectedAssignmentId;
                  return (
                    <div
                      key={asg.id}
                      onClick={() => setSelectedAssignmentId(asg.id)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : 'bg-[#FAF8F5]/60 border-[#E5E0D8] hover:border-[#0F2942]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium opacity-80">
                            {asg.kind} · {getClassName(asg.classId)}
                          </div>
                          <div className="font-semibold text-sm mt-0.5 line-clamp-2">
                            {asg.title}
                          </div>
                          <div className="text-[11px] mt-1.5 opacity-80 flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5" />
                            Hạn nộp: {formatDateTimeVN(asg.dueAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssignment(asg.id);
                          }}
                          className={`p-1 rounded hover:bg-black/10 ${
                            active ? 'text-rose-200' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Xóa bài giao"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Assignment Submission Tracking */}
        <div className="lg:col-span-7">
          {selectedAssignment ? (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D8] pb-4">
                <div>
                  <div className="text-xs font-semibold text-[#0D7A6F]">
                    {selectedAssignment.kind} · {getClassName(selectedAssignment.classId)}
                  </div>
                  <h2 className="font-serif text-lg font-bold text-[#0F2942] mt-0.5">
                    {selectedAssignment.title}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1">
                    Thời lượng: <span className="font-mono tabular-nums">{selectedAssignment.durationMinutes}</span> phút · Số lần tối đa:{' '}
                    <span className="font-mono tabular-nums">{selectedAssignment.maxAttempts}</span> · Hạn nộp:{' '}
                    {formatDateTimeVN(selectedAssignment.dueAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/cham-bai')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D] shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mở khu vực chấm bài
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                  <div className="text-xs text-slate-500">Tổng HS</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#0F2942]">
                    {statusCounts.total}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                  <div className="text-xs text-slate-500">Chưa bắt đầu</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-600">
                    {statusCounts.notStarted}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                  <div className="text-xs text-slate-500">Đang làm</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-amber-700">
                    {statusCounts.inProgress}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                  <div className="text-xs text-slate-500">Đã nộp</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#0D7A6F]">
                    {statusCounts.submitted}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                  <div className="text-xs text-slate-500">Đã chấm</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#0F2942]">
                    {statusCounts.graded}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#E5E0D8] rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#FAF8F5] text-xs font-semibold text-[#0F2942] border-b border-[#E5E0D8]">
                    <tr>
                      <th className="py-2.5 px-3">Học sinh</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Thời điểm nộp</th>
                      <th className="py-2.5 px-3 text-right">Điểm số</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {selectedSubs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-sm text-slate-500"
                        >
                          Lớp chưa có học sinh hoặc chưa có bản ghi bài làm.
                        </td>
                      </tr>
                    ) : (
                      selectedSubs.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#FAF8F5]/50">
                          <td className="py-2.5 px-3 font-medium text-[#0F2942]">
                            {sub.studentName}
                          </td>
                          <td className="py-2.5 px-3 text-xs font-medium">
                            <span
                              className={
                                sub.status === 'Đã chấm'
                                  ? 'text-[#0D7A6F]'
                                  : sub.status === 'Đã nộp'
                                  ? 'text-[#0F2942]'
                                  : sub.status === 'Nộp muộn'
                                  ? 'text-rose-700'
                                  : 'text-slate-500'
                              }
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-600">
                            {sub.submittedAt ? formatDateTimeVN(sub.submittedAt) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#0F2942]">
                            {typeof sub.totalScore === 'number'
                              ? sub.totalScore.toLocaleString('vi-VN', {
                                  maximumFractionDigits: 2,
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-10 text-center text-sm text-slate-500">
              Chọn một đợt giao bài bên trái hoặc nhấn "Tạo đợt giao bài mới" để phát hành cho học sinh.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
