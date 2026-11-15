import { ExamDocument, PresentationDeck, SlideItem } from '../types';
import { formatScore, generateId, slugifyFilename } from '../utils/formatters';
import { triggerBlobDownload } from './wordExportService';

export function convertExamToPresentation(exam: ExamDocument): PresentationDeck {
  const slides: SlideItem[] = [];
  const now = new Date().toISOString();

  // 1. Cover slide
  slides.push({
    id: generateId('slide'),
    template: 'Trang bìa',
    title: exam.adminInfo.title,
    subtitle: `Môn Ngữ văn – Lớp ${exam.adminInfo.grade} · ${exam.adminInfo.textbookSeries} · Thời gian: ${exam.adminInfo.durationMinutes} phút`,
    body: `${exam.adminInfo.schoolName}\n${exam.adminInfo.departmentName}\nPhạm vi: ${exam.adminInfo.knowledgeScope}`,
    teacherNote: 'Giới thiệu cấu trúc đề và phân bổ thời gian làm bài cho học sinh.',
    themeVariant: 'navy',
  });

  // 2. Passage slides (never cut content: split poem by stanza or prose by paragraph)
  if (exam.readingQuestions.length > 0 && exam.passage.content.trim()) {
    const blocks = exam.passage.content
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    // Group at most 2 stanzas or 1-2 short paragraphs per slide so there is zero overflow
    const chunkSize = exam.passage.formatStyle === 'poem' ? 2 : 1;
    for (let i = 0; i < blocks.length; i += chunkSize) {
      const slice = blocks.slice(i, i + chunkSize).join('\n\n');
      const partLabel =
        blocks.length > chunkSize
          ? ` (Phần ${Math.floor(i / chunkSize) + 1}/${Math.ceil(blocks.length / chunkSize)})`
          : '';
      slides.push({
        id: generateId('slide'),
        template:
          exam.passage.formatStyle === 'poem' ? 'Trình chiếu thơ' : 'Trình chiếu đoạn văn',
        title: `${exam.passage.title || 'Ngữ liệu đọc hiểu'}${partLabel}`,
        subtitle: `${exam.passage.author} · ${exam.passage.genre}`,
        body: slice,
        teacherNote: `Nguồn: ${exam.passage.citationSource}`,
        themeVariant: 'cream',
      });
    }
  }

  // 3. Reading question slides with hidden/revealable answers
  exam.readingQuestions.forEach((q, idx) => {
    slides.push({
      id: generateId('slide'),
      template: 'Đọc hiểu',
      title: `Phần I – Câu ${idx + 1} (${formatScore(q.points)} điểm)`,
      subtitle: `${q.cognitiveLevel} · ${q.skill}`,
      body: q.content,
      answerText: `${q.answer}${q.equivalentAnswers ? `\n\nLưu ý diễn đạt tương đương: ${q.equivalentAnswers}` : ''}`,
      teacherNote: `Yêu cầu cần đạt: ${q.learningOutcome}`,
      themeVariant: 'cream',
    });
  });

  // 4. Writing prompt slides + Outline slides
  exam.writingPrompts.forEach((wp, idx) => {
    slides.push({
      id: generateId('slide'),
      template: 'Luyện viết',
      title: `Phần II – Câu ${idx + 1} (${formatScore(wp.points)} điểm)`,
      subtitle: `${wp.category} · ${wp.formatType} khoảng ${wp.wordCountTarget} chữ`,
      body: wp.promptText,
      answerText:
        wp.suggestedOutline.length > 0
          ? `Dàn ý gợi ý:\n${wp.suggestedOutline.map((s) => `• ${s}`).join('\n')}`
          : 'Gợi ý lập dàn ý theo cấu trúc 3 phần.',
      teacherNote: `Luận điểm trọng tâm: ${wp.keyArguments.join('; ')}`,
      themeVariant: 'teal',
    });
  });

  // 5. Summary slide
  slides.push({
    id: generateId('slide'),
    template: 'Tổng kết',
    title: 'Tổng kết & Rút kinh nghiệm làm bài',
    subtitle: `Lớp ${exam.adminInfo.grade} · ${exam.adminInfo.examType}`,
    body: `• Đọc kĩ câu hỏi và xác định từ khóa trọng tâm.\n• Trả lời đúng trọng tâm, đủ ý theo từng mức độ nhận thức.\n• Phân bổ thời gian hợp lí giữa phần Đọc hiểu và phần Viết.`,
    teacherNote: 'Chốt lại các lỗi thường gặp khi diễn đạt và phân tích dẫn chứng.',
    themeVariant: 'navy',
  });

  return {
    id: generateId('deck'),
    ownerId: exam.ownerId,
    title: `Bài giảng: ${exam.adminInfo.title}`,
    grade: exam.adminInfo.grade,
    sourceExamId: exam.id,
    slides,
    createdAt: now,
    updatedAt: now,
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generates a 100% self-contained offline HTML presentation with zero external CDN links.
 */
export function exportStandaloneOfflineHtml(deck: PresentationDeck): void {
  const slidesJson = JSON.stringify(deck.slides).replace(/</g, '\\u003c');
  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(deck.title)} – Trình chiếu Offline</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
  .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: #0F2942; border-bottom: 1px solid rgba(255,255,255,0.12); gap: 12px; flex-wrap: wrap; }
  .toolbar button { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  .toolbar button:hover { background: rgba(255,255,255,0.22); }
  .stage { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; overflow: hidden; }
  .slide { width: 100%; max-width: 1120px; aspect-ratio: 16/9; border-radius: 14px; padding: 48px 56px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.45); overflow: hidden; position: relative; }
  .theme-navy { background: #0F2942; color: #FAF8F5; }
  .theme-cream { background: #FAF8F5; color: #102438; border: 1px solid #e2e8f0; }
  .theme-teal { background: #0D5C54; color: #FAF8F5; }
  .kicker { font-size: 13px; letter-spacing: 0.04em; opacity: 0.78; margin-bottom: 10px; font-weight: 600; }
  .title { font-size: 32px; font-weight: 700; line-height: 1.25; margin-bottom: 10px; }
  .subtitle { font-size: 16px; opacity: 0.85; margin-bottom: 22px; }
  .body { font-size: 20px; line-height: 1.6; white-space: pre-wrap; }
  .answer { margin-top: 20px; padding: 16px 20px; border-radius: 10px; background: rgba(13, 122, 111, 0.14); border: 1px solid rgba(13, 122, 111, 0.35); font-size: 17px; line-height: 1.55; white-space: pre-wrap; display: none; }
  .answer.visible { display: block; }
  .note { position: absolute; bottom: 16px; left: 56px; right: 56px; font-size: 13px; opacity: 0.72; display: none; border-top: 1px solid rgba(128,128,128,0.25); padding-top: 8px; }
  .note.visible { display: block; }
</style>
</head>
<body>
  <div class="toolbar">
    <div><strong>${esc(deck.title)}</strong> <span id="counter" style="margin-left:10px;opacity:0.8">1 / 1</span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="prevSlide()">← Trước</button>
      <button onclick="nextSlide()">Sau →</button>
      <button onclick="changeFont(-2)">A-</button>
      <button onclick="changeFont(2)">A+</button>
      <button onclick="toggleAnswer()">Ẩn/Hiện đáp án (A)</button>
      <button onclick="toggleNote()">Lời dẫn GV</button>
      <button onclick="toggleFullscreen()">Toàn màn hình (F)</button>
    </div>
  </div>
  <div class="stage">
    <div id="slideBox" class="slide theme-cream">
      <div id="kicker" class="kicker"></div>
      <div id="title" class="title"></div>
      <div id="subtitle" class="subtitle"></div>
      <div id="body" class="body"></div>
      <div id="answer" class="answer"></div>
      <div id="note" class="note"></div>
    </div>
  </div>
<script>
  const slides = ${slidesJson};
  let idx = 0, fontSize = 20, showAns = false, showNote = false;
  function render() {
    const s = slides[idx] || {};
    const box = document.getElementById('slideBox');
    box.className = 'slide theme-' + (s.themeVariant || 'cream');
    document.getElementById('counter').textContent = (idx + 1) + ' / ' + slides.length;
    document.getElementById('kicker').textContent = s.template || '';
    document.getElementById('title').textContent = s.title || '';
    document.getElementById('subtitle').textContent = s.subtitle || '';
    const bodyEl = document.getElementById('body');
    bodyEl.textContent = s.body || '';
    bodyEl.style.fontSize = fontSize + 'px';
    const ansEl = document.getElementById('answer');
    ansEl.textContent = s.answerText || '';
    ansEl.className = 'answer' + (showAns && s.answerText ? ' visible' : '');
    const noteEl = document.getElementById('note');
    noteEl.textContent = s.teacherNote ? 'Lời dẫn GV: ' + s.teacherNote : '';
    noteEl.className = 'note' + (showNote && s.teacherNote ? ' visible' : '');
  }
  function nextSlide() { if (idx < slides.length - 1) { idx++; showAns = false; render(); } }
  function prevSlide() { if (idx > 0) { idx--; showAns = false; render(); } }
  function changeFont(delta) { fontSize = Math.max(14, Math.min(34, fontSize + delta)); render(); }
  function toggleAnswer() { showAns = !showAns; render(); }
  function toggleNote() { showNote = !showNote; render(); }
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'a' || e.key === 'A') toggleAnswer();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  });
  render();
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerBlobDownload(blob, `Bai_giang_${slugifyFilename(deck.title)}.html`);
}
