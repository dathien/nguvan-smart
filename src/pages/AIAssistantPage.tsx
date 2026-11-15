import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  Send,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { db, ensureDatabaseSeeded } from '../database/db';
import {
  AIHealthStatus,
  callLiteratureAI,
  checkAIHealth,
} from '../services/aiService';
import { ExamDocument, ReadingPassage } from '../types';

const TASK_PRESETS = [
  {
    id: 'questions',
    label: 'Gợi ý câu hỏi Đọc hiểu',
    taskName: 'Soạn câu hỏi Đọc hiểu Ngữ văn THPT theo 3-4 mức độ nhận thức',
    placeholder:
      'Ví dụ: Đề xuất 5 câu hỏi đọc hiểu (2 Nhận biết, 2 Thông hiểu, 1 Vận dụng) bám sát văn bản đính kèm.',
  },
  {
    id: 'rubric',
    label: 'Gợi ý đáp án & Hướng dẫn chấm',
    taskName: 'Xây dựng đáp án chi tiết, đáp án tương đương và chia ý chấm điểm',
    placeholder:
      'Ví dụ: Gợi ý đáp án chi tiết và thang điểm từng ý nhỏ (0,25đ) cho đề nghị luận xã hội 600 chữ.',
  },
  {
    id: 'matrix',
    label: 'Gợi ý Ma trận & Bản đặc tả',
    taskName: 'Tư vấn phân bổ ma trận và chỉ báo đặc tả GDPT 2018',
    placeholder:
      'Ví dụ: Tư vấn phân bổ tỉ lệ Đọc hiểu 4 điểm – Viết 6 điểm cho đề kiểm tra cuối kỳ lớp 11.',
  },
  {
    id: 'passage-analysis',
    label: 'Phân tích ngữ liệu',
    taskName: 'Phân tích đặc sắc nội dung, nghệ thuật và YCCĐ phù hợp của ngữ liệu',
    placeholder:
      'Ví dụ: Phân tích mạch cảm xúc, biện pháp tu từ và thông điệp chính của văn bản đính kèm.',
  },
  {
    id: 'lesson-plan',
    label: 'Gợi ý KHBD & Phiếu học tập',
    taskName: 'Thiết kế chuỗi 4 hoạt động dạy học (Công văn 5512) và câu hỏi phiếu học tập',
    placeholder:
      'Ví dụ: Gợi ý hoạt động Khởi động và Hình thành kiến thức trong 2 tiết dạy đọc hiểu thơ tự do lớp 12.',
  },
  {
    id: 'slides',
    label: 'Gợi ý kịch bản Slide bài giảng',
    taskName: 'Lên dàn ý bài trình chiếu 16:9 ngắn gọn, trực quan cho tiết học Ngữ văn',
    placeholder:
      'Ví dụ: Đề xuất 8 slide chính giúp học sinh tương tác thảo luận về hình ảnh trung tâm trong bài thơ.',
  },
];

export const AIAssistantPage: React.FC = () => {
  const [health, setHealth] = useState<AIHealthStatus | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState(TASK_PRESETS[0].id);
  const [prompt, setPrompt] = useState('');
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [exams, setExams] = useState<ExamDocument[]>([]);
  const [contextSource, setContextSource] = useState<string>('none');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      await ensureDatabaseSeeded();
      const [h, pasList, exmList] = await Promise.all([
        checkAIHealth(),
        db.passages.toArray(),
        db.exams.toArray(),
      ]);
      setHealth(h);
      setPassages(pasList);
      setExams(exmList);
    })();
  }, []);

  const currentPreset =
    TASK_PRESETS.find((p) => p.id === selectedPresetId) || TASK_PRESETS[0];

  const buildSelectedContext = (): string => {
    if (contextSource === 'none') return '';
    if (contextSource.startsWith('passage:')) {
      const id = contextSource.replace('passage:', '');
      const p = passages.find((item) => item.id === id);
      if (!p) return '';
      return `Ngữ liệu: ${p.title} (${p.genre} – Lớp ${p.grade})\nTác giả/Nguồn: ${p.author}\nNội dung:\n${p.content}`;
    }
    if (contextSource.startsWith('exam:')) {
      const id = contextSource.replace('exam:', '');
      const ex = exams.find((item) => item.id === id);
      if (!ex) return '';
      return `Đề kiểm tra: ${ex.adminInfo.title} (Lớp ${ex.adminInfo.grade}, ${ex.adminInfo.durationMinutes} phút)\nNgữ liệu: ${ex.passage.title}\n${ex.passage.content}`;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setResultText('');

    const res = await callLiteratureAI({
      task: currentPreset.taskName,
      prompt: prompt.trim(),
      context: buildSelectedContext(),
    });

    if (res.available && res.text) {
      setResultText(res.text);
    } else {
      setErrorMsg(
        res.message ||
          'Dịch vụ AI hiện không khả dụng. Các chức năng soạn đề, ma trận, bài giảng và xuất tài liệu vẫn hoạt động bình thường.'
      );
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!resultText) return;
    await navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Trợ lý AI Ngữ văn
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Hỗ trợ gợi ý câu hỏi, đáp án, phân tích ngữ liệu và kế hoạch bài dạy qua máy chủ an toàn (không yêu cầu nhập khóa cá nhân).
          </p>
        </div>
        <div className="text-xs font-medium text-slate-600">
          {health === null ? (
            'Đang kiểm tra trạng thái kết nối...'
          ) : health.ok && health.aiConfigured ? (
            <span className="text-[#0D7A6F] font-semibold">
              Dịch vụ AI phía máy chủ đang sẵn sàng
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              Dịch vụ AI chưa kích hoạt hoặc đang ngoại tuyến
            </span>
          )}
        </div>
      </div>

      {/* Task Presets */}
      <div className="flex flex-wrap gap-2">
        {TASK_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setSelectedPresetId(preset.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              selectedPresetId === preset.id
                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                : 'bg-white text-slate-700 border-[#E5E0D8] hover:border-[#0F2942]/40'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-4"
        >
          <div>
            <div className="text-xs font-semibold text-[#0D7A6F]">
              Nhiệm vụ đang chọn
            </div>
            <div className="text-sm font-bold text-[#0F2942] mt-0.5">
              {currentPreset.taskName}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Đính kèm ngữ liệu hoặc đề từ kho (tùy chọn)
            </label>
            <select
              value={contextSource}
              onChange={(e) => setContextSource(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="none">Không đính kèm tài liệu nguồn</option>
              {passages.map((p) => (
                <option key={p.id} value={`passage:${p.id}`}>
                  Ngữ liệu: {p.title} (Lớp {p.grade})
                </option>
              ))}
              {exams.map((ex) => (
                <option key={ex.id} value={`exam:${ex.id}`}>
                  Đề: {ex.adminInfo.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yêu cầu chi tiết của giáo viên
            </label>
            <textarea
              rows={6}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={currentPreset.placeholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0F2942] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0B665D] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Đang xử lý yêu cầu...' : 'Gửi yêu cầu gợi ý'}
          </button>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Lưu ý học thuật: Nội dung từ AI chỉ mang tính tham khảo sư phạm. Giáo viên kiểm tra lại nguồn trích dẫn, mức độ nhận thức và chuẩn YCCĐ trước khi sử dụng chính thức.
          </p>
        </form>

        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E0D8] p-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3 mb-4">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0F2942]">
              <Sparkles className="w-4 h-4 text-[#0D7A6F]" />
              Kết quả gợi ý tham khảo
            </div>
            {resultText && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-300 text-xs font-medium text-[#0F2942] hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0D7A6F]" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép nội dung
                  </>
                )}
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
              <div>
                <div className="font-semibold">Không thể tạo phản hồi AI lúc này</div>
                <p className="mt-1 text-xs leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {!errorMsg && !resultText && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <BookOpen className="w-8 h-8 mb-2 text-slate-400" />
              <p className="text-sm max-w-md">
                Chọn nhiệm vụ, đính kèm ngữ liệu (nếu cần) và nhập yêu cầu ở khung bên trái để nhận gợi ý soạn giảng, ra đề hoặc chấm bài.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex items-center justify-center py-12 text-sm text-slate-600">
              Đang phân tích ngữ cảnh và soạn nội dung gợi ý...
            </div>
          )}

          {resultText && (
            <div className="flex-1 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-[#FAF8F5] rounded-lg border border-[#E5E0D8] p-4 overflow-y-auto max-h-[540px]">
              {resultText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
