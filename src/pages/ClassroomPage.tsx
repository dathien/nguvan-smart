import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Archive,
  Download,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { db, ensureDatabaseSeeded } from '../database/db';
import { GRADE_LEVELS } from '../config/curriculum';
import { Classroom, GradeLevel, StudentRecord, UserProfile } from '../types';
import { formatDateVN, generateId, slugifyFilename } from '../utils/formatters';

interface ClassroomPageProps {
  activeUser: UserProfile;
}

export const ClassroomPage: React.FC<ClassroomPageProps> = ({ activeUser }) => {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Inline create/edit class form
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState<GradeLevel>('12');
  const [academicYear, setAcademicYear] = useState('2025 - 2026');

  // Inline add/edit student form
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [transferTargetClassId, setTransferTargetClassId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = async (preferredClassId?: string) => {
    await ensureDatabaseSeeded();
    const allClasses = await db.classes.toArray();
    allClasses.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setClasses(allClasses);
    const activeId =
      preferredClassId && allClasses.some((c) => c.id === preferredClassId)
        ? preferredClassId
        : selectedClassId && allClasses.some((c) => c.id === selectedClassId)
        ? selectedClassId
        : allClasses[0]?.id || '';
    setSelectedClassId(activeId);
    if (activeId) {
      const list = await db.students.where('classId').equals(activeId).toArray();
      list.sort((a, b) => a.studentCode.localeCompare(b.studentCode, 'vi'));
      setStudents(list);
    } else {
      setStudents([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    (async () => {
      const list = await db.students
        .where('classId')
        .equals(selectedClassId)
        .toArray();
      list.sort((a, b) => a.studentCode.localeCompare(b.studentCode, 'vi'));
      setStudents(list);
    })();
  }, [selectedClassId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || null;
  const visibleClasses = classes.filter((c) =>
    showArchived ? true : !c.archived
  );
  const filteredStudents = students.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  const generateJoinCode = (grade: GradeLevel) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `NV${grade}${suffix}`;
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    const now = new Date().toISOString();
    if (editingClassId) {
      const existing = classes.find((c) => c.id === editingClassId);
      if (!existing) return;
      await db.classes.put({
        ...existing,
        name: className.trim(),
        grade: classGrade,
        academicYear: academicYear.trim() || '2025 - 2026',
        updatedAt: now,
      });
      setStatusMessage(`Đã cập nhật lớp "${className.trim()}".`);
    } else {
      const created: Classroom = {
        id: generateId('class'),
        ownerId: activeUser.id,
        name: className.trim(),
        grade: classGrade,
        academicYear: academicYear.trim() || '2025 - 2026',
        joinCode: generateJoinCode(classGrade),
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      await db.classes.put(created);
      setStatusMessage(`Đã tạo lớp "${created.name}" với mã tham gia ${created.joinCode}.`);
      setSelectedClassId(created.id);
    }
    setShowClassForm(false);
    setEditingClassId(null);
    setClassName('');
    await loadData();
  };

  const handleToggleArchive = async (cls: Classroom) => {
    await db.classes.put({
      ...cls,
      archived: !cls.archived,
      updatedAt: new Date().toISOString(),
    });
    setStatusMessage(
      cls.archived
        ? `Đã khôi phục lớp "${cls.name}".`
        : `Đã lưu trữ lớp "${cls.name}".`
    );
    await loadData();
  };

  const handleRegenerateCode = async (cls: Classroom) => {
    const nextCode = generateJoinCode(cls.grade);
    await db.classes.put({
      ...cls,
      joinCode: nextCode,
      updatedAt: new Date().toISOString(),
    });
    setStatusMessage(`Đã cấp mã tham gia mới cho lớp "${cls.name}": ${nextCode}.`);
    await loadData();
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !studentName.trim()) return;
    const now = new Date().toISOString();
    const code =
      studentCode.trim() ||
      `HS${selectedClass.grade}${String(students.length + 1).padStart(3, '0')}`;

    if (editingStudentId) {
      const existing = students.find((s) => s.id === editingStudentId);
      if (!existing) return;
      const targetClassId = transferTargetClassId || selectedClass.id;
      await db.students.put({
        ...existing,
        classId: targetClassId,
        studentCode: code,
        fullName: studentName.trim(),
        email: studentEmail.trim() || undefined,
      });
      setStatusMessage(
        targetClassId !== selectedClass.id
          ? `Đã cập nhật và chuyển học sinh "${studentName.trim()}" sang lớp mới.`
          : `Đã cập nhật thông tin học sinh "${studentName.trim()}".`
      );
    } else {
      const created: StudentRecord = {
        id: generateId('stu'),
        classId: selectedClass.id,
        studentCode: code,
        fullName: studentName.trim(),
        email: studentEmail.trim() || undefined,
        ownerId: activeUser.id,
        createdAt: now,
      };
      await db.students.put(created);
      setStatusMessage(`Đã thêm học sinh "${created.fullName}" vào lớp ${selectedClass.name}.`);
    }

    setStudentCode('');
    setStudentName('');
    setStudentEmail('');
    setEditingStudentId(null);
    setTransferTargetClassId('');
    const list = await db.students
      .where('classId')
      .equals(selectedClass.id)
      .toArray();
    list.sort((a, b) => a.studentCode.localeCompare(b.studentCode, 'vi'));
    setStudents(list);
  };

  const handleDeleteStudent = async (stu: StudentRecord) => {
    await db.students.delete(stu.id);
    setStudents((prev) => prev.filter((s) => s.id !== stu.id));
    setStatusMessage(`Đã xóa học sinh "${stu.fullName}" khỏi lớp.`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClass) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: '',
      });
      const existingCodes = new Set(students.map((s) => s.studentCode.toLowerCase()));
      const toInsert: StudentRecord[] = [];
      const now = new Date().toISOString();

      rows.forEach((row, index) => {
        const keys = Object.keys(row);
        const findVal = (candidates: string[]) => {
          const foundKey = keys.find((k) =>
            candidates.some((c) => k.toLowerCase().includes(c))
          );
          return foundKey ? String(row[foundKey] ?? '').trim() : '';
        };
        const fullName =
          findVal(['họ tên', 'ho ten', 'họ và tên', 'tên', 'name', 'fullname']) ||
          '';
        if (!fullName) return;
        const code =
          findVal(['mã', 'ma hs', 'mã học sinh', 'code', 'stt']) ||
          `HS${selectedClass.grade}${String(students.length + index + 1).padStart(3, '0')}`;
        if (existingCodes.has(code.toLowerCase())) return;
        existingCodes.add(code.toLowerCase());
        const email = findVal(['email', 'mail', 'thư']);
        toInsert.push({
          id: generateId('stu'),
          classId: selectedClass.id,
          studentCode: code,
          fullName,
          email: email || undefined,
          ownerId: activeUser.id,
          createdAt: now,
        });
      });

      if (toInsert.length > 0) {
        await db.students.bulkPut(toInsert);
        const updatedList = await db.students
          .where('classId')
          .equals(selectedClass.id)
          .toArray();
        updatedList.sort((a, b) => a.studentCode.localeCompare(b.studentCode, 'vi'));
        setStudents(updatedList);
        setStatusMessage(
          `Đã nhập thành công ${toInsert.length} học sinh từ tệp "${file.name}".`
        );
      } else {
        setStatusMessage(
          'Không tìm thấy dòng học sinh hợp lệ mới trong tệp Excel (cần cột "Họ và tên" hoặc "Tên").'
        );
      }
    } catch {
      setStatusMessage('Không thể đọc tệp Excel. Vui lòng kiểm tra định dạng .xlsx / .xls.');
    } finally {
      e.target.value = '';
    }
  };

  const handleExportExcel = () => {
    if (!selectedClass) return;
    const rows = students.map((s, idx) => ({
      STT: idx + 1,
      'Mã học sinh': s.studentCode,
      'Họ và tên': s.fullName,
      Email: s.email || '',
      Lớp: selectedClass.name,
      'Khối': selectedClass.grade,
      'Năm học': selectedClass.academicYear,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sach lop');
    XLSX.writeFile(
      wb,
      `danh_sach_${slugifyFilename(selectedClass.name)}.xlsx`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Quản lý lớp học
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tạo lớp, cấp mã tham gia, quản lý danh sách học sinh và nhập/xuất bảng Excel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingClassId(null);
              setClassName('');
              setClassGrade('12');
              setAcademicYear('2025 - 2026');
              setShowClassForm((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F2942] text-white text-sm font-semibold hover:bg-[#173B5E]"
          >
            <Plus className="w-4 h-4" />
            Tạo lớp học mới
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-[#0D7A6F]/10 border border-[#0D7A6F]/30 text-[#0F2942] rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-xs font-semibold text-[#0D7A6F] hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Inline Create / Edit Class Panel */}
      {showClassForm && (
        <form
          onSubmit={handleSaveClass}
          className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F2942]">
              {editingClassId ? 'Cập nhật thông tin lớp học' : 'Thêm lớp học mới'}
            </h2>
            <button
              type="button"
              onClick={() => setShowClassForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Hủy
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên lớp học
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Ví dụ: Lớp 11A3 – Ngữ văn"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F2942] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khối lớp
              </label>
              <select
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value as GradeLevel)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-[#0F2942] focus:outline-none"
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
                Năm học
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025 - 2026"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F2942] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0B665D]"
            >
              {editingClassId ? 'Lưu thay đổi' : 'Xác nhận tạo lớp'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Class List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0F2942]">
                Danh sách lớp ({visibleClasses.length})
              </h2>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Hiện lớp lưu trữ
              </label>
            </div>

            {visibleClasses.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                Chưa có lớp học nào. Nhấn "Tạo lớp học mới" để bắt đầu.
              </p>
            ) : (
              <div className="space-y-2">
                {visibleClasses.map((cls) => {
                  const active = cls.id === selectedClassId;
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : 'bg-[#FAF8F5]/60 border-[#E5E0D8] hover:border-[#0F2942]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {cls.name}
                          </div>
                          <div
                            className={`text-xs mt-1 ${
                              active ? 'text-slate-200' : 'text-slate-500'
                            }`}
                          >
                            Khối {cls.grade} · {cls.academicYear} · Mã:{' '}
                            <span className="font-mono font-semibold">
                              {cls.joinCode}
                            </span>
                          </div>
                        </div>
                        {cls.archived && (
                          <span
                            className={`text-[11px] font-medium ${
                              active ? 'text-amber-200' : 'text-amber-700'
                            }`}
                          >
                            Lưu trữ
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Selected Class Detail & Student Roster */}
        <div className="lg:col-span-8 space-y-4">
          {selectedClass ? (
            <>
              <div className="bg-white rounded-xl border border-[#E5E0D8] p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#0F2942]">
                      {selectedClass.name}
                    </h2>
                    <div className="text-xs text-slate-600 mt-1">
                      Khối {selectedClass.grade} · Năm học {selectedClass.academicYear} ·
                      Mã tham gia:{' '}
                      <span className="font-mono font-bold text-[#0D7A6F]">
                        {selectedClass.joinCode}
                      </span>{' '}
                      · Cập nhật {formatDateVN(selectedClass.updatedAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClassId(selectedClass.id);
                        setClassName(selectedClass.name);
                        setClassGrade(selectedClass.grade);
                        setAcademicYear(selectedClass.academicYear);
                        setShowClassForm(true);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-[#0F2942] hover:bg-slate-50"
                    >
                      Sửa tên lớp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateCode(selectedClass)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-[#0F2942] hover:bg-slate-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Đổi mã lớp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(selectedClass)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {selectedClass.archived ? 'Bỏ lưu trữ' : 'Lưu trữ lớp'}
                    </button>
                  </div>
                </div>

                {/* Add / Edit Student Inline Form */}
                <form
                  onSubmit={handleSaveStudent}
                  className="mt-4 bg-[#FAF8F5] rounded-lg border border-[#E5E0D8] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#0F2942] inline-flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-[#0D7A6F]" />
                      {editingStudentId
                        ? 'Chỉnh sửa / chuyển lớp học sinh'
                        : 'Thêm học sinh vào lớp'}
                    </div>
                    {editingStudentId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStudentId(null);
                          setStudentCode('');
                          setStudentName('');
                          setStudentEmail('');
                          setTransferTargetClassId('');
                        }}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="Mã HS (tự động nếu trống)"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-[#0F2942] focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Họ và tên học sinh"
                      className="sm:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-[#0F2942] focus:outline-none"
                    />
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="Email (tùy chọn)"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-[#0F2942] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {editingStudentId ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600">Chuyển sang lớp:</span>
                        <select
                          value={transferTargetClassId || selectedClass.id}
                          onChange={(e) => setTransferTargetClassId(e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        Hỗ trợ nhập hàng loạt từ tệp Excel (.xlsx, .xls) có cột "Họ và tên", "Mã học sinh".
                      </div>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D]"
                    >
                      {editingStudentId ? 'Lưu cập nhật' : 'Thêm học sinh'}
                    </button>
                  </div>
                </form>

                {/* Toolbar: Search & Excel Import/Export */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm theo tên hoặc mã học sinh..."
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-sm focus:border-[#0F2942] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-[#0F2942] hover:bg-slate-50 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-[#0D7A6F]" />
                      Nhập danh sách Excel
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportExcel}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      disabled={students.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-[#0F2942] hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0F2942]" />
                      Xuất Excel ({students.length})
                    </button>
                  </div>
                </div>

                {/* Roster Table */}
                <div className="mt-4 overflow-x-auto border border-[#E5E0D8] rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FAF8F5] text-xs font-semibold text-[#0F2942] border-b border-[#E5E0D8]">
                      <tr>
                        <th className="py-2.5 px-3 w-12">STT</th>
                        <th className="py-2.5 px-3">Mã HS</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D8]">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-sm text-slate-500"
                          >
                            <Users className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                            Chưa có học sinh nào khớp bộ lọc trong lớp này.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((stu, idx) => (
                          <tr key={stu.id} className="hover:bg-[#FAF8F5]/60">
                            <td className="py-2.5 px-3 font-mono tabular-nums text-xs text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-xs font-semibold text-[#0F2942]">
                              {stu.studentCode}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#0F2942]">
                              {stu.fullName}
                            </td>
                            <td className="py-2.5 px-3 text-xs text-slate-600">
                              {stu.email || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudentId(stu.id);
                                  setStudentCode(stu.studentCode);
                                  setStudentName(stu.fullName);
                                  setStudentEmail(stu.email || '');
                                  setTransferTargetClassId(stu.classId);
                                }}
                                className="text-xs font-medium text-[#0D7A6F] hover:underline"
                              >
                                Sửa / Chuyển lớp
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(stu)}
                                className="inline-flex items-center text-xs text-rose-600 hover:underline"
                                title="Xóa học sinh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-10 text-center text-sm text-slate-500">
              Chọn hoặc tạo một lớp học ở cột bên trái để quản lý danh sách học sinh.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
