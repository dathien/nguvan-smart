import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CloudOff,
  Lock,
  Shield,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { db, ensureDatabaseSeeded } from '../database/db';
import { GRADE_LEVELS, TEXTBOOK_SERIES } from '../config/curriculum';
import { getCloudConnectionStatus } from '../services/firebaseConfigService';
import { GradeLevel, UserProfile, UserRole } from '../types';
import { formatDateTimeVN, generateId } from '../utils/formatters';

interface AccountPageProps {
  activeUser: UserProfile;
  onSwitchRole: (role: UserRole) => void;
  onSwitchPortalUser: (userId: string) => void;
  onUserUpdated: (user: UserProfile) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  activeUser,
  onSwitchRole,
  onSwitchPortalUser,
  onUserUpdated,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [profileName, setProfileName] = useState(activeUser.fullName);
  const [profileSchool, setProfileSchool] = useState(activeUser.schoolName);
  const [profileDept, setProfileDept] = useState(activeUser.department);
  const [profileGrade, setProfileGrade] = useState<GradeLevel>(
    activeUser.gradeFocus || '12'
  );

  // Admin: add new local account
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [newDept, setNewDept] = useState('Tổ Ngữ văn');
  const [studentJoinCode, setStudentJoinCode] = useState('');
  const [notice, setNotice] = useState('');

  const cloudStatus = getCloudConnectionStatus();

  const loadUsers = async () => {
    await ensureDatabaseSeeded();
    const list = await db.users.toArray();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setProfileName(activeUser.fullName);
    setProfileSchool(activeUser.schoolName);
    setProfileDept(activeUser.department);
    setProfileGrade(activeUser.gradeFocus || '12');
  }, [activeUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...activeUser,
      fullName: profileName.trim() || activeUser.fullName,
      schoolName: profileSchool.trim() || activeUser.schoolName,
      department: profileDept.trim() || activeUser.department,
      gradeFocus: profileGrade,
      updatedAt: new Date().toISOString(),
    };
    await db.users.put(updated);
    onUserUpdated(updated);
    await loadUsers();
    setNotice('Đã lưu cập nhật hồ sơ cá nhân.');
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    const created: UserProfile = {
      id: generateId(newRole),
      fullName: newName.trim(),
      email: newEmail.trim(),
      roles: [newRole],
      activeRole: newRole,
      schoolName: activeUser.schoolName,
      department: newDept.trim() || 'Tổ Ngữ văn',
      gradeFocus: '12',
      status: 'active',
      authProvider: 'local',
      updatedAt: new Date().toISOString(),
    };
    await db.users.put(created);
    setNewName('');
    setNewEmail('');
    setNotice(`Đã thêm tài khoản "${created.fullName}".`);
    await loadUsers();
  };

  const handleUpdateUserStatus = async (
    target: UserProfile,
    nextStatus: 'active' | 'pending' | 'locked'
  ) => {
    const updated = {
      ...target,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    await db.users.put(updated);
    await loadUsers();
    setNotice(
      `Đã chuyển trạng thái tài khoản "${target.fullName}" sang ${
        nextStatus === 'active'
          ? 'Đang hoạt động'
          : nextStatus === 'locked'
          ? 'Đã khóa'
          : 'Chờ duyệt'
      }.`
    );
  };

  const handleJoinByClassCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = studentJoinCode.trim().toUpperCase();
    if (!code) return;
    const matchedClass = await db.classes
      .filter((c) => c.joinCode.toUpperCase() === code && !c.archived)
      .first();
    if (!matchedClass) {
      setNotice(`Không tìm thấy lớp học nào có mã "${code}".`);
      return;
    }
    setNotice(
      `Đã xác nhận mã lớp "${matchedClass.name}" (Khối ${matchedClass.grade}). Bạn có thể chuyển sang tài khoản Học sinh để vào làm bài.`
    );
  };

  const roleLabels: Record<UserRole, string> = {
    admin: 'Quản trị viên hệ thống',
    teacher: 'Giáo viên Ngữ văn',
    student: 'Học sinh',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-[#E5E0D8] pb-5">
        <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
          Tài khoản và Phân quyền
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Quản lý hồ sơ cá nhân, chuyển đổi nhanh không gian làm việc Quản trị / Giáo viên / Học sinh và kiểm soát quyền truy cập.
        </p>
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

      {/* Honest Cloud Sync Status Banner */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-4 flex items-start gap-3">
        <CloudOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <div className="font-bold text-[#0F2942]">
            Trạng thái xác thực & đồng bộ đám mây: Lưu trữ cục bộ (IndexedDB)
          </div>
          <p className="mt-0.5">{cloudStatus.note}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Active User & Role Switcher */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F2942]">
                Phiên làm việc hiện tại
              </h2>
              <span className="text-xs font-semibold text-[#0D7A6F]">
                {roleLabels[activeUser.activeRole]}
              </span>
            </div>

            {activeUser.roles.length > 1 && (
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                <div className="text-xs font-semibold text-[#0F2942]">
                  Chuyển nhanh không gian làm việc (không cần đăng xuất):
                </div>
                <div className="flex gap-2">
                  {activeUser.roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onSwitchRole(r)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                        activeUser.activeRole === r
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : 'bg-white text-[#0F2942] border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {r === 'admin' ? 'Quản trị hệ thống' : 'Giáo viên'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đơn vị công tác / Trường THPT
                </label>
                <input
                  type="text"
                  value={profileSchool}
                  onChange={(e) => setProfileSchool(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tổ chuyên môn / Lớp
                  </label>
                  <input
                    type="text"
                    value={profileDept}
                    onChange={(e) => setProfileDept(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khối trọng tâm
                  </label>
                  <select
                    value={profileGrade}
                    onChange={(e) => setProfileGrade(e.target.value as GradeLevel)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  >
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>
                        Lớp {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0B665D]"
              >
                Lưu thông tin tài khoản
              </button>
            </form>
          </div>

          {/* Student Join Code Checker */}
          <form
            onSubmit={handleJoinByClassCode}
            className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-[#0F2942]">
              Kiểm tra mã tham gia lớp học (dành cho Học sinh)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={studentJoinCode}
                onChange={(e) => setStudentJoinCode(e.target.value)}
                placeholder="Nhập mã lớp (ví dụ: NV12A1)..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono uppercase"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E]"
              >
                Kiểm tra
              </button>
            </div>
          </form>
        </div>

        {/* Account Directory & Admin Role Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <div className="inline-flex items-center gap-2 text-base font-bold text-[#0F2942]">
                <Users className="w-4 h-4 text-[#0D7A6F]" />
                Danh sách tài khoản trên thiết bị ({users.length})
              </div>
              {activeUser.activeRole === 'admin' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D7A6F]">
                  <Shield className="w-3.5 h-3.5" /> Quyền Quản trị viên đang bật
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {users.map((u) => {
                const isCurrent = u.id === activeUser.id;
                return (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-[#FAF8F5] border-[#0F2942]/40'
                        : 'bg-white border-[#E5E0D8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#0F2942]">
                          {u.fullName}
                        </span>
                        {isCurrent && (
                          <span className="text-[11px] font-semibold text-[#0D7A6F]">
                            · Đang đăng nhập
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {u.email} · {u.roles.map((r) => roleLabels[r]).join(' + ')} ·{' '}
                        {u.status === 'active'
                          ? 'Hoạt động'
                          : u.status === 'locked'
                          ? 'Đã khóa'
                          : 'Chờ duyệt'}{' '}
                        · Cập nhật {formatDateTimeVN(u.updatedAt)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {!isCurrent && u.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => onSwitchPortalUser(u.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-medium hover:bg-[#173B5E]"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Chuyển sang tài khoản này
                        </button>
                      )}
                      {activeUser.activeRole === 'admin' && !isCurrent && (
                        <>
                          {u.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserStatus(u, 'active')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#0D7A6F] text-[#0D7A6F] text-xs font-medium hover:bg-[#0D7A6F]/5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Duyệt / Mở khóa
                            </button>
                          )}
                          {u.status !== 'locked' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserStatus(u, 'locked')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-xs font-medium hover:bg-rose-50"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Khóa
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {activeUser.activeRole === 'admin' ? (
              <form
                onSubmit={handleAddAccount}
                className="pt-4 border-t border-[#E5E0D8] space-y-3"
              >
                <div className="text-xs font-bold text-[#0F2942] inline-flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#0D7A6F]" />
                  Cấp tài khoản giáo viên / học sinh mới (Quản trị viên)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Họ và tên..."
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email..."
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  >
                    <option value="teacher">Giáo viên Ngữ văn</option>
                    <option value="student">Học sinh</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="Tổ chuyên môn hoặc Lớp..."
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D]"
                  >
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-slate-600 flex items-center gap-2">
                <Unlock className="w-4 h-4 text-slate-500" />
                Chuyển sang vai trò "Quản trị hệ thống" ở thanh trên cùng nếu bạn muốn phê duyệt hoặc khóa tài khoản người dùng.
              </div>
            )}
          </div>

          {/* Curriculum Catalog Reference */}
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-2">
            <h3 className="text-sm font-bold text-[#0F2942]">
              Danh mục Chương trình & Bộ sách đang hỗ trợ
            </h3>
            <div className="text-xs text-slate-600 leading-relaxed">
              Khối lớp: Lớp 10, Lớp 11, Lớp 12 (THPT và GDTX) · Bộ sách:{' '}
              {TEXTBOOK_SERIES.join(', ')}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
