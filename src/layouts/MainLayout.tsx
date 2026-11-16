import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  Award,
  BarChart3,
  BookOpen,
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
      { path: '/huong-dan-su-dung', label: 'Hướng dẫn sử dụng', icon: BookOpen },
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
      { path: '/ngan-hang-ngu-lieu', label: 'Ngân hàng ngữ liệu', icon: Library },
      { path: '/ke-hoach-bai-day', label: 'Kế hoạch bài dạy', icon: BookOpen },
      { path: '/bai-giang', label: 'Bài giảng và trình chiếu', icon: Presentation },
      { path: '/so-do-tu-duy', label: 'Sơ đồ tư duy', icon: GitBranch },
      { path: '/phieu-hoc-tap', label: 'Phiếu học tập', icon: FileCheck2 },
    ],
  },
  {
    id: 'labs',
    label: 'Phòng thực hành',
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
  const [topMenuOpen, setTopMenuOpen] = useState(false);
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
      {/* Clean Top Bar (3-zone contract) */}
      <header className="app-topbar no-print sticky top-0 z-40 min-h-14 bg-white/95 backdrop-blur border-b border-[#E5E0D8] px-2 sm:px-3 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
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
            className="text-sm sm:text-base font-bold tracking-tight text-[#0F2942] truncate min-w-0"
          >
            Ngữ Văn Thông Minh
          </Link>
        </div>

        {/* Center concise links */}
        <nav className="hidden 2xl:flex items-center gap-2 text-[13px] font-medium text-slate-600">
          <Link
            to="/soan-de"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/soan-de' ? 'text-[#0F2942] font-semibold' : ''
            }`}
          >
            Soạn đề
          </Link>
          <Link
            to="/ma-tran-dac-ta"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/ma-tran-dac-ta' ? 'text-[#0F2942] font-semibold' : ''
            }`}
          >
            Ma trận & Đặc tả
          </Link>
          <Link
            to="/ngan-hang-ngu-lieu"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/ngan-hang-ngu-lieu' ? 'text-[#0F2942] font-semibold' : ''
            }`}
          >
            Ngữ liệu
          </Link>
          <Link
            to="/bai-giang"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/bai-giang' ? 'text-[#0F2942] font-semibold' : ''
            }`}
          >
            Bài giảng
          </Link>
          <Link
            to="/luyen-thi-thpt"
            className={`hover:text-[#0F2942] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/luyen-thi-thpt' ? 'text-[#0F2942] font-semibold' : ''
            }`}
          >
            Luyện thi THPT
          </Link>
        </nav>

        {/* Right Primary Action / Workspace Role Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link to="/huong-dan-su-dung" aria-label="Hướng dẫn sử dụng" title="Hướng dẫn sử dụng" className="inline-flex items-center gap-1 rounded-lg border border-teal-700/30 px-2 py-2 text-teal-800 hover:bg-teal-50"><BookOpen className="w-4 h-4"/><span className="hidden 2xl:inline text-sm font-semibold">Hướng dẫn</span></Link>
          {!isOnline && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md whitespace-nowrap">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ngoại tuyến</span>
            </span>
          )}

          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0D7A6F]/30 text-[#0D7A6F] text-xs font-medium hover:bg-[#0D7A6F]/5 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Cài đặt ứng dụng
            </button>
          )}
          {!isInstalled && !isInstallable && isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Cài trên iOS
            </button>
          )}

          {activeUser.roles.length > 1 && (
            <div className="hidden 2xl:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {activeUser.roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSwitchRole(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
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
            className="hidden md:inline-flex px-2.5 py-1.5 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] transition-colors whitespace-nowrap shrink-0"
          >
            Soạn đề mới
          </button>
          <button type="button" aria-expanded={topMenuOpen} aria-controls="compact-top-menu" onClick={() => setTopMenuOpen(v => !v)} className="2xl:hidden inline-flex items-center gap-1 p-2 rounded-lg border border-slate-200 text-sm whitespace-nowrap" title="Menu chức năng"><Menu className="w-4 h-4"/><span className="hidden sm:inline">Menu</span></button>
        </div>
        {topMenuOpen && (
          <div id="compact-top-menu" className="2xl:hidden absolute top-full right-2 left-2 sm:left-auto sm:w-72 max-h-[75vh] overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50">
            {[{path:'/soan-de',label:'Soạn đề thông minh'},{path:'/ma-tran-dac-ta',label:'Ma trận & Đặc tả'},{path:'/ngan-hang-ngu-lieu',label:'Ngữ liệu'},{path:'/bai-giang',label:'Bài giảng'},{path:'/luyen-thi-thpt',label:'Luyện thi THPT'},{path:'/huong-dan-su-dung',label:'Hướng dẫn sử dụng'}].map(item => <Link key={item.path} to={item.path} onClick={() => setTopMenuOpen(false)} className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">{item.label}</Link>)}
            {!isInstalled && isInstallable && <button type="button" onClick={() => { setTopMenuOpen(false); install(); }} className="block w-full text-left px-3 py-2 text-sm">Cài đặt ứng dụng</button>}
            {!isInstalled && !isInstallable && isIOS && <button type="button" onClick={() => { setTopMenuOpen(false); setShowIOSGuide(true); }} className="block w-full text-left px-3 py-2 text-sm">Cài trên iOS</button>}
            {activeUser.roles.length > 1 && activeUser.roles.map(r => <button key={r} type="button" onClick={() => { onSwitchRole(r); setTopMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded text-sm ${activeUser.activeRole === r ? 'bg-slate-100 font-semibold' : ''}`}>{roleLabels[r]}</button>)}
            <button type="button" onClick={() => { navigate('/soan-de'); setTopMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded bg-[#0F2942] text-white text-sm">Soạn đề mới</button>
          </div>
        )}
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

      {/* iOS Install instruction sheet */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 no-print">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-[#0F2942]">
              Cài đặt trên iPhone / iPad
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              1. Nhấn nút <strong>Chia sẻ (Share)</strong> trên thanh công cụ Safari.
              <br />
              2. Cuộn xuống và chọn <strong>Thêm vào Màn hình chính</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-lg bg-[#0F2942] py-2 text-sm font-medium text-white hover:bg-[#173B5E]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
