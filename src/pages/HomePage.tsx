import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Gamepad2,
  GraduationCap,
  Layers,
  Pause,
  Play,
  Presentation,
  Users,
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  description: string;
  ctaLabel: string;
  targetPath: string;
  imageUrl: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    kicker: 'Phân hệ 01 · Soạn đề & Kiểm định',
    title: 'Soạn đề kiểm tra thông minh',
    description:
      'Trình soạn thảo song song hai cột với bản xem trước khổ A4 theo thời gian thực, hỗ trợ đầy đủ lớp 10, 11, 12 và ba bộ sách GDPT 2018.',
    ctaLabel: 'Mở trình soạn đề',
    targetPath: '/soan-de',
    imageUrl: '/src/assets/images/slide_smart_exam_1794726656403.jpg',
  },
  {
    id: 'slide-2',
    kicker: 'Phân hệ 02 · Đánh giá chuẩn hóa',
    title: 'Ma trận, bản đặc tả và hướng dẫn chấm',
    description:
      'Đồng bộ dữ liệu từ một nguồn duy nhất, tự động phát hiện sai lệch điểm số và xuất trọn bộ hồ sơ Word, PDF chuyên nghiệp.',
    ctaLabel: 'Xem ma trận & đặc tả',
    targetPath: '/ma-tran-dac-ta',
    imageUrl: '/src/assets/images/slide_matrix_rubric_1794726654623.jpg',
  },
  {
    id: 'slide-3',
    kicker: 'Phân hệ 03 · Ngữ liệu & Tương tác',
    title: 'Khám phá thế giới văn học',
    description:
      'Không gian thực hành phân tích thơ ca, cốt truyện, văn bản nghị luận và thông tin với sơ đồ tư duy tương tác trực quan.',
    ctaLabel: 'Vào phòng thực hành',
    targetPath: '/kham-pha-tho',
    imageUrl: '/src/assets/images/slide_literature_world_1794726655728.jpg',
  },
  {
    id: 'slide-4',
    kicker: 'Phân hệ 04 · Năng lực ngôn ngữ',
    title: 'Phát triển năng lực đọc và viết',
    description:
      'Xưởng luyện viết 7 bước giúp học sinh tự tìm ý, lập dàn ý, viết bài và tự kiểm tra theo từng tiêu chí rubric.',
    ctaLabel: 'Mở xưởng luyện viết',
    targetPath: '/luyen-viet',
    imageUrl: '/src/assets/images/slide_reading_writing_1794726657601.jpg',
  },
  {
    id: 'slide-5',
    kicker: 'Phân hệ 05 · Lớp học số & Trình chiếu',
    title: 'Bài giảng tương tác và lớp học số',
    description:
      'Chuyển đề thi thành bài giảng 16:9, trình chiếu toàn màn hình, xuất HTML hoạt động độc lập và quản lý lớp học toàn diện.',
    ctaLabel: 'Thiết kế bài giảng',
    targetPath: '/bai-giang',
    imageUrl: '/src/assets/images/slide_digital_classroom_1794726657780.jpg',
  },
];

const FEATURE_GROUPS = [
  {
    num: '01',
    title: 'Soạn đề, Ma trận & Kiểm định',
    description:
      'Soạn đề đọc hiểu và viết linh hoạt theo mẫu 2025 hoặc định kỳ 10–11–12; đồng bộ ma trận, bản đặc tả, barem và kiểm tra lỗi tự động.',
    icon: FileText,
    path: '/soan-de',
    actionText: 'Vào phân hệ Soạn đề',
  },
  {
    num: '02',
    title: 'Ngân hàng Ngữ liệu & Nhập Word',
    description:
      'Lưu trữ ngữ liệu theo khối lớp, bộ sách, thể loại và trạng thái xác minh nguồn; nhập đề từ file DOCX giữ nguyên khổ thơ, đoạn văn.',
    icon: BookOpen,
    path: '/ngan-hang-ngu-lieu',
    actionText: 'Mở kho Ngữ liệu',
  },
  {
    num: '03',
    title: 'Bài giảng, KHBD & Phiếu học tập',
    description:
      'Soạn kế hoạch bài dạy 4 hoạt động chuẩn GDPT 2018, thiết kế slide trình chiếu 16:9 và phiếu học tập hai phiên bản GV – HS.',
    icon: Presentation,
    path: '/bai-giang',
    actionText: 'Mở Bài giảng & Trình chiếu',
  },
  {
    num: '04',
    title: 'Phòng thực hành & Trò chơi Ngữ văn',
    description:
      'Khám phá thơ, truyện, sơ đồ tư duy, luyện thi THPT 120 phút và 8 trò chơi Ngữ văn tương tác cho cá nhân hoặc đội nhóm.',
    icon: Gamepad2,
    path: '/tro-choi',
    actionText: 'Khám phá Trò chơi & Thực hành',
  },
  {
    num: '05',
    title: 'Quản lý Lớp học, Giao bài & Chấm bài',
    description:
      'Quản lý danh sách lớp bằng Excel, giao bài trực tuyến có hẹn giờ, chấm bài bằng rubric hai cột và theo dõi biểu đồ tiến bộ.',
    icon: Users,
    path: '/lop-hoc',
    actionText: 'Quản lý Lớp học',
  },
  {
    num: '06',
    title: 'Sao lưu, Xuất hồ sơ & Offline PWA',
    description:
      'Xuất DOCX chỉnh sửa được, PDF khổ A4, ZIP trọn bộ hồ sơ và sao lưu toàn bộ kho dữ liệu để chuyển máy làm việc ngoại tuyến.',
    icon: Layers,
    path: '/sao-luu',
    actionText: 'Sao lưu & Phục hồi',
  },
];

interface HomePageProps {
  activeUser: UserProfile;
  onSelectPortal: (portal: 'teacher' | 'student') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activeUser,
  onSelectPortal,
}) => {
  const navigate = useNavigate();
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const currentSlide = HERO_SLIDES[slideIdx];

  return (
    <div className="bg-[#FAF8F5]">
      {/* Hero Banner & Auto-Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#0D7A6F] uppercase">
              Smart Literature · GDPT 2018 · Lớp 10 – 11 – 12 & GDTX
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0F2942] leading-tight mt-1">
              Văn Học Thông Minh
            </h1>
            <p className="text-slate-600 text-base mt-1.5 max-w-2xl">
              Khơi nguồn cảm hứng – Phát triển năng lực ngôn ngữ. Hệ thống soạn giảng, kiểm tra, đánh giá và phát triển năng lực Ngữ văn THPT.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Kết nối tri thức</span>
            <span aria-hidden="true">·</span>
            <span>Chân trời sáng tạo</span>
            <span aria-hidden="true">·</span>
            <span>Cánh Diều</span>
          </div>
        </div>

        {/* Interactive 5-Topic Slider */}
        <div className="bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
              <div>
                <div className="text-xs font-semibold text-[#0D7A6F]">
                  {currentSlide.kicker}
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F2942] mt-2 leading-snug">
                  {currentSlide.title}
                </h2>
                <p className="text-slate-600 text-[15px] leading-relaxed mt-3">
                  {currentSlide.description}
                </p>
              </div>

              <div className="mt-8 space-y-5">
                <button
                  type="button"
                  onClick={() => navigate(currentSlide.targetPath)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F2942] text-white text-sm font-semibold hover:bg-[#173B5E] transition-colors"
                >
                  {currentSlide.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Slider Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {HERO_SLIDES.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-label={`Chuyển đến chủ đề ${idx + 1}: ${s.title}`}
                        onClick={() => setSlideIdx(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === slideIdx
                            ? 'w-7 bg-[#0F2942]'
                            : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAutoPlay((v) => !v)}
                      aria-label={autoPlay ? 'Tạm dừng chuyển slide' : 'Tự động chuyển slide'}
                      className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      {autoPlay ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIdx(
                          (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
                        )
                      }
                      aria-label="Slide trước"
                      className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)
                      }
                      aria-label="Slide tiếp theo"
                      className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[340px] lg:min-h-[410px] bg-[#0F2942]">
              {!imgErrors[currentSlide.id] ? (
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.title}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [currentSlide.id]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#0F2942] to-[#0D7A6F] text-white">
                  <BookOpen className="w-12 h-12 mb-3 opacity-80" />
                  <div className="font-serif text-xl font-bold">
                    {currentSlide.title}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Two Clear Role Portals Below Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0F2942] uppercase tracking-wide">
                  Cổng dành cho Nhà giáo
                </span>
                <ClipboardCheck className="w-5 h-5 text-[#0D7A6F]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#0F2942] mt-2">
                Góc Giáo viên
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Soạn đề kiểm tra hai cột A4, lập ma trận và bản đặc tả đồng bộ, xây dựng hướng dẫn chấm chi tiết, thiết kế bài giảng 16:9, giao bài và chấm bài theo rubric.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onSelectPortal('teacher');
                  navigate('/tong-quan');
                }}
                className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-sm font-semibold hover:bg-[#173B5E] transition-colors"
              >
                Vào không gian Giáo viên
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectPortal('teacher');
                  navigate('/soan-de');
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-[#0F2942] text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Soạn đề ngay
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0D7A6F] uppercase tracking-wide">
                  Cổng dành cho Học sinh THPT & GDTX
                </span>
                <GraduationCap className="w-5 h-5 text-[#0F2942]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#0F2942] mt-2">
                Góc Học sinh
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Khám phá thơ ca và truyện qua sơ đồ tương tác, luyện viết 7 bước từ tìm ý đến hoàn thiện bài, luyện thi THPT trực tuyến và tham gia 8 trò chơi Ngữ văn.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onSelectPortal('student');
                  navigate('/luyen-thi-thpt');
                }}
                className="px-4 py-2 rounded-lg bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0B665D] transition-colors"
              >
                Vào không gian Học sinh
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectPortal('student');
                  navigate('/luyen-viet');
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-[#0F2942] text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Xưởng luyện viết
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Group Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0F2942]">
              Hệ sinh thái nghiệp vụ Ngữ văn THPT
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Phiên làm việc hiện tại: {activeUser.fullName} · Vai trò đang mở:{' '}
              {activeUser.activeRole === 'admin'
                ? 'Quản trị hệ thống'
                : activeUser.activeRole === 'teacher'
                ? 'Giáo viên'
                : 'Học sinh'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURE_GROUPS.map((grp) => {
            const Icon = grp.icon;
            return (
              <div
                key={grp.num}
                className="bg-white rounded-xl border border-[#E5E0D8] p-5 flex flex-col justify-between hover:border-[#0F2942]/35 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono tabular-nums font-semibold text-[#0D7A6F]">
                      {grp.num}.
                    </span>
                    <Icon className="w-4 h-4 text-[#0F2942]" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F2942] mt-2">
                    {grp.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {grp.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(grp.path)}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F2942] hover:text-[#0D7A6F] transition-colors"
                >
                  {grp.actionText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
