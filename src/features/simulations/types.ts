import { CognitiveLevel, GradeLevel, TextbookSeries } from '../../types';

export type SimulationGroup = 'grade10' | 'grade11' | 'grade12' | 'skills';

export type SimulationMode = '2d' | '3d' | 'both';

export type SimulationSkillDomain =
  | 'Tác phẩm văn học'
  | 'Kiến thức tiếng Việt'
  | 'Kĩ năng đọc'
  | 'Kĩ năng viết';

export type QualityTier = 'economy' | 'standard' | 'high';

export type Scene3DPreset =
  | 'myth-pillar'
  | 'temple-ghost'
  | 'prison-calligraphy'
  | 'longhouse-epic'
  | 'greek-fire'
  | 'odyssey-strait'
  | 'huong-son-cave'
  | 'autumn-garden'
  | 'hoang-lan-garden'
  | 'famine-village'
  | 'vu-dai-village'
  | 'trang-giang-river'
  | 'perfume-river-terrain'
  | 'cuu-trung-dai-stage'
  | 'boat-sea-waves'
  | 'hamlet-stage'
  | 'tay-tien-mountains'
  | 'tennis-court-satire'
  | 'family-courtyard'
  | 'forest-journey'
  | 'lorca-guitar-symbol'
  | 'sea-shrine'
  | 'comedy-stage-miser'
  | 'comedy-stage-inspector'
  | 'lifeboat-ocean'
  | 'drama-conflict-stage';

export type Scene2DType =
  | 'spatial-map'
  | 'character-network'
  | 'timeline-argument'
  | 'emotion-arc'
  | 'skill-pov'
  | 'skill-chronology'
  | 'skill-rhetoric'
  | 'skill-prosody'
  | 'skill-argument-builder'
  | 'skill-character-map'
  | 'skill-poetic-imagery'
  | 'skill-paragraph-200'
  | 'skill-essay-600';

export interface SimulationParameter {
  id: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  illustrativeNote: string;
}

export interface SimulationHotspot {
  id: string;
  label: string;
  shortLabel?: string;
  position3D: [number, number, number];
  position2D: { x: number; y: number }; // 0..100 percent
  priority: 1 | 2 | 3; // 1 = primary
  category: 'Không gian' | 'Nhân vật' | 'Chi tiết nghệ thuật' | 'Biểu tượng' | 'Lịch sử – Văn hóa' | 'Kiến thức';
  summary: string;
  textualDetail: string;
  pedagogicalNote: string;
}

export interface SimulationStage {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  narration: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  highlightHotspotIds: string[];
  animationKey: string;
  textualAnchor: string;
}

export interface SimulationNode2D {
  id: string;
  label: string;
  role?: string;
  x: number; // 0..100
  y: number; // 0..100
  color: string;
  detail: string;
}

export interface SimulationEdge2D {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export type QuestionFormat =
  | 'mcq'
  | 'true-false'
  | 'fill-blank'
  | 'short-answer'
  | 'appreciation';

export interface SimulationQuestion {
  id: string;
  level: CognitiveLevel;
  format: QuestionFormat;
  prompt: string;
  options?: string[];
  correctAnswer?: string | number | boolean;
  suggestedGuide: string;
  rubricCriteria?: string[];
  explanation: string;
}

export interface SimulationInteractiveTask {
  id: string;
  title: string;
  instruction: string;
  type: 'match' | 'order' | 'classify' | 'explore';
  items: { id: string; prompt: string; target: string; feedback: string }[];
}

export interface SimulationDefinition {
  id: string;
  number: number; // 1..40
  title: string;
  workTitle: string;
  author: string;
  group: SimulationGroup;
  grades: GradeLevel[];
  textbooks: (TextbookSeries | 'Học liệu dùng chung 3 bộ sách')[];
  volumeAndUnit: string;
  genre: string;
  skillDomain: SimulationSkillDomain;
  mode: SimulationMode;
  scene3DPreset?: Scene3DPreset;
  scene2DType: Scene2DType;
  estimatedMinutes: number;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    sky: string;
  };
  sourceVerificationStatus:
    | 'Đã đối chiếu Chương trình GDPT 2018'
    | 'Học liệu chuẩn chương trình – Cần đối chiếu bản in SGK';
  sourceCitation: string;
  reconstructionNotice: string;
  objective: string;
  learningOutcomes: string[];
  introNarration: string;
  operationGuide: string;
  summaryNarration: string;
  keyTakeaways: string[];
  applicationTask: {
    title: string;
    prompt: string;
    criteria: string[];
  };
  teacherGuide: {
    durationSuggestion: string;
    classroomFlow: string[];
    discussionPrompts: string[];
    cautionNote: string;
  };
  parameters: SimulationParameter[];
  stages: SimulationStage[];
  hotspots: SimulationHotspot[];
  diagram2D: {
    title: string;
    nodes: SimulationNode2D[];
    edges: SimulationEdge2D[];
  };
  interactiveTasks: SimulationInteractiveTask[];
  questions: SimulationQuestion[];
  offlineEstimateKb: number;
}

export interface SimulationProgressRecord {
  simId: string;
  visitedHotspots: string[];
  completedStages: string[];
  completedTasks: string[];
  answers: Record<string, string>;
  quizScore?: number;
  quizTotal?: number;
  progressPercent: number;
  favorite: boolean;
  lastStageIndex: number;
  notes: string;
  customTeacherText?: string;
  lastViewedAt: string;
  updatedAt: string;
}

export interface SimulationOfflinePack {
  simId: string;
  group: SimulationGroup;
  sizeBytes: number;
  downloadedAt: string;
  version: string;
  payload: SimulationDefinition;
}
