import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { db } from '../../../database/db';
import {
  ExamQuestion,
  GradeLevel,
  MindMapDocument,
  PassageGenre,
  PresentationDeck,
  SlideItem,
  TextbookSeries,
  WorksheetBlock,
  WorksheetDocument,
} from '../../../types';
import { SimulationDefinition } from '../types';

function pickPrimaryGrade(sim: SimulationDefinition): GradeLevel {
  return sim.grades[0] ?? '10';
}

function pickPrimaryTextbook(sim: SimulationDefinition): TextbookSeries {
  const first = sim.textbooks.find(
    (t): t is TextbookSeries =>
      t === 'Kết nối tri thức với cuộc sống' ||
      t === 'Chân trời sáng tạo' ||
      t === 'Cánh Diều'
  );
  return first ?? 'Kết nối tri thức với cuộc sống';
}

function mapGenre(genre: string): PassageGenre {
  const g = genre.toLowerCase();
  if (g.includes('thơ')) return 'Thơ';
  if (g.includes('kịch') || g.includes('tuồng') || g.includes('hài')) return 'Kịch';
  if (g.includes('kí') || g.includes('tùy bút') || g.includes('bút kí')) return 'Kí';
  if (g.includes('nghị luận') || g.includes('cáo') || g.includes('tuyên ngôn')) {
    return 'Văn bản nghị luận';
  }
  if (g.includes('thông tin')) return 'Văn bản thông tin';
  return 'Truyện';
}

/**
 * 1. Tạo Phiếu học tập thực tế lưu vào bảng `worksheets` trong IndexedDB
 */
export async function exportSimulationToWorksheet(
  sim: SimulationDefinition,
  ownerId = 'teacher-dathien'
): Promise<WorksheetDocument> {
  const now = new Date().toISOString();
  const blocks: WorksheetBlock[] = [
    {
      id: `wb-${sim.id}-1`,
      blockType: 'Checklist',
      prompt: `Mục tiêu & Yêu cầu cần đạt khi khám phá mô phỏng "${sim.title}" (${sim.workTitle} – ${sim.author}):`,
      teacherGuide: sim.objective,
      rowsOrItems: sim.learningOutcomes,
    },
    {
      id: `wb-${sim.id}-2`,
      blockType: 'Bảng so sánh',
      prompt: 'Quan sát mô phỏng 2D/3D và hoàn thành bảng đối chiếu các chi tiết nghệ thuật trọng tâm:',
      teacherGuide: sim.hotspots
        .map((h) => `• ${h.label}: ${h.summary} (Neo văn bản: ${h.textualDetail})`)
        .join('\n'),
      rowsOrItems: sim.hotspots.map((h) => `${h.label} (${h.category})`),
    },
    ...sim.questions.slice(0, 4).map((q, idx): WorksheetBlock => ({
      id: `wb-${sim.id}-q-${idx}`,
      blockType: 'Câu hỏi tự luận',
      prompt: `Câu ${idx + 1} [${q.level}]: ${q.prompt}`,
      teacherGuide: `${q.suggestedGuide}\nGiải thích: ${q.explanation}`,
    })),
    {
      id: `wb-${sim.id}-app`,
      blockType: 'Khung viết đoạn văn',
      prompt: `Nhiệm vụ vận dụng – ${sim.applicationTask.title}: ${sim.applicationTask.prompt}`,
      teacherGuide: sim.applicationTask.criteria.map((c) => `- ${c}`).join('\n'),
      rowsOrItems: sim.applicationTask.criteria,
    },
  ];

  const doc: WorksheetDocument = {
    id: `ws-sim-${sim.id}-${Date.now()}`,
    ownerId,
    title: `Phiếu học tập – ${sim.title}`,
    worksheetType:
      mapGenre(sim.genre) === 'Thơ'
        ? 'Phiếu phân tích thơ'
        : mapGenre(sim.genre) === 'Truyện'
        ? 'Phiếu phân tích truyện'
        : 'Phiếu đọc hiểu',
    grade: pickPrimaryGrade(sim),
    textbookSeries: pickPrimaryTextbook(sim),
    passageTitle: `${sim.workTitle} (${sim.author})`,
    blocks,
    createdAt: now,
    updatedAt: now,
  };

  await db.worksheets.put(doc);
  return doc;
}

/**
 * 2. Tạo Bộ Slide Bài giảng trình chiếu lưu vào bảng `presentations`
 */
export async function exportSimulationToPresentation(
  sim: SimulationDefinition,
  ownerId = 'teacher-dathien'
): Promise<PresentationDeck> {
  const now = new Date().toISOString();
  const slides: SlideItem[] = [
    {
      id: `sl-${sim.id}-cover`,
      template: 'Trang bìa',
      title: sim.title,
      subtitle: `${sim.workTitle} – ${sim.author} | Lớp ${sim.grades.join(', ')}`,
      body: `${sim.volumeAndUnit}\nThể loại: ${sim.genre}\n${sim.objective}`,
      teacherNote: sim.teacherGuide.durationSuggestion,
      themeVariant: 'navy',
    },
    {
      id: `sl-${sim.id}-obj`,
      template: 'Mục tiêu bài học',
      title: 'Yêu cầu cần đạt & Hướng dẫn trải nghiệm',
      body: sim.learningOutcomes.map((o, i) => `${i + 1}. ${o}`).join('\n'),
      teacherNote: sim.operationGuide,
      themeVariant: 'cream',
    },
    ...sim.stages.map((st, idx): SlideItem => ({
      id: `sl-${sim.id}-st-${idx}`,
      template: 'Đọc hiểu',
      title: `Chặng ${idx + 1}: ${st.title}`,
      subtitle: st.subtitle,
      body: `${st.narration}\n\nĐiểm neo văn bản: ${st.textualAnchor}`,
      teacherNote: sim.teacherGuide.classroomFlow[idx] ?? sim.teacherGuide.cautionNote,
      themeVariant: idx % 2 === 0 ? 'teal' : 'cream',
    })),
    {
      id: `sl-${sim.id}-hotspots`,
      template: 'Phân tích nghệ thuật',
      title: 'Hệ thống điểm khám phá & Chi tiết nghệ thuật',
      body: sim.hotspots
        .map((h) => `• ${h.label} (${h.category}): ${h.summary}`)
        .join('\n'),
      teacherNote: sim.teacherGuide.discussionPrompts.join('\n'),
      themeVariant: 'navy',
    },
    {
      id: `sl-${sim.id}-discuss`,
      template: 'Câu hỏi thảo luận',
      title: 'Câu hỏi củng cố đọc hiểu',
      body: sim.questions
        .slice(0, 3)
        .map((q, i) => `Câu ${i + 1} (${q.level}): ${q.prompt}`)
        .join('\n\n'),
      answerText: sim.questions
        .slice(0, 3)
        .map((q, i) => `Gợi ý câu ${i + 1}: ${q.suggestedGuide}`)
        .join('\n'),
      themeVariant: 'cream',
    },
    {
      id: `sl-${sim.id}-summary`,
      template: 'Tổng kết',
      title: 'Tổng kết & Nhiệm vụ vận dụng',
      body: `${sim.keyTakeaways.map((k) => `• ${k}`).join('\n')}\n\nVận dụng: ${sim.applicationTask.prompt}`,
      teacherNote: sim.teacherGuide.cautionNote,
      themeVariant: 'teal',
    },
  ];

  const deck: PresentationDeck = {
    id: `deck-sim-${sim.id}-${Date.now()}`,
    ownerId,
    title: `Bài giảng trình chiếu – ${sim.title}`,
    grade: pickPrimaryGrade(sim),
    slides,
    createdAt: now,
    updatedAt: now,
  };

  await db.presentations.put(deck);
  return deck;
}

/**
 * 3. Tạo Sơ đồ tư duy lưu vào bảng `mindMaps`
 */
export async function exportSimulationToMindMap(
  sim: SimulationDefinition,
  ownerId = 'teacher-dathien'
): Promise<MindMapDocument> {
  const now = new Date().toISOString();
  const rootId = `mm-root-${sim.id}`;
  const nodes = [
    {
      id: rootId,
      parentId: null,
      label: sim.title,
      note: `${sim.workTitle} – ${sim.author}`,
      color: sim.palette.primary,
      x: 420,
      y: 240,
    },
    ...sim.diagram2D.nodes.map((n, idx) => ({
      id: `mm-node-${sim.id}-${idx}`,
      parentId: rootId,
      label: n.label,
      note: n.detail,
      color: n.color || sim.palette.accent,
      x: Math.round((n.x / 100) * 760 + 40),
      y: Math.round((n.y / 100) * 420 + 40),
    })),
  ];

  const doc: MindMapDocument = {
    id: `mm-sim-${sim.id}-${Date.now()}`,
    ownerId,
    title: `Sơ đồ tư duy – ${sim.title}`,
    category: 'Tác phẩm',
    grade: pickPrimaryGrade(sim),
    nodes,
    createdAt: now,
    updatedAt: now,
  };

  await db.mindMaps.put(doc);
  return doc;
}

/**
 * 4. Đưa bộ câu hỏi đọc hiểu của mô phỏng vào Ngân hàng câu hỏi (`questions`)
 */
export async function exportSimulationToQuestionBank(
  sim: SimulationDefinition,
  ownerId = 'teacher-dathien'
): Promise<number> {
  const now = new Date().toISOString();
  const grade = pickPrimaryGrade(sim);
  const genre = mapGenre(sim.genre);

  const items: ExamQuestion[] = sim.questions.map((q, idx) => ({
    id: `q-sim-${sim.id}-${idx + 1}-${Date.now()}`,
    order: idx + 1,
    part: 'doc-hieu',
    content: `[${sim.workTitle} – ${sim.author}] ${q.prompt}`,
    skill: sim.skillDomain,
    learningOutcome: sim.learningOutcomes[idx % sim.learningOutcomes.length] ?? sim.objective,
    cognitiveLevel: q.level,
    points: q.level === 'Nhận biết' ? 0.5 : 1.0,
    answer: q.suggestedGuide,
    equivalentAnswers: q.explanation,
    partialCreditSteps: (q.rubricCriteria ?? [q.suggestedGuide]).map((c, i) => ({
      id: `step-${i + 1}`,
      description: c,
      points: 0.5,
    })),
    nonQualifyingNotes: 'Không chấm điểm nếu trả lời lạc khỏi văn bản hoặc thiếu lập luận căn cứ.',
    tags: ['Khám phá 2D/3D', sim.workTitle, sim.genre, `Lớp ${grade}`],
    grade,
    genre,
    ownerId,
    createdAt: now,
    updatedAt: now,
  }));

  await db.questions.bulkPut(items);
  return items.length;
}

/**
 * 5. Xuất Phiếu học tập & Hướng dẫn giảng dạy ra file Word (.docx)
 */
export async function downloadSimulationWordHandout(
  sim: SimulationDefinition,
  schoolName = 'TRƯỜNG THPT'
): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: schoolName.toUpperCase(), bold: true, size: 24, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'TỔ NGỮ VĂN – HỌC LIỆU KHÁM PHÁ NGỮ VĂN 2D/3D',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `PHIẾU HỌC TẬP: ${sim.title.toUpperCase()}`,
                bold: true,
                size: 28,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `Tác phẩm: ${sim.workTitle} | Tác giả: ${sim.author} | Thể loại: ${sim.genre} | Lớp: ${sim.grades.join(', ')}`,
                italics: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: 'I. MỤC TIÊU BÀI HỌC', bold: true, size: 26, font: 'Times New Roman' }),
            ],
          }),
          ...sim.learningOutcomes.map(
            (o) =>
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: `• ${o}`, size: 24, font: 'Times New Roman' })],
              })
          ),
          new Paragraph({
            spacing: { before: 160, after: 120 },
            children: [
              new TextRun({
                text: 'II. CÁC ĐIỂM KHÁM PHÁ TRỌNG TÂM TRÊN MÔ PHỎNG',
                bold: true,
                size: 26,
                font: 'Times New Roman',
              }),
            ],
          }),
          ...sim.hotspots.map(
            (h) =>
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({ text: `• ${h.label} (${h.category}): `, bold: true, size: 24, font: 'Times New Roman' }),
                  new TextRun({ text: `${h.summary} [Neo văn bản: ${h.textualDetail}]`, size: 24, font: 'Times New Roman' }),
                ],
              })
          ),
          new Paragraph({
            spacing: { before: 160, after: 120 },
            children: [
              new TextRun({
                text: 'III. CÂU HỎI ĐỌC HIỂU & GỢI Ý TRẢ LỜI',
                bold: true,
                size: 26,
                font: 'Times New Roman',
              }),
            ],
          }),
          ...sim.questions.flatMap((q, i) => [
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: `Câu ${i + 1} [${q.level}]: ${q.prompt}`,
                  bold: true,
                  size: 24,
                  font: 'Times New Roman',
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: `Gợi ý: ${q.suggestedGuide}`,
                  italics: true,
                  size: 23,
                  font: 'Times New Roman',
                }),
              ],
            }),
          ]),
          new Paragraph({
            spacing: { before: 160, after: 100 },
            children: [
              new TextRun({
                text: `IV. NHIỆM VỤ VẬN DỤNG – ${sim.applicationTask.title.toUpperCase()}`,
                bold: true,
                size: 26,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: sim.applicationTask.prompt, size: 24, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: `Nguồn & Trạng thái học liệu: ${sim.sourceCitation} (${sim.sourceVerificationStatus}).`,
                italics: true,
                size: 20,
                font: 'Times New Roman',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Phieu-hoc-tap-${sim.id}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
