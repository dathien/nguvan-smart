import Dexie, { Table } from 'dexie';
import {
  AppSettings,
  Assignment,
  Classroom,
  ExamDocument,
  ExamQuestion,
  ExamVersionSnapshot,
  LessonPlan,
  MindMapDocument,
  PresentationDeck,
  ReadingPassage,
  StudentRecord,
  Submission,
  UserProfile,
  WorksheetDocument,
  WritingDraftSession,
} from '../types';

export class SmartLiteratureDB extends Dexie {
  passages!: Table<ReadingPassage, string>;
  questions!: Table<ExamQuestion, string>;
  exams!: Table<ExamDocument, string>;
  examVersions!: Table<ExamVersionSnapshot, string>;
  lessonPlans!: Table<LessonPlan, string>;
  presentations!: Table<PresentationDeck, string>;
  mindMaps!: Table<MindMapDocument, string>;
  worksheets!: Table<WorksheetDocument, string>;
  classes!: Table<Classroom, string>;
  students!: Table<StudentRecord, string>;
  assignments!: Table<Assignment, string>;
  submissions!: Table<Submission, string>;
  writingDrafts!: Table<WritingDraftSession, string>;
  users!: Table<UserProfile, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('SmartLiteratureDB');
    this.version(1).stores({
      passages: 'id, genre, grade, textbookSeries, verificationStatus, isFavorite, ownerId, updatedAt',
      questions: 'id, passageId, cognitiveLevel, grade, genre, ownerId, updatedAt',
      exams: 'id, ownerId, updatedAt, approved',
      examVersions: 'id, examId, createdAt',
      lessonPlans: 'id, ownerId, grade, textbookSeries, updatedAt',
      presentations: 'id, ownerId, grade, sourceExamId, updatedAt',
      mindMaps: 'id, ownerId, category, grade, updatedAt',
      worksheets: 'id, ownerId, worksheetType, grade, updatedAt',
      classes: 'id, ownerId, grade, joinCode, archived',
      students: 'id, classId, studentCode, ownerId',
      assignments: 'id, ownerId, classId, kind, dueAt',
      submissions: 'id, assignmentId, classId, studentId, status, updatedAt',
      writingDrafts: 'id, studentId, updatedAt',
      users: 'id, email, activeRole, status',
      settings: 'id',
    });
  }
}

export const db = new SmartLiteratureDB();

const nowIso = () => new Date().toISOString();

export const SEED_PASSAGES: ReadingPassage[] = [
  {
    id: 'passage-practice-12-poem',
    title: 'Nhịp cầu qua mùa gió',
    author: 'Hồ Nguyễn Đa Thiện (Ngữ liệu thực hành tự biên soạn)',
    genre: 'Thơ',
    grade: '12',
    textbookSeries: 'Kết nối tri thức với cuộc sống',
    topic: 'Quê hương, kí ức và sự tiếp nối thế hệ',
    literaryPeriod: 'Văn học hiện đại',
    textType: 'Thơ tự do',
    content: `Buổi sớm ấy sương còn giăng mặt bến
Cây cầu tre gầy nối hai bờ lau trắng
Bàn chân mẹ đi qua bao mùa gió chướng
Đem hạt thóc vàng gõ cửa từng gian.

Con lớn lên từ nhịp võng trưa hè
Từ trang vở thơm mùi giấy mới
Mỗi lần ngoái lại bến sông xưa lặng lẽ
Thấy dáng cầu cong như nét chữ nghiêng nghiêng.

Mai con bước vào thành phố rộng
Giữa đèn màu và những ngã tư xa
Xin giữ lại trong hành trang lặng thầm nhất
Một nhịp cầu thương nhớ của quê nhà.`,
    formatStyle: 'poem',
    origin: 'Ngữ liệu thực hành nội bộ phục vụ kiểm thử quy trình soạn đề',
    citationSource: 'Tư liệu tự biên soạn dùng thử nghiệm trong hệ thống Văn Học Thông Minh (2026)',
    publisher: 'Lưu hành nội bộ (Ngữ liệu thực hành)',
    publishYear: '2026',
    verificationStatus: 'Ngữ liệu tự biên soạn',
    learningOutcomes: [
      'Nhận biết và phân tích được các yếu tố hình thức của thơ tự do: hình ảnh, biện pháp tu từ, nhịp điệu và chủ thể trữ tình.',
      'Phân tích được mạch cảm xúc từ kí ức tuổi thơ đến ý thức gìn giữ cội nguồn của nhân vật trữ tình.',
      'Rút ra thông điệp nhân văn về trách nhiệm với quê hương và gia đình trong nhịp sống hiện đại.',
    ],
    tags: ['Ngữ liệu thực hành', 'Thơ tự do', 'Quê hương', 'Lớp 12'],
    isFavorite: true,
    ownerId: 'teacher-dathien',
    isPracticeSample: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'passage-practice-10-story',
    title: 'Người thắp đèn ở ga xép',
    author: 'Ngữ liệu thực hành tự biên soạn (Văn Học Thông Minh)',
    genre: 'Truyện',
    grade: '10',
    textbookSeries: 'Chân trời sáng tạo',
    topic: 'Trách nhiệm thầm lặng và phẩm chất con người lao động',
    literaryPeriod: 'Văn học hiện đại',
    textType: 'Truyện ngắn',
    content: `Ga xép nằm nép mình sau rặng phi lao chắn cát, mỗi ngày chỉ đón hai chuyến tàu đêm lướt qua trong tiếng còi dài xé gió. Ông Tư gác ghi đã ở đó hơn ba mươi mùa mưa bão. Người trong xóm thường bảo công việc của ông tẻ nhạt, quanh năm chỉ có chiếc đèn tín hiệu bằng đồng, cuốn sổ ghi giờ tàu và ấm trà đặc quánh hơi sương.

Đêm cuối thu năm ấy, gió mùa tràn về đột ngột khiến dây điện dọc đường ray đứt phăng một đoạn. Cả xóm tối om. Trời mưa như trút nước, rặng phi lao rít lên từng hồi. Ông Tư khoác vội tấm áo tơi cũ, tay giữ chặt chiếc đèn bão leo ngược triền đá sỏi ra phía ghi tàu. Ngọn lửa nhỏ trong lồng kính rung lên bần bật nhưng chưa lúc nào tắt. Ông đứng suốt gần hai giờ giữa mưa lạnh để báo hiệu đoạn đường đang khắc phục cho đoàn tàu chở hàng kịp giảm tốc.

Khi chuyến tàu chậm rãi lăn bánh an toàn qua ga xép, ánh đèn từ toa lái quét ngang khuôn mặt sạm gió của ông. Trên chuyến tàu ấy không ai biết tên người gác ghi già, chỉ thấy một vệt sáng vàng ấm áp vẫn đứng yên bên đường ray cho tới khi toa cuối cùng khuất sau màn mưa.`,
    formatStyle: 'prose',
    origin: 'Ngữ liệu thực hành tự biên soạn phục vụ luyện đọc hiểu truyện ngắn lớp 10',
    citationSource: 'Tư liệu tự biên soạn trong hệ thống Văn Học Thông Minh (2026)',
    publisher: 'Lưu hành nội bộ (Ngữ liệu thực hành)',
    publishYear: '2026',
    verificationStatus: 'Ngữ liệu tự biên soạn',
    learningOutcomes: [
      'Nhận biết được ngôi kể thứ ba, điểm nhìn và tình huống truyện thử thách phẩm chất nhân vật.',
      'Phân tích được ý nghĩa chi tiết nghệ thuật ngọn đèn bão giữa đêm mưa.',
      'Rút ra thông điệp về giá trị của sự tận tụy và trách nhiệm thầm lặng.',
    ],
    tags: ['Ngữ liệu thực hành', 'Truyện ngắn', 'Lao động thầm lặng', 'Lớp 10'],
    isFavorite: false,
    ownerId: 'teacher-dathien',
    isPracticeSample: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'passage-practice-11-argument',
    title: 'Đọc chậm giữa thời đại tốc độ',
    author: 'Ngữ liệu thực hành tự biên soạn (Văn Học Thông Minh)',
    genre: 'Văn bản nghị luận',
    grade: '11',
    textbookSeries: 'Cánh Diều',
    topic: 'Văn hóa đọc và năng lực tư duy sâu của người trẻ',
    literaryPeriod: 'Văn học hiện đại',
    textType: 'Văn bản nghị luận xã hội',
    content: `Trong guồng quay thông tin ngắn kéo dài vài chục giây mỗi lượt lướt, thói quen đọc nhanh đang dần thay thế năng lực đọc sâu. Nhiều bạn trẻ có thể tiếp nhận hàng trăm mẩu tin mỗi ngày nhưng lại lúng túng khi phải tóm tắt một lập luận dài quá hai trang giấy hoặc trình bày quan điểm cá nhân có hệ thống.

Đọc chậm không đồng nghĩa với tụt hậu trước công nghệ. Trái lại, đó là khoảng lặng cần thiết để trí óc thực hiện ba thao tác quan trọng: đối thoại với tác giả, kiểm chứng độ tin cậy của lí lẽ và kết nối tri thức mới với trải nghiệm sống của bản thân. Một trang sách được đọc kĩ có thể gợi mở nhiều câu hỏi hơn cả trăm dòng tiêu đề giật gân lướt qua vội vã.

Giữ nhịp đọc chậm cũng là cách rèn luyện sự kiên nhẫn cho tư duy. Khi biết dừng lại trước một khái niệm chưa rõ hay một câu văn giàu sức gợi, người đọc không chỉ thu nhận thông tin mà còn hình thành bản lĩnh tự chủ trước dòng chảy ồn ào của mạng xã hội.`,
    formatStyle: 'prose',
    origin: 'Ngữ liệu thực hành tự biên soạn phục vụ luyện đọc hiểu văn bản nghị luận lớp 11',
    citationSource: 'Tư liệu tự biên soạn trong hệ thống Văn Học Thông Minh (2026)',
    publisher: 'Lưu hành nội bộ (Ngữ liệu thực hành)',
    publishYear: '2026',
    verificationStatus: 'Ngữ liệu tự biên soạn',
    learningOutcomes: [
      'Xác định được luận đề, hệ thống luận điểm, lí lẽ và bằng chứng trong văn bản nghị luận.',
      'Phân tích được mối quan hệ giữa các luận điểm và mục đích của người viết.',
      'Liên hệ thực tiễn để đề xuất thói quen đọc sách hiệu quả cho học sinh THPT.',
    ],
    tags: ['Ngữ liệu thực hành', 'Nghị luận', 'Văn hóa đọc', 'Lớp 11'],
    isFavorite: false,
    ownerId: 'teacher-dathien',
    isPracticeSample: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

export const SEED_EXAM: ExamDocument = {
  id: 'exam-practice-thpt-01',
  ownerId: 'teacher-dathien',
  adminInfo: {
    schoolName: 'TRƯỜNG THPT THỰC HÀNH SMART LITERATURE',
    departmentName: 'TỔ NGỮ VĂN',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ II',
    grade: '12',
    textbookSeries: 'Kết nối tri thức với cuộc sống',
    examType: 'Đề luyện thi tốt nghiệp THPT',
    title: 'ĐỀ THỰC HÀNH MINH HỌA – KIỂM TRA NĂNG LỰC NGỮ VĂN 12',
    durationMinutes: 120,
    totalPoints: 10,
    knowledgeScope: 'Đọc hiểu văn bản thơ tự do (ngữ liệu thực hành) và Viết nghị luận',
    learningOutcomesSummary:
      'Đánh giá năng lực đọc hiểu văn bản thơ theo Chương trình GDPT 2018 và năng lực viết đoạn văn 200 chữ, bài văn 600 chữ.',
    examCode: 'TH-12-01',
    extraNotes:
      'Hồ sơ đề thực hành minh họa dùng ngữ liệu tự biên soạn để kiểm thử quy trình soạn đề, ma trận, đặc tả và xuất tài liệu.',
    templateId: 'thpt-2025-4-6',
  },
  passage: SEED_PASSAGES[0],
  readingQuestions: [
    {
      id: 'q-prac-1',
      order: 1,
      part: 'doc-hieu',
      content: 'Xác định thể thơ và nhân vật trữ tình trong văn bản trên.',
      skill: 'Nhận biết đặc trưng hình thức thể loại thơ',
      learningOutcome:
        'Nhận biết và phân tích được một số yếu tố của thơ trữ tình hiện đại như thể thơ, chủ thể trữ tình.',
      cognitiveLevel: 'Nhận biết',
      points: 0.5,
      answer:
        '- Thể thơ: Tự do.\n- Nhân vật trữ tình: Người con (xưng "con" trực tiếp bộc lộ cảm xúc về mẹ, quê hương).',
      equivalentAnswers:
        'Thí sinh gọi đúng "thơ tự do" và xác định đúng "người con / nhân vật xưng con" vẫn đạt điểm tối đa.',
      partialCreditSteps: [
        { id: 's1', description: 'Xác định đúng thể thơ tự do', points: 0.25 },
        { id: 's2', description: 'Xác định đúng nhân vật trữ tình (người con)', points: 0.25 },
      ],
      nonQualifyingNotes: 'Ghi nhầm sang thơ lục bát hoặc thơ tám chữ không tính điểm ý thể thơ.',
      passageId: 'passage-practice-12-poem',
      grade: '12',
      genre: 'Thơ',
    },
    {
      id: 'q-prac-2',
      order: 2,
      part: 'doc-hieu',
      content:
        'Chỉ ra những hình ảnh gắn với kí ức tuổi thơ và người mẹ được nhắc đến trong hai khổ thơ đầu.',
      skill: 'Nhận diện chi tiết, hình ảnh trong văn bản thơ',
      learningOutcome:
        'Nhận biết được hình ảnh, từ ngữ gợi tả trong hai khổ thơ đầu của văn bản.',
      cognitiveLevel: 'Nhận biết',
      points: 0.5,
      answer:
        'Những hình ảnh gắn với kí ức tuổi thơ và người mẹ: sương giăng mặt bến, cây cầu tre gầy, hai bờ lau trắng, bàn chân mẹ qua mùa gió chướng, hạt thóc vàng, nhịp võng trưa hè, trang vở thơm mùi giấy mới, dáng cầu cong.',
      equivalentAnswers:
        'Nêu được từ 4 hình ảnh chính xác trở lên trích từ hai khổ thơ đầu được chấm trọn điểm.',
      partialCreditSteps: [
        { id: 's1', description: 'Nêu được ít nhất 2–3 hình ảnh đúng', points: 0.25 },
        { id: 's2', description: 'Nêu đầy đủ từ 4 hình ảnh trở lên', points: 0.5 },
      ],
      nonQualifyingNotes: 'Không chép hình ảnh từ khổ thơ thứ ba.',
      passageId: 'passage-practice-12-poem',
      grade: '12',
      genre: 'Thơ',
    },
    {
      id: 'q-prac-3',
      order: 3,
      part: 'doc-hieu',
      content:
        'Phân tích tác dụng của biện pháp tu từ so sánh trong dòng thơ: "Thấy dáng cầu cong như nét chữ nghiêng nghiêng."',
      skill: 'Phân tích biện pháp tu từ trong thơ',
      learningOutcome:
        'Phân tích được giá trị biểu đạt và giá trị thẩm mĩ của biện pháp tu từ so sánh trong ngữ cảnh.',
      cognitiveLevel: 'Thông hiểu',
      points: 1.0,
      answer:
        '- Biện pháp so sánh: "dáng cầu cong" được ví với "nét chữ nghiêng nghiêng".\n- Tác dụng gợi hình: Gợi tả đường nét mềm mại, thân quen, duyên dáng của cây cầu tre quê hương.\n- Tác dụng biểu cảm: Kết nối hình ảnh quê hương với trang vở học trò, thể hiện tình cảm trân trọng, gắn bó sâu nặng của người con đối với nguồn cội và tri thức thuở thiếu thời.',
      equivalentAnswers:
        'Diễn đạt linh hoạt miễn làm rõ được hai phương diện gợi hình và gợi cảm gắn với tuổi học trò và quê hương.',
      partialCreditSteps: [
        { id: 's1', description: 'Chỉ đúng hai vế so sánh', points: 0.25 },
        { id: 's2', description: 'Nêu được giá trị gợi hình của phép so sánh', points: 0.25 },
        { id: 's3', description: 'Phân tích được giá trị biểu cảm, sự gắn kết quê hương – trang vở', points: 0.5 },
      ],
      nonQualifyingNotes: 'Chỉ gọi tên biện pháp tu từ mà không phân tích tác dụng chỉ đạt tối đa 0,25đ.',
      passageId: 'passage-practice-12-poem',
      grade: '12',
      genre: 'Thơ',
    },
    {
      id: 'q-prac-4',
      order: 4,
      part: 'doc-hieu',
      content:
        'Nhận xét sự vận động mạch cảm xúc của nhân vật trữ tình từ khổ đầu đến khổ cuối bài thơ.',
      skill: 'Phân tích mạch cảm xúc và cấu tứ bài thơ',
      learningOutcome:
        'Phân tích được sự vận động mạch cảm xúc của chủ thể trữ tình xuyên suốt văn bản thơ.',
      cognitiveLevel: 'Thông hiểu',
      points: 1.0,
      answer:
        '- Mạch cảm xúc vận động từ hồi tưởng quá khứ (nhớ bến sông, dáng mẹ tảo tần và những trang vở tuổi thơ) đến chiêm nghiệm hiện tại khi trưởng thành và hướng tới tương lai (bước vào thành phố rộng nhưng vẫn nâng niu kí ức quê nhà).\n- Nhận xét: Mạch cảm xúc tự nhiên, lắng đọng, cho thấy sự trưởng thành đi kèm lòng biết ơn và ý thức gìn giữ cội nguồn.',
      equivalentAnswers:
        'Chấp nhận cách trình bày theo trình tự thời gian (quá khứ → hiện tại → tương lai) hoặc không gian (bến sông quê → thành phố rộng).',
      partialCreditSteps: [
        { id: 's1', description: 'Chỉ ra được các chặng vận động cảm xúc qua 3 khổ', points: 0.5 },
        { id: 's2', description: 'Nhận xét ý nghĩa của sự vận động cảm xúc ấy', points: 0.5 },
      ],
      nonQualifyingNotes: 'Tóm tắt lại nội dung từng khổ mà không chỉ ra sự chuyển biến cảm xúc chỉ tính 0,25đ.',
      passageId: 'passage-practice-12-poem',
      grade: '12',
      genre: 'Thơ',
    },
    {
      id: 'q-prac-5',
      order: 5,
      part: 'doc-hieu',
      content:
        'Lời tự nhủ "Xin giữ lại trong hành trang lặng thầm nhất / Một nhịp cầu thương nhớ của quê nhà" gợi cho anh/chị suy nghĩ gì về hành trang tinh thần của người trẻ khi bước vào đời? (Trình bày khoảng 5 – 7 dòng).',
      skill: 'Vận dụng và liên hệ thực tiễn từ thông điệp văn bản',
      learningOutcome:
        'Vận dụng trải nghiệm văn hóa, nhân sinh để lí giải và kết nối thông điệp của bài thơ với đời sống.',
      cognitiveLevel: 'Vận dụng',
      points: 1.0,
      answer:
        'Thí sinh trình bày suy nghĩ sâu sắc, chân thành, có thể triển khai các ý:\n- Người trẻ khi rời quê hương đến với chân trời mới cần tri thức, kĩ năng hiện đại nhưng không thể thiếu điểm tựa tinh thần từ gia đình và cội nguồn.\n- Kí ức quê hương giúp con người giữ được bản sắc, lòng biết ơn và sự vững vàng trước những đổi thay của đời sống đô thị.',
      equivalentAnswers:
        'Tôn trọng quan điểm cá nhân miễn hợp lí, tích cực, bám sát tinh thần hai dòng thơ.',
      partialCreditSteps: [
        { id: 's1', description: 'Giải thích ngắn gọn ý nghĩa lời tự nhủ', points: 0.25 },
        { id: 's2', description: 'Nêu rõ giá trị của hành trang tinh thần / cội nguồn với người trẻ', points: 0.5 },
        { id: 's3', description: 'Diễn đạt mạch lạc, đúng dung lượng 5–7 dòng', points: 0.25 },
      ],
      nonQualifyingNotes: 'Trả lời sáo rỗng, tách rời hoàn toàn nội dung hai dòng thơ.',
      passageId: 'passage-practice-12-poem',
      grade: '12',
      genre: 'Thơ',
    },
  ],
  writingPrompts: [
    {
      id: 'w-prac-1',
      order: 1,
      category: 'Nghị luận văn học',
      formatType: 'Đoạn văn',
      wordCountTarget: 200,
      promptText:
        'Viết đoạn văn nghị luận (khoảng 200 chữ) phân tích hình ảnh "nhịp cầu" trong bài thơ "Nhịp cầu qua mùa gió" (phần Đọc hiểu).',
      points: 2.0,
      cognitiveLevel: 'Vận dụng',
      learningOutcome:
        'Viết được đoạn văn nghị luận phân tích nét đặc sắc về hình ảnh nghệ thuật trong tác phẩm thơ.',
      suggestedOutline: [
        'Mở đoạn: Giới thiệu hình ảnh "nhịp cầu" – hình tượng trung tâm xuyên suốt bài thơ.',
        'Thân đoạn: Phân tích lớp nghĩa thực (cây cầu tre gầy bắc qua bến sông quê, gắn với bước chân mẹ) và lớp nghĩa biểu tượng (nhịp nối tuổi thơ – trưởng thành, quê hương – thành phố, lòng biết ơn).',
        'Kết đoạn: Khẳng định vẻ đẹp bình dị mà sâu lắng của hình ảnh thơ.',
      ],
      keyArguments: [
        'Hình ảnh tả thực gắn với đời sống lao động tần tảo của người mẹ.',
        'So sánh sáng tạo "dáng cầu cong như nét chữ nghiêng nghiêng" nối liền quê hương và sự học.',
        'Biểu tượng cho sợi dây tinh thần bền bỉ nâng đỡ nhân vật trữ tình.',
      ],
      rubric: [
        {
          id: 'r1-1',
          group: 'Đảm bảo cấu trúc',
          title: 'Hình thức đoạn văn ~200 chữ',
          description: 'Viết đúng 01 đoạn văn mạch lạc, dung lượng khoảng 200 chữ.',
          points: 0.25,
        },
        {
          id: 'r1-2',
          group: 'Xác định đúng vấn đề',
          title: 'Đúng trọng tâm hình tượng "nhịp cầu"',
          description: 'Xác định đúng vấn đề nghị luận là ý nghĩa hình ảnh nhịp cầu trong bài thơ.',
          points: 0.25,
        },
        {
          id: 'r1-3',
          group: 'Triển khai vấn đề',
          title: 'Phân tích đa tầng ý nghĩa và nghệ thuật',
          description: 'Làm rõ nghĩa thực và nghĩa biểu tượng của nhịp cầu qua dẫn chứng thơ.',
          points: 1.0,
        },
        {
          id: 'r1-4',
          group: 'Chính tả và ngữ pháp',
          title: 'Chuẩn chính tả, ngữ pháp tiếng Việt',
          description: 'Không mắc lỗi chính tả, dùng từ và đặt câu chuẩn mực.',
          points: 0.25,
        },
        {
          id: 'r1-5',
          group: 'Sáng tạo',
          title: 'Diễn đạt tinh tế, sâu sắc',
          description: 'Có cảm nhận riêng tinh tế, liên kết chặt chẽ.',
          points: 0.25,
        },
      ],
      teacherReferenceEssay:
        'Tài liệu tham khảo nội bộ dành cho giáo viên (không hiển thị cho học sinh khi làm bài): Hướng dẫn học sinh đi từ nghĩa tả thực ("cây cầu tre gầy") tới hình ảnh so sánh ("như nét chữ nghiêng nghiêng") và ý nghĩa biểu tượng của hành trang tinh thần ở khổ kết.',
    },
    {
      id: 'w-prac-2',
      order: 2,
      category: 'Nghị luận xã hội',
      formatType: 'Bài văn',
      wordCountTarget: 600,
      promptText:
        'Từ gợi dẫn của văn bản phần Đọc hiểu, hãy viết bài văn nghị luận (khoảng 600 chữ) bàn về chủ đề: Người trẻ giữ gìn bản sắc và cội nguồn trong quá trình hội nhập.',
      points: 4.0,
      cognitiveLevel: 'Vận dụng',
      learningOutcome:
        'Viết được bài văn nghị luận về một vấn đề có liên quan đến tuổi trẻ, biết kết hợp lí lẽ sắc bén và bằng chứng xác thực.',
      suggestedOutline: [
        'Mở bài: Dẫn dắt từ xu hướng hội nhập năng động của người trẻ và đặt vấn đề giữ gìn bản sắc, cội nguồn.',
        'Thân bài - Giải thích: Làm rõ khái niệm "bản sắc", "cội nguồn" và "hội nhập".',
        'Thân bài - Phân tích & Chứng minh: Vì sao người trẻ cần giữ cội nguồn khi hội nhập (điểm tựa giá trị, tạo dấu ấn riêng, tránh hòa tan)? Lấy bằng chứng thực tế xác đáng.',
        'Thân bài - Bàn luận mở rộng: Phê phán thái độ sính ngoại cực đoan hoặc bảo thủ khép kín; đề xuất hành động thiết thực.',
        'Kết bài: Khái quát thông điệp và liên hệ trách nhiệm bản thân.',
      ],
      keyArguments: [
        'Hội nhập là tiếp thu tinh hoa nhân loại nhưng không đánh mất gốc rễ văn hóa gia đình, dân tộc.',
        'Bản sắc cội nguồn giúp người trẻ định vị bản thân và tự tin đóng góp giá trị riêng.',
        'Giữ gìn cội nguồn cần gắn với tư duy cởi mở, sáng tạo để truyền thống tiếp tục sống trong đời sống mới.',
      ],
      rubric: [
        {
          id: 'r2-1',
          group: 'Đảm bảo cấu trúc',
          title: 'Bố cục 3 phần Mở - Thân - Kết',
          description: 'Đảm bảo cấu trúc bài văn nghị luận hoàn chỉnh, khoảng 600 chữ.',
          points: 0.5,
        },
        {
          id: 'r2-2',
          group: 'Xác định đúng vấn đề',
          title: 'Đúng vấn đề nghị luận xã hội',
          description: 'Tập trung bàn về mối quan hệ giữa giữ gìn cội nguồn/bản sắc và hội nhập ở người trẻ.',
          points: 0.5,
        },
        {
          id: 'r2-3',
          group: 'Triển khai vấn đề',
          title: 'Hệ thống luận điểm rõ ràng, sâu sắc',
          description: 'Giải thích, phân tích vai trò, mở rộng phản đề và nêu bài học nhận thức - hành động.',
          points: 1.5,
        },
        {
          id: 'r2-4',
          group: 'Lập luận và dẫn chứng',
          title: 'Lí lẽ thuyết phục, bằng chứng xác thực',
          description: 'Lập luận chặt chẽ, có dẫn chứng đời sống tiêu biểu và phù hợp.',
          points: 0.75,
        },
        {
          id: 'r2-5',
          group: 'Chính tả và ngữ pháp',
          title: 'Chuẩn chính tả, diễn đạt',
          description: 'Hành văn mạch lạc, chuẩn ngữ pháp và chính tả.',
          points: 0.25,
        },
        {
          id: 'r2-6',
          group: 'Sáng tạo',
          title: 'Góc nhìn mới mẻ, sâu sắc',
          description: 'Thể hiện suy nghĩ sâu sắc, cách diễn đạt giàu sức thuyết phục.',
          points: 0.5,
        },
      ],
      teacherReferenceEssay:
        'Tài liệu gợi ý chấm dành cho giáo viên: Đánh giá cao các bài viết biết phân biệt giữa bảo tồn cội nguồn một cách năng động với lối sống bảo thủ, đồng thời sử dụng dẫn chứng thực tế xác đáng.',
    },
  ],
  includeHighApplication: false,
  approved: false,
  isPracticeSample: true,
  sampleNotice:
    'Hồ sơ đề thực hành minh họa sử dụng ngữ liệu tự biên soạn để kiểm thử quy trình. Không phải đề thi chính thức của Bộ GD&ĐT.',
  createdAt: nowIso(),
  updatedAt: nowIso(),
};

let seedPromise: Promise<void> | null = null;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.put({
        id: 'default',
        defaultSchoolName: 'TRƯỜNG THPT THỰC HÀNH SMART LITERATURE',
        defaultDepartmentName: 'TỔ NGỮ VĂN',
        defaultAcademicYear: '2025 - 2026',
        wordFontFamily: 'Times New Roman',
        wordFontSizePt: 13,
        wordLineSpacing: 1.35,
        wordMarginsMm: { top: 20, bottom: 20, left: 25, right: 15 },
      });
    }

    const usersCount = await db.users.count();
    if (usersCount === 0) {
      await db.users.bulkPut([
        {
          id: 'teacher-dathien',
          fullName: 'Thầy Hồ Nguyễn Đa Thiện',
          email: 'dathien2412@gmail.com',
          roles: ['admin', 'teacher'],
          activeRole: 'teacher',
          schoolName: 'Trường THPT Thực hành Smart Literature',
          department: 'Tổ Ngữ văn',
          gradeFocus: '12',
          status: 'active',
          authProvider: 'local',
          updatedAt: nowIso(),
        },
        {
          id: 'student-demo-12a1',
          fullName: 'Nguyễn Minh An (Học sinh mẫu)',
          email: 'minhan.12a1@student.local',
          roles: ['student'],
          activeRole: 'student',
          schoolName: 'Trường THPT Thực hành Smart Literature',
          department: 'Lớp 12A1',
          gradeFocus: '12',
          status: 'active',
          authProvider: 'student-code',
          updatedAt: nowIso(),
        },
      ]);
    }

    const passagesCount = await db.passages.count();
    if (passagesCount === 0) {
      await db.passages.bulkPut(SEED_PASSAGES);
    }

    const examsCount = await db.exams.count();
    if (examsCount === 0) {
      await db.exams.put(SEED_EXAM);
    }

    const questionsCount = await db.questions.count();
    if (questionsCount === 0) {
      await db.questions.bulkPut(
        SEED_EXAM.readingQuestions.map((q) => ({
          ...q,
          ownerId: 'teacher-dathien',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }))
      );
    }

    const classesCount = await db.classes.count();
    if (classesCount === 0) {
      await db.classes.put({
        id: 'class-12a1-sample',
        ownerId: 'teacher-dathien',
        name: 'Lớp 12A1 – Ngữ văn (Thực hành)',
        grade: '12',
        academicYear: '2025 - 2026',
        joinCode: 'NV12A1',
        archived: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      await db.students.put({
        id: 'student-demo-12a1',
        classId: 'class-12a1-sample',
        studentCode: 'HS12A101',
        fullName: 'Nguyễn Minh An (Học sinh mẫu)',
        email: 'minhan.12a1@student.local',
        ownerId: 'teacher-dathien',
        createdAt: nowIso(),
      });
    }
  })();
  return seedPromise;
}
