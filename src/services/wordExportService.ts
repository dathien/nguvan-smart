import { db } from '../database/db';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import {
  AppSettings,
  ExamDocument,
  LessonPlan,
  WorksheetDocument,
} from '../types';
import { formatScore, slugifyFilename } from '../utils/formatters';
import { buildSynchronizedExamData } from './examSyncService';

const BORDER_STYLE = {
  top: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
  left: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
  right: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' },
};

function pageMargins(settings?: AppSettings) {
  const m = settings?.wordMarginsMm ?? {top:20,bottom:20,left:25,right:15};
  return {top:Math.round(m.top*56.693),bottom:Math.round(m.bottom*56.693),left:Math.round(m.left*56.693),right:Math.round(m.right*56.693)};
}

function getFontConfig(settings?: AppSettings) {
  return {
    font: settings?.wordFontFamily || 'Times New Roman',
    size: (settings?.wordFontSizePt || 13) * 2, // half-points
    line: Math.round((settings?.wordLineSpacing || 1.35) * 240),
  };
}

function makePara(
  text: string,
  options?: {
    bold?: boolean;
    italic?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceBefore?: number;
    spaceAfter?: number;
    indentLeft?: number;
    font?: string;
    size?: number;
    line?: number;
  }
): Paragraph {
  return new Paragraph({
    alignment: options?.align ?? AlignmentType.LEFT,
    spacing: {
      before: options?.spaceBefore ?? 60,
      after: options?.spaceAfter ?? 80,
      line: options?.line ?? 324,
    },
    indent: options?.indentLeft ? { left: options.indentLeft } : undefined,
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        italic: options?.italic,
        font: options?.font ?? 'Times New Roman',
        size: options?.size ?? 26,
      }),
    ],
  });
}

function makeCell(
  text: string,
  options?: {
    bold?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    widthPercent?: number;
    shading?: string;
  }
): TableCell {
  return new TableCell({
    borders: BORDER_STYLE,
    shading: options?.shading ? { fill: options.shading } : undefined,
    width: options?.widthPercent
      ? { size: options.widthPercent, type: WidthType.PERCENTAGE }
      : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: text.split('\n').map(
      (line) =>
        new Paragraph({
          alignment: options?.align ?? AlignmentType.LEFT,
          spacing: { before: 20, after: 20, line: 260 },
          children: [
            new TextRun({
              text: line,
              bold: options?.bold,
              font: 'Times New Roman',
              size: 24,
            }),
          ],
        })
    ),
  });
}

function buildAdminHeaderTable(exam: ExamDocument, subtitle: string, settings?: AppSettings): Table {
  const cfg = getFontConfig(settings);
  const para = (text: string, options?: Parameters<typeof makePara>[1]) => makePara(text, {...options, font:cfg.font, size:cfg.size, line:cfg.line});
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              para(exam.adminInfo.schoolName.toUpperCase(), {
                bold: true,
                align: AlignmentType.CENTER,
                size: 24,
              }),
              para(exam.adminInfo.departmentName.toUpperCase(), {
                bold: true,
                align: AlignmentType.CENTER,
                size: 24,
              }),
              para(exam.adminInfo.examCode ? `Mã đề: ${exam.adminInfo.examCode}` : "", {
                italic: true,
                align: AlignmentType.CENTER,
                size: 22,
              }),
            ],
          }),
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [
              para(subtitle.toUpperCase(), {
                bold: true,
                align: AlignmentType.CENTER,
                size: 24,
              }),
              para(
                `Môn: NGỮ VĂN – Lớp ${exam.adminInfo.grade} (${exam.adminInfo.semester}, ${exam.adminInfo.academicYear})`,
                { bold: true, align: AlignmentType.CENTER, size: 24 }
              ),
              para(
                `Thời gian làm bài: ${exam.adminInfo.durationMinutes} phút (không kể thời gian phát đề)`,
                { italic: true, align: AlignmentType.CENTER, size: 22 }
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

export async function generateExamDocxBlob(
  exam: ExamDocument,
  settings?: AppSettings
): Promise<Blob> {
  settings ??= await db.settings.get("default");
  const cfg = getFontConfig(settings);
  const para = (text: string, options?: Parameters<typeof makePara>[1]) => makePara(text, {...options, font:cfg.font, size:options?.size ?? cfg.size, line:cfg.line});
  const fontCfg = getFontConfig(settings);
  const sync = buildSynchronizedExamData(exam);
  const children: (Paragraph | Table)[] = [
    buildAdminHeaderTable(exam, exam.adminInfo.title, settings),
    para('', { spaceAfter: 80 }),
  ];

  if (exam.isPracticeSample && exam.sampleNotice) {
    children.push(
      para(`[Lưu ý: ${exam.sampleNotice}]`, {
        italic: true,
        size: 22,
        font: fontCfg.font,
      })
    );
  }

  if (exam.readingQuestions.length > 0) {
    children.push(
      para(
        `I. ĐỌC HIỂU (${formatScore(sync.readingTotal)} điểm)`,
        { bold: true, size: fontCfg.size, font: fontCfg.font, spaceBefore: 120 }
      )
    );
    children.push(
      para('Đọc văn bản sau và thực hiện các yêu cầu:', {
        italic: true,
        size: fontCfg.size,
        font: fontCfg.font,
      })
    );
    if (exam.passage.title) {
      children.push(
        para(exam.passage.title.toUpperCase(), {
          bold: true,
          align: AlignmentType.CENTER,
          size: fontCfg.size,
          font: fontCfg.font,
        })
      );
    }
    const lines = exam.passage.content.split('\n');
    lines.forEach((line) => {
      children.push(
        para(line, {
          align:
            exam.passage.formatStyle === 'poem'
              ? AlignmentType.LEFT
              : AlignmentType.JUSTIFIED,
          indentLeft: exam.passage.formatStyle === 'poem' ? 720 : 0,
          spaceBefore: 20,
          spaceAfter: line.trim() === '' ? 100 : 30,
          size: fontCfg.size,
          font: fontCfg.font,
        })
      );
    });
    children.push(
      para(
        `(Theo ${exam.passage.author} – ${exam.passage.citationSource}${exam.passage.publishYear ? `, ${exam.passage.publishYear}` : ''})`,
        {
          italic: true,
          align: AlignmentType.RIGHT,
          size: fontCfg.size - 2,
          font: fontCfg.font,
        }
      )
    );

    exam.readingQuestions.forEach((q, idx) => {
      children.push(
        para(
          `Câu ${idx + 1} (${formatScore(q.points)} điểm). ${q.content}`,
          {
            size: fontCfg.size,
            font: fontCfg.font,
            spaceBefore: 80,
          }
        )
      );
    });
  }

  if (exam.writingPrompts.length > 0) {
    children.push(
      para(
        `II. VIẾT (${formatScore(sync.writingTotal)} điểm)`,
        { bold: true, size: fontCfg.size, font: fontCfg.font, spaceBefore: 180 }
      )
    );
    exam.writingPrompts.forEach((wp, idx) => {
      children.push(
        para(
          `Câu ${idx + 1} (${formatScore(wp.points)} điểm). ${wp.promptText}`,
          {
            size: fontCfg.size,
            font: fontCfg.font,
            spaceBefore: 80,
          }
        )
      );
    });
  }

  children.push(
    para('--- HẾT ---', {
      bold: true,
      align: AlignmentType.CENTER,
      spaceBefore: 200,
      font: fontCfg.font,
      size: fontCfg.size,
    })
  );

  if (exam.adminInfo.extraNotes) {
    children.push(
      para(exam.adminInfo.extraNotes, {
        italic: true,
        align: AlignmentType.CENTER,
        font: fontCfg.font,
        size: fontCfg.size - 2,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: pageMargins(settings),
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function generateMatrixDocxBlob(exam: ExamDocument, settings?: AppSettings): Promise<Blob> {
  settings ??= await db.settings.get("default");
  const cfg = getFontConfig(settings);
  const para = (text: string, options?: Parameters<typeof makePara>[1]) => makePara(text, {...options, font:cfg.font, size:options?.size ?? cfg.size, line:cfg.line});
  const sync = buildSynchronizedExamData(exam);
  const rows = exam.matrixOverride?.enabled
    ? exam.matrixOverride.rows
    : sync.matrixRows;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell('STT', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
      makeCell('Kỹ năng', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
      makeCell('Nội dung / Đơn vị kiến thức', { bold: true, shading: 'E2E8F0' }),
      ...sync.levelsUsed.map((lvl) =>
        makeCell(`${lvl}\n(Số câu / Điểm)`, {
          bold: true,
          align: AlignmentType.CENTER,
          shading: 'E2E8F0',
        })
      ),
      makeCell('Tổng câu', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
      makeCell('Tổng điểm', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
      makeCell('Tỉ lệ %', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
    ],
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: [
          makeCell(String(row.stt), { align: AlignmentType.CENTER }),
          makeCell(row.skill, { align: AlignmentType.CENTER }),
          makeCell(row.contentUnit),
          ...sync.levelsUsed.map((lvl) =>
            makeCell(`${row.counts[lvl]} câu / ${formatScore(row.points[lvl])}đ`, {
              align: AlignmentType.CENTER,
            })
          ),
          makeCell(String(row.totalQuestions), { align: AlignmentType.CENTER }),
          makeCell(formatScore(row.totalPoints), { align: AlignmentType.CENTER }),
          makeCell(`${formatScore(row.percentage)}%`, { align: AlignmentType.CENTER }),
        ],
      })
  );

  const totalRow = new TableRow({
    children: [
      makeCell('', { shading: 'F8FAFC' }),
      makeCell('TỔNG CỘNG', { bold: true, shading: 'F8FAFC' }),
      makeCell(`${exam.adminInfo.title}`, { bold: true, shading: 'F8FAFC' }),
      ...sync.levelsUsed.map((lvl) =>
        makeCell(
          `${sync.levelTotals[lvl].count} câu / ${formatScore(sync.levelTotals[lvl].points)}đ (${formatScore(sync.levelTotals[lvl].percent)}%)`,
          { bold: true, align: AlignmentType.CENTER, shading: 'F8FAFC' }
        )
      ),
      makeCell(
        String(rows.reduce((s, r) => s + r.totalQuestions, 0)),
        { bold: true, align: AlignmentType.CENTER, shading: 'F8FAFC' }
      ),
      makeCell(formatScore(sync.computedTotal), {
        bold: true,
        align: AlignmentType.CENTER,
        shading: 'F8FAFC',
      }),
      makeCell(
        `${sync.targetTotal > 0 ? formatScore((sync.computedTotal / sync.targetTotal) * 100) : 0}%`,
        { bold: true, align: AlignmentType.CENTER, shading: 'F8FAFC' }
      ),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906 }, // A4 Landscape for wide matrix
            margin: pageMargins(settings),
          },
        },
        children: [
          para(`${exam.adminInfo.schoolName} · ${exam.adminInfo.departmentName}`, {bold:true, align:AlignmentType.CENTER}),
          para('MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ / ÔN TẬP MÔN NGỮ VĂN', {
            bold: true,
            align: AlignmentType.CENTER,
            size: 28,
          }),
          para(
            `${exam.adminInfo.title} – Lớp ${exam.adminInfo.grade} (${exam.adminInfo.textbookSeries})`,
            { italic: true, align: AlignmentType.CENTER, size: 24 }
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows, totalRow],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function generateSpecificationDocxBlob(exam: ExamDocument, settings?: AppSettings): Promise<Blob> {
  settings ??= await db.settings.get("default");
  const cfg = getFontConfig(settings);
  const para = (text: string, options?: Parameters<typeof makePara>[1]) => makePara(text, {...options, font:cfg.font, size:options?.size ?? cfg.size, line:cfg.line});
  const sync = buildSynchronizedExamData(exam);

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell('STT', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
      makeCell('Kỹ năng', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
      makeCell('Đơn vị kiến thức', { bold: true, shading: 'E2E8F0' }),
      makeCell('Yêu cầu cần đạt (GDPT 2018)', { bold: true, shading: 'E2E8F0' }),
      makeCell('Biểu hiện cần đánh giá', { bold: true, shading: 'E2E8F0' }),
      makeCell('Mức độ', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
      makeCell('Số câu / Điểm', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
      makeCell('Câu tương ứng', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0' }),
    ],
  });

  const bodyRows = sync.specRows.map(
    (r) =>
      new TableRow({
        children: [
          makeCell(String(r.stt), { align: AlignmentType.CENTER }),
          makeCell(r.skill, { align: AlignmentType.CENTER }),
          makeCell(r.contentUnit),
          makeCell(r.learningOutcome),
          makeCell(r.evaluationIndicators),
          makeCell(r.cognitiveLevel, { align: AlignmentType.CENTER }),
          makeCell(`${r.questionCount} câu\n(${formatScore(r.points)}đ)`, {
            align: AlignmentType.CENTER,
          }),
          makeCell(r.questionLabels.join(', '), { align: AlignmentType.CENTER }),
        ],
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906 }, // A4 Landscape
            margin: pageMargins(settings),
          },
        },
        children: [
          para(`${exam.adminInfo.schoolName} · ${exam.adminInfo.departmentName}`, {bold:true, align:AlignmentType.CENTER}),
          para('BẢN ĐẶC TẢ ĐỀ KIỂM TRA MÔN NGỮ VĂN', {
            bold: true,
            align: AlignmentType.CENTER,
            size: 28,
          }),
          para(
            `${exam.adminInfo.title} – Lớp ${exam.adminInfo.grade} (${exam.adminInfo.textbookSeries})`,
            { italic: true, align: AlignmentType.CENTER, size: 24 }
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...bodyRows],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function generateGradingGuideDocxBlob(exam: ExamDocument, settings?: AppSettings): Promise<Blob> {
  settings ??= await db.settings.get("default");
  const cfg = getFontConfig(settings);
  const para = (text: string, options?: Parameters<typeof makePara>[1]) => makePara(text, {...options, font:cfg.font, size:options?.size ?? cfg.size, line:cfg.line});
  const sync = buildSynchronizedExamData(exam);
  const children: (Paragraph | Table)[] = [
    buildAdminHeaderTable(exam, 'HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM', settings),
    para('', { spaceAfter: 80 }),
  ];

  if (exam.readingQuestions.length > 0) {
    children.push(
      para(`PHẦN I. ĐỌC HIỂU (${formatScore(sync.readingTotal)} điểm)`, {
        bold: true,
        size: 26,
      })
    );

    const rHeader = new TableRow({
      tableHeader: true,
      children: [
        makeCell('Câu', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0', widthPercent: 10 }),
        makeCell('Nội dung đáp án & Hướng dẫn chấm chi tiết', {
          bold: true,
          shading: 'E2E8F0',
          widthPercent: 72,
        }),
        makeCell('Điểm', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0', widthPercent: 18 }),
      ],
    });

    const rRows = exam.readingQuestions.map((q, idx) => {
      const detailParts = [
        q.answer,
        q.partialCreditSteps.length > 0
          ? '\nChiết điểm thành phần:\n' +
            q.partialCreditSteps
              .map((s) => `- ${s.description}: ${formatScore(s.points)}đ`)
              .join('\n')
          : '',
        q.equivalentAnswers ? `\nDiễn đạt tương đương: ${q.equivalentAnswers}` : '',
        q.nonQualifyingNotes ? `\nLưu ý trừ/không tính điểm: ${q.nonQualifyingNotes}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      return new TableRow({
        children: [
          makeCell(`Câu ${idx + 1}`, { bold: true, align: AlignmentType.CENTER }),
          makeCell(detailParts),
          makeCell(`${formatScore(q.points)} đ`, { bold: true, align: AlignmentType.CENTER }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [rHeader, ...rRows],
      })
    );
  }

  if (exam.writingPrompts.length > 0) {
    children.push(
      para(`PHẦN II. VIẾT (${formatScore(sync.writingTotal)} điểm)`, {
        bold: true,
        size: 26,
        spaceBefore: 180,
      })
    );

    exam.writingPrompts.forEach((wp, idx) => {
      children.push(
        para(
          `Câu ${idx + 1} (${formatScore(wp.points)} điểm) – ${wp.category} (${wp.formatType} ~${wp.wordCountTarget} chữ)`,
          { bold: true, spaceBefore: 100 }
        )
      );
      const wHeader = new TableRow({
        tableHeader: true,
        children: [
          makeCell('Nhóm tiêu chí', { bold: true, shading: 'E2E8F0', widthPercent: 25 }),
          makeCell('Yêu cầu cụ thể', { bold: true, shading: 'E2E8F0', widthPercent: 60 }),
          makeCell('Điểm', { bold: true, align: AlignmentType.CENTER, shading: 'E2E8F0', widthPercent: 15 }),
        ],
      });
      const wRows = wp.rubric.map(
        (r) =>
          new TableRow({
            children: [
              makeCell(`${r.group}\n(${r.title})`, { bold: true }),
              makeCell(r.description),
              makeCell(`${formatScore(r.points)} đ`, { align: AlignmentType.CENTER }),
            ],
          })
      );
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [wHeader, ...wRows],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: pageMargins(settings),
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function generateLessonPlanDocxBlob(plan: LessonPlan): Promise<Blob> {
  const children: (Paragraph | Table)[] = [
    makePara('KẾ HOẠCH BÀI DẠY MÔN NGỮ VĂN (GDPT 2018)', {
      bold: true,
      align: AlignmentType.CENTER,
      size: 28,
    }),
    makePara(`Bài dạy: ${plan.title}`, {
      bold: true,
      align: AlignmentType.CENTER,
      size: 26,
    }),
    makePara(
      `Khối lớp: ${plan.grade} | Bộ sách: ${plan.textbookSeries} | Thời lượng: ${plan.durationPeriods} tiết`,
      { italic: true, align: AlignmentType.CENTER, size: 24 }
    ),
    makePara('I. MỤC TIÊU BÀI HỌC', { bold: true, spaceBefore: 140 }),
    makePara(`1. Yêu cầu cần đạt: ${plan.learningOutcomes}`),
    makePara(`2. Năng lực: ${plan.competencies}`),
    makePara(`3. Phẩm chất: ${plan.qualities}`),
    makePara('II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU', { bold: true, spaceBefore: 120 }),
    makePara(plan.equipmentAndMaterials),
    makePara('III. TIẾN TRÌNH DẠY HỌC', { bold: true, spaceBefore: 120 }),
  ];

  plan.activities.forEach((act) => {
    children.push(
      makePara(
        `${act.phase}: ${act.title} (${act.durationMinutes} phút – Phương pháp: ${act.method})`,
        { bold: true, spaceBefore: 120 }
      )
    );
    children.push(makePara(`Mục tiêu: ${act.objective}`));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              makeCell('Hoạt động của Giáo viên', { bold: true, shading: 'E2E8F0', widthPercent: 38 }),
              makeCell('Hoạt động của Học sinh', { bold: true, shading: 'E2E8F0', widthPercent: 38 }),
              makeCell('Sản phẩm & Đánh giá', { bold: true, shading: 'E2E8F0', widthPercent: 24 }),
            ],
          }),
          new TableRow({
            children: [
              makeCell(act.teacherActivity),
              makeCell(act.studentActivity),
              makeCell(`Sản phẩm:\n${act.expectedProduct}\n\nĐánh giá:\n${act.assessmentMethod}`),
            ],
          }),
        ],
      })
    );
  });

  if (plan.postLessonAdjustment) {
    children.push(makePara('IV. ĐIỀU CHỈNH SAU BÀI DẠY', { bold: true, spaceBefore: 140 }));
    children.push(makePara(plan.postLessonAdjustment));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, bottom: 1134, left: 1417, right: 964 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function generateWorksheetDocxBlob(
  ws: WorksheetDocument,
  mode: 'student' | 'teacher'
): Promise<Blob> {
  const children: (Paragraph | Table)[] = [
    makePara(
      mode === 'student'
        ? 'PHIẾU HỌC TẬP DÀNH CHO HỌC SINH'
        : 'HƯỚNG DẪN PHIẾU HỌC TẬP (BẢN GIÁO VIÊN)',
      { bold: true, align: AlignmentType.CENTER, size: 28 }
    ),
    makePara(ws.title, { bold: true, align: AlignmentType.CENTER, size: 26 }),
    makePara(
      `Lớp ${ws.grade} · ${ws.textbookSeries} · Dạng: ${ws.worksheetType} · Ngữ liệu: ${ws.passageTitle}`,
      { italic: true, align: AlignmentType.CENTER, size: 22 }
    ),
    makePara('Họ và tên học sinh: ......................................................... Lớp: ............', {
      spaceBefore: 100,
    }),
  ];

  ws.blocks.forEach((b, idx) => {
    children.push(
      makePara(`Nhiệm vụ ${idx + 1} [${b.blockType}]: ${b.prompt}`, {
        bold: true,
        spaceBefore: 120,
      })
    );
    if (b.rowsOrItems && b.rowsOrItems.length > 0) {
      b.rowsOrItems.forEach((item) => {
        children.push(makePara(`• ${item}`, { indentLeft: 360 }));
      });
    }
    if (mode === 'student') {
      children.push(
        makePara(
          'Phần trả lời / ghi chú của học sinh:\n........................................................................................................................................\n........................................................................................................................................',
          { italic: true }
        )
      );
    } else {
      children.push(
        makePara(`Gợi ý đáp án / Hướng dẫn GV: ${b.teacherGuide || 'Theo đánh giá của giáo viên.'}`)
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, bottom: 1134, left: 1417, right: 964 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function makeExamDocxFilename(exam: ExamDocument, prefix: string): string {
  return `${prefix}_${slugifyFilename(exam.adminInfo.title)}.docx`;
}
