import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  CheckCircle2,
  Gamepad2,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';

type GameId =
  | 'crossword'
  | 'match-author'
  | 'rhetoric'
  | 'character'
  | 'plot-order'
  | 'argument'
  | 'poem-fill'
  | 'arena';

interface GameInfo {
  id: GameId;
  num: number;
  title: string;
  guide: string;
}

const GAMES: GameInfo[] = [
  { id: 'crossword', num: 1, title: 'Ô chữ văn học', guide: 'Đọc gợi ý và điền đúng thuật ngữ hoặc tên tác phẩm Ngữ văn.' },
  { id: 'match-author', num: 2, title: 'Ghép tác giả và tác phẩm', guide: 'Chọn cặp tác giả – tác phẩm tương ứng chính xác.' },
  { id: 'rhetoric', num: 3, title: 'Giải mã biện pháp tu từ', guide: 'Nhận diện đúng biện pháp tu từ trong câu văn, câu thơ.' },
  { id: 'character', num: 4, title: 'Ai hiểu nhân vật hơn?', guide: 'Chọn nhận định đúng về phẩm chất, tình huống nhân vật.' },
  { id: 'plot-order', num: 5, title: 'Sắp xếp cốt truyện', guide: 'Sắp xếp các sự kiện theo đúng trình tự diễn biến câu chuyện.' },
  { id: 'argument', num: 6, title: 'Tìm luận điểm đúng', guide: 'Phân biệt luận điểm chuẩn xác, logic với phát biểu lạc đề.' },
  { id: 'poem-fill', num: 7, title: 'Hoàn thiện câu thơ', guide: 'Điền từ còn thiếu để hoàn chỉnh dòng thơ thực hành.' },
  { id: 'arena', num: 8, title: 'Đấu trường Ngữ văn', guide: 'Thử thách tổng hợp tốc độ giữa Cá nhân hoặc 2 Đội thi.' },
];

interface QuizItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const DEFAULT_QUIZ_BY_GAME: Record<Exclude<GameId, 'crossword' | 'match-author' | 'plot-order'>, QuizItem[]> = {
  rhetoric: [
    {
      id: 'rh-1',
      question: 'Dòng thơ "Thấy dáng cầu cong như nét chữ nghiêng nghiêng" sử dụng biện pháp tu từ nào?',
      options: ['So sánh', 'Hoán dụ', 'Nói quá', 'Chơi chữ'],
      correctIndex: 0,
    },
    {
      id: 'rh-2',
      question: 'Câu "Ngọn lửa nhỏ trong lồng kính rung lên bần bật nhưng chưa lúc nào tắt" gợi ý nghĩa gì?',
      options: ['Sự ngẫu nhiên của thời tiết', 'Biểu tượng cho tinh thần trách nhiệm bền bỉ', 'Lối kể chuyện hài hước', 'Phép nói giảm nói tránh'],
      correctIndex: 1,
    },
  ],
  character: [
    {
      id: 'ch-1',
      question: 'Trong ngữ liệu "Người thắp đèn ở ga xép", hành động nào thể hiện rõ nhất phẩm chất của ông Tư?',
      options: ['Bỏ về nhà tránh gió mùa', 'Cầm đèn bão đứng suốt gần hai giờ giữa mưa lạnh để báo hiệu tàu', 'Chờ người khác đến sửa dây điện', 'Tắt đèn ga xép để tiết kiệm dầu'],
      correctIndex: 1,
    },
  ],
  argument: [
    {
      id: 'ar-1',
      question: 'Luận điểm nào bám sát vấn đề "Đọc chậm giữa thời đại tốc độ"?',
      options: ['Đọc chậm giúp kiểm chứng lí lẽ và kết nối tri thức sâu sắc', 'Không cần đọc sách khi đã có tin ngắn', 'Chỉ nên đọc sách vào cuối tuần', 'Tốc độ đọc càng nhanh thì càng hiểu sâu'],
      correctIndex: 0,
    },
  ],
  'poem-fill': [
    {
      id: 'pf-1',
      question: 'Điền từ phù hợp vào dòng thơ thực hành: "Xin giữ lại trong hành trang lặng thầm nhất / Một nhịp cầu ______ của quê nhà."',
      options: ['thương nhớ', 'ồn ào', 'vội vã', 'lạnh lẽo'],
      correctIndex: 0,
    },
  ],
  arena: [
    {
      id: 'an-1',
      question: 'Theo cấu trúc luyện thi tốt nghiệp THPT từ năm 2025, tổng thời gian làm bài môn Ngữ văn là bao nhiêu phút?',
      options: ['90 phút', '120 phút', '150 phút', '60 phút'],
      correctIndex: 1,
    },
    {
      id: 'an-2',
      question: 'Ba mức độ nhận thức mặc định trong ma trận đề Ngữ văn GDPT 2018 là gì?',
      options: ['Nhận biết, Thông hiểu, Vận dụng', 'Ghi nhớ, Thuộc lòng, Phân tích', 'Nghe, Nói, Đọc', 'Khởi động, Luyện tập, Vận dụng'],
      correctIndex: 0,
    },
  ],
};

function playChime(good: boolean, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = good ? 587 : 220;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // Ignore audio context restriction
  }
}

export const GamesPage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameId>('crossword');
  const [teamMode, setTeamMode] = useState<'solo' | 'teams'>('solo');
  const [activeTeam, setActiveTeam] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ solo: 0, team1: 0, team2: 0 });
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [seconds, setSeconds] = useState(0);

  // Game 1: Crossword state
  const [crosswordAnswers, setCrosswordAnswers] = useState<Record<number, string>>({});
  const crosswordRows = [
    { clue: 'Thể loại văn học có vần, nhịp và biểu đạt cảm xúc (3 chữ cái)', answer: 'THƠ' },
    { clue: 'Phương tiện nghệ thuật ví von A với B dựa trên nét tương đồng (7 chữ cái)', answer: 'SOSÁNH' },
    { clue: 'Yếu tố then chốt nối các sự kiện tạo nên câu chuyện (9 chữ cái)', answer: 'CỐTTRUYỆN' },
  ];

  // Game 2: Match author & work
  const matchPairs = [
    { id: 'p1', author: 'Ngữ liệu thực hành thơ 12', work: 'Nhịp cầu qua mùa gió' },
    { id: 'p2', author: 'Ngữ liệu thực hành truyện 10', work: 'Người thắp đèn ở ga xép' },
    { id: 'p3', author: 'Ngữ liệu nghị luận 11', work: 'Đọc chậm giữa thời đại tốc độ' },
  ];
  const [pickedAuthor, setPickedAuthor] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  // Game 5: Plot order
  const [plotItems, setPlotItems] = useState([
    { id: '2', text: 'Dây điện đường ray bị đứt trong đêm mưa bão.' },
    { id: '1', text: 'Ông Tư gác ghi trực ca đêm ở ga xép ven biển.' },
    { id: '3', text: 'Ông Tư cầm đèn bão báo hiệu giúp đoàn tàu giảm tốc an toàn.' },
  ]);

  // Quiz games custom question support
  const [customQuiz, setCustomQuiz] = useState(DEFAULT_QUIZ_BY_GAME);
  const [quizIndex, setQuizIndex] = useState(0);
  const [newQText, setNewQText] = useState('');
  const [newCorrectOpt, setNewCorrectOpt] = useState('');
  const [newWrongOpt, setNewWrongOpt] = useState('');

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [activeGame]);

  const awardPoints = (pts: number, ok: boolean, msg: string) => {
    playChime(ok, soundOn);
    setFeedback({ ok, msg });
    if (ok) {
      if (teamMode === 'solo') setScores((s) => ({ ...s, solo: s.solo + pts }));
      else if (activeTeam === 1) setScores((s) => ({ ...s, team1: s.team1 + pts }));
      else setScores((s) => ({ ...s, team2: s.team2 + pts }));
    }
    if (teamMode === 'teams') setActiveTeam((t) => (t === 1 ? 2 : 1));
  };

  const resetGame = () => {
    setFeedback(null);
    setQuizIndex(0);
    setSeconds(0);
    setMatchedIds([]);
    setPickedAuthor(null);
    setCrosswordAnswers({});
  };

  const currentInfo = GAMES.find((g) => g.id === activeGame)!;

  return (
    <div
      className={`${
        fullscreen ? 'fixed inset-0 z-50 bg-[#FAF8F5] p-6 overflow-y-auto' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
      } space-y-5`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E0D8] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F2942] flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-[#0D7A6F]" />
            8 Trò chơi Ngữ văn tương tác
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Hỗ trợ chế độ cá nhân hoặc thi đấu đội nhóm, tùy chỉnh câu hỏi và bảng điểm trực tiếp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setTeamMode('solo')}
              className={`px-3 py-1 rounded-md font-semibold ${
                teamMode === 'solo' ? 'bg-[#0F2942] text-white' : 'text-slate-600'
              }`}
            >
              Cá nhân
            </button>
            <button
              type="button"
              onClick={() => setTeamMode('teams')}
              className={`px-3 py-1 rounded-md font-semibold ${
                teamMode === 'teams' ? 'bg-[#0D7A6F] text-white' : 'text-slate-600'
              }`}
            >
              2 Đội thi
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            className="p-2 rounded-lg border border-slate-300 bg-white"
            title="Bật/tắt âm thanh"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={resetGame}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Chơi lại
          </button>

          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="p-2 rounded-lg border border-slate-300 bg-white"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 8 Games Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              setActiveGame(g.id);
              resetGame();
            }}
            className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
              activeGame === g.id
                ? 'bg-[#0F2942] text-white border-[#0F2942]'
                : 'bg-white text-[#0F2942] border-[#E5E0D8] hover:border-slate-400'
            }`}
          >
            <div className="font-mono text-[11px] opacity-75">0{g.num}.</div>
            <div className="font-semibold mt-0.5 leading-snug">{g.title}</div>
          </button>
        ))}
      </div>

      {/* Score & Timer Strip */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <strong className="text-[#0F2942]">{currentInfo.title}:</strong>{' '}
          <span className="text-slate-600">{currentInfo.guide}</span>
        </div>
        <div className="flex items-center gap-4 font-mono tabular-nums font-bold">
          <span>
            Thời gian: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </span>
          {teamMode === 'solo' ? (
            <span className="text-[#0D7A6F] inline-flex items-center gap-1">
              <Award className="w-4 h-4" /> Điểm: {scores.solo}
            </span>
          ) : (
            <div className="flex items-center gap-3">
              <span className={activeTeam === 1 ? 'text-[#0F2942] underline' : 'text-slate-500'}>
                Đội 1: {scores.team1}đ
              </span>
              <span className={activeTeam === 2 ? 'text-[#0D7A6F] underline' : 'text-slate-500'}>
                Đội 2: {scores.team2}đ
              </span>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          {feedback.msg}
        </div>
      )}

      {/* GAME STAGES */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-6">
        {activeGame === 'crossword' && (
          <div className="space-y-4">
            {crosswordRows.map((row, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-[#FAF8F5] border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-[#0F2942]">
                  Hàng ngang {idx + 1}: {row.clue}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nhập đáp án viết liền không dấu cách..."
                    value={crosswordAnswers[idx] || ''}
                    onChange={(e) =>
                      setCrosswordAnswers((p) => ({ ...p, [idx]: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (crosswordAnswers[idx] || '').replace(/\s+/g, '').toUpperCase();
                      if (val === row.answer) {
                        awardPoints(10, true, `Chính xác hàng ngang ${idx + 1}! (+10 điểm)`);
                      } else {
                        awardPoints(0, false, 'Chưa chính xác, hãy kiểm tra lại gợi ý số chữ cái.');
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold"
                  >
                    Kiểm tra
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeGame === 'match-author' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#0F2942]">Cột A: Tác giả / Nguồn</div>
              {matchPairs.map((p) => {
                const done = matchedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={done}
                    onClick={() => setPickedAuthor(p.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-medium ${
                      done
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : pickedAuthor === p.id
                        ? 'bg-[#0F2942] text-white border-[#0F2942]'
                        : 'bg-white border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {p.author}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#0F2942]">Cột B: Văn bản</div>
              {[...matchPairs].reverse().map((p) => {
                const done = matchedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={done || !pickedAuthor}
                    onClick={() => {
                      if (pickedAuthor === p.id) {
                        setMatchedIds((m) => [...m, p.id]);
                        setPickedAuthor(null);
                        awardPoints(10, true, `Ghép đúng cặp "${p.work}"! (+10 điểm)`);
                      } else {
                        setPickedAuthor(null);
                        awardPoints(0, false, 'Cặp tác giả – tác phẩm chưa khớp.');
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-medium ${
                      done
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {p.work}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeGame === 'plot-order' && (
          <div className="space-y-3">
            {plotItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-[#FAF8F5] text-xs"
              >
                <span>
                  <strong>Sự kiện {idx + 1}:</strong> {item.text}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const next = [...plotItems];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      setPlotItems(next);
                    }}
                    className="p-1 border border-slate-300 rounded bg-white disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === plotItems.length - 1}
                    onClick={() => {
                      const next = [...plotItems];
                      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                      setPlotItems(next);
                    }}
                    className="p-1 border border-slate-300 rounded bg-white disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const ok = plotItems.map((x) => x.id).join(',') === '1,2,3';
                awardPoints(
                  ok ? 15 : 0,
                  ok,
                  ok ? 'Tuyệt vời! Bạn đã sắp xếp đúng mạch cốt truyện. (+15 điểm)' : 'Thứ tự chưa chính xác, hãy thử lại.'
                );
              }}
              className="px-4 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold"
            >
              Chốt trình tự cốt truyện
            </button>
          </div>
        )}

        {(activeGame === 'rhetoric' ||
          activeGame === 'character' ||
          activeGame === 'argument' ||
          activeGame === 'poem-fill' ||
          activeGame === 'arena') && (() => {
          const list = customQuiz[activeGame];
          const item = list[quizIndex % list.length];
          return (
            <div className="space-y-5">
              {item && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Câu {(quizIndex % list.length) + 1} / {list.length}
                  </div>
                  <div className="text-base font-bold text-[#0F2942]">
                    {item.question}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {item.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => {
                          const ok = oIdx === item.correctIndex;
                          awardPoints(
                            ok ? 10 : 0,
                            ok,
                            ok ? 'Chính xác! (+10 điểm)' : `Chưa đúng. Đáp án đúng là: "${item.options[item.correctIndex]}"`
                          );
                          setQuizIndex((i) => i + 1);
                        }}
                        className="text-left p-3.5 rounded-xl border border-slate-300 hover:border-[#0F2942] hover:bg-slate-50 text-xs font-medium transition-colors"
                      >
                        <strong className="mr-2">{String.fromCharCode(65 + oIdx)}.</strong>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Custom Question Adder */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="font-bold text-[#0F2942]">
                  Giáo viên thêm câu hỏi mới cho trò chơi này
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Nội dung câu hỏi..."
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    className="sm:col-span-2 rounded border border-slate-300 px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="Đáp án đúng"
                    value={newCorrectOpt}
                    onChange={(e) => setNewCorrectOpt(e.target.value)}
                    className="rounded border border-slate-300 px-2.5 py-1.5"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Đáp án nhiễu"
                      value={newWrongOpt}
                      onChange={(e) => setNewWrongOpt(e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-2.5 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newQText.trim() || !newCorrectOpt.trim()) return;
                        setCustomQuiz((prev) => ({
                          ...prev,
                          [activeGame]: [
                            ...prev[activeGame],
                            {
                              id: `custom-${Date.now()}`,
                              question: newQText.trim(),
                              options: [
                                newCorrectOpt.trim(),
                                newWrongOpt.trim() || 'Phương án khác',
                              ],
                              correctIndex: 0,
                            },
                          ],
                        }));
                        setNewQText('');
                        setNewCorrectOpt('');
                        setNewWrongOpt('');
                      }}
                      className="px-3 rounded bg-[#0F2942] text-white font-semibold inline-flex items-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
