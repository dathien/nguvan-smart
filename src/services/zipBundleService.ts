import JSZip from 'jszip';
import { db } from '../database/db';
import {
  AppSettings,
  Classroom,
  ExamDocument,
  LessonPlan,
  MindMapDocument,
  PresentationDeck,
  ReadingPassage,
  WorksheetDocument,
  ExamQuestion,
} from '../types';
import { formatDateVN, formatScore, slugifyFilename } from '../utils/formatters';
import { buildSynchronizedExamData } from './examSyncService';
import {
  generateExamDocxBlob,
  generateGradingGuideDocxBlob,
  generateMatrixDocxBlob,
  generateSpecificationDocxBlob,
  triggerBlobDownload,
} from './wordExportService';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildExamPrintableHtml(exam: ExamDocument): string {
  const sync = buildSynchronizedExamData(exam);
  const passageLines = exam.passage.content
    .split('\n')
    .map((line) =>
      line.trim() === ''
        ? '<div style="height:8pt"></div>'
        : `<p style="margin:2pt 0; ${exam.passage.formatStyle === 'poem' ? 'padding-left:24pt;' : 'text-indent:24pt; text-align:justify;'}">${escapeHtml(line)}</p>`
    )
    .join('');

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(exam.adminInfo.title)}</title>
<style>
  @page { size: A4 portrait; margin: 18mm 16mm 18mm 22mm; }
  body { font-family: "Times New Roman", Georgia, serif; font-size: 13pt; line-height: 1.45; color: #000; margin: 24px auto; max-width: 794px; }
  h1, h2, h3 { margin: 8pt 0 4pt; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th, td { border: 1px solid #1e293b; padding: 5pt 6pt; vertical-align: top; font-size: 11.5pt; }
  th { background: #f1f5f9; text-align: center; }
  .header-grid { display: flex; justify-content: space-between; text-align: center; margin-bottom: 12pt; }
  .page-break { page-break-before: always; break-before: page; }
  .print-btn { position: fixed; top: 12px; right: 12px; padding: 8px 16px; background: #0f2942; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-family: sans-serif; }
  @media print { .print-btn { display: none; } body { margin: 0; } }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">In / Lưu PDF khổ A4</button>
<div class="header-grid">
  <div style="width:45%">
    <strong>${escapeHtml(exam.adminInfo.schoolName)}</strong><br/>
    <strong>${escapeHtml(exam.adminInfo.departmentName)}</strong><br/>
    <em>Mã đề: ${escapeHtml(exam.adminInfo.examCode)}</em>
  </div>
  <div style="width:52%">
    <strong>${escapeHtml(exam.adminInfo.title)}</strong><br/>
    <strong>Môn: NGỮ VĂN – Lớp ${escapeHtml(exam.adminInfo.grade)}</strong><br/>
    <em>Thời gian làm bài: ${exam.adminInfo.durationMinutes} phút</em>
  </div>
</div>

${
  exam.readingQuestions.length > 0
    ? `<h3>I. ĐỌC HIỂU (${formatScore(sync.readingTotal)} điểm)</h3>
       <p><em>Đọc văn bản sau và thực hiện các yêu cầu:</em></p>
       ${exam.passage.title ? `<p style="text-align:center;font-weight:bold">${escapeHtml(exam.passage.title.toUpperCase())}</p>` : ''}
       ${passageLines}
       ${exam.passage.verificationStatus !== 'Ngữ liệu tự biên soạn' && (exam.passage.author || exam.passage.citationSource) ? `<p style="text-align:right;font-style:italic">(Theo ${escapeHtml(exam.passage.author)} – ${escapeHtml(exam.passage.citationSource)})</p>` : ''}
       ${exam.readingQuestions
         .map(
           (q, i) =>
             `<p><strong>Câu ${i + 1} (${formatScore(q.points)} điểm).</strong> ${escapeHtml(q.content)}</p>`
         )
         .join('')}`
    : ''
}

${
  exam.writingPrompts.length > 0
    ? `<h3>II. VIẾT (${formatScore(sync.writingTotal)} điểm)</h3>
       ${exam.writingPrompts
         .map(
           (w, i) =>
             `<p><strong>Câu ${i + 1} (${formatScore(w.points)} điểm).</strong> ${escapeHtml(w.promptText)}</p>`
         )
         .join('')}`
    : ''
}
<p style="text-align:center;font-weight:bold;margin-top:16pt">--- HẾT ---</p>

<div class="page-break"></div>
<h2 style="text-align:center">MA TRẬN ĐỀ KIỂM TRA</h2>
<table>
  <thead>
    <tr>
      <th>STT</th><th>Kỹ năng</th><th>Nội dung / Đơn vị kiến thức</th>
      ${sync.levelsUsed.map((l) => `<th>${escapeHtml(l)}</th>`).join('')}
      <th>Tổng câu</th><th>Tổng điểm</th><th>Tỉ lệ</th>
    </tr>
  </thead>
  <tbody>
    ${sync.matrixRows
      .map(
        (r) => `<tr>
      <td style="text-align:center">${r.stt}</td>
      <td style="text-align:center">${escapeHtml(r.skill)}</td>
      <td>${escapeHtml(r.contentUnit)}</td>
      ${sync.levelsUsed.map((l) => `<td style="text-align:center">${r.counts[l]} câu / ${formatScore(r.points[l])}đ</td>`).join('')}
      <td style="text-align:center">${r.totalQuestions}</td>
      <td style="text-align:center">${formatScore(r.totalPoints)}</td>
      <td style="text-align:center">${formatScore(r.percentage)}%</td>
    </tr>`
      )
      .join('')}
  </tbody>
</table>

<div class="page-break"></div>
<h2 style="text-align:center">HƯỚNG DẪN CHẤM</h2>
${exam.readingQuestions
  .map(
    (q, i) =>
      `<p><strong>Câu ${i + 1} (${formatScore(q.points)} điểm):</strong><br/>${escapeHtml(q.answer).replace(/\n/g, '<br/>')}</p>`
  )
  .join('')}
${exam.writingPrompts
  .map(
    (w, i) =>
      `<h4>Phần Viết – Câu ${i + 1} (${formatScore(w.points)} điểm)</h4>
       <table><thead><tr><th>Tiêu chí</th><th>Yêu cầu</th><th>Điểm</th></tr></thead>
       <tbody>${w.rubric.map((r) => `<tr><td>${escapeHtml(r.group)}</td><td>${escapeHtml(r.description)}</td><td style="text-align:center">${formatScore(r.points)}</td></tr>`).join('')}</tbody></table>`
  )
  .join('')}
</body>
</html>`;
}

export async function exportCompleteExamZip(
  exam: ExamDocument,
  settings?: AppSettings
): Promise<{ packagedFiles: string[]; failedFiles: string[] }> {
  const zip = new JSZip();
  const packagedFiles: string[] = [];
  const failedFiles: string[] = [];

  const tasks: { name: string; run: () => Promise<Blob> }[] = [
    { name: 'De_kiem_tra.docx', run: () => generateExamDocxBlob(exam, settings) },
    { name: 'Ma_tran.docx', run: () => generateMatrixDocxBlob(exam, settings) },
    { name: 'Ban_dac_ta.docx', run: () => generateSpecificationDocxBlob(exam, settings) },
    { name: 'Huong_dan_cham.docx', run: () => generateGradingGuideDocxBlob(exam, settings) },
  ];

  for (const t of tasks) {
    try {
      const blob = await t.run();
      if (blob && blob.size > 0) {
        zip.file(t.name, blob);
        packagedFiles.push(t.name);
      } else {
        failedFiles.push(t.name);
      }
    } catch {
      failedFiles.push(t.name);
    }
  }

  try {
    const htmlStr = buildExamPrintableHtml(exam);
    zip.file('Ho_so_tong_hop_In_PDF.html', htmlStr);
    packagedFiles.push('Ho_so_tong_hop_In_PDF.html');
  } catch {
    failedFiles.push('Ho_so_tong_hop_In_PDF.html');
  }

  try {
    zip.file('Du_lieu_de.json', JSON.stringify(exam, null, 2));
    packagedFiles.push('Du_lieu_de.json');
  } catch {
    failedFiles.push('Du_lieu_de.json');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(
    zipBlob,
    `Ho_so_de_${slugifyFilename(exam.adminInfo.title)}.zip`
  );

  return { packagedFiles, failedFiles };
}

export interface FullBackupPayload {
  schemaVersion: number;
  exportedAt: string;
  app: string;
  data: {
    passages: ReadingPassage[];
    questions: ExamQuestion[];
    exams: ExamDocument[];
    lessonPlans: LessonPlan[];
    presentations: PresentationDeck[];
    mindMaps: MindMapDocument[];
    worksheets: WorksheetDocument[];
    classes: Classroom[];
    settings: AppSettings[];
  };
}

export async function buildBackupPayload(): Promise<FullBackupPayload> {
  const [
    passages,
    questions,
    exams,
    lessonPlans,
    presentations,
    mindMaps,
    worksheets,
    classes,
    settings,
  ] = await Promise.all([
    db.passages.toArray(),
    db.questions.toArray(),
    db.exams.toArray(),
    db.lessonPlans.toArray(),
    db.presentations.toArray(),
    db.mindMaps.toArray(),
    db.worksheets.toArray(),
    db.classes.toArray(),
    db.settings.toArray(),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: 'VĂN HỌC THÔNG MINH – SMART LITERATURE',
    data: {
      passages,
      questions,
      exams,
      lessonPlans,
      presentations,
      mindMaps,
      worksheets,
      classes,
      settings,
    },
  };
}

function buildOfflineCatalogHtml(payload: FullBackupPayload): string {
  const examItems = payload.data.exams
    .map(
      (e, idx) =>
        `<tr><td>${idx + 1}</td><td><strong>${escapeHtml(e.adminInfo.title)}</strong></td><td>Lớp ${escapeHtml(e.adminInfo.grade)}</td><td>${escapeHtml(e.adminInfo.textbookSeries)}</td><td>${escapeHtml(e.adminInfo.examType)}</td><td>${e.adminInfo.durationMinutes} phút</td><td>${formatDateVN(e.updatedAt)}</td></tr>`
    )
    .join('');

  const passageItems = payload.data.passages
    .map(
      (p, idx) =>
        `<tr><td>${idx + 1}</td><td><strong>${escapeHtml(p.title)}</strong></td><td>${escapeHtml(p.author)}</td><td>${escapeHtml(p.genre)}</td><td>Lớp ${escapeHtml(p.grade)}</td><td>${escapeHtml(p.verificationStatus)}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Mục lục kho đề – Văn Học Thông Minh</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 1080px; margin: 32px auto; padding: 0 20px; color: #102438; background: #FAF8F5; }
  h1, h2 { color: #0F2942; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0 32px; background: #fff; }
  th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 14px; }
  th { background: #0F2942; color: #fff; }
</style>
</head>
<body>
  <h1>MỤC LỤC KHO ĐỀ & NGỮ LIỆU – VĂN HỌC THÔNG MINH</h1>
  <p>Ngày xuất sao lưu: ${formatDateVN(payload.exportedAt)} | Phiên bản dữ liệu: ${payload.schemaVersion}</p>
  <h2>1. Danh mục Đề kiểm tra (${payload.data.exams.length})</h2>
  <table>
    <thead><tr><th>STT</th><th>Tên đề</th><th>Khối</th><th>Bộ sách</th><th>Loại đề</th><th>Thời gian</th><th>Cập nhật</th></tr></thead>
    <tbody>${examItems || '<tr><td colspan="7">Chưa có đề kiểm tra.</td></tr>'}</tbody>
  </table>
  <h2>2. Danh mục Ngữ liệu (${payload.data.passages.length})</h2>
  <table>
    <thead><tr><th>STT</th><th>Tên văn bản</th><th>Tác giả</th><th>Thể loại</th><th>Khối</th><th>Trạng thái nguồn</th></tr></thead>
    <tbody>${passageItems || '<tr><td colspan="6">Chưa có ngữ liệu.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

export async function exportFullBackupZip(): Promise<void> {
  const payload = await buildBackupPayload();
  const zip = new JSZip();

  zip.file('du_lieu_sao_luu.json', JSON.stringify(payload, null, 2));
  zip.file('MUC-LUC-KHO-DE.html', buildOfflineCatalogHtml(payload));

  const examsFolder = zip.folder('de_kiem_tra');
  if (examsFolder) {
    payload.data.exams.forEach((exam) => {
      examsFolder.file(
        `${slugifyFilename(exam.adminInfo.title)}_${exam.id.slice(-6)}.json`,
        JSON.stringify(exam, null, 2)
      );
    });
  }

  const passagesFolder = zip.folder('ngu_lieu');
  if (passagesFolder) {
    payload.data.passages.forEach((p) => {
      passagesFolder.file(
        `${slugifyFilename(p.title)}_${p.id.slice(-6)}.json`,
        JSON.stringify(p, null, 2)
      );
    });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `Sao_luu_VanHocThongMinh_${dateTag}.zip`);
}

export async function parseBackupFile(file: File): Promise<FullBackupPayload> {
  let jsonText = '';
  if (file.name.toLowerCase().endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    const dataFile = zip.file('du_lieu_sao_luu.json');
    if (!dataFile) {
      throw new Error('File ZIP không chứa dữ liệu sao lưu hợp lệ (du_lieu_sao_luu.json).');
    }
    jsonText = await dataFile.async('string');
  } else {
    jsonText = await file.text();
  }

  const parsed = JSON.parse(jsonText) as Partial<FullBackupPayload>;
  if (!parsed || !parsed.data || !Array.isArray(parsed.data.exams)) {
    throw new Error('Cấu trúc dữ liệu phục hồi không hợp lệ.');
  }
  return parsed as FullBackupPayload;
}

export async function restoreBackupPayload(
  payload: FullBackupPayload,
  mode: 'merge' | 'replace'
): Promise<{ exams: number; passages: number; questions: number }> {
  const { data } = payload;
  if (mode === 'replace') {
    await Promise.all([
      db.passages.clear(),
      db.questions.clear(),
      db.exams.clear(),
      db.lessonPlans.clear(),
      db.presentations.clear(),
      db.mindMaps.clear(),
      db.worksheets.clear(),
    ]);
  }

  if (data.passages?.length) await db.passages.bulkPut(data.passages);
  if (data.questions?.length) await db.questions.bulkPut(data.questions);
  if (data.exams?.length) await db.exams.bulkPut(data.exams);
  if (data.lessonPlans?.length) await db.lessonPlans.bulkPut(data.lessonPlans);
  if (data.presentations?.length) await db.presentations.bulkPut(data.presentations);
  if (data.mindMaps?.length) await db.mindMaps.bulkPut(data.mindMaps);
  if (data.worksheets?.length) await db.worksheets.bulkPut(data.worksheets);
  if (data.classes?.length) await db.classes.bulkPut(data.classes);
  if (data.settings?.length) await db.settings.bulkPut(data.settings);

  return {
    exams: data.exams?.length ?? 0,
    passages: data.passages?.length ?? 0,
    questions: data.questions?.length ?? 0,
  };
}

export async function exportNumberedExamZip(exams: ExamDocument[], settings?: AppSettings): Promise<void> {
  const zip = new JSZip();
  for (const exam of exams) {
    const folder = zip.folder(`Ma_de_${exam.adminInfo.examCode}`)!;
    folder.file('De_kiem_tra.docx', await generateExamDocxBlob(exam, settings));
    folder.file('Ma_tran.docx', await generateMatrixDocxBlob(exam, settings));
    folder.file('Ban_dac_ta.docx', await generateSpecificationDocxBlob(exam, settings));
    folder.file('Huong_dan_cham.docx', await generateGradingGuideDocxBlob(exam, settings));
    folder.file('In_PDF.html', buildExamPrintableHtml(exam));
    folder.file('Du_lieu_de.json', JSON.stringify(exam, null, 2));
  }
  triggerBlobDownload(await zip.generateAsync({type:'blob'}), 'Ho_so_nhieu_ma_de.zip');
}
