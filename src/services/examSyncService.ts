import {
  CognitiveLevel,
  ExamDocument,
  MatrixRow,
  SpecificationRow,
} from '../types';
import { COGNITIVE_LEVELS_ALL, COGNITIVE_LEVELS_BASE } from '../config/curriculum';
import { roundExact } from '../utils/formatters';

export interface ExamSyncSummary {
  readingTotal: number;
  writingTotal: number;
  computedTotal: number;
  targetTotal: number;
  levelsUsed: CognitiveLevel[];
  matrixRows: MatrixRow[];
  specRows: SpecificationRow[];
  levelTotals: Record<CognitiveLevel, { count: number; points: number; percent: number }>;
  conflicts: string[];
}

function emptyCounts(): Record<CognitiveLevel, number> {
  return {
    'Nhận biết': 0,
    'Thông hiểu': 0,
    'Vận dụng': 0,
    'Vận dụng cao': 0,
  };
}

function emptyPoints(): Record<CognitiveLevel, number> {
  return {
    'Nhận biết': 0,
    'Thông hiểu': 0,
    'Vận dụng': 0,
    'Vận dụng cao': 0,
  };
}

export function buildSynchronizedExamData(exam: ExamDocument): ExamSyncSummary {
  const hasHighApp =
    exam.includeHighApplication ||
    exam.readingQuestions.some((q) => q.cognitiveLevel === 'Vận dụng cao') ||
    exam.writingPrompts.some((w) => w.cognitiveLevel === 'Vận dụng cao');

  const levelsUsed = hasHighApp ? COGNITIVE_LEVELS_ALL : COGNITIVE_LEVELS_BASE;

  const readingTotal = roundExact(
    exam.readingQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
  );
  const writingTotal = roundExact(
    exam.writingPrompts.reduce((acc, w) => acc + (Number(w.points) || 0), 0)
  );
  const computedTotal = roundExact(readingTotal + writingTotal);
  const targetTotal = roundExact(Number(exam.adminInfo.totalPoints) || 10);

  const matrixRows: MatrixRow[] = [];

  if (exam.readingQuestions.length > 0) {
    const rCounts = emptyCounts();
    const rPoints = emptyPoints();
    const refs: string[] = [];

    exam.readingQuestions.forEach((q, idx) => {
      const lvl = q.cognitiveLevel;
      rCounts[lvl] += 1;
      rPoints[lvl] = roundExact(rPoints[lvl] + (Number(q.points) || 0));
      refs.push(`Câu ${idx + 1} (Đọc hiểu)`);
    });

    matrixRows.push({
      id: 'matrix-reading',
      stt: 1,
      skill: 'Đọc hiểu',
      contentUnit: `${exam.passage.genre}: ${exam.passage.title || 'Ngữ liệu đọc hiểu'}`,
      counts: rCounts,
      points: rPoints,
      totalQuestions: exam.readingQuestions.length,
      totalPoints: readingTotal,
      percentage: targetTotal > 0 ? roundExact((readingTotal / targetTotal) * 100) : 0,
      questionRefs: refs,
    });
  }

  exam.writingPrompts.forEach((wp, idx) => {
    const wCounts = emptyCounts();
    const wPoints = emptyPoints();
    const pts = roundExact(Number(wp.points) || 0);
    wCounts[wp.cognitiveLevel] = 1;
    wPoints[wp.cognitiveLevel] = pts;

    matrixRows.push({
      id: `matrix-writing-${wp.id}`,
      stt: matrixRows.length + 1,
      skill: 'Viết',
      contentUnit: `${wp.category} (${wp.formatType} ~${wp.wordCountTarget} chữ)`,
      counts: wCounts,
      points: wPoints,
      totalQuestions: 1,
      totalPoints: pts,
      percentage: targetTotal > 0 ? roundExact((pts / targetTotal) * 100) : 0,
      questionRefs: [`Câu ${idx + 1} (Viết)`],
    });
  });

  // Specification rows grouped cleanly by cognitive level & skill
  const specRows: SpecificationRow[] = [];
  if (exam.readingQuestions.length > 0) {
    for (const lvl of levelsUsed) {
      const matched = exam.readingQuestions
        .map((q, idx) => ({ q, label: `Câu ${idx + 1}` }))
        .filter((item) => item.q.cognitiveLevel === lvl);
      if (matched.length > 0) {
        const pts = roundExact(
          matched.reduce((sum, item) => sum + (Number(item.q.points) || 0), 0)
        );
        const outcomes = Array.from(
          new Set(matched.map((m) => m.q.learningOutcome.trim()).filter(Boolean))
        ).join(' ');
        const skills = Array.from(
          new Set(matched.map((m) => m.q.skill.trim()).filter(Boolean))
        ).join('; ');

        specRows.push({
          id: `spec-reading-${lvl}`,
          stt: specRows.length + 1,
          skill: 'Đọc hiểu',
          contentUnit: `${exam.passage.genre} (${exam.passage.title || 'Ngữ liệu'})`,
          learningOutcome:
            outcomes || 'Chưa gắn yêu cầu cần đạt cho nhóm câu hỏi mức độ này.',
          evaluationIndicators: skills || 'Đánh giá theo câu hỏi đọc hiểu tương ứng.',
          cognitiveLevel: lvl,
          questionCount: matched.length,
          points: pts,
          questionLabels: matched.map((m) => m.label),
        });
      }
    }
  }

  exam.writingPrompts.forEach((wp, idx) => {
    specRows.push({
      id: `spec-writing-${wp.id}`,
      stt: specRows.length + 1,
      skill: 'Viết',
      contentUnit: `${wp.category} (${wp.formatType} ~${wp.wordCountTarget} chữ)`,
      learningOutcome:
        wp.learningOutcome || 'Chưa gắn yêu cầu cần đạt cho bài viết.',
      evaluationIndicators:
        wp.keyArguments.length > 0
          ? wp.keyArguments.join('; ')
          : 'Đảm bảo cấu trúc, xác định đúng vấn đề, triển khai lập luận và chuẩn chính tả.',
      cognitiveLevel: wp.cognitiveLevel,
      questionCount: 1,
      points: roundExact(Number(wp.points) || 0),
      questionLabels: [`Phần II - Câu ${idx + 1}`],
    });
  });

  const levelTotals: Record<
    CognitiveLevel,
    { count: number; points: number; percent: number }
  > = {
    'Nhận biết': { count: 0, points: 0, percent: 0 },
    'Thông hiểu': { count: 0, points: 0, percent: 0 },
    'Vận dụng': { count: 0, points: 0, percent: 0 },
    'Vận dụng cao': { count: 0, points: 0, percent: 0 },
  };

  matrixRows.forEach((row) => {
    levelsUsed.forEach((lvl) => {
      levelTotals[lvl].count += row.counts[lvl];
      levelTotals[lvl].points = roundExact(levelTotals[lvl].points + row.points[lvl]);
    });
  });

  levelsUsed.forEach((lvl) => {
    levelTotals[lvl].percent =
      targetTotal > 0
        ? roundExact((levelTotals[lvl].points / targetTotal) * 100)
        : 0;
  });

  // Check manual matrix override conflicts if enabled
  const conflicts: string[] = [];
  if (exam.matrixOverride?.enabled) {
    const manualPoints = roundExact(
      exam.matrixOverride.rows.reduce((s, r) => s + r.totalPoints, 0)
    );
    const manualCount = exam.matrixOverride.rows.reduce(
      (s, r) => s + r.totalQuestions,
      0
    );
    const actualCount = exam.readingQuestions.length + exam.writingPrompts.length;
    if (manualPoints !== computedTotal) {
      conflicts.push(
        `Ma trận tùy chỉnh có tổng điểm ${manualPoints} khác với tổng điểm các câu hỏi hiện tại (${computedTotal}).`
      );
    }
    if (manualCount !== actualCount) {
      conflicts.push(
        `Ma trận tùy chỉnh có ${manualCount} câu nhưng đề thi hiện có ${actualCount} câu.`
      );
    }
  }

  return {
    readingTotal,
    writingTotal,
    computedTotal,
    targetTotal,
    levelsUsed,
    matrixRows,
    specRows,
    levelTotals,
    conflicts,
  };
}
