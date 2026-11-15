import { EXAM_TEMPLATES } from '../config/curriculum';
import { ExamDocument, ValidationIssue, ValidationReport } from '../types';
import { formatScore, roundExact } from '../utils/formatters';
import { buildSynchronizedExamData } from './examSyncService';

export function validateExamDocument(exam: ExamDocument): ValidationReport {
  const issues: ValidationIssue[] = [];
  const sync = buildSynchronizedExamData(exam);

  // 1. Admin metadata check
  if (!exam.adminInfo.schoolName.trim() || !exam.adminInfo.title.trim()) {
    issues.push({
      id: 'val-admin-missing',
      severity: 'error',
      category: 'Thông tin hành chính',
      message: 'Đề thi thiếu tên trường hoặc tên đề thi.',
      targetTab: 'admin',
    });
  }
  if (!exam.adminInfo.examCode.trim() || !exam.adminInfo.academicYear.trim()) {
    issues.push({
      id: 'val-admin-meta',
      severity: 'warning',
      category: 'Thông tin hành chính',
      message: 'Nên bổ sung đầy đủ mã đề và năm học trước khi phát hành.',
      targetTab: 'admin',
    });
  }

  // 2. Total points match
  if (sync.computedTotal !== sync.targetTotal) {
    issues.push({
      id: 'val-total-points',
      severity: 'error',
      category: 'Tổng điểm',
      message: `Tổng điểm hiện tại của các câu hỏi là ${formatScore(sync.computedTotal)} điểm, chưa khớp với tổng điểm cấu hình (${formatScore(sync.targetTotal)} điểm).`,
      targetTab: 'reading',
    });
  }

  // 3. Question count & numbering sequence
  const totalQCount = exam.readingQuestions.length + exam.writingPrompts.length;
  if (totalQCount === 0) {
    issues.push({
      id: 'val-no-questions',
      severity: 'error',
      category: 'Số câu hỏi',
      message: 'Đề kiểm tra chưa có câu hỏi nào.',
      targetTab: 'reading',
    });
  }

  const orders = exam.readingQuestions.map((q) => q.order);
  const expectedOrders = exam.readingQuestions.map((_, i) => i + 1);
  if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
    issues.push({
      id: 'val-order-seq',
      severity: 'warning',
      category: 'Thứ tự câu hỏi',
      message: 'Thứ tự đánh số câu hỏi Đọc hiểu chưa liên tục từ 1.',
      targetTab: 'reading',
    });
  }

  // 4. Duplicate questions check
  const normalizedContents = new Map<string, number>();
  exam.readingQuestions.forEach((q, idx) => {
    const norm = q.content.trim().toLowerCase().replace(/\s+/g, ' ');
    if (norm) {
      if (normalizedContents.has(norm)) {
        issues.push({
          id: `val-dup-${q.id}`,
          severity: 'error',
          category: 'Trùng lặp câu hỏi',
          message: `Câu ${idx + 1} Đọc hiểu bị trùng nội dung với Câu ${normalizedContents.get(norm)}.`,
          targetTab: 'reading',
          targetElementId: q.id,
        });
      } else {
        normalizedContents.set(norm, idx + 1);
      }
    }
  });

  // 5. Passage & Source check
  if (exam.readingQuestions.length > 0) {
    if (!exam.passage.content.trim()) {
      issues.push({
        id: 'val-passage-empty',
        severity: 'error',
        category: 'Ngữ liệu Đọc hiểu',
        message: 'Phần Đọc hiểu chưa có nội dung ngữ liệu.',
        targetTab: 'reading',
      });
    }
    if (!exam.passage.citationSource.trim() || !exam.passage.author.trim()) {
      issues.push({
        id: 'val-passage-source',
        severity: 'error',
        category: 'Nguồn trích dẫn ngữ liệu',
        message: 'Ngữ liệu Đọc hiểu còn thiếu tên tác giả hoặc nguồn trích dẫn rõ ràng.',
        targetTab: 'reading',
      });
    }
    if (exam.passage.verificationStatus === 'Chưa xác minh') {
      issues.push({
        id: 'val-passage-unverified',
        severity: 'warning',
        category: 'Trạng thái nguồn',
        message: 'Ngữ liệu đang ở trạng thái "Chưa xác minh". Giáo viên cần rà soát nguồn gốc trước khi phát hành.',
        targetTab: 'reading',
      });
    }
  }

  // 6. Per-question answer, grading guide, and YCCĐ
  exam.readingQuestions.forEach((q, idx) => {
    if (!q.content.trim()) {
      issues.push({
        id: `val-q-content-${q.id}`,
        severity: 'error',
        category: 'Nội dung câu hỏi',
        message: `Câu ${idx + 1} (Đọc hiểu) đang để trống nội dung.`,
        targetTab: 'reading',
        targetElementId: q.id,
      });
    }
    if (!q.answer.trim()) {
      issues.push({
        id: `val-q-ans-${q.id}`,
        severity: 'error',
        category: 'Thiếu đáp án',
        message: `Câu ${idx + 1} (Đọc hiểu) chưa có đáp án dự kiến.`,
        targetTab: 'rubric',
        targetElementId: q.id,
      });
    }
    const partialSum = roundExact(
      q.partialCreditSteps.reduce((s, step) => s + (Number(step.points) || 0), 0)
    );
    if (q.partialCreditSteps.length === 0) {
      issues.push({
        id: `val-q-guide-${q.id}`,
        severity: 'warning',
        category: 'Hướng dẫn chấm',
        message: `Câu ${idx + 1} (Đọc hiểu) chưa có các ý chấm thành phần chi tiết.`,
        targetTab: 'rubric',
        targetElementId: q.id,
      });
    } else if (partialSum > roundExact(Number(q.points) || 0)) {
      issues.push({
        id: `val-q-partialsum-${q.id}`,
        severity: 'error',
        category: 'Điểm thành phần',
        message: `Tổng điểm các ý thành phần của Câu ${idx + 1} (${formatScore(partialSum)}đ) vượt quá điểm câu hỏi (${formatScore(q.points)}đ).`,
        targetTab: 'rubric',
        targetElementId: q.id,
      });
    }
    if (!q.learningOutcome.trim()) {
      issues.push({
        id: `val-q-yccd-${q.id}`,
        severity: 'warning',
        category: 'Yêu cầu cần đạt',
        message: `Câu ${idx + 1} (Đọc hiểu) chưa gắn Yêu cầu cần đạt cụ thể.`,
        targetTab: 'reading',
        targetElementId: q.id,
      });
    }
  });

  // 7. Writing prompts & Rubric validation
  exam.writingPrompts.forEach((wp, idx) => {
    if (!wp.promptText.trim()) {
      issues.push({
        id: `val-w-prompt-${wp.id}`,
        severity: 'error',
        category: 'Đề bài phần Viết',
        message: `Phần Viết - Câu ${idx + 1} chưa có nội dung đề bài.`,
        targetTab: 'writing',
        targetElementId: wp.id,
      });
    }
    if (!wp.learningOutcome.trim()) {
      issues.push({
        id: `val-w-yccd-${wp.id}`,
        severity: 'warning',
        category: 'Yêu cầu cần đạt',
        message: `Phần Viết - Câu ${idx + 1} chưa gắn Yêu cầu cần đạt.`,
        targetTab: 'writing',
        targetElementId: wp.id,
      });
    }
    const rubricSum = roundExact(
      wp.rubric.reduce((s, r) => s + (Number(r.points) || 0), 0)
    );
    const wpPoints = roundExact(Number(wp.points) || 0);
    if (wp.rubric.length === 0) {
      issues.push({
        id: `val-w-norubric-${wp.id}`,
        severity: 'error',
        category: 'Rubric chấm viết',
        message: `Phần Viết - Câu ${idx + 1} chưa có tiêu chí barem chấm điểm.`,
        targetTab: 'rubric',
        targetElementId: wp.id,
      });
    } else if (rubricSum !== wpPoints) {
      issues.push({
        id: `val-w-rubric-${wp.id}`,
        severity: 'error',
        category: 'Khớp điểm Rubric',
        message: `Tổng điểm rubric của Phần Viết - Câu ${idx + 1} (${formatScore(rubricSum)}đ) không khớp điểm câu hỏi (${formatScore(wpPoints)}đ).`,
        targetTab: 'rubric',
        targetElementId: wp.id,
      });
    }
  });

  // 8. Matrix & Specification conflict checks
  sync.conflicts.forEach((conflictMsg, idx) => {
    issues.push({
      id: `val-matrix-conflict-${idx}`,
      severity: 'error',
      category: 'Ma trận & Đặc tả',
      message: conflictMsg,
      targetTab: 'matrix',
    });
  });

  // 9. Template alignment check (soft check if user selected a structured template)
  const template = EXAM_TEMPLATES.find((t) => t.id === exam.adminInfo.templateId);
  if (template && exam.adminInfo.templateId !== 'custom') {
    if (
      template.readingQuestionPoints.length > 0 &&
      exam.readingQuestions.length !== template.readingQuestionPoints.length
    ) {
      issues.push({
        id: 'val-template-reading-count',
        severity: 'warning',
        category: 'Cấu trúc mẫu',
        message: `Mẫu "${template.name}" gợi ý ${template.readingQuestionPoints.length} câu Đọc hiểu, hiện tại đề có ${exam.readingQuestions.length} câu.`,
        targetTab: 'reading',
      });
    }
    if (exam.writingPrompts.length !== template.writingPromptsConfig.length) {
      issues.push({
        id: 'val-template-writing-count',
        severity: 'warning',
        category: 'Cấu trúc mẫu',
        message: `Mẫu "${template.name}" gợi ý ${template.writingPromptsConfig.length} câu Viết, hiện tại đề có ${exam.writingPrompts.length} câu.`,
        targetTab: 'writing',
      });
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');

  return {
    status: hasErrors
      ? 'Có lỗi cần sửa'
      : hasWarnings
      ? 'Cần kiểm tra'
      : 'Đạt yêu cầu kỹ thuật',
    issues,
    checkedAt: new Date().toISOString(),
  };
}
