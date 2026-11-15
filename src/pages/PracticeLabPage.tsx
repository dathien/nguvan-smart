import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Feather,
  GitMerge,
  Info,
  MessageSquarePlus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { listPassages } from '../repositories/examRepository';
import { ReadingPassage } from '../types';
import { generateId } from '../utils/formatters';

type LabMode = 'tho' | 'truyen' | 'nghi-luan' | 'thong-tin' | 'ki-kich';

interface LineAnnotation {
  id: string;
  lineIndex: number;
  selectedText: string;
  note: string;
  rhetoricTag: string;
}

interface StoryEvent {
  id: string;
  text: string;
}

interface PracticeLabPageProps {
  initialMode?: 'tho' | 'truyen';
}

export const PracticeLabPage: React.FC<PracticeLabPageProps> = ({
  initialMode = 'tho',
}) => {
  const [mode, setMode] = useState<LabMode>(initialMode);
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [activePassage, setActivePassage] = useState<ReadingPassage | null>(null);

  // Poetry Lab state
  const [selectedLineIdx, setSelectedLineIdx] = useState<number | null>(null);
  const [annotations, setAnnotations] = useState<LineAnnotation[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [rhetoricInput, setRhetoricInput] = useState('So sánh');
  const [poetryAnalysis, setPoetryAnalysis] = useState({
    form: 'Thơ tự do',
    rhymeRhythm: 'Nhịp linh hoạt 3/4 và 4/4, vần chân nhẹ nhàng',
    lyricalSubject: 'Người con hồi tưởng về quê hương và mẹ',
    emotionalFlow: 'Từ kí ức tuổi thơ → chiêm nghiệm hiện tại → hướng về tương lai',
    theme: 'Tình cảm gia đình, lòng biết ơn cội nguồn',
    message: 'Giữ gìn giá trị tinh thần quê hương trong hành trang trưởng thành',
  });

  // Story Lab state
  const [storyMap, setStoryMap] = useState({
    characters: 'Ông Tư gác ghi – người lao động tận tụy thầm lặng',
    situation: 'Đêm mưa bão mất điện, đường dây tín hiệu bị đứt đúng giờ tàu sắp qua',
    narratorView: 'Ngôi thứ ba, điểm nhìn toàn tri kết hợp điểm nhìn cận cảnh nhân vật',
    spaceTime: 'Ga xép ven rặng phi lao, đêm cuối thu mưa gió',
    artisticDetail: 'Ngọn đèn bão rung lên bần bật nhưng không tắt giữa màn mưa',
    themeMessage: 'Tôn vinh vẻ đẹp thầm lặng và tinh thần trách nhiệm của người lao động',
  });
  const [storyEvents, setStoryEvents] = useState<StoryEvent[]>([
    { id: 'ev-2', text: 'Gió mùa tràn về bất ngờ làm đứt dây điện dọc đường ray.' },
    { id: 'ev-4', text: 'Đoàn tàu lăn bánh an toàn qua ga xép trong ánh đèn ấm áp.' },
    { id: 'ev-1', text: 'Giới thiệu ga xép vắng vẻ và công việc thầm lặng suốt ba mươi năm của ông Tư.' },
    { id: 'ev-3', text: 'Ông Tư cầm đèn bão leo lên triền đá suốt hai giờ để báo hiệu cho tàu giảm tốc.' },
  ]);
  const [timelineStatus, setTimelineStatus] = useState('');

  // Argumentative & Informational Lab state
  const [argMap, setArgMap] = useState({
    thesis: 'Giá trị của thói quen đọc chậm trong thời đại thông tin nhanh',
    points: '1. Đọc nhanh dễ gây tiếp nhận hời hợt.\n2. Đọc chậm giúp đối thoại, kiểm chứng và kết nối tri thức.\n3. Rèn sự kiên nhẫn và bản lĩnh tự chủ tư duy.',
    reasoningEvidence: 'Đối lập giữa vài chục giây lướt tin và chiều sâu lập luận hai trang sách.',
    operations: 'Giải thích, phân tích, chứng minh, bình luận, bác bỏ quan niệm sai lệch.',
    authorView: 'Khẳng định đọc chậm là nền tảng của năng lực tự chủ tư duy hiện đại.',
  });

  const [infoMap, setInfoMap] = useState({
    headline: '',
    subheadings: '',
    mainInfo: '',
    dataPresentation: 'Trình bày theo trình tự logic / số liệu / biểu đồ đối chiếu',
    nonVerbal: 'Bảng thống kê, sơ đồ minh họa, chú thích ảnh',
    purpose: 'Cung cấp thông tin chính xác, khách quan cho người đọc',
  });

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    (async () => {
      const all = await listPassages();
      setPassages(all);
      if (all.length > 0) {
        const match =
          initialMode === 'tho'
            ? all.find((p) => p.genre === 'Thơ') || all[0]
            : all.find((p) => p.genre === 'Truyện') || all[0];
        setActivePassage(match);
      }
    })();
  }, [initialMode]);

  const handleSelectMode = (nextMode: LabMode) => {
    setMode(nextMode);
    const genreMap: Record<LabMode, string> = {
      tho: 'Thơ',
      truyen: 'Truyện',
      'nghi-luan': 'Văn bản nghị luận',
      'thong-tin': 'Văn bản thông tin',
      'ki-kich': 'Kí',
    };
    const found = passages.find((p) => p.genre === genreMap[nextMode]);
    if (found) setActivePassage(found);
  };

  const lines = activePassage ? activePassage.content.split('\n') : [];

  const handleAddAnnotation = () => {
    if (selectedLineIdx === null || !noteInput.trim()) return;
    const lineText = lines[selectedLineIdx] || '';
    setAnnotations((prev) => [
      ...prev,
      {
        id: generateId('ann'),
        lineIndex: selectedLineIdx,
        selectedText: lineText,
        note: noteInput.trim(),
        rhetoricTag: rhetoricInput,
      },
    ]);
    setNoteInput('');
  };

  const moveEvent = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= storyEvents.length) return;
    const copy = [...storyEvents];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setStoryEvents(copy);
    setTimelineStatus('');
  };

  const checkStoryTimeline = () => {
    const expected = ['ev-1', 'ev-2', 'ev-3', 'ev-4'];
    const current = storyEvents.map((e) => e.id);
    if (JSON.stringify(expected) === JSON.stringify(current)) {
      setTimelineStatus('Chính xác! Trình tự cốt truyện hợp lí từ mở đầu đến cao trào và kết thúc.');
    } else {
      setTimelineStatus('Thứ tự chưa hoàn toàn khớp với mạch sự kiện gốc; hãy kiểm tra lại từ phần giới thiệu nhân vật.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
            Phòng thực hành văn học tương tác
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Phân tích trực tiếp trên ngữ liệu theo đặc trưng thể loại (Lớp 10, 11, 12)
          </p>
        </div>

        <select
          value={activePassage?.id || ''}
          onChange={(e) => {
            const found = passages.find((p) => p.id === e.target.value);
            if (found) setActivePassage(found);
          }}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs max-w-xs"
        >
          {passages.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.genre} · Lớp {p.grade}] {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Genre Lab Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-[#E5E0D8] w-fit">
        {[
          { id: 'tho', label: 'Khám phá thơ ca', icon: Feather },
          { id: 'truyen', label: 'Khám phá truyện', icon: BookOpen },
          { id: 'nghi-luan', label: 'Văn bản nghị luận', icon: GitMerge },
          { id: 'thong-tin', label: 'Văn bản thông tin', icon: Info },
          { id: 'ki-kich', label: 'Kí và Kịch', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectMode(tab.id as LabMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                mode === tab.id
                  ? 'bg-[#0F2942] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TWO-ZONE SANDBOX LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Stage: Interactive Text Reader */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3">
          {activePassage ? (
            <>
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-serif text-xl font-bold text-[#0F2942]">
                  {activePassage.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {activePassage.author} · {activePassage.genre} · Lớp {activePassage.grade}
                </p>
              </div>

              <div className="space-y-1 text-sm leading-relaxed">
                {lines.map((line, idx) => {
                  if (!line.trim()) return <div key={idx} className="h-3" />;
                  const lineAnns = annotations.filter((a) => a.lineIndex === idx);
                  const isSelected = selectedLineIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedLineIdx(idx)}
                      className={`cursor-pointer px-2.5 py-1 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-[#0D7A6F]/15 border border-[#0D7A6F]/40'
                          : lineAnns.length > 0
                          ? 'bg-amber-50 border border-amber-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[11px] font-mono text-slate-400 mr-2 select-none">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{line}</span>
                      {lineAnns.length > 0 && (
                        <span className="ml-2 text-[11px] font-semibold text-[#0D7A6F]">
                          [{lineAnns.map((a) => a.rhetoricTag).join(', ')}]
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-100">
                Nhấn vào một dòng bất kỳ để đánh dấu từ ngữ, biện pháp tu từ và ghi chú phân tích.
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">Chưa có ngữ liệu.</p>
          )}
        </div>

        {/* Right Interactive Analytical Workspace */}
        <div className="lg:col-span-6 space-y-4">
          {mode === 'tho' && (
            <>
              <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#0F2942] flex items-center gap-1.5">
                  <MessageSquarePlus className="w-4 h-4 text-[#0D7A6F]" />
                  Đánh dấu hình ảnh & biện pháp tu từ trên dòng thơ
                </h3>
                {selectedLineIdx !== null ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-slate-200 italic text-[#0F2942]">
                      Dòng {selectedLineIdx + 1}: &ldquo;{lines[selectedLineIdx]}&rdquo;
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={rhetoricInput}
                        onChange={(e) => setRhetoricInput(e.target.value)}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5"
                      >
                        {[
                          'So sánh',
                          'Ẩn dụ',
                          'Nhân hóa',
                          'Điệp ngữ',
                          'Đối lập',
                          'Hoán dụ',
                          'Hình ảnh biểu tượng',
                        ].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Ghi chú phân tích tác dụng..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-1.5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAnnotation}
                      className="px-3.5 py-1.5 rounded-lg bg-[#0D7A6F] text-white font-semibold"
                    >
                      Lưu ghi chú dòng thơ
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Chọn một dòng thơ ở khung bên trái để ghi chú phân tích.
                  </p>
                )}

                {annotations.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#0F2942]">
                            Dòng {ann.lineIndex + 1} · {ann.rhetoricTag}:
                          </span>{' '}
                          {ann.note}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAnnotations((prev) =>
                              prev.filter((a) => a.id !== ann.id)
                            )
                          }
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-[#0F2942]">
                  Phiếu khám phá đặc trưng thơ ca
                </h3>
                {[
                  { key: 'form', label: 'Thể thơ' },
                  { key: 'rhymeRhythm', label: 'Vần và nhịp' },
                  { key: 'lyricalSubject', label: 'Chủ thể trữ tình' },
                  { key: 'emotionalFlow', label: 'Mạch cảm xúc' },
                  { key: 'theme', label: 'Chủ đề' },
                  { key: 'message', label: 'Thông điệp rút ra' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={poetryAnalysis[f.key as keyof typeof poetryAnalysis]}
                      onChange={(e) =>
                        setPoetryAnalysis((prev) => ({
                          ...prev,
                          [f.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {mode === 'truyen' && (
            <>
              <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-[#0F2942]">
                  Sơ đồ các yếu tố tự sự
                </h3>
                {[
                  { key: 'characters', label: 'Nhân vật & tính cách' },
                  { key: 'situation', label: 'Tình huống truyện' },
                  { key: 'narratorView', label: 'Ngôi kể & điểm nhìn' },
                  { key: 'spaceTime', label: 'Không gian & thời gian' },
                  { key: 'artisticDetail', label: 'Chi tiết nghệ thuật tiêu biểu' },
                  { key: 'themeMessage', label: 'Chủ đề & thông điệp' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={storyMap[f.key as keyof typeof storyMap]}
                      onChange={(e) =>
                        setStoryMap((prev) => ({ ...prev, [f.key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                    />
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F2942]">
                    Dòng thời gian sự kiện (Sắp xếp đúng trình tự cốt truyện)
                  </h3>
                  <button
                    type="button"
                    onClick={checkStoryTimeline}
                    className="px-3 py-1 rounded-lg bg-[#0D7A6F] text-white font-semibold"
                  >
                    Kiểm tra trình tự
                  </button>
                </div>
                <div className="space-y-2">
                  {storyEvents.map((ev, idx) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-[#FAF8F5]"
                    >
                      <span>
                        <strong>{idx + 1}.</strong> {ev.text}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveEvent(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded border border-slate-300 bg-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEvent(idx, 1)}
                          disabled={idx === storyEvents.length - 1}
                          className="p-1 rounded border border-slate-300 bg-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {timelineStatus && (
                  <p className="text-xs font-semibold text-[#0F2942]">
                    {timelineStatus}
                  </p>
                )}
              </div>
            </>
          )}

          {mode === 'nghi-luan' && (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-[#0F2942]">
                Sơ đồ lập luận văn bản nghị luận
              </h3>
              {[
                { key: 'thesis', label: 'Luận đề trung tâm' },
                { key: 'points', label: 'Hệ thống luận điểm & mối quan hệ', area: true },
                { key: 'reasoningEvidence', label: 'Lí lẽ và bằng chứng tiêu biểu', area: true },
                { key: 'operations', label: 'Thao tác lập luận sử dụng' },
                { key: 'authorView', label: 'Mục đích và quan điểm của người viết' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {f.label}
                  </label>
                  {f.area ? (
                    <textarea
                      rows={3}
                      value={argMap[f.key as keyof typeof argMap]}
                      onChange={(e) =>
                        setArgMap((prev) => ({ ...prev, [f.key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                    />
                  ) : (
                    <input
                      type="text"
                      value={argMap[f.key as keyof typeof argMap]}
                      onChange={(e) =>
                        setArgMap((prev) => ({ ...prev, [f.key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {(mode === 'thong-tin' || mode === 'ki-kich') && (
            <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-[#0F2942]">
                {mode === 'thong-tin'
                  ? 'Phân tích cấu trúc Văn bản thông tin'
                  : 'Khám phá đặc trưng Kí và Kịch'}
              </h3>
              {[
                {
                  key: 'headline',
                  label:
                    mode === 'thong-tin'
                      ? 'Nhan đề & đề mục chính'
                      : 'Tình huống / Sự kiện xác thực hoặc Xung đột kịch',
                },
                {
                  key: 'subheadings',
                  label:
                    mode === 'thong-tin'
                      ? 'Thông tin chính và thông tin chi tiết'
                      : 'Nhân vật / Cái tôi tác giả & Lời thoại',
                },
                {
                  key: 'dataPresentation',
                  label:
                    mode === 'thong-tin'
                      ? 'Cách trình bày dữ liệu'
                      : 'Thủ pháp trần thuật / Chỉ dẫn sân khấu',
                },
                {
                  key: 'nonVerbal',
                  label:
                    mode === 'thong-tin'
                      ? 'Phương tiện phi ngôn ngữ (biểu đồ, hình ảnh)'
                      : 'Chi tiết nghệ thuật đặc sắc',
                },
                {
                  key: 'purpose',
                  label: 'Mục đích và thông điệp của văn bản',
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={infoMap[f.key as keyof typeof infoMap]}
                    onChange={(e) =>
                      setInfoMap((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
