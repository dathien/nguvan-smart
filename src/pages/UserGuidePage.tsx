import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  GitBranch,
  GraduationCap,
  HelpCircle,
  Layers,
  Laptop,
  MonitorPlay,
  Presentation,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface GuideSection {
  number: string;
  title: string;
  icon: React.FC<{ className?: string }>;
  summary: string;
  steps: string[];
  actionLabel?: string;
  actionTo?: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    number: '01',
    title: 'Giới thiệu phân hệ Khám phá Ngữ văn 2D/3D',
    icon: Sparkles,
    summary:
      'Phân hệ trực quan giúp giáo viên giảng dạy sinh động và học sinh trải nghiệm sâu tác phẩm văn học THPT 10–11–12 theo Chương trình GDPT 2018.',
    steps: [
      'Gồm trọn bộ 40 bài mô phỏng: 10 bài Ngữ văn 10, 10 bài Ngữ văn 11, 10 bài Ngữ văn 12 và 10 bài Kiến thức – Kĩ năng Ngữ văn dùng chung.',
      'Hoạt động hoàn toàn miễn phí trên trình duyệt, không yêu cầu đăng nhập Firebase, không cần nhập API Key hay cài phần mềm ngoài.',
      'Mọi tiến độ khám phá, câu trả lời, ghi chú và gói học liệu offline được lưu an toàn ngay trên thiết bị của thầy/cô và học sinh.',
    ],
    actionLabel: 'Mở danh mục 40 bài Khám phá 2D/3D',
    actionTo: '/kham-pha-2d-3d',
  },
  {
    number: '02',
    title: 'Cách tìm kiếm và lọc bài học theo lớp, bộ sách, thể loại',
    icon: BookOpen,
    summary:
      'Nhanh chóng tìm đúng tác phẩm trong 3 bộ sách Kết nối tri thức với cuộc sống, Chân trời sáng tạo và Cánh Diều.',
    steps: [
      'Chọn nhóm tab: Tất cả (40), Ngữ văn 10, Ngữ văn 11, Ngữ văn 12, Kiến thức & Kĩ năng, Đã xem hoặc Yêu thích.',
      'Nhập tên tác phẩm, tác giả hoặc chủ đề vào ô tìm kiếm (hỗ trợ cả tiếng Việt có dấu và không dấu, ví dụ: "chu nguoi tu tu" hoặc "Tay Tien").',
      'Kết hợp các bộ lọc Bộ sách, Thể loại, Chế độ 2D/3D và Nhóm nội dung để thu hẹp danh sách tức thì.',
    ],
    actionLabel: 'Thử tìm kiếm trong kho 40 bài',
    actionTo: '/kham-pha-2d-3d',
  },
  {
    number: '03',
    title: 'Cách tương tác với mô phỏng 3D trực quan',
    icon: Box,
    summary:
      '26 tác phẩm trọng tâm được dựng dưới dạng sa bàn 3D góc nhìn isometric sắc nét, có nhãn nổi tiếng Việt rõ ràng.',
    steps: [
      'Kéo chuột (hoặc vuốt tay trên điện thoại/máy tính bảng) để xoay không gian 3D 360°; cuộn chuột hoặc chụm 2 ngón để thu phóng.',
      'Nhấp trực tiếp vào từng nhãn nổi màu trắng hoặc mô hình 3D để vòng sáng xanh định vị đối tượng và mở bảng phân tích chi tiết bên phải.',
      'Nhấn nút “Góc nhìn gốc” để đưa camera về khung hình chuẩn ban đầu hoặc “Đang hiện nhãn / Đã ẩn nhãn” để bật tắt lớp nhãn.',
    ],
    actionLabel: 'Trải nghiệm 3D: Chữ người tử tù',
    actionTo: '/kham-pha-2d-3d/sim-03',
  },
  {
    number: '04',
    title: 'Cách sử dụng chế độ 2D & Phòng thực hành kĩ năng Ngữ văn',
    icon: Layers,
    summary:
      'Chế độ 2D không lặp lại hình ảnh 3D mà cung cấp công cụ phân tích tư duy riêng biệt cho đọc hiểu và viết.',
    steps: [
      'Với các tác phẩm văn học: chuyển sang “Sơ đồ & Phân tích 2D” để xem 3 lớp học liệu gồm Sơ đồ quan hệ & lập luận (có phóng to/kéo thả), Diễn biến tác phẩm (Storyboard) và Bản đồ điểm khám phá 2D.',
      'Với 10 bài Kiến thức & Kĩ năng (#31–#40): trực tiếp thao tác đổi ngôi kể, đảo trật tự cốt truyện, ngắt nhịp thơ, lắp ghép luận điểm – dẫn chứng và viết đoạn 200 chữ / bài văn 600 chữ có đếm từ thời gian thực.',
    ],
    actionLabel: 'Thử phòng thực hành Ngôi kể & Điểm nhìn',
    actionTo: '/kham-pha-2d-3d/sim-31',
  },
  {
    number: '05',
    title: 'Điều khiển tiến trình chặng và điều chỉnh tham số minh họa',
    icon: MonitorPlay,
    summary:
      'Mỗi mô phỏng chia thành nhiều chặng diễn biến gắn với điểm neo văn bản để giáo viên dẫn dắt tiết học mạch lạc.',
    steps: [
      'Nhấp từng nút “Chặng 1, Chặng 2…” hoặc nút Trước / Sau để chuyển cảnh và tự động xoay tâm quan sát.',
      'Nhấn “Tự chạy các chặng” để trình chiếu liên hoàn theo tốc độ 0.75x, 1.0x hoặc 1.25x.',
      'Trong tab Khám phá bên phải, kéo các thanh trượt “Điều chỉnh bối cảnh minh họa” (ví dụ độ cao cột chống trời, ánh đuốc, sóng biển, sương mù…) để quan sát sự biến đổi trực quan.',
    ],
    actionLabel: 'Mở mô phỏng 4 chặng: Thần Trụ Trời',
    actionTo: '/kham-pha-2d-3d/sim-01',
  },
  {
    number: '06',
    title: 'Sử dụng lời dẫn thuyết minh tiếng Việt và phụ đề văn bản',
    icon: Volume2,
    summary:
      'Tích hợp giọng đọc tiếng Việt miễn phí từ trình duyệt/thiết bị, tuyệt đối không dùng giọng tiếng Anh thay thế.',
    steps: [
      'Nhấn “Đọc lời dẫn chặng này” hoặc biểu tượng loa trên từng điểm khám phá và câu hỏi để nghe thuyết minh.',
      'Điều chỉnh tốc độ đọc bằng menu 0.75x / 1.0x / 1.25x hoặc nhấn “Tắt tiếng” bất cứ lúc nào.',
      'Nếu thiết bị chưa cài gói giọng đọc tiếng Việt (vi-VN), hệ thống sẽ thông báo rõ ràng và luôn hiển thị trọn vẹn lời dẫn bằng văn bản dễ đọc.',
    ],
  },
  {
    number: '07',
    title: 'Tiến trình tự học 6 bước dành cho học sinh THPT',
    icon: GraduationCap,
    summary:
      'Giúp học sinh chủ động đọc hiểu trước khi lên lớp hoặc ôn tập củng cố kiến thức sau giờ học.',
    steps: [
      'Bước 1–2: Đọc mục tiêu, quan sát không gian 3D/2D và bấm mở lần lượt tất cả điểm khám phá.',
      'Bước 3: Chuyển sang tab “Thực hành” để làm nhiệm vụ ghép nối / phân loại chi tiết và nhấn “Kiểm tra kết quả nhiệm vụ”.',
      'Bước 4–5: Trả lời 5 câu hỏi đọc hiểu (tab “Câu hỏi”), xem gợi ý chấm, rồi hoàn thành bài viết vận dụng ở tab “Vận dụng”.',
    ],
    actionLabel: 'Mở bài luyện tập: Vợ nhặt (Lớp 11)',
    actionTo: '/kham-pha-2d-3d/sim-11',
  },
  {
    number: '08',
    title: 'Chế độ Trình chiếu dạy học dành cho giáo viên trên lớp',
    icon: Presentation,
    summary:
      'Tối ưu hóa cho máy chiếu, tivi thông minh và bảng tương tác phòng học.',
    steps: [
      'Nhấn nút “Trình chiếu dạy học” ở thanh tiêu đề của bài mô phỏng để phóng lớn cỡ chữ và mở thanh công cụ lớp học.',
      'Bật “Ẩn đáp án cho lớp thảo luận” để che đáp án mẫu khi tổ chức học sinh trả lời trên lớp, sau đó bật hiện lại để chốt kiến thức.',
      'Nhấn “Bật bút ghi chú & đồng hồ” để vẽ khoanh vùng trực tiếp lên mô phỏng (bút vẽ, bút dạ quang, tẩy) và chạy đồng hồ đếm ngược thảo luận nhóm.',
    ],
  },
  {
    number: '09',
    title: 'Kết nối mô phỏng với Phiếu học tập, Bài giảng, Sơ đồ tư duy và Ngân hàng câu hỏi',
    icon: GitBranch,
    summary:
      'Chỉ với 1 cú nhấp chuột, chuyển hóa ngay bài mô phỏng thành học liệu giảng dạy thực tế trong hệ thống Ngữ Văn Thông Minh.',
    steps: [
      'Tại trang xem mô phỏng, mở nút “Tạo học liệu / Xuất”.',
      'Chọn “Tạo Phiếu học tập”, “Tạo Bài giảng trình chiếu”, “Tạo Sơ đồ tư duy” hoặc “Đưa câu hỏi vào Ngân hàng”.',
      'Mở các phân hệ tương ứng trên thanh điều hướng để tiếp tục chỉnh sửa, trình chiếu hoặc giao bài cho lớp.',
    ],
    actionLabel: 'Mở kho Bài giảng & Trình chiếu',
    actionTo: '/bai-giang',
  },
  {
    number: '10',
    title: 'Xuất Word (.docx), ảnh PNG và sơ đồ SVG chất lượng cao',
    icon: FileText,
    summary:
      'Hỗ trợ in ấn phiếu học tập, chèn hình minh họa vào giáo án PowerPoint hoặc đề kiểm tra.',
    steps: [
      'Chọn “Xuất Phiếu học tập Word (.docx)” trong menu “Tạo học liệu / Xuất” để tải ngay file Word chuẩn phông Times New Roman.',
      'Chọn “Tải ảnh mô phỏng (PNG)” để chụp trực tiếp khung cảnh 3D hoặc sơ đồ 2D sắc nét.',
      'Ở chế độ 2D (tab Sơ đồ quan hệ), chọn “Tải sơ đồ 2D (SVG)” để thu được ảnh vector phóng to không vỡ nét.',
    ],
  },
  {
    number: '11',
    title: 'Tải gói học liệu ngoại tuyến (Offline) cho phòng học không có mạng',
    icon: Download,
    summary:
      'Lưu trước từng bài hoặc trọn khối lớp vào bộ nhớ IndexedDB ngay trên trình duyệt.',
    steps: [
      'Tại trang Danh mục 40 bài, nhấn “Gói học offline” để mở bảng tải theo từng khối (Ngữ văn 10, 11, 12, Kiến thức & Kĩ năng).',
      'Hoặc nhấn nút dung lượng (ví dụ 46 KB) ngay trên từng thẻ bài hay nút “Lưu offline” trong trang xem mô phỏng.',
      'Khi đã có nhãn xanh “Offline”, bài mô phỏng mở nhanh tức thì và giữ nguyên tiến độ kể cả khi mất kết nối Internet.',
    ],
    actionLabel: 'Mở quản lí gói offline',
    actionTo: '/kham-pha-2d-3d',
  },
  {
    number: '12',
    title: 'Cài đặt ứng dụng Ngữ Văn Thông Minh dùng như phần mềm (PWA)',
    icon: Smartphone,
    summary:
      'Cài trực tiếp lên màn hình chính Windows, macOS, Android hoặc iOS mà không cần tải file cài đặt phức tạp.',
    steps: [
      'Trên thanh công cụ phía trên, nhấn nút “Cài ứng dụng dùng offline”.',
      'Nếu trình duyệt hỗ trợ (Chrome / Edge trên Windows, macOS, Android), hộp thoại cài đặt ứng dụng sẽ xuất hiện ngay để xác nhận.',
      'Trên iPhone / iPad (Safari): mở nút Chia sẻ (Share) ở thanh dưới và chọn “Thêm vào Màn hình chính” (Add to Home Screen).',
    ],
  },
  {
    number: '13',
    title: 'Tùy chỉnh hiệu năng đồ họa 3D và khả năng tiếp cận',
    icon: Laptop,
    summary:
      'Đảm bảo chạy mượt trên cả máy tính phòng học cấu hình trung bình lẫn điện thoại di động.',
    steps: [
      'Nếu thiết bị yếu hoặc pin thấp, chọn mức chất lượng “Tiết kiệm” ở thanh điều khiển phía dưới khung 3D.',
      'Bật “Giảm chuyển động” nếu học sinh cần quan sát mô hình đứng yên để ghi chép hoặc trình chiếu cố định.',
      'Nếu trình duyệt không hỗ trợ WebGL 3D, hệ thống tự động chuyển sang chế độ 2D tương tác đầy đủ mà không gây lỗi trang.',
    ],
  },
  {
    number: '14',
    title: 'Sử dụng đồng bộ các phân hệ Soạn đề, Ma trận, Đặc tả và Luyện thi THPT',
    icon: FileSpreadsheet,
    summary:
      'Toàn bộ các phân hệ cốt lõi của Ngữ Văn Thông Minh luôn sẵn sàng song hành cùng Khám phá 2D/3D.',
    steps: [
      'Soạn đề thông minh: tạo đề đọc hiểu – viết linh hoạt, sinh nhiều mã đề 101, 102, 103…, tự động tính Ma trận, Bản đặc tả và Hướng dẫn chấm.',
      'Thiết lập tên trường: mặc định hệ thống để “TRƯỜNG THPT” để thầy/cô tự điền tên trường của mình trong phần Cài đặt hoặc trực tiếp khi soạn đề.',
      'Ngân hàng ngữ liệu & Luyện thi THPT: quản lí ngữ liệu đã xác minh, luyện viết 200 chữ / 600 chữ và xuất trọn bộ hồ sơ Word/PDF.',
    ],
    actionLabel: 'Đi tới Soạn đề thông minh',
    actionTo: '/soan-de',
  },
];

export default function UserGuidePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* Header Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0F2942] via-[#173D66] to-[#1D63ED] p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1 text-[13px] font-bold text-blue-100">
              <HelpCircle className="h-4 w-4" />
              <span>TÀI LIỆU HƯỚNG DẪN CHÍNH THỨC · NGỮ VĂN THÔNG MINH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hướng dẫn sử dụng Ngữ Văn Thông Minh &amp; Khám phá 2D/3D
            </h1>
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-blue-100">
              Quy trình chi tiết 14 mục dành cho giáo viên Ngữ văn THPT, học sinh lớp 10–11–12 và hệ GDTX:
              từ khám phá 40 mô phỏng 2D/3D, trình chiếu lớp học, xuất học liệu Word/PNG/SVG đến soạn đề thông minh và cài đặt offline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/kham-pha-2d-3d"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-[15px] font-bold text-[#0F2942] shadow-md hover:bg-blue-50"
            >
              <Box className="h-5 w-5 text-[#1D63ED]" />
              <span>Mở Khám phá 2D/3D</span>
            </Link>
            <Link
              to="/soan-de"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-[15px] font-bold text-white hover:bg-white/20"
            >
              <FileText className="h-5 w-5" />
              <span>Soạn đề thông minh</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Principles Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-[#0F2942]">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
        <div className="space-y-1 text-[15px]">
          <p className="font-bold text-emerald-950">
            Cam kết minh bạch học liệu &amp; an toàn sử dụng
          </p>
          <p className="text-slate-700">
            Mọi bài mô phỏng trong <strong>Khám phá Ngữ văn 2D/3D</strong> hoạt động miễn phí, không yêu cầu API Key,
            không sử dụng dữ liệu giả và luôn ghi rõ tính chất minh họa sư phạm để đối chiếu song song cùng bản in SGK GDPT 2018.
          </p>
        </div>
      </div>

      {/* 14-Section Detailed Guide Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {GUIDE_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <article
              key={sec.number}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1D63ED]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#1D63ED]">
                      Mục {sec.number}
                    </span>
                    <h2 className="text-[17px] font-bold leading-snug text-[#0F2942]">
                      {sec.title}
                    </h2>
                  </div>
                </div>

                <p className="text-[15px] leading-relaxed text-slate-600">{sec.summary}</p>

                <ul className="space-y-2">
                  {sec.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[14px] leading-relaxed text-slate-800"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {sec.actionTo && sec.actionLabel && (
                <div className="pt-2 border-t border-slate-100">
                  <Link
                    to={sec.actionTo}
                    className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1D63ED] hover:underline"
                  >
                    <span>{sec.actionLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
