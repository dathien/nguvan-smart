import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  History,
  PenTool,
  Save,
  Sparkles,
} from 'lucide-react';
import { WRITING_CATEGORIES } from '../config/curriculum';
import { db } from '../database/db';
import { callLiteratureAI } from '../services/aiService';
import { WritingCategory, WritingDraftSession } from '../types';
import { countWords, formatDateTimeVN, generateId } from '../utils/formatters';

const CHECKLIST_ITEMS = [
  { id: 'req', label: 'Đúng yêu cầu đề bài và kiểu bài' },
  { id: 'ideas', label: 'Đủ ý theo dàn ý đã lập' },
  { id: 'coherence', label: 'Mạch lạc, liên kết giữa các câu và đoạn' },
  { id: 'reasoning', label: 'Lập luận chặt chẽ, lí lẽ rõ ràng' },
  { id: 'evidence', label: 'Dẫn chứng xác thực, phù hợp vấn đề' },
  { id: 'expression', label: 'Diễn đạt trong sáng, giàu sức thuyết phục' },
  { id: 'spelling', label: 'Chuẩn chính tả và ngữ pháp tiếng Việt' },
];

function createDefaultSession(): WritingDraftSession {
  return {
    id: generateId('wd'),
    studentId: 'student-demo-12a1',
    promptText:
      'Viết bài văn nghị luận (khoảng 600 chữ) bàn về tinh thần tự học và bản lĩnh giữ gìn giá trị bản thân của người trẻ trong thời đại số.',
    essayType: 'Nghị luận xã hội',
    targetWords: 600,
    step1Analysis: {
      textType: 'Nghị luận xã hội (bài văn)',
      topic: 'Tinh thần tự học và bản lĩnh người trẻ',
      focusIssue: 'Mối quan hệ giữa chủ động học tập và giữ vững giá trị cốt lõi',
      evidenceScope: 'Thực tế đời sống học đường, xã hội đương đại',
    },
    step2Ideas:
      '- Tại sao thời đại số đòi hỏi năng lực tự học liên tục?\n- Bản lĩnh giữ gìn giá trị cá nhân giúp tránh chạy theo đám đông.\n- Dẫn chứng thực tế cần xác minh trước khi đưa vào bài.',
    step3Outline: {
      intro: 'Dẫn dắt từ tốc độ biến đổi tri thức hiện nay và nêu vấn đề nghị luận.',
      body: '1. Giải thích tự học & bản lĩnh.\n2. Phân tích vai trò và mối liên hệ hai mặt.\n3. Phản đề và bài học hành động.',
      conclusion: 'Khẳng định giá trị bền vững và liên hệ bản thân.',
    },
    draftText: '',
    revisions: [],
    selfChecklist: {},
    updatedAt: new Date().toISOString(),
  };
}

export const WritingStudioPage: React.FC = () => {
  const [session, setSession] = useState<WritingDraftSession | null>(null);
  const [step, setStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    (async () => {
      const existing = await db.writingDrafts.orderBy('updatedAt').reverse().first();
      if (existing) {
        setSession(existing);
      } else {
        const fresh = createDefaultSession();
        await db.writingDrafts.put(fresh);
        setSession(fresh);
      }
    })();
  }, []);

  if (!session) return null;

  const persist = async (next: WritingDraftSession) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    setSession(updated);
    await db.writingDrafts.put(updated);
  };

  const wordCount = countWords(session.draftText);
  const progressPct = Math.min(
    100,
    Math.round((wordCount / Math.max(1, session.targetWords)) * 100)
  );

  const handleSaveRevision = async () => {
    if (!session.draftText.trim()) return;
    const next: WritingDraftSession = {
      ...session,
      revisions: [
        {
          timestamp: new Date().toISOString(),
          content: session.draftText,
          wordCount,
        },
        ...session.revisions,
      ],
    };
    await persist(next);
    setSavedNotice('Đã lưu mốc phiên bản bài viết vào lịch sử tiến bộ.');
    setTimeout(() => setSavedNotice(''), 3000);
  };

  const handleRequestAIFeedback = async (mode: 'brainstorm' | 'feedback') => {
    setAiLoading(true);
    setAiNotice('');
    const prompt =
      mode === 'brainstorm'
        ? `Đề bài: "${session.promptText}". Hãy đưa ra 4 câu hỏi gợi mở giúp học sinh tự tìm ý và 3 gợi ý luận điểm ngắn gọn (tuyệt đối không viết thành bài văn mẫu hoàn chỉnh).`
        : `Đề bài: "${session.promptText}".\nBài làm của học sinh (${wordCount} chữ):\n${session.draftText}\n\nHãy nhận xét theo từng tiêu chí: Đúng yêu cầu đề, Mạch lạc, Lập luận & dẫn chứng, Diễn đạt & chính tả, và nêu 2 gợi ý để học sinh tự chỉnh sửa tốt hơn (không viết lại thay học sinh).`;

    const res = await callLiteratureAI({
      task:
        mode === 'brainstorm'
          ? 'Gợi mở tìm ý Xưởng luyện viết'
          : 'Phản hồi bài viết theo tiêu chí',
      prompt,
    });

    setAiLoading(false);
    if (!res.available) {
      setAiNotice(res.message || 'Trợ lý AI hiện chưa khả dụng.');
    } else if (res.text) {
      await persist({ ...session, aiFeedback: res.text });
    }
  };

  const STEPS = [
    '1. Nhập đề bài',
    '2. Tìm hiểu đề',
    '3. Khơi nguồn ý tưởng',
    '4. Lập dàn ý',
    '5. Viết bài',
    '6. Tự kiểm tra',
    '7. Nộp & Phản hồi',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Xưởng luyện viết (7 bước phát triển năng lực viết)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Học sinh tự tìm ý, lập dàn ý và tự viết bài; lưu toàn bộ các phiên bản chỉnh sửa để theo dõi tiến bộ
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveRevision}
          className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] inline-flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" /> Lưu phiên bản bài viết
        </button>
      </div>

      {/* 7-Step Bar */}
      <div className="flex flex-wrap gap-1.5 bg-white p-2 rounded-xl border border-[#E5E0D8]">
        {STEPS.map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(idx + 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              step === idx + 1
                ? 'bg-[#0F2942] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {savedNotice}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#0F2942]">
              Bước 1. Nhập đề bài luyện viết
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kiểu bài viết
                </label>
                <select
                  value={session.essayType}
                  onChange={(e) =>
                    persist({
                      ...session,
                      essayType: e.target.value as WritingCategory,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                >
                  {WRITING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dung lượng mục tiêu (chữ)
                </label>
                <input
                  type="number"
                  step={50}
                  min={100}
                  value={session.targetWords}
                  onChange={(e) =>
                    persist({ ...session, targetWords: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nội dung đề bài
              </label>
              <textarea
                rows={4}
                value={session.promptText}
                onChange={(e) => persist({ ...session, promptText: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#0F2942]">
              Bước 2. Tìm hiểu đề (Phân tích đề bài)
            </h2>
            {[
              { key: 'textType', label: 'Kiểu bài' },
              { key: 'topic', label: 'Đối tượng nghị luận' },
              { key: 'focusIssue', label: 'Vấn đề trọng tâm' },
              { key: 'evidenceScope', label: 'Phạm vi dẫn chứng' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block font-semibold text-slate-700 mb-1">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={
                    session.step1Analysis[
                      f.key as keyof typeof session.step1Analysis
                    ]
                  }
                  onChange={(e) =>
                    persist({
                      ...session,
                      step1Analysis: {
                        ...session.step1Analysis,
                        [f.key]: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#0F2942]">
                Bước 3. Khơi nguồn ý tưởng & Gợi ý luận điểm
              </h2>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleRequestAIFeedback('brainstorm')}
                className="px-3 py-1.5 rounded-lg bg-[#0D7A6F] text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiLoading ? 'Đang gợi mở...' : 'Gợi mở câu hỏi tìm ý'}
              </button>
            </div>
            <p className="text-slate-500">
              Ghi lại trải nghiệm cá nhân, các ý tưởng sơ khởi và những dẫn chứng thực tế bạn dự định kiểm chứng để đưa vào bài.
            </p>
            <textarea
              rows={7}
              value={session.step2Ideas}
              onChange={(e) => persist({ ...session, step2Ideas: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed"
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#0F2942]">
              Bước 4. Lập dàn ý chi tiết
            </h2>
            {[
              { key: 'intro', label: 'Mở bài / Mở đoạn', rows: 2 },
              { key: 'body', label: 'Thân bài / Thân đoạn (Hệ thống luận điểm)', rows: 6 },
              { key: 'conclusion', label: 'Kết bài / Kết đoạn', rows: 2 },
            ].map((f) => (
              <div key={f.key}>
                <label className="block font-semibold text-slate-700 mb-1">
                  {f.label}
                </label>
                <textarea
                  rows={f.rows}
                  value={
                    session.step3Outline[
                      f.key as keyof typeof session.step3Outline
                    ]
                  }
                  onChange={(e) =>
                    persist({
                      ...session,
                      step3Outline: {
                        ...session.step3Outline,
                        [f.key]: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#0F2942] flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#0D7A6F]" />
                Bước 5. Trình soạn thảo bài viết
              </h2>
              <div className="text-xs font-mono tabular-nums text-slate-600">
                Số chữ hiện tại:{' '}
                <strong className="text-[#0F2942]">{wordCount}</strong> /{' '}
                {session.targetWords} chữ ({progressPct}%)
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0D7A6F] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <textarea
              rows={14}
              placeholder="Bắt đầu viết bài của bạn tại đây (bản nháp tự động lưu cục bộ)..."
              value={session.draftText}
              onChange={(e) => persist({ ...session, draftText: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-[15px] leading-relaxed"
            />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#0F2942]">
              Bước 6. Tự kiểm tra theo bảng tiêu chí
            </h2>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(session.selfChecklist[item.id])}
                    onChange={(e) =>
                      persist({
                        ...session,
                        selfChecklist: {
                          ...session.selfChecklist,
                          [item.id]: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#0F2942]">
                Bước 7. Nộp bài, nhận phản hồi và theo dõi phiên bản
              </h2>
              <button
                type="button"
                disabled={aiLoading || !session.draftText.trim()}
                onClick={() => handleRequestAIFeedback('feedback')}
                className="px-3.5 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiLoading ? 'Đang phản hồi...' : 'Nhận phản hồi theo tiêu chí'}
              </button>
            </div>

            {aiNotice && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {aiNotice}
              </div>
            )}

            {session.aiFeedback && (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                <div className="text-xs font-bold text-[#0D7A6F] mb-1.5">
                  Phản hồi tham khảo theo tiêu chí (Bài gốc của bạn luôn được giữ nguyên):
                </div>
                {session.aiFeedback}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-[#0F2942] flex items-center gap-1.5 mb-2">
                <History className="w-4 h-4 text-[#0D7A6F]" />
                Lịch sử phiên bản đã lưu ({session.revisions.length})
              </div>
              {session.revisions.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Chưa có mốc phiên bản nào. Nhấn &ldquo;Lưu phiên bản bài viết&rdquo; để ghi lại tiến trình.
                </p>
              ) : (
                <div className="space-y-2">
                  {session.revisions.map((rev, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <strong>Phiên bản {session.revisions.length - i}</strong> ·{' '}
                        {rev.wordCount} chữ · {formatDateTimeVN(rev.timestamp)}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          persist({ ...session, draftText: rev.content });
                          setStep(5);
                        }}
                        className="text-[#0D7A6F] font-semibold hover:underline"
                      >
                        Mở bản này
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium disabled:opacity-40"
          >
            ← Bước trước
          </button>
          <button
            type="button"
            disabled={step === 7}
            onClick={() => setStep((s) => Math.min(7, s + 1))}
            className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold disabled:opacity-40"
          >
            Bước tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
};
