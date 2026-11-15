import React from 'react';
import { ExamDocument } from '../types';
import { formatScore } from '../utils/formatters';
import { buildSynchronizedExamData } from '../services/examSyncService';

export type PreviewMode =
  | 'exam'
  | 'answers'
  | 'grading'
  | 'matrix'
  | 'spec'
  | 'dossier';

interface A4PreviewSheetProps {
  exam: ExamDocument;
  mode: PreviewMode;
  fontFamily?: 'Times New Roman' | 'Be Vietnam Pro';
  fontSizePt?: number;
}

export const A4PreviewSheet: React.FC<A4PreviewSheetProps> = ({
  exam,
  mode,
  fontFamily = 'Times New Roman',
  fontSizePt = 13,
}) => {
  const sync = buildSynchronizedExamData(exam);
  const showExam = mode === 'exam' || mode === 'dossier';
  const showAnswers = mode === 'answers';
  const showGrading = mode === 'grading' || mode === 'dossier';
  const showMatrix = mode === 'matrix' || mode === 'dossier';
  const showSpec = mode === 'spec' || mode === 'dossier';

  const passageLines = exam.passage.content.split('\n');

  return (
    <div
      id="a4-print-area"
      className={`print-only-container bg-white text-black shadow-sm border border-slate-200 mx-auto p-8 md:p-12 ${
        fontFamily === 'Times New Roman' ? 'font-a4' : 'font-sans'
      }`}
      style={{
        maxWidth: '210mm',
        minHeight: '297mm',
        fontSize: `${fontSizePt}pt`,
        lineHeight: 1.48,
      }}
    >
      {exam.isPracticeSample && exam.sampleNotice && (
        <div className="mb-4 border border-amber-300 bg-amber-50/70 px-3 py-2 text-[10.5pt] italic text-amber-900 no-print">
          Lưu ý: {exam.sampleNotice}
        </div>
      )}

      {/* EXAM SECTION */}
      {showExam && (
        <section>
          <div className="grid grid-cols-12 gap-4 text-center mb-5 items-start">
            <div className="col-span-5">
              <div className="font-bold uppercase text-[11.5pt]">
                {exam.adminInfo.schoolName || 'TÊN TRƯỜNG'}
              </div>
              <div className="font-bold uppercase text-[11.5pt]">
                {exam.adminInfo.departmentName || 'TỔ NGỮ VĂN'}
              </div>
              <div className="w-24 h-px bg-black mx-auto my-1" />
              <div className="italic text-[10.5pt]">
                Mã đề: {exam.adminInfo.examCode || '01'}
              </div>
            </div>
            <div className="col-span-7">
              <div className="font-bold uppercase text-[11.5pt]">
                {exam.adminInfo.title || 'ĐỀ KIỂM TRA MÔN NGỮ VĂN'}
              </div>
              <div className="font-bold text-[11.5pt]">
                Môn: NGỮ VĂN – Lớp {exam.adminInfo.grade} ({exam.adminInfo.semester},{' '}
                {exam.adminInfo.academicYear})
              </div>
              <div className="italic text-[10.5pt]">
                Thời gian làm bài: {exam.adminInfo.durationMinutes} phút (không kể thời gian phát đề)
              </div>
            </div>
          </div>

          {exam.readingQuestions.length > 0 && (
            <div className="mb-5">
              <h3 className="font-bold text-[13pt] mb-1.5">
                I. ĐỌC HIỂU ({formatScore(sync.readingTotal)} điểm)
              </h3>
              <p className="italic mb-2">Đọc văn bản sau và thực hiện các yêu cầu:</p>
              {exam.passage.title && (
                <p className="font-bold text-center uppercase mb-2">
                  {exam.passage.title}
                </p>
              )}
              <div
                className={
                  exam.passage.formatStyle === 'poem'
                    ? 'pl-8 space-y-0.5 mb-2'
                    : 'space-y-2 mb-2 text-justify'
                }
              >
                {passageLines.map((line, i) =>
                  line.trim() === '' ? (
                    <div key={i} className="h-2.5" />
                  ) : (
                    <p
                      key={i}
                      className={
                        exam.passage.formatStyle === 'prose' ? 'indent-7' : ''
                      }
                    >
                      {line}
                    </p>
                  )
                )}
              </div>
              {(exam.passage.author || exam.passage.citationSource) && (
                <p className="text-right italic text-[11.5pt] mb-3">
                  (Theo {exam.passage.author}
                  {exam.passage.citationSource ? ` – ${exam.passage.citationSource}` : ''}
                  {exam.passage.publishYear ? `, ${exam.passage.publishYear}` : ''})
                </p>
              )}

              <div className="space-y-2">
                {exam.readingQuestions.map((q, idx) => (
                  <p key={q.id} className="avoid-break">
                    <strong>
                      Câu {idx + 1} ({formatScore(q.points)} điểm).{' '}
                    </strong>
                    {q.content}
                  </p>
                ))}
              </div>
            </div>
          )}

          {exam.writingPrompts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-[13pt] mb-2">
                II. VIẾT ({formatScore(sync.writingTotal)} điểm)
              </h3>
              <div className="space-y-2.5">
                {exam.writingPrompts.map((wp, idx) => (
                  <p key={wp.id} className="avoid-break text-justify">
                    <strong>
                      Câu {idx + 1} ({formatScore(wp.points)} điểm).{' '}
                    </strong>
                    {wp.promptText}
                  </p>
                ))}
              </div>
            </div>
          )}

          <p className="font-bold text-center my-4">--- HẾT ---</p>
          {exam.adminInfo.extraNotes && (
            <p className="italic text-center text-[11pt]">{exam.adminInfo.extraNotes}</p>
          )}
        </section>
      )}

      {/* MATRIX SECTION */}
      {showMatrix && (
        <section className={mode === 'dossier' ? 'print-page-break pt-6' : ''}>
          <h2 className="font-bold text-center uppercase text-[14pt] mb-1">
            MA TRẬN ĐỀ KIỂM TRA MÔN NGỮ VĂN LỚP {exam.adminInfo.grade}
          </h2>
          <p className="italic text-center text-[11.5pt] mb-4">
            {exam.adminInfo.title} · Bộ sách: {exam.adminInfo.textbookSeries}
          </p>

          <table className="w-full border-collapse text-[11pt]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-800 p-1.5 text-center">STT</th>
                <th className="border border-slate-800 p-1.5 text-center">Kỹ năng</th>
                <th className="border border-slate-800 p-1.5 text-left">
                  Nội dung / Đơn vị kiến thức
                </th>
                {sync.levelsUsed.map((lvl) => (
                  <th key={lvl} className="border border-slate-800 p-1.5 text-center">
                    {lvl}
                    <br />
                    <span className="font-normal text-[9.5pt]">(Câu / Điểm)</span>
                  </th>
                ))}
                <th className="border border-slate-800 p-1.5 text-center">Tổng câu</th>
                <th className="border border-slate-800 p-1.5 text-center">Tổng điểm</th>
                <th className="border border-slate-800 p-1.5 text-center">Tỉ lệ</th>
              </tr>
            </thead>
            <tbody>
              {(exam.matrixOverride?.enabled
                ? exam.matrixOverride.rows
                : sync.matrixRows
              ).map((row) => (
                <tr key={row.id}>
                  <td className="border border-slate-800 p-1.5 text-center tabular-nums">
                    {row.stt}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-center font-semibold">
                    {row.skill}
                  </td>
                  <td className="border border-slate-800 p-1.5">{row.contentUnit}</td>
                  {sync.levelsUsed.map((lvl) => (
                    <td
                      key={lvl}
                      className="border border-slate-800 p-1.5 text-center tabular-nums"
                    >
                      {row.counts[lvl]} / {formatScore(row.points[lvl])}đ
                    </td>
                  ))}
                  <td className="border border-slate-800 p-1.5 text-center tabular-nums">
                    {row.totalQuestions}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-center font-semibold tabular-nums">
                    {formatScore(row.totalPoints)}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-center tabular-nums">
                    {formatScore(row.percentage)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={3} className="border border-slate-800 p-1.5 text-center">
                  TỔNG CỘNG
                </td>
                {sync.levelsUsed.map((lvl) => (
                  <td
                    key={lvl}
                    className="border border-slate-800 p-1.5 text-center tabular-nums"
                  >
                    {sync.levelTotals[lvl].count} /{' '}
                    {formatScore(sync.levelTotals[lvl].points)}đ (
                    {formatScore(sync.levelTotals[lvl].percent)}%)
                  </td>
                ))}
                <td className="border border-slate-800 p-1.5 text-center tabular-nums">
                  {exam.readingQuestions.length + exam.writingPrompts.length}
                </td>
                <td className="border border-slate-800 p-1.5 text-center tabular-nums">
                  {formatScore(sync.computedTotal)}
                </td>
                <td className="border border-slate-800 p-1.5 text-center tabular-nums">
                  {sync.targetTotal > 0
                    ? formatScore((sync.computedTotal / sync.targetTotal) * 100)
                    : 0}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* SPECIFICATION SECTION */}
      {showSpec && (
        <section className={mode === 'dossier' ? 'print-page-break pt-6' : ''}>
          <h2 className="font-bold text-center uppercase text-[14pt] mb-1">
            BẢN ĐẶC TẢ ĐỀ KIỂM TRA MÔN NGỮ VĂN LỚP {exam.adminInfo.grade}
          </h2>
          <p className="italic text-center text-[11.5pt] mb-4">
            {exam.adminInfo.title} · {exam.adminInfo.textbookSeries}
          </p>

          <table className="w-full border-collapse text-[10.5pt]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-800 p-1.5 text-center">STT</th>
                <th className="border border-slate-800 p-1.5 text-center">Kỹ năng</th>
                <th className="border border-slate-800 p-1.5">Đơn vị kiến thức</th>
                <th className="border border-slate-800 p-1.5">Yêu cầu cần đạt</th>
                <th className="border border-slate-800 p-1.5">Biểu hiện cần đánh giá</th>
                <th className="border border-slate-800 p-1.5 text-center">Mức độ</th>
                <th className="border border-slate-800 p-1.5 text-center">Câu / Điểm</th>
              </tr>
            </thead>
            <tbody>
              {sync.specRows.map((r) => (
                <tr key={r.id}>
                  <td className="border border-slate-800 p-1.5 text-center tabular-nums">
                    {r.stt}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-center font-semibold">
                    {r.skill}
                  </td>
                  <td className="border border-slate-800 p-1.5">{r.contentUnit}</td>
                  <td className="border border-slate-800 p-1.5">{r.learningOutcome}</td>
                  <td className="border border-slate-800 p-1.5">
                    {r.evaluationIndicators}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-center">
                    {r.cognitiveLevel}
                  </td>
                  <td className="border border-slate-800 p-1.5 text-center tabular-nums">
                    {r.questionLabels.join(', ')}
                    <br />({formatScore(r.points)}đ)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ANSWERS OR FULL GRADING GUIDE */}
      {(showAnswers || showGrading) && (
        <section className={mode === 'dossier' ? 'print-page-break pt-6' : ''}>
          <h2 className="font-bold text-center uppercase text-[14pt] mb-1">
            {showAnswers ? 'ĐÁP ÁN THAM KHẢO' : 'HƯỚNG DẪN CHẤM VÀ BAREM CHI TIẾT'}
          </h2>
          <p className="italic text-center text-[11.5pt] mb-4">
            {exam.adminInfo.title} · Tổng điểm: {formatScore(sync.computedTotal)} điểm
          </p>

          {exam.readingQuestions.length > 0 && (
            <div className="mb-5">
              <h3 className="font-bold text-[12.5pt] mb-2">
                PHẦN I. ĐỌC HIỂU ({formatScore(sync.readingTotal)} điểm)
              </h3>
              <table className="w-full border-collapse text-[11pt]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-800 p-1.5 w-16 text-center">Câu</th>
                    <th className="border border-slate-800 p-1.5 text-left">
                      {showAnswers
                        ? 'Đáp án chính'
                        : 'Đáp án, các ý thành phần và hướng dẫn cho điểm'}
                    </th>
                    <th className="border border-slate-800 p-1.5 w-20 text-center">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {exam.readingQuestions.map((q, idx) => (
                    <tr key={q.id}>
                      <td className="border border-slate-800 p-1.5 text-center font-bold">
                        Câu {idx + 1}
                      </td>
                      <td className="border border-slate-800 p-1.5 space-y-1.5">
                        <div className="whitespace-pre-line">{q.answer}</div>
                        {showGrading && q.partialCreditSteps.length > 0 && (
                          <div className="pt-1 border-t border-slate-300 text-[10.5pt]">
                            <strong>Chiết điểm thành phần:</strong>
                            <ul className="list-disc pl-5">
                              {q.partialCreditSteps.map((s) => (
                                <li key={s.id}>
                                  {s.description}:{' '}
                                  <span className="font-semibold">
                                    {formatScore(s.points)} điểm
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {showGrading && q.equivalentAnswers && (
                          <div className="text-[10.5pt] italic">
                            <strong>Diễn đạt tương đương:</strong> {q.equivalentAnswers}
                          </div>
                        )}
                        {showGrading && q.nonQualifyingNotes && (
                          <div className="text-[10.5pt] text-slate-700">
                            <strong>Không tính điểm khi:</strong> {q.nonQualifyingNotes}
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-800 p-1.5 text-center font-bold tabular-nums">
                        {formatScore(q.points)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exam.writingPrompts.length > 0 && (
            <div>
              <h3 className="font-bold text-[12.5pt] mb-2">
                PHẦN II. VIẾT ({formatScore(sync.writingTotal)} điểm)
              </h3>
              {exam.writingPrompts.map((wp, idx) => (
                <div key={wp.id} className="mb-4 avoid-break">
                  <p className="font-bold mb-1.5">
                    Câu {idx + 1} ({formatScore(wp.points)} điểm) – {wp.category} (
                    {wp.formatType} ~{wp.wordCountTarget} chữ)
                  </p>
                  {wp.suggestedOutline.length > 0 && (
                    <div className="mb-2 text-[11pt]">
                      <strong>Dàn ý gợi ý:</strong>
                      <ul className="list-disc pl-5">
                        {wp.suggestedOutline.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <table className="w-full border-collapse text-[11pt]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-800 p-1.5 w-44 text-left">
                          Nhóm tiêu chí
                        </th>
                        <th className="border border-slate-800 p-1.5 text-left">
                          Mô tả mức độ đạt yêu cầu
                        </th>
                        <th className="border border-slate-800 p-1.5 w-20 text-center">
                          Điểm
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {wp.rubric.map((r) => (
                        <tr key={r.id}>
                          <td className="border border-slate-800 p-1.5 font-semibold">
                            {r.group}
                            <div className="font-normal text-[10pt] text-slate-600">
                              {r.title}
                            </div>
                          </td>
                          <td className="border border-slate-800 p-1.5">{r.description}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-semibold tabular-nums">
                            {formatScore(r.points)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
