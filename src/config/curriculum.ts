import {
  CognitiveLevel,
  ExamAdminInfo,
  ExamType,
  GradeLevel,
  PassageGenre,
  TextbookSeries,
  WritingCategory,
} from '../types';

export const GRADE_LEVELS: GradeLevel[] = ['10', '11', '12'];

export const TEXTBOOK_SERIES: TextbookSeries[] = [
  'Kết nối tri thức với cuộc sống',
  'Chân trời sáng tạo',
  'Cánh Diều',
];

export const PASSAGE_GENRES: PassageGenre[] = [
  'Thơ',
  'Truyện',
  'Kí',
  'Kịch',
  'Văn bản nghị luận',
  'Văn bản thông tin',
];

export const EXAM_TYPES: ExamType[] = [
  'Kiểm tra thường xuyên',
  'Kiểm tra giữa kỳ',
  'Kiểm tra cuối kỳ',
  'Đề ôn tập',
  'Đề luyện thi tốt nghiệp THPT',
  'Đề thi thử',
  'Đề bồi dưỡng học sinh giỏi',
  'Đề tùy chỉnh',
];

export const COGNITIVE_LEVELS_BASE: CognitiveLevel[] = [
  'Nhận biết',
  'Thông hiểu',
  'Vận dụng',
];

export const COGNITIVE_LEVELS_ALL: CognitiveLevel[] = [
  'Nhận biết',
  'Thông hiểu',
  'Vận dụng',
  'Vận dụng cao',
];

export const WRITING_CATEGORIES: WritingCategory[] = [
  'Nghị luận xã hội',
  'Nghị luận văn học',
  'Viết đoạn văn',
  'Viết bài văn',
  'Văn bản thuyết minh',
  'Văn bản nhật dụng / Kiến nghị',
];

export interface ExamTemplateDefinition {
  id: string;
  name: string;
  description: string;
  applicableGrades: GradeLevel[];
  examType: ExamType;
  durationMinutes: number;
  totalPoints: number;
  readingQuestionPoints: number[];
  readingCognitiveDefaults: CognitiveLevel[];
  writingPromptsConfig: {
    category: WritingCategory;
    formatType: 'Đoạn văn' | 'Bài văn';
    wordCountTarget: number;
    points: number;
    cognitiveLevel: CognitiveLevel;
  }[];
  note: string;
}

export const EXAM_TEMPLATES: ExamTemplateDefinition[] = [
  {
    id: 'thpt-2025-4-6',
    name: 'Mẫu luyện thi tốt nghiệp THPT từ năm 2025 (120 phút – 4/6)',
    description:
      'Phần I. Đọc hiểu (4,0 điểm – 5 câu tự luận); Phần II. Viết (6,0 điểm – 01 đoạn văn khoảng 200 chữ 2,0đ và 01 bài văn khoảng 600 chữ 4,0đ). Không cố định kiểu bài NLXH/NLVH.',
    applicableGrades: ['12'],
    examType: 'Đề luyện thi tốt nghiệp THPT',
    durationMinutes: 120,
    totalPoints: 10,
    readingQuestionPoints: [0.5, 0.5, 1.0, 1.0, 1.0],
    readingCognitiveDefaults: [
      'Nhận biết',
      'Nhận biết',
      'Thông hiểu',
      'Thông hiểu',
      'Vận dụng',
    ],
    writingPromptsConfig: [
      {
        category: 'Nghị luận văn học',
        formatType: 'Đoạn văn',
        wordCountTarget: 200,
        points: 2.0,
        cognitiveLevel: 'Vận dụng',
      },
      {
        category: 'Nghị luận xã hội',
        formatType: 'Bài văn',
        wordCountTarget: 600,
        points: 4.0,
        cognitiveLevel: 'Vận dụng',
      },
    ],
    note: 'Giáo viên có thể hoán đổi kiểu bài 200 chữ (NLXH/NLVH) và 600 chữ (NLVH/NLXH) tùy ngữ liệu và định hướng ôn tập.',
  },
  {
    id: 'dinh-ky-90-4-6',
    name: 'Kiểm tra định kỳ THPT (90 phút – Đọc hiểu 4,0đ / Viết 6,0đ)',
    description:
      'Phù hợp kiểm tra giữa kỳ / cuối kỳ lớp 10, 11, 12 theo GDPT 2018. Phần Đọc hiểu 4 câu (4,0 điểm) và 01 bài văn nghị luận hoặc thuyết minh (6,0 điểm).',
    applicableGrades: ['10', '11', '12'],
    examType: 'Kiểm tra giữa kỳ',
    durationMinutes: 90,
    totalPoints: 10,
    readingQuestionPoints: [0.5, 1.0, 1.0, 1.5],
    readingCognitiveDefaults: [
      'Nhận biết',
      'Thông hiểu',
      'Thông hiểu',
      'Vận dụng',
    ],
    writingPromptsConfig: [
      {
        category: 'Nghị luận văn học',
        formatType: 'Bài văn',
        wordCountTarget: 500,
        points: 6.0,
        cognitiveLevel: 'Vận dụng',
      },
    ],
    note: 'Phù hợp đánh giá theo đơn vị thể loại của từng học kỳ lớp 10 và 11.',
  },
  {
    id: 'dinh-ky-90-5-5',
    name: 'Kiểm tra định kỳ cân bằng (90 phút – Đọc hiểu 5,0đ / Viết 5,0đ)',
    description:
      'Cấu trúc cân bằng 50% Đọc hiểu (4–5 câu) và 50% Viết (01 đoạn/bài văn), thích hợp lớp 10 và 11 hoặc hệ GDTX.',
    applicableGrades: ['10', '11', '12'],
    examType: 'Kiểm tra cuối kỳ',
    durationMinutes: 90,
    totalPoints: 10,
    readingQuestionPoints: [1.0, 1.0, 1.0, 1.0, 1.0],
    readingCognitiveDefaults: [
      'Nhận biết',
      'Nhận biết',
      'Thông hiểu',
      'Thông hiểu',
      'Vận dụng',
    ],
    writingPromptsConfig: [
      {
        category: 'Nghị luận xã hội',
        formatType: 'Bài văn',
        wordCountTarget: 500,
        points: 5.0,
        cognitiveLevel: 'Vận dụng',
      },
    ],
    note: 'Dễ điều chỉnh tỉ lệ điểm đọc hiểu và viết theo kế hoạch tổ chuyên môn.',
  },
  {
    id: 'thuong-xuyen-45',
    name: 'Kiểm tra thường xuyên (45 phút – Đọc hiểu + Đoạn văn)',
    description:
      'Kiểm tra nhanh trên lớp gồm 3 câu đọc hiểu (4,0 điểm) và 01 đoạn văn ngắn (6,0 điểm).',
    applicableGrades: ['10', '11', '12'],
    examType: 'Kiểm tra thường xuyên',
    durationMinutes: 45,
    totalPoints: 10,
    readingQuestionPoints: [1.0, 1.5, 1.5],
    readingCognitiveDefaults: ['Nhận biết', 'Thông hiểu', 'Vận dụng'],
    writingPromptsConfig: [
      {
        category: 'Viết đoạn văn',
        formatType: 'Đoạn văn',
        wordCountTarget: 200,
        points: 6.0,
        cognitiveLevel: 'Vận dụng',
      },
    ],
    note: 'Thiết kế gọn nhẹ cho 1 tiết học trên lớp.',
  },
  {
    id: 'hsg-180',
    name: 'Bồi dưỡng Học sinh giỏi (150–180 phút – Chuyên sâu)',
    description:
      'Cấu trúc 2 câu nghị luận chuyên sâu (NLXH 8,0 điểm + NLVH 12,0 điểm, thang 20 hoặc quy đổi 10), hỗ trợ mức Vận dụng cao.',
    applicableGrades: ['10', '11', '12'],
    examType: 'Đề bồi dưỡng học sinh giỏi',
    durationMinutes: 150,
    totalPoints: 20,
    readingQuestionPoints: [],
    readingCognitiveDefaults: [],
    writingPromptsConfig: [
      {
        category: 'Nghị luận xã hội',
        formatType: 'Bài văn',
        wordCountTarget: 800,
        points: 8.0,
        cognitiveLevel: 'Vận dụng cao',
      },
      {
        category: 'Nghị luận văn học',
        formatType: 'Bài văn',
        wordCountTarget: 1200,
        points: 12.0,
        cognitiveLevel: 'Vận dụng cao',
      },
    ],
    note: 'Có thể bật thêm phần Đọc hiểu mở rộng hoặc chuyển thang 10 tùy quy chế.',
  },
];

export const LEARNING_OUTCOMES_BY_GENRE: Record<
  PassageGenre,
  Record<GradeLevel, string[]>
> = {
  Thơ: {
    '10': [
      'Nhận biết và phân tích được giá trị thẩm mĩ của một số yếu tố trong thơ như từ ngữ, hình ảnh, vần, nhịp, đối, chủ thể trữ tình.',
      'Phân tích và đánh giá được tình cảm, cảm xúc, cảm hứng chủ đạo của người viết thể hiện qua văn bản thơ.',
      'Phát hiện và lí giải được các giá trị văn hóa, triết lí nhân sinh từ văn bản thơ.',
    ],
    '11': [
      'Nhận biết và phân tích được một số yếu tố của thơ trữ tình hiện đại như cấu tứ, hình ảnh, yếu tố tượng trưng.',
      'Phân tích được sự vận động của mạch cảm xúc và vai trò của chủ thể trữ tình trong bài thơ.',
      'Đánh giá được ý nghĩa thông điệp của bài thơ đối với nhận thức và đời sống tâm hồn con người.',
    ],
    '12': [
      'Nhận biết và phân tích được phong cách sáng tác, cấu tứ độc đáo và yếu tố tượng trưng hoặc siêu thực (nếu có) trong thơ hiện đại.',
      'So sánh, đánh giá được nét đặc sắc về hình thức nghệ thuật và chiều sâu tư tưởng giữa các văn bản thơ.',
      'Vận dụng trải nghiệm văn hóa, thẩm mĩ để lí giải thông điệp nhân văn của tác phẩm thơ.',
    ],
  },
  Truyện: {
    '10': [
      'Nhận biết và phân tích được một số yếu tố của truyện như nhân vật, câu chuyện, người kể chuyện ngôi thứ ba và ngôi thứ nhất, điểm nhìn, lời người kể chuyện, lời nhân vật.',
      'Phân tích và đánh giá được chủ đề, tư tưởng, thông điệp mà văn bản muốn gửi gắm.',
      'Phân tích được tình huống truyện và chi tiết tiêu biểu góp phần thể hiện tính cách nhân vật.',
    ],
    '11': [
      'Nhận biết và phân tích được sự kết hợp giữa lời người kể chuyện và lời nhân vật, sự dịch chuyển điểm nhìn trần thuật.',
      'Phân tích được tâm lí nhân vật, tình huống truyện và ý nghĩa của chi tiết nghệ thuật đặc sắc.',
      'Đánh giá được giá trị nhân đạo, tư tưởng và thông điệp của tác phẩm truyện trong bối cảnh đời sống.',
    ],
    '12': [
      'Phân tích và đánh giá được nghệ thuật trần thuật, điểm nhìn, giọng điệu và phong cách tác giả trong truyện hiện đại.',
      'Khái quát được đặc điểm thể loại và ý nghĩa triết lí nhân sinh đặt ra qua số phận nhân vật.',
      'Liên hệ, vận dụng thông điệp tác phẩm để bàn luận về các vấn đề của con người hôm nay.',
    ],
  },
  Kí: {
    '10': [
      'Nhận biết được tính xác thực của sự kiện, không gian, thời gian và cái tôi tác giả trong văn bản kí.',
      'Phân tích được sự kết hợp giữa tự sự và trữ tình hoặc chi tiết ghi chép thực tế trong tác phẩm.',
      'Rút ra được ý nghĩa văn hóa, lịch sử hoặc trải nghiệm sống từ văn bản kí.',
    ],
    '11': [
      'Nhận biết và phân tích được sự kết hợp giữa hư cấu và phi hư cấu trong một số tiểu loại kí.',
      'Phân tích được cái tôi trữ tình, giọng điệu và ngôn ngữ giàu chất tạo hình trong văn bản kí.',
      'Đánh giá được thái độ, tư tưởng của tác giả đối với con người và thiên nhiên đất nước.',
    ],
    '12': [
      'Phân tích được đặc trưng của phóng sự, nhật kí hoặc hồi kí hiện đại: tính thời sự, sự thật đời sống và chiều sâu suy tư.',
      'Đánh giá được vai trò của chi tiết xác thực và cảm hứng nhân văn trong văn bản kí.',
      'Vận dụng góc nhìn phản biện để kết nối vấn đề từ trang kí với thực tiễn xã hội.',
    ],
  },
  Kịch: {
    '10': [
      'Nhận biết và phân tích được xung đột kịch, hành động kịch, nhân vật và lời thoại trong văn bản kịch.',
      'Phân tích được ý nghĩa của các chỉ dẫn sân khấu và diễn biến tâm lí nhân vật qua đối thoại, độc thoại.',
      'Đánh giá được thông điệp đạo đức và xã hội đặt ra từ xung đột kịch.',
    ],
    '11': [
      'Phân tích được xung đột trung tâm, bi kịch hoặc tiếng cười châm biếm trong bi kịch và hài kịch.',
      'Phân tích được vai trò của lời thoại trong việc bộc lộ bản chất nhân vật và thúc đẩy hành động kịch.',
      'Đánh giá được giá trị nhận thức và giáo dục của tác phẩm kịch đối với người tiếp nhận.',
    ],
    '12': [
      'Phân tích được đặc điểm nghệ thuật tổ chức xung đột, ngôn ngữ kịch và tính triết lí trong kịch hiện đại.',
      'Đánh giá được ý nghĩa thời đại và giá trị nhân bản của hình tượng nhân vật kịch.',
      'Vận dụng hiểu biết về thể loại kịch để lí giải lựa chọn ứng xử của nhân vật trong bối cảnh cụ thể.',
    ],
  },
  'Văn bản nghị luận': {
    '10': [
      'Nhận biết và phân tích được nội dung của luận đề, các luận điểm, lí lẽ và bằng chứng tiêu biểu trong văn bản nghị luận.',
      'Phân tích được mối quan hệ giữa luận đề, luận điểm, lí lẽ và bằng chứng; cách sắp xếp trình tự lập luận.',
      'Xác định được mục đích, quan điểm của người viết và đánh giá được sức thuyết phục của văn bản.',
    ],
    '11': [
      'Phân tích được sự kết hợp giữa các thao tác lập luận và yếu tố biểu cảm, thuyết minh trong văn bản nghị luận.',
      'Đánh giá được tính xác đáng, độ tin cậy của bằng chứng và logic lập luận của tác giả.',
      'Liên hệ, thể hiện được quan điểm cá nhân trước vấn đề xã hội hoặc văn học đặt ra trong văn bản.',
    ],
    '12': [
      'Phân tích và đánh giá được cách đặt vấn đề, nghệ thuật lập luận sắc bén và giọng điệu tranh luận trong văn bản nghị luận.',
      'Nhận diện và phản biện được các góc nhìn đa chiều xoay quanh luận đề của văn bản.',
      'Vận dụng quan điểm đúng đắn để giải quyết một tình huống hoặc vấn đề thực tiễn có liên quan.',
    ],
  },
  'Văn bản thông tin': {
    '10': [
      'Nhận biết và phân tích được thông tin cơ bản, thông tin chi tiết và cách triển khai dữ liệu trong văn bản thông tin.',
      'Phân tích được tác dụng của phương tiện giao tiếp phi ngôn ngữ (sơ đồ, bảng biểu, hình ảnh) kết hợp với ngôn ngữ.',
      'Đánh giá được tính khách quan, độ tin cậy và mục đích của văn bản thông tin.',
    ],
    '11': [
      'Phân tích được cách bố trí nhan đề, đề mục, hệ thống dữ liệu và thái độ của người viết trong văn bản thông tin tổng hợp.',
      'Đánh giá được hiệu quả truyền đạt thông tin của việc phối hợp phương tiện ngôn ngữ và phi ngôn ngữ.',
      'Vận dụng thông tin đã đọc để giải thích hoặc đề xuất giải pháp cho một vấn đề thực tiễn.',
    ],
    '12': [
      'Phân tích và đánh giá được cách lựa chọn, tổ chức thông tin khoa học, văn hóa hoặc thời sự trong văn bản thông tin.',
      'Nhận diện được mục đích ẩn sau cách trình bày dữ liệu và đánh giá tính cập nhật của nguồn tin.',
      'Kết nối, chuyển hóa thông tin từ văn bản thành nhận thức và hành động phù hợp.',
    ],
  },
};

export const DEFAULT_ADMIN_INFO: ExamAdminInfo = {
  schoolName: 'TRƯỜNG THPT MẪU GDPT 2018',
  departmentName: 'TỔ NGỮ VĂN',
  academicYear: '2025 - 2026',
  semester: 'Học kỳ II',
  grade: '12',
  textbookSeries: 'Kết nối tri thức với cuộc sống',
  examType: 'Đề luyện thi tốt nghiệp THPT',
  title: 'ĐỀ THỰC HÀNH KIỂM TRA NĂNG LỰC NGỮ VĂN (MẪU MINH HỌA)',
  durationMinutes: 120,
  totalPoints: 10,
  knowledgeScope: 'Đọc hiểu thơ hiện đại ngoài SGK và viết văn nghị luận theo cấu trúc GDPT 2018',
  learningOutcomesSummary:
    'Đánh giá năng lực đọc hiểu văn bản thơ theo đặc trưng thể loại và năng lực viết đoạn/bài văn nghị luận mạch lạc, thuyết phục.',
  examCode: 'TH-12-01',
  extraNotes: 'Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.',
  templateId: 'thpt-2025-4-6',
};
