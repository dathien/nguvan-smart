import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  Award,
  BarChart3,
  BookOpen,
  Box,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Database,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Gamepad2,
  GitBranch,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  Library,
  Menu,
  PenTool,
  Presentation,
  Settings,
  Shield,
  Sparkles,
  UserCircle2,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { UserProfile, UserRole } from '../types';

interface NavGroup {
  id: string;
  label: string;
  items: {
    path: string;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    items: [
      { path: '/', label: 'Trang chủ', icon: Home },
      { path: '/tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
      { path: '/kham-pha-2d-3d', label: 'Khám phá Ngữ văn 2D/3D', icon: Box },
      { path: '/huong-dan-su-dung', label: 'Hướng dẫn sử dụng', icon: HelpCircle },
    ],
  },
  {
    id: 'assessment',
    label: 'Soạn đề và đánh giá',
    items: [
      { path: '/soan-de', label: 'Soạn đề thông minh', icon: FileText },
      { path: '/ma-tran-dac-ta', label: 'Ma trận và bản đặc tả', icon: FileSpreadsheet },
      { path: '/huong-dan-cham', label: 'Hướng dẫn chấm', icon: ClipboardCheck },
      { path: '/ngan-hang-cau-hoi', label: 'Ngân hàng câu hỏi', icon: Database },
      { path: '/kho-de', label: 'Kho đề kiểm tra', icon: FolderArchive },
    ],
  },
  {
    id: 'materials',
    label: 'Học liệu và bài giảng',
    items: [
      { path: '/kham-pha-2d-3d', label: 'Khám phá Ngữ văn 2D/3D', icon: Box },
      { path: '/ngan-hang-ngu-lieu', label: 'Ngân hàng ngữ liệu', icon: Library },
      { path: '/ke-hoach-bai-day', label: 'Kế hoạch bài dạy', icon: BookOpen },
      { path: '/bai-giang', label: 'Bài giảng và trình chiếu', icon: Presentation },
      { path: '/so-do-tu-duy', label: 'Sơ đồ tư duy', icon: GitBranch },
      { path: '/phieu-hoc-tap', label: 'Phiếu học tập', icon: FileCheck2 },
    ],
  },
  {
    id: 'labs',
    label: 'Thực hành & Luyện tập',
    items: [
      { path: '/kham-pha-tho', label: 'Khám phá thơ ca', icon: Sparkles },
      { path: '/kham-pha-truyen', label: 'Khám phá truyện', icon: BookOpen },
      { path: '/luyen-viet', label: 'Phòng luyện viết', icon: PenTool },
      { path: '/luyen-thi-thpt', label: 'Luyện thi THPT', icon: GraduationCap },
      { path: '/tro-choi', label: 'Trò chơi Ngữ văn', icon: Gamepad2 },
    ],
  },
  {
    id: 'management',
    label: 'Quản lý',
    items: [
      { path: '/lop-hoc', label: 'Quản lý lớp học', icon: Users },
      { path: '/giao-bai', label: 'Giao bài và kiểm tra', icon: CheckSquare },
      { path: '/cham-bai', label: 'Chấm bài và nhận xét', icon: Award },
      { path: '/thong-ke', label: 'Thống kê và báo cáo', icon: BarChart3 },
    ],
  },
  {
    id: 'system',
    label: 'Hệ thống',
    items: [
      { path: '/huong-dan-su-dung', label: 'Hướng dẫn sử dụng', icon: HelpCircle },
      { path: '/tro-ly-ai', label: 'Trợ lý AI', icon: Sparkles },
      { path: '/sao-luu', label: 'Sao lưu và phục hồi', icon: Archive },
      { path: '/tai-khoan', label: 'Tài khoản', icon: UserCircle2 },
      { path: '/cai-dat', label: 'Cài đặt', icon: Settings },
    ],
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
  activeUser: UserProfile;
  onSwitchRole: (role: UserRole) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeUser,
  onSwitchRole,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    assessment: true,
    materials: false,
    labs: false,
    management: false,
    system: false,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const roleLabels: Record<UserRole, string> = {
    admin: 'Quản trị hệ thống',
    teacher: 'Giáo viên',
    student: 'Học sinh',
  };

  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#102438]">
      {/* Clean Top Bar (Balanced, non-overflowing across desktop & mobile) */}
      <header className="app-topbar no-print sticky top-0 z-40 h-14 bg-white/95 backdrop-blur border-b border-[#E5E0D8] px-3 lg:px-5 flex items-center justify-between gap-2 overflow-x-clip">
        <div className="flex items-center gap-2 shrink-0">
          {!isLanding && (
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileMenuOpen((v) => !v);
                } else {
                  setSidebarCollapsed((v) => !v);
                }
              }}
              aria-label="Mở/thu gọn danh mục"
              className="p-2 rounded-lg text-[#0F2942] hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link
            to="/"
            className="font-serif text-[17px] font-bold tracking-tight text-[#0F2942] whitespace-nowrap shrink-0"
          >
            Ngữ Văn Thông Minh
          </Link>
        </div>

        {/* Center concise links — never overflows or hides Hướng dẫn sử dụng */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-[13px] font-semibold text-slate-600 min-w-0">
          <Link
            to="/kham-pha-2d-3d"
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
              location.pathname.startsWith('/kham-pha-2d-3d')
                ? 'bg-[#1D63ED] text-white'
                : 'bg-blue-50 text-[#1D63ED] hover:bg-blue-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Khám phá 2D/3D</span>
          </Link>
          <Link
            to="/soan-de"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/soan-de' ? 'text-[#0F2942] font-bold' : ''
            }`}
          >
            Soạn đề
          </Link>
          <Link
            to="/ma-tran-dac-ta"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/ma-tran-dac-ta' ? 'text-[#0F2942] font-bold' : ''
            }`}
          >
            Ma trận
          </Link>
          <Link
            to="/ngan-hang-ngu-lieu"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/ngan-hang-ngu-lieu' ? 'text-[#0F2942] font-bold' : ''
            }`}
          >
            Ngữ liệu
          </Link>
          <Link
            to="/bai-giang"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/bai-giang' ? 'text-[#0F2942] font-bold' : ''
            }`}
          >
            Bài giảng
          </Link>
          <Link
            to="/luyen-thi-thpt"
            className={`hidden xl:inline hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/luyen-thi-thpt' ? 'text-[#0F2942] font-bold' : ''
            }`}
          >
            Luyện thi THPT
          </Link>
          <Link
            to="/huong-dan-su-dung"
            className={`inline-flex items-center gap-1 hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/huong-dan-su-dung' ? 'text-[#1D63ED] font-bold' : ''
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hướng dẫn sử dụng</span>
          </Link>
        </nav>

        {/* Right Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isOnline && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md whitespace-nowrap">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ngoại tuyến</span>
            </span>
          )}

          {/* Mobile quick links for Khám phá 2D/3D and Hướng dẫn sử dụng */}
          <Link
            to="/kham-pha-2d-3d"
            className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1D63ED] text-white text-xs font-bold whitespace-nowrap"
          >
            <Box className="w-3.5 h-3.5" />
            <span>2D/3D</span>
          </Link>
          <Link
            to="/huong-dan-su-dung"
            className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[#0F2942] text-xs font-semibold whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hướng dẫn</span>
          </Link>

          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                if (isInstallable) {
                  install();
                } else {
                  setShowIOSGuide(true);
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#0D7A6F]/35 text-[#0D7A6F] text-xs font-semibold hover:bg-[#0D7A6F]/5 transition-colors whitespace-nowrap shrink-0"
              title="Cài ứng dụng Ngữ Văn Thông Minh dùng offline trên máy tính hoặc điện thoại"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài ứng dụng dùng offline</span>
            </button>
          )}

          {activeUser.roles.length > 1 && (
            <div className="hidden xl:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {activeUser.roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSwitchRole(r)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeUser.activeRole === r
                      ? 'bg-[#0F2942] text-white'
                      : 'text-slate-600 hover:text-[#0F2942]'
                  }`}
                >
                  {r === 'admin' ? (
                    <span className="inline-flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Quản trị
                    </span>
                  ) : (
                    roleLabels[r]
                  )}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/soan-de')}
            className="hidden md:inline-flex px-3 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] transition-colors whitespace-nowrap shrink-0"
          >
            Soạn đề mới
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* Collapsible Grouped Sidebar (shown in workspace routes, hidden on landing unless toggled on mobile) */}
        {!isLanding && (
          <>
            {/* Mobile backdrop */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black/30 z-40 lg:hidden no-print"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}

            <aside
              className={`no-print bg-white border-r border-[#E5E0D8] shrink-0 transition-all duration-200 z-50 lg:z-20 ${
                mobileMenuOpen
                  ? 'fixed inset-y-0 left-0 w-64 shadow-xl'
                  : 'hidden lg:block'
              } ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
            >
              <div className="h-full flex flex-col">
                <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[#E5E0D8]">
                  <span className="font-serif font-bold text-[#0F2942]">Danh mục</span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-md hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* User summary strip (NO author credit in sidebar) */}
                {!sidebarCollapsed && (
                  <div className="px-4 py-3 border-b border-[#E5E0D8] bg-[#FAF8F5]/60">
                    <div className="text-xs font-semibold text-[#0F2942] truncate">
                      {activeUser.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {roleLabels[activeUser.activeRole]} · {activeUser.department}
                    </div>
                  </div>
                )}

                <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                  {NAV_GROUPS.map((group) => {
                    const isOpen = openGroups[group.id];
                    const hasActiveItem = group.items.some(
                      (i) => i.path === location.pathname
                    );
                    return (
                      <div key={group.id} className="pb-1">
                        {!sidebarCollapsed ? (
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                              hasActiveItem
                                ? 'text-[#0F2942] bg-slate-100/70'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F2942]'
                            }`}
                          >
                            <span className="truncate">{group.label}</span>
                            {isOpen || hasActiveItem ? (
                              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>
                        ) : (
                          <div className="h-px bg-slate-200 my-1.5" />
                        )}

                        {(isOpen || hasActiveItem || sidebarCollapsed) && (
                          <div className="mt-0.5 space-y-0.5 pl-1">
                            {group.items.map((item) => {
                              const Icon = item.icon;
                              const active = location.pathname === item.path;
                              return (
                                <Link
                                  key={item.path}
                                  to={item.path}
                                  onClick={() => setMobileMenuOpen(false)}
                                  title={item.label}
                                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                                    active
                                      ? 'bg-[#0F2942] text-white font-medium'
                                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#0F2942]'
                                  }`}
                                >
                                  <Icon className="w-4 h-4 shrink-0" />
                                  {!sidebarCollapsed && (
                                    <span className="truncate">{item.label}</span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1">{children}</div>

          {/* Exact Footer mandated by Section 4.4 */}
          <footer className="app-footer no-print border-t border-[#E5E0D8] bg-white px-6 py-4 text-center text-xs text-slate-600">
            Copyright © 2026 – Phát triển bởi Thầy Hồ Nguyễn Đa Thiện.
          </footer>
        </main>
      </div>

      {/* Multi-OS Offline PWA Install Instruction Modal (Windows, macOS, Android, iOS) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#0F2942]">
                  Cài đặt Ngữ Văn Thông Minh dùng Offline (PWA)
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  Cài trực tiếp thành ứng dụng độc lập trên thiết bị, không cần tải tệp cài đặt rời.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[14px] text-slate-700 leading-relaxed">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="font-bold text-[#0F2942]">1. Máy tính Windows / macOS (Chrome, Edge)</p>
                <p className="mt-1">
                  Nhấn biểu tượng <strong>Cài đặt ứng dụng (hình màn hình có mũi tên)</strong> ở góc phải thanh địa chỉ trình duyệt → chọn <strong>Cài đặt (Install)</strong>.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="font-bold text-[#0F2942]">2. Điện thoại / Máy tính bảng Android (Chrome)</p>
                <p className="mt-1">
                  Nhấn nút menu <strong>⋮</strong> ở góc phải trên → chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào Màn hình chính</strong>.
                </p>
              </div>
              <div className={`rounded-xl p-3 border ${isIOS ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                <p className="font-bold text-[#0F2942]">3. iPhone / iPad (Safari)</p>
                <p className="mt-1">
                  Nhấn biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới → cuộn xuống chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong> → nhấn <strong>Thêm</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Link
                to="/kham-pha-2d-3d"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0F2942] hover:bg-slate-50"
              >
                Tải gói bài 2D/3D offline
              </Link>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-xl bg-[#0F2942] px-5 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
