export type GradeLevel = '10' | '11' | '12';

export type TextbookSeries =
  | 'Kết nối tri thức với cuộc sống'
  | 'Chân trời sáng tạo'
  | 'Cánh Diều';

export type PassageGenre =
  | 'Thơ'
  | 'Truyện'
  | 'Kí'
  | 'Kịch'
  | 'Văn bản nghị luận'
  | 'Văn bản thông tin';

export type SourceVerificationStatus =
  | 'Đã xác minh'
  | 'Giáo viên cung cấp'
  | 'Chưa xác minh'
  | 'Ngữ liệu tự biên soạn';

export type CognitiveLevel =
  | 'Nhận biết'
  | 'Thông hiểu'
  | 'Vận dụng'
  | 'Vận dụng cao';

export type ExamType =
  | 'Kiểm tra thường xuyên'
  | 'Kiểm tra giữa kỳ'
  | 'Kiểm tra cuối kỳ'
  | 'Đề ôn tập'
  | 'Đề luyện thi tốt nghiệp THPT'
  | 'Đề thi thử'
  | 'Đề bồi dưỡng học sinh giỏi'
  | 'Đề tùy chỉnh';

export type WritingCategory =
  | 'Nghị luận xã hội'
  | 'Nghị luận văn học'
  | 'Viết đoạn văn'
  | 'Viết bài văn'
  | 'Văn bản thuyết minh'
  | 'Văn bản nhật dụng / Kiến nghị';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  roles: UserRole[];
  activeRole: UserRole;
  schoolName: string;
  department: string;
  gradeFocus?: GradeLevel;
  status: 'active' | 'pending' | 'locked';
  authProvider: 'local' | 'google' | 'email' | 'student-code';
  updatedAt: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  author: string;
  genre: PassageGenre;
  grade: GradeLevel;
  textbookSeries: TextbookSeries | 'Dùng chung';
  topic: string;
  literaryPeriod: string;
  textType: string;
  content: string;
  formatStyle: 'poem' | 'prose' | 'dialogue' | 'informational';
  origin: string;
  citationSource: string;
  publisher: string;
  publishYear: string;
  pageNumber?: string;
  sourceUrl?: string;
  verificationStatus: SourceVerificationStatus;
  learningOutcomes: string[];
  tags: string[];
  isFavorite: boolean;
  ownerId: string;
  isPracticeSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartialCreditStep {
  id: string;
  description: string;
  points: number;
}

export interface ExamQuestion {
  id: string;
  order: number;
  part: 'doc-hieu';
  content: string;
  skill: string;
  learningOutcome: string;
  cognitiveLevel: CognitiveLevel;
  points: number;
  answer: string;
  equivalentAnswers: string;
  partialCreditSteps: PartialCreditStep[];
  nonQualifyingNotes: string;
  passageId?: string;
  tags?: string[];
  grade?: GradeLevel;
  genre?: PassageGenre;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RubricCriterion {
  id: string;
  group:
    | 'Đảm bảo cấu trúc'
    | 'Xác định đúng vấn đề'
    | 'Triển khai vấn đề'
    | 'Lập luận và dẫn chứng'
    | 'Diễn đạt'
    | 'Chính tả và ngữ pháp'
    | 'Sáng tạo';
  title: string;
  description: string;
  points: number;
}

export interface WritingPrompt {
  id: string;
  order: number;
  category: WritingCategory;
  formatType: 'Đoạn văn' | 'Bài văn';
  wordCountTarget: number;
  promptText: string;
  points: number;
  cognitiveLevel: CognitiveLevel;
  learningOutcome: string;
  suggestedOutline: string[];
  keyArguments: string[];
  rubric: RubricCriterion[];
  teacherReferenceEssay: string;
}

export interface ExamAdminInfo {
  schoolName: string;
  departmentName: string;
  academicYear: string;
  semester: 'Học kỳ I' | 'Học kỳ II' | 'Cả năm';
  grade: GradeLevel;
  textbookSeries: TextbookSeries;
  examType: ExamType;
  title: string;
  durationMinutes: number;
  totalPoints: number;
  knowledgeScope: string;
  learningOutcomesSummary: string;
  examCode: string;
  extraNotes: string;
  templateId: string;
}

export interface MatrixManualOverride {
  enabled: boolean;
  rows: MatrixRow[];
}

export interface ExamDocument {
  id: string;
  ownerId: string;
  adminInfo: ExamAdminInfo;
  passage: ReadingPassage;
  readingQuestions: ExamQuestion[];
  writingPrompts: WritingPrompt[];
  includeHighApplication: boolean;
  matrixOverride?: MatrixManualOverride;
  approved: boolean;
  isPracticeSample?: boolean;
  sampleNotice?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamVersionSnapshot {
  id: string;
  examId: string;
  label: string;
  snapshot: ExamDocument;
  createdAt: string;
}

export interface MatrixRow {
  id: string;
  stt: number;
  skill: 'Đọc hiểu' | 'Viết';
  contentUnit: string;
  counts: Record<CognitiveLevel, number>;
  points: Record<CognitiveLevel, number>;
  totalQuestions: number;
  totalPoints: number;
  percentage: number;
  questionRefs: string[];
}

export interface SpecificationRow {
  id: string;
  stt: number;
  skill: 'Đọc hiểu' | 'Viết';
  contentUnit: string;
  learningOutcome: string;
  evaluationIndicators: string;
  cognitiveLevel: CognitiveLevel;
  questionCount: number;
  points: number;
  questionLabels: string[];
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  targetTab: 'admin' | 'reading' | 'writing' | 'matrix' | 'spec' | 'rubric';
  targetElementId?: string;
}

export interface ValidationReport {
  status: 'Đạt yêu cầu kỹ thuật' | 'Cần kiểm tra' | 'Có lỗi cần sửa';
  issues: ValidationIssue[];
  checkedAt: string;
}

export interface LessonActivity {
  id: string;
  phase: '1. Mở đầu' | '2. Hình thành kiến thức' | '3. Luyện tập' | '4. Vận dụng';
  title: string;
  durationMinutes: number;
  method: 'Hợp tác nhóm' | 'Trạm học tập' | 'Dự án' | 'Đàm thoại gợi mở' | 'Trải nghiệm';
  objective: string;
  teacherActivity: string;
  studentActivity: string;
  expectedProduct: string;
  assessmentMethod: string;
}

export interface LessonPlan {
  id: string;
  ownerId: string;
  title: string;
  grade: GradeLevel;
  textbookSeries: TextbookSeries;
  durationPeriods: number;
  objectives: string;
  learningOutcomes: string;
  competencies: string;
  qualities: string;
  equipmentAndMaterials: string;
  activities: LessonActivity[];
  postLessonAdjustment: string;
  createdAt: string;
  updatedAt: string;
}

export type SlideTemplateType =
  | 'Trang bìa'
  | 'Mục tiêu bài học'
  | 'Khởi động'
  | 'Giới thiệu tác giả'
  | 'Giới thiệu tác phẩm'
  | 'Trình chiếu thơ'
  | 'Trình chiếu đoạn văn'
  | 'Đọc hiểu'
  | 'Phân tích nhân vật'
  | 'Phân tích nghệ thuật'
  | 'Sơ đồ tư duy'
  | 'Câu hỏi thảo luận'
  | 'Phiếu học tập'
  | 'Luyện viết'
  | 'Trò chơi'
  | 'Tổng kết'
  | 'Dặn dò';

export interface SlideItem {
  id: string;
  template: SlideTemplateType;
  title: string;
  subtitle?: string;
  body: string;
  answerText?: string;
  teacherNote?: string;
  themeVariant: 'navy' | 'cream' | 'teal';
}

export interface PresentationDeck {
  id: string;
  ownerId: string;
  title: string;
  grade: GradeLevel;
  sourceExamId?: string;
  slides: SlideItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MindMapNode {
  id: string;
  parentId: string | null;
  label: string;
  note?: string;
  color: string;
  x: number;
  y: number;
  collapsed?: boolean;
}

export interface MindMapDocument {
  id: string;
  ownerId: string;
  title: string;
  category:
    | 'Tác giả'
    | 'Tác phẩm'
    | 'Nhân vật'
    | 'Chủ đề'
    | 'Cốt truyện'
    | 'Hình ảnh thơ'
    | 'Luận điểm'
    | 'Dàn ý bài văn';
  grade: GradeLevel;
  nodes: MindMapNode[];
  createdAt: string;
  updatedAt: string;
}

export type WorksheetType =
  | 'Phiếu đọc hiểu'
  | 'Phiếu phân tích thơ'
  | 'Phiếu phân tích truyện'
  | 'Phiếu tìm hiểu nhân vật'
  | 'Phiếu thảo luận nhóm'
  | 'Phiếu phân tích lập luận'
  | 'Phiếu lập dàn ý'
  | 'Phiếu tự đánh giá'
  | 'Phiếu đánh giá đồng đẳng'
  | 'Phiếu luyện viết';

export interface WorksheetBlock {
  id: string;
  blockType:
    | 'Câu hỏi tự luận'
    | 'Điền khuyết'
    | 'Ghép nối'
    | 'Bảng so sánh'
    | 'Sơ đồ'
    | 'Ô ghi chú'
    | 'Checklist'
    | 'Khung viết đoạn văn';
  prompt: string;
  teacherGuide: string;
  rowsOrItems?: string[];
}

export interface WorksheetDocument {
  id: string;
  ownerId: string;
  title: string;
  worksheetType: WorksheetType;
  grade: GradeLevel;
  textbookSeries: TextbookSeries;
  passageTitle: string;
  blocks: WorksheetBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  ownerId: string;
  name: string;
  grade: GradeLevel;
  academicYear: string;
  joinCode: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRecord {
  id: string;
  classId: string;
  studentCode: string;
  fullName: string;
  email?: string;
  ownerId: string;
  createdAt: string;
}

export type AssignmentKind =
  | 'Đề kiểm tra'
  | 'Bài đọc hiểu'
  | 'Bài luyện viết'
  | 'Phiếu học tập'
  | 'Trò chơi';

export interface Assignment {
  id: string;
  ownerId: string;
  title: string;
  kind: AssignmentKind;
  classId: string;
  targetId: string;
  startAt: string;
  dueAt: string;
  durationMinutes: number;
  maxAttempts: number;
  allowViewAnswersAfter: 'never' | 'after-submit' | 'after-grading';
  allowViewScoreAfter: 'after-submit' | 'after-grading';
  allowLate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionHighlight {
  id: string;
  excerpt: string;
  comment: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  classId: string;
  studentId: string;
  studentName: string;
  status: 'Chưa bắt đầu' | 'Đang làm' | 'Đã nộp' | 'Nộp muộn' | 'Đang chấm' | 'Đã chấm';
  readingAnswers: Record<string, string>;
  writingAnswers: Record<string, string>;
  questionScores: Record<string, number>;
  rubricScores: Record<string, number>;
  highlights: SubmissionHighlight[];
  teacherComment: string;
  aiSuggestedFeedback?: string;
  totalScore?: number;
  submittedAt?: string;
  gradedAt?: string;
  updatedAt: string;
}

export interface WritingDraftSession {
  id: string;
  studentId: string;
  promptText: string;
  essayType: WritingCategory;
  targetWords: number;
  step1Analysis: {
    textType: string;
    topic: string;
    focusIssue: string;
    evidenceScope: string;
  };
  step2Ideas: string;
  step3Outline: {
    intro: string;
    body: string;
    conclusion: string;
  };
  draftText: string;
  revisions: { timestamp: string; content: string; wordCount: number }[];
  selfChecklist: Record<string, boolean>;
  aiFeedback?: string;
  updatedAt: string;
}

export interface AppSettings {
  id: 'default';
  defaultSchoolName: string;
  defaultDepartmentName: string;
  defaultAcademicYear: string;
  wordFontFamily: 'Times New Roman' | 'Be Vietnam Pro';
  wordFontSizePt: number;
  wordLineSpacing: number;
  wordMarginsMm: { top: number; bottom: number; left: number; right: number };
  lastSyncAt?: string;
}
