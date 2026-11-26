import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { Scene2DType } from '../types';

interface SkillLabs2DProps {
  scene2DType: Scene2DType;
  onSpeak?: (text: string) => void;
}

const POV_SAMPLES = {
  first: {
    title: 'Ngôi thứ nhất (Xưng "tôi" – Điểm nhìn bên trong hạn tri)',
    badge: 'Chân thực · Giàu cảm xúc trực tiếp',
    scope: 'Người đọc chỉ thấy những gì nhân vật "tôi" trực tiếp chứng kiến và cảm nhận; không thể đọc chắc chắn suy nghĩ của người khác.',
    text: 'Tôi đứng lặng bên cửa lớp, nghe tiếng mưa rơi nặng hạt trên mái ngói. Minh ngồi ở bàn cuối, cúi gằm mặt giấu tờ giấy kiểm tra vào cặp. Tôi thoáng thấy vai cậu ấy khẽ run, nhưng không rõ cậu đang buồn vì điểm số hay giận vì lời trách mắng ban nãy của tôi.',
    highlights: ['Tôi đứng lặng', 'Tôi thoáng thấy', 'không rõ cậu đang buồn...'],
  },
  thirdOmniscient: {
    title: 'Ngôi thứ ba toàn tri (Người kể ẩn mình – Thấu suốt mọi nội tâm)',
    badge: 'Bao quát · Đa chiều không gian – tâm lí',
    scope: 'Người kể biết cùng lúc suy nghĩ thầm kín của cả Lan lẫn Minh, thậm chí biết cả nguyên nhân từ quá khứ.',
    text: 'Ngoài hành lang, Lan đứng lặng nhìn mưa rơi, lòng áy náy vì lời nói nóng nảy lúc ra chơi. Ở bàn cuối, Minh vội giấu bài kiểm tra vào cặp; thực ra cậu không hề giận Lan mà chỉ đang lo cho mẹ ốm nằm viện suốt đêm qua khiến cậu làm bài chưa trọn vẹn.',
    highlights: ['Lan ... lòng áy náy', 'thực ra cậu không hề giận', 'mẹ ốm nằm viện suốt đêm qua'],
  },
  thirdLimited: {
    title: 'Ngôi thứ ba hạn tri (Ẩn mình – Gắn sát điểm nhìn nhân vật)',
    badge: 'Khách quan mà đồng cảm sâu sắc',
    scope: 'Gọi tên nhân vật bằng ngôi thứ ba ("Minh") nhưng mọi âm thanh, ánh sáng và suy nghĩ chỉ mở ra qua cảm nhận của riêng Minh.',
    text: 'Tiếng mưa ngoài hành lang bỗng trở nên lạnh buốt trong tai Minh. Cậu vội gấp tờ giấy kiểm tra nhét sâu vào đáy cặp, cố không ngoái nhìn về phía cửa lớp nơi dáng Lan vẫn đứng. Cậu ước giá mình có thể nói thật với bạn về đêm thức trắng ở bệnh viện.',
    highlights: ['lạnh buốt trong tai Minh', 'cố không ngoái nhìn', 'Cậu ước giá mình...'],
  },
};

const CHRONOLOGY_EVENTS = [
  { id: 'e1', storyOrder: 1, plotOrder: 2, label: 'Đứa bé bị bỏ rơi bên cái lò gạch cũ, lớn lên thành anh canh điền lương thiện' },
  { id: 'e2', storyOrder: 2, plotOrder: 3, label: 'Bị Bá Kiến ghen tuông đẩy vào nhà tù thực dân, biến dạng cả nhân hình lẫn nhân tính' },
  { id: 'e3', storyOrder: 3, plotOrder: 1, label: 'Trở về làng Vũ Đại, say rượu vừa đi vừa chửi cả làng không ai đáp lại (Mở đầu truyện!)' },
  { id: 'e4', storyOrder: 4, plotOrder: 4, label: 'Gặp Thị Nở, xúc động trước bát cháo hành và khao khát làm người lương thiện' },
  { id: 'e5', storyOrder: 5, plotOrder: 5, label: 'Bị bà cô Thị Nở cự tuyệt, đến nhà Bá Kiến đòi lương thiện rồi kết thúc bi kịch' },
];

const RHETORIC_ITEMS = [
  {
    id: 'so-sanh',
    name: 'So sánh',
    group: 'Tu từ ngữ nghĩa',
    mechanism: 'Đối chiếu sự vật A với sự vật B có nét tương đồng (thường có từ: như, tựa, là, giống...).',
    example: '"Những ngôi sao thức ngoài kia / Chẳng bằng mẹ đã thức vì chúng con" (Trần Quốc Minh)',
    effect: 'Cụ thể hóa hình ảnh, tăng sức gợi hình, gợi cảm và nhấn mạnh mức độ cao cả của tình mẫu tử.',
  },
  {
    id: 'an-du',
    name: 'Ẩn dụ',
    group: 'Tu từ ngữ nghĩa',
    mechanism: 'Gọi tên sự vật A bằng sự vật B dựa trên quan hệ TƯƠNG ĐỒNG (giống nhau ngầm, lược bỏ vế so sánh).',
    example: '"Thuyền về có nhớ bến chăng / Bến thì một dạ khăng khăng đợi thuyền" (Ca dao)',
    effect: 'Hàm súc, giàu chất thơ, gợi tình yêu thủy chung kín đáo mà sâu sắc.',
  },
  {
    id: 'hoan-du',
    name: 'Hoán dụ',
    group: 'Tu từ ngữ nghĩa',
    mechanism: 'Gọi tên sự vật A bằng sự vật B dựa trên quan hệ TƯƠNG CẬN (gần gũi thực tế: bộ phận – toàn thể, dấu hiệu – sự vật).',
    example: '"Áo chàm đưa buổi phân li / Cầm tay nhau biết nói gì hôm nay" (Tố Hữu)',
    effect: 'Diễn đạt ngắn gọn, làm nổi bật nét tiêu biểu bình dị, thân thương của đồng bào Việt Bắc.',
  },
  {
    id: 'nhan-hoa',
    name: 'Nhân hóa',
    group: 'Tu từ ngữ nghĩa',
    mechanism: 'Dùng từ ngữ vốn chỉ hoạt động, tính chất, cảm xúc của con người để miêu tả vật, thiên nhiên.',
    example: '"Sông Mã gầm lên khúc độc hành" (Quang Dũng – Tây Tiến)',
    effect: 'Thổi hồn cho dòng sông trở thành chứng nhân lịch sử bi tráng tiễn đưa người lính.',
  },
  {
    id: 'diep-ngu',
    name: 'Điệp ngữ / Điệp cấu trúc',
    group: 'Tu từ cú pháp',
    mechanism: 'Lặp lại có chủ ý một từ, cụm từ hoặc cấu trúc câu để tạo nhịp điệu và khắc sâu ý nghĩa.',
    example: '"Chúng lập ra nhà tù nhiều hơn trường học. Chúng thẳng tay chém giết..." (Hồ Chí Minh)',
    effect: 'Tạo giọng điệu đanh thép, dồn dập, tăng sức tố cáo mãnh liệt tội ác thực dân.',
  },
  {
    id: 'liet-ke',
    name: 'Liệt kê',
    group: 'Tu từ cú pháp',
    mechanism: 'Sắp xếp nối tiếp hàng loạt từ hoặc cụm từ cùng loại để diễn tả đầy đủ hơn các khía cạnh.',
    example: '"Ngàn thước lên cao, ngàn thước xuống... Sài Khao... Mường Lát... Pha Luông"',
    effect: 'Mở rộng quy mô không gian, tạo cảm giác phong phú, dồn dập và cụ thể.',
  },
  {
    id: 'tuong-phan',
    name: 'Đối lập / Tương phản',
    group: 'Tu từ cú pháp',
    mechanism: 'Đặt hai hình ảnh, trạng thái hoặc tính chất trái ngược nhau cạnh nhau để cùng làm bật lẫn nhau.',
    example: 'Buồng giam tối tăm ẩm ướt ↔ Ánh đuốc đỏ rực và tấm lụa trắng tinh (Chữ người tử tù)',
    effect: 'Tôn vinh mạnh mẽ sự chiến thắng của cái Đẹp và thiên lương giữa bóng tối.',
  },
  {
    id: 'noi-qua',
    name: 'Nói quá (Phóng đại)',
    group: 'Tu từ sắc thái',
    mechanism: 'Phóng đại quy mô, tính chất của sự vật/hiện tượng lên mức phi thường để gây ấn tượng mạnh.',
    example: '"Đăm Săn múa khiên một lần xốc tới vượt một đồi tranh, một lần xốc tới nữa vượt một đồi lồ ô"',
    effect: 'Tô đậm tầm vóc anh hùng sử thi kì vĩ và sức mạnh phi thường của người anh hùng cộng đồng.',
  },
  {
    id: 'noi-giam',
    name: 'Nói giảm nói tránh',
    group: 'Tu từ sắc thái',
    mechanism: 'Diễn đạt uyển chuyển, tế nhị để làm dịu cảm giác đau thương, nặng nề hoặc giữ sự trang trọng.',
    example: '"Áo bào thay chiếu anh về đất" (Quang Dũng)',
    effect: 'Giảm nhẹ nỗi đau mất mát, nâng sự hi sinh lên vẻ đẹp thanh thản, cao quý.',
  },
  {
    id: 'cau-hoi-tu-tu',
    name: 'Câu hỏi tu từ',
    group: 'Tu từ sắc thái',
    mechanism: 'Đặt câu hỏi không nhằm tìm lời giải đáp mà để khẳng định, phủ định hoặc xoáy sâu cảm xúc.',
    example: '"Tao muốn làm người lương thiện... Ai cho tao lương thiện?" (Nam Cao – Chí Phèo)',
    effect: 'Khắc sâu bi kịch đau đớn tột cùng và buộc xã hội phải day dứt đối diện.',
  },
];

const PROSODY_SAMPLES = [
  {
    id: 'tay-tien',
    title: 'Tây Tiến – Quang Dũng (Thơ 7 chữ · Đối lập thanh Trắc / Bằng)',
    genre: 'Thơ 7 chữ',
    lines: [
      { words: ['Dốc', 'lên', 'khúc', 'khuỷu', 'dốc', 'thăm', 'thẳm'], validBreaks: [[2, 4], [4]] },
      { words: ['Heo', 'hút', 'cồn', 'mây', 'súng', 'ngửi', 'trời'], validBreaks: [[4], [2, 4]] },
      { words: ['Nhà', 'ai', 'Pha', 'Luông', 'mưa', 'xa', 'khơi'], validBreaks: [[4], [2, 4]] },
    ],
    rhymeNote: 'Vần chân "trời – khơi" kết hợp câu 1 giàu thanh Trắc (gập ghềnh) đối lập câu 3 toàn thanh Bằng (mênh mang êm dịu).',
  },
  {
    id: 'trao-duyen',
    title: 'Trao duyên – Nguyễn Du (Thơ Lục bát · Nhịp chuyển cảm xúc)',
    genre: 'Thơ Lục bát',
    lines: [
      { words: ['Cậy', 'em', 'em', 'có', 'chịu', 'lời'], validBreaks: [[2], [2, 4]] },
      { words: ['Ngồi', 'lên', 'cho', 'chị', 'lạy', 'rồi', 'sẽ', 'thưa'], validBreaks: [[2, 5], [4]] },
      { words: ['Ôi', 'Kim', 'Lang', 'Hỡi', 'Kim', 'Lang'], validBreaks: [[3]] },
    ],
    rhymeNote: 'Vần lưng lục bát chuẩn ("lời" tiếng 6 câu lục vần với "rồi" tiếng 6 câu bát). Câu cuối phá nhịp 3/3 diễn tả tiếng nấc nghẹn.',
  },
];

function detectTone(word: string): 'B' | 'T' {
  const lower = word.toLowerCase();
  // Trắc: sắc, hỏi, ngã, nặng
  const tracPattern = /[áắấéếíóốớúứýảẳẩẻểỉỏổởủửỷãẵẫẽễĩõỗỡũữỹạặậẹệịọộợụựỵ]/;
  if (tracPattern.test(lower)) return 'T';
  return 'B';
}

const CHARACTER_PROFILES = [
  {
    id: 'huan-cao',
    name: 'Huấn Cao (Chữ người tử tù)',
    aspects: [
      { key: 'Hoàn cảnh', detail: 'Tử tù sắp ra pháp trường nhưng vẫn giữ khí phách hiên ngang bậc anh hùng.' },
      { key: 'Ngoại hình', detail: 'Cổ đeo gông gỗ, chân vướng xiềng sắt nhưng phong thái uy nghi ung dung.' },
      { key: 'Hành động', detail: 'Rũ gông, dậm tô nét chữ vuông tươi tắn trên tấm lụa trắng giữa đêm tối.' },
      { key: 'Lời nói', detail: 'Khuyên viên quản ngục bỏ nghề coi tù, tìm về quê giữ lấy thiên lương lành vững.' },
      { key: 'Nội tâm', detail: 'Xúc động nhận ra "một tấm lòng trong thiên hạ" nên đồng ý cho chữ.' },
      { key: 'Quan hệ nhân vật', detail: 'Tương phản và đảo ngược vị thế hoàn toàn với viên quản ngục.' },
      { key: 'Nghệ thuật', detail: 'Bút pháp lí tưởng hóa, tương phản ánh sáng – bóng tối đậm chất điện ảnh.' },
    ],
  },
  {
    id: 'chi-pheo',
    name: 'Chí Phèo (Chí Phèo – Nam Cao)',
    aspects: [
      { key: 'Hoàn cảnh', detail: 'Nông dân mồ côi lương thiện bị Bá Kiến và nhà tù thực dân tha hóa.' },
      { key: 'Ngoại hình', detail: 'Đầu trọc lốc, răng cạo trắng hớn, mặt rạch đầy vết sẹo ngang dọc.' },
      { key: 'Hành động', detail: 'Say rượu rạch mặt ăn vạ → tỉnh rượu ôm mặt khóc → xách dao đòi lương thiện.' },
      { key: 'Lời nói', detail: 'Câu hỏi ám ảnh "Tao muốn làm người lương thiện... Ai cho tao lương thiện?".' },
      { key: 'Nội tâm', detail: 'Tỉnh dậy sau bát cháo hành, sợ cô độc, thèm làm hòa với mọi người.' },
      { key: 'Quan hệ nhân vật', detail: 'Đối đầu với Bá Kiến (thế lực áp bức), thức tỉnh nhờ Thị Nở, bị cự tuyệt bởi định kiến.' },
      { key: 'Nghệ thuật', detail: 'Kết cấu đầu cuối tương ứng (lò gạch cũ), đảo ngược thời gian, dịch chuyển điểm nhìn.' },
    ],
  },
];

const IMAGERY_SAMPLES = [
  {
    id: 'cui-kho',
    title: '"Củi một cành khô lạc mấy dòng" (Huy Cận – Tràng giang)',
    layers: [
      { title: 'Lớp 1 · Bề mặt giác quan', body: 'Một cành củi khô gầy guộc, trôi nổi vô định giữa nhiều nhánh nước mênh mang của dòng sông lớn.' },
      { title: 'Lớp 2 · Tín hiệu nghệ thuật', body: 'Đảo ngữ đưa danh từ "Củi" lên đầu câu; đối lập số từ "một" (nhỏ bé, đơn độc) ↔ "mấy dòng" (rộng lớn, chia lìa).' },
      { title: 'Lớp 3 · Biểu tượng & Cảm xúc', body: 'Biểu tượng thân phận con người nhỏ bé, bơ vơ và nỗi sầu chia lìa của cái tôi Thơ mới trước cuộc đời.' },
      { title: 'Lớp 4 · Liên tưởng mở', body: 'Đưa một hình ảnh rất đời thường vào thơ cổ điển, gợi lòng trắc ẩn với những kiếp người nhỏ bé trong xã hội.' },
    ],
  },
  {
    id: 'dan-lorca',
    title: '"Giọt nước mắt vầng trăng / long lanh trong đáy giếng" (Thanh Thảo)',
    layers: [
      { title: 'Lớp 1 · Bề mặt giác quan', body: 'Ánh trăng tròn phản chiếu lấp lánh dưới đáy giếng sâu trong vắt như một giọt lệ sáng ngời.' },
      { title: 'Lớp 2 · Tín hiệu nghệ thuật', body: 'Liên tưởng siêu thực kết hợp ẩn dụ tạo hình ("giọt nước mắt" ↔ "vầng trăng"), từ láy "long lanh" gợi ánh sáng tinh khiết.' },
      { title: 'Lớp 3 · Biểu tượng & Cảm xúc', body: 'Nỗi đau bi phẫn của người nghệ sĩ tự do đã hóa thành vẻ đẹp trong sáng bất tử, không gì vấy bẩn được.' },
      { title: 'Lớp 4 · Liên tưởng mở', body: 'Khẳng định quy luật trường tồn của nghệ thuật chân chính vượt lên trên cái chết và bạo quyền.' },
    ],
  },
];

function countVietnameseWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export const SkillLabs2D: React.FC<SkillLabs2DProps> = ({ scene2DType, onSpeak }) => {
  // 31: POV Switcher state
  const [povMode, setPovMode] = useState<'first' | 'thirdOmniscient' | 'thirdLimited'>('first');

  // 32: Chronology Reorderer state
  const [chronoOrder, setChronoOrder] = useState<string[]>(['e3', 'e1', 'e4', 'e2', 'e5']);
  const [showPlotComparison, setShowPlotComparison] = useState(false);

  // 33: Rhetoric Explorer state
  const [selectedRhetoricId, setSelectedRhetoricId] = useState<string>('an-du');

  // 34: Prosody Workbench state
  const [prosodyIdx, setProsodyIdx] = useState(0);
  const [breaksMap, setBreaksMap] = useState<Record<string, number[]>>({
    'tay-tien-0': [2, 4],
    'tay-tien-1': [4],
    'tay-tien-2': [4],
    'trao-duyen-0': [2],
    'trao-duyen-1': [2, 5],
    'trao-duyen-2': [3],
  });
  const [showTones, setShowTones] = useState(true);

  // 36: Argument Builder state
  const [argSlots, setArgSlots] = useState<Record<string, string>>({});
  const [checkedArg, setCheckedArg] = useState(false);

  // 37: Character Map state
  const [charIdx, setCharIdx] = useState(0);
  const [activeAspectIdx, setActiveAspectIdx] = useState(0);

  // 38: Poetic Imagery state
  const [imageryIdx, setImageryIdx] = useState(0);
  const [revealedLayer, setRevealedLayer] = useState(1);

  // 39: 200-word Paragraph Studio state
  const [paraType, setParaType] = useState<'nlxh' | 'nlvh'>('nlxh');
  const [paraDraft, setParaDraft] = useState(
    'Trong nhịp sống hiện đại đầy biến động, lòng kiên trì chính là chiếc chìa khóa bền bỉ giúp người trẻ biến ước mơ thành hiện thực. Kiên trì là sự bền bỉ theo đuổi mục tiêu tốt đẹp bất chấp khó khăn, thất bại tạm thời...'
  );
  const [paraChecklist, setParaChecklist] = useState<Record<number, boolean>>({ 0: true, 1: true });

  // 40: 600-word Essay Studio state
  const [essayType, setEssayType] = useState<'nlxh' | 'nlvh'>('nlxh');
  const [essaySections, setEssaySections] = useState({
    intro:
      'Trong kỉ nguyên số bùng nổ thông tin, người trẻ đứng trước cơ hội rộng mở nhưng cũng đối mặt với nguy cơ đánh mất sự cân bằng giữa thế giới ảo và cuộc sống thực.',
    body1:
      'Trước hết, không thể phủ nhận thế giới số mang lại nguồn tri thức khổng lồ, khả năng kết nối xuyên biên giới và công cụ học tập sáng tạo vượt bậc cho thế hệ trẻ...',
    body2:
      'Tuy nhiên, nếu đắm chìm quá mức vào màn hình mà sao nhãng gia đình, sức khỏe và trải nghiệm thực tế, con người dễ rơi vào cảm giác cô đơn và lệ thuộc cảm xúc vào những lượt thích ảo...',
    counter:
      'Có ý kiến cho rằng công nghệ là nguyên nhân trực tiếp gây xa cách, song thực chất bản thân công nghệ trung tính; điều quyết định nằm ở bản lĩnh làm chủ thời gian của mỗi cá nhân...',
    conclusion:
      'Hãy biến thế giới số thành cánh cửa mở rộng tri thức chứ không phải bức tường ngăn cách trái tim với cuộc đời thực tươi đẹp quanh ta.',
  });

  const chronoCorrect = useMemo(() => {
    return chronoOrder.every((id, idx) => {
      const ev = CHRONOLOGY_EVENTS.find((e) => e.id === id);
      return ev?.storyOrder === idx + 1;
    });
  }, [chronoOrder]);

  // 31. NGÔI KỂ & ĐIỂM NHÌN
  if (scene2DType === 'skill-pov') {
    const sample = POV_SAMPLES[povMode];
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F2942]">Xưởng chuyển đổi Ngôi kể & Điểm nhìn</h3>
            <p className="text-[15px] text-slate-600">
              Chọn một góc nhìn bên dưới để quan sát cùng một tình huống truyện thay đổi như thế nào:
            </p>
          </div>
          {onSpeak && (
            <button
              type="button"
              onClick={() => onSpeak(sample.text)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-[15px] font-semibold text-white hover:bg-blue-700"
            >
              <Volume2 className="h-4 w-4" /> Đọc đoạn mẫu
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {(
            [
              ['first', '1. Ngôi thứ nhất'],
              ['thirdOmniscient', '2. Ngôi thứ ba toàn tri'],
              ['thirdLimited', '3. Ngôi thứ ba hạn tri'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPovMode(key)}
              className={`rounded-xl border px-4 py-3 text-left text-[15px] font-bold transition-all ${
                povMode === key
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-bold text-[#0F2942]">{sample.title}</span>
            <span className="rounded-lg bg-blue-50 px-3 py-1 text-[14px] font-semibold text-blue-700">
              {sample.badge}
            </span>
          </div>
          <p className="rounded-xl bg-slate-50 p-4 text-[16px] leading-relaxed text-slate-900 border-l-4 border-blue-600">
            “{sample.text}”
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200">
              <div className="mb-1 flex items-center gap-1.5 text-[14px] font-bold text-emerald-900">
                <Eye className="h-4 w-4" /> Phạm vi quan sát & tri giác
              </div>
              <p className="text-[15px] text-emerald-950">{sample.scope}</p>
            </div>
            <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-200">
              <div className="mb-1 text-[14px] font-bold text-amber-900">Tín hiệu nhận diện trong đoạn:</div>
              <div className="flex flex-wrap gap-1.5">
                {sample.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-md bg-white px-2.5 py-1 text-[14px] font-semibold text-amber-900 border border-amber-300"
                  >
                    “{h}”
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 32. TRÌNH TỰ KỂ CHUYỆN
  if (scene2DType === 'skill-chronology') {
    const moveItem = (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= chronoOrder.length) return;
      const next = [...chronoOrder];
      [next[idx], next[target]] = [next[target], next[idx]];
      setChronoOrder(next);
    };

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-teal-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F2942]">
              So sánh Trình tự Câu chuyện (Thời gian) ↔ Mạch truyện (Chí Phèo)
            </h3>
            <p className="text-[15px] text-slate-600">
              Dùng nút lên/xuống để sắp xếp 5 sự kiện theo đúng trình tự thời gian tự nhiên (1 → 5):
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPlotComparison((v) => !v)}
              className="rounded-xl bg-teal-700 px-3.5 py-2 text-[15px] font-semibold text-white hover:bg-teal-800"
            >
              {showPlotComparison ? 'Ẩn thứ tự Nam Cao kể' : 'Đối chiếu mạch kể Nam Cao'}
            </button>
            <button
              type="button"
              onClick={() => setChronoOrder(['e3', 'e1', 'e4', 'e2', 'e5'])}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" /> Xáo lại
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {chronoOrder.map((id, idx) => {
            const ev = CHRONOLOGY_EVENTS.find((e) => e.id === id)!;
            const isRightPos = ev.storyOrder === idx + 1;
            return (
              <div
                key={id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                  isRightPos
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F2942] text-[15px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900">{ev.label}</p>
                    {showPlotComparison && (
                      <p className="mt-1 text-[14px] font-semibold text-rose-700">
                        Vị trí xuất hiện trong truyện ngắn Nam Cao: Sự kiện số {ev.plotOrder}
                        {ev.plotOrder === 1 ? ' (Đảo ngược lên ngay trang đầu để gây ấn tượng mạnh!)' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    aria-label="Chuyển lên"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === chronoOrder.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    aria-label="Chuyển xuống"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`rounded-xl p-3.5 text-[15px] font-semibold ${
            chronoCorrect
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          {chronoCorrect
            ? 'Xuất sắc! Bạn đã khôi phục đúng trình tự thời gian tự nhiên (Câu chuyện). Hãy bấm "Đối chiếu mạch kể Nam Cao" để thấy nghệ thuật đảo ngược thời gian!'
            : 'Mẹo: Bắt đầu từ lúc Chí Phèo bị bỏ rơi ở lò gạch cũ (1) và kết thúc ở bi kịch tại nhà Bá Kiến (5).'}
        </div>
      </div>
    );
  }

  // 33. 10+ BIỆN PHÁP TU TỪ
  if (scene2DType === 'skill-rhetoric') {
    const active = RHETORIC_ITEMS.find((r) => r.id === selectedRhetoricId) ?? RHETORIC_ITEMS[0];
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-violet-50/40 p-5">
        <div>
          <h3 className="text-lg font-bold text-[#0F2942]">Bản đồ tương tác 10 Biện pháp tu từ trọng tâm</h3>
          <p className="text-[15px] text-slate-600">
            Nhấp chọn từng biện pháp để xem cơ chế tạo nghĩa, ví dụ văn học và công thức nêu tác dụng chuẩn thi THPT:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {RHETORIC_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedRhetoricId(item.id)}
              className={`rounded-xl border px-3 py-2.5 text-center text-[15px] font-bold transition-all ${
                item.id === active.id
                  ? 'border-violet-600 bg-violet-600 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xl font-bold text-violet-950">{active.name}</h4>
            <span className="rounded-lg bg-violet-100 px-3 py-1 text-[14px] font-semibold text-violet-800">
              {active.group}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <div className="text-[14px] font-bold text-slate-500">CƠ CHẾ NHẬN DIỆN</div>
            <p className="mt-1 text-[15px] font-medium text-slate-900">{active.mechanism}</p>
          </div>
          <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200">
            <div className="text-[14px] font-bold text-amber-800">VÍ DỤ TIÊU BIỂU</div>
            <p className="mt-1 text-[16px] font-semibold italic text-amber-950">{active.example}</p>
          </div>
          <div className="rounded-xl bg-emerald-50/80 p-3.5 border border-emerald-200">
            <div className="text-[14px] font-bold text-emerald-800">CÁCH NÊU TÁC DỤNG ĐẠT ĐIỂM TỐI ĐA</div>
            <p className="mt-1 text-[15px] text-emerald-950">{active.effect}</p>
          </div>
        </div>
      </div>
    );
  }

  // 34. VẦN, NHỊP, THANH ĐIỆU & THỂ THƠ
  if (scene2DType === 'skill-prosody') {
    const poem = PROSODY_SAMPLES[prosodyIdx];
    const toggleBreak = (lineIdx: number, wordIdx: number) => {
      const key = `${poem.id}-${lineIdx}`;
      const current = breaksMap[key] || [];
      const next = current.includes(wordIdx)
        ? current.filter((n) => n !== wordIdx)
        : [...current, wordIdx].sort((a, b) => a - b);
      setBreaksMap((prev) => ({ ...prev, [key]: next }));
    };

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-sky-50/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F2942]">Bàn thực hành Ngắt nhịp (/), Gieo vần & Thanh Bằng – Trắc</h3>
            <p className="text-[15px] text-slate-600">
              Bấm trực tiếp vào khoảng trống giữa hai tiếng thơ để thêm hoặc bỏ dấu ngắt nhịp (/):
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROSODY_SAMPLES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setProsodyIdx(idx)}
                className={`rounded-xl px-3.5 py-2 text-[14px] font-bold ${
                  idx === prosodyIdx ? 'bg-sky-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                {s.genre}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowTones((v) => !v)}
              className={`rounded-xl px-3.5 py-2 text-[14px] font-bold border ${
                showTones ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {showTones ? 'Đang hiện Bằng / Trắc' : 'Hiện Bằng / Trắc'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-bold text-[#0F2942]">{poem.title}</span>
            {onSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(poem.lines.map((l) => l.words.join(' ')).join('. '))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-100 px-3 py-1.5 text-[14px] font-semibold text-sky-900 hover:bg-sky-200"
              >
                <Volume2 className="h-4 w-4" /> Đọc theo nhịp
              </button>
            )}
          </div>

          <div className="space-y-4">
            {poem.lines.map((line, lIdx) => {
              const key = `${poem.id}-${lIdx}`;
              const userBreaks = breaksMap[key] || [];
              const isAccepted = line.validBreaks.some(
                (vb) => vb.length === userBreaks.length && vb.every((v, i) => v === userBreaks[i])
              );
              const rhythmLabel = (() => {
                const pts = [0, ...userBreaks, line.words.length];
                const segs: number[] = [];
                for (let i = 1; i < pts.length; i++) segs.push(pts[i] - pts[i - 1]);
                return segs.join('/');
              })();

              return (
                <div key={key} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex flex-wrap items-center gap-y-2">
                    {line.words.map((word, wIdx) => {
                      const tone = detectTone(word);
                      const hasBreak = userBreaks.includes(wIdx + 1);
                      return (
                        <React.Fragment key={`${lIdx}-${wIdx}`}>
                          <div className="flex flex-col items-center">
                            <span className="rounded-lg bg-white px-2.5 py-1.5 text-[17px] font-bold text-slate-900 shadow-xs border border-slate-200">
                              {word}
                            </span>
                            {showTones && (
                              <span
                                className={`mt-1 rounded px-1.5 text-[12px] font-bold ${
                                  tone === 'B'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {tone === 'B' ? 'Bằng' : 'Trắc'}
                              </span>
                            )}
                          </div>
                          {wIdx < line.words.length - 1 && (
                            <button
                              type="button"
                              onClick={() => toggleBreak(lIdx, wIdx + 1)}
                              title="Bấm để đặt hoặc bỏ dấu ngắt nhịp (/)"
                              className={`mx-1 flex h-9 w-7 items-center justify-center rounded-lg text-lg font-extrabold transition-colors ${
                                hasBreak
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-transparent text-slate-300 hover:bg-slate-200 hover:text-slate-700'
                              }`}
                            >
                              {hasBreak ? '/' : '·'}
                            </button>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[14px]">
                    <span className="font-semibold text-slate-700">
                      Số tiếng: <strong>{line.words.length}</strong> · Nhịp hiện tại: <strong>{rhythmLabel}</strong>
                    </span>
                    <span
                      className={`font-semibold ${isAccepted ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
                      {isAccepted
                        ? 'Nhịp hợp lí, giàu nhạc điệu!'
                        : `Gợi ý nhịp phổ biến: ${line.validBreaks
                            .map((vb) => {
                              const pts = [0, ...vb, line.words.length];
                              return pts.slice(1).map((p, i) => p - pts[i]).join('/');
                            })
                            .join(' hoặc ')}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-sky-50 p-3.5 text-[15px] text-sky-950 border border-sky-200">
            <strong>Phân tích vần & thanh điệu:</strong> {poem.rhymeNote}
          </div>
        </div>
      </div>
    );
  }

  // 36. CẤU TRÚC VĂN NGHỊ LUẬN
  if (scene2DType === 'skill-argument-builder') {
    const pieces = [
      { id: 'p1', text: 'Ý nghĩa của tinh thần tự học đối với học sinh THPT hiện nay.', role: 'Luận đề' },
      { id: 'p2', text: 'Tự học giúp người trẻ chủ động mở rộng tri thức vượt ra khỏi khuôn khổ sách giáo khoa.', role: 'Luận điểm' },
      { id: 'p3', text: 'Bởi lượng tri thức nhân loại tăng nhanh mỗi ngày; nếu chỉ thụ động chờ thầy cô giảng giải, ta sẽ dễ tụt hậu.', role: 'Lí lẽ' },
      { id: 'p4', text: 'Nhiều học sinh vùng cao đã tự học ngoại ngữ và lập trình qua học liệu mở để giành giải thưởng khoa học kĩ thuật quốc gia.', role: 'Bằng chứng' },
      { id: 'p5', text: 'Hôm qua bạn em mới mua một chiếc bút màu xanh rất đẹp ở hiệu sách.', role: 'Bằng chứng lạc đề (Loại bỏ)' },
    ];
    const roles = ['Luận đề', 'Luận điểm', 'Lí lẽ', 'Bằng chứng', 'Bằng chứng lạc đề (Loại bỏ)'];
    const score = pieces.filter((p) => argSlots[p.id] === p.role).length;

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-indigo-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F2942]">Xưởng lắp ráp Cấu trúc Văn nghị luận & Phát hiện lỗi</h3>
            <p className="text-[15px] text-slate-600">
              Xác định đúng vai trò của từng câu dưới đây (bao gồm 1 bằng chứng lạc đề cần phát hiện):
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCheckedArg(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-[15px] font-bold text-white hover:bg-blue-700"
          >
            Kiểm tra sơ đồ ({score}/{pieces.length})
          </button>
        </div>

        <div className="space-y-3">
          {pieces.map((p) => {
            const picked = argSlots[p.id] || '';
            const isCorrect = checkedArg && picked === p.role;
            const isWrong = checkedArg && picked !== p.role;
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isCorrect
                    ? 'border-emerald-400 bg-emerald-50/70'
                    : isWrong
                    ? 'border-rose-300 bg-rose-50/60'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-[15px] font-semibold text-slate-900">“{p.text}”</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setArgSlots((prev) => ({ ...prev, [p.id]: r }));
                        setCheckedArg(false);
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-[14px] font-semibold ${
                        picked === r
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {checkedArg && (
                  <p className={`mt-2 text-[14px] font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isCorrect ? 'Chính xác!' : `Đáp án chuẩn: ${p.role}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 37. SƠ ĐỒ PHÂN TÍCH NHÂN VẬT
  if (scene2DType === 'skill-character-map') {
    const profile = CHARACTER_PROFILES[charIdx];
    const aspect = profile.aspects[activeAspectIdx];
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-emerald-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F2942]">Bản đồ 7 Phương diện Phân tích Nhân vật</h3>
            <p className="text-[15px] text-slate-600">
              Chọn nhân vật mẫu rồi bấm từng nhánh phương diện để xem dẫn chứng & cách lập luận:
            </p>
          </div>
          <div className="flex gap-2">
            {CHARACTER_PROFILES.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCharIdx(idx);
                  setActiveAspectIdx(0);
                }}
                className={`rounded-xl px-3.5 py-2 text-[14px] font-bold ${
                  idx === charIdx ? 'bg-teal-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {profile.aspects.map((a, idx) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setActiveAspectIdx(idx)}
              className={`rounded-xl border px-3.5 py-3 text-left text-[15px] font-bold transition-all ${
                idx === activeAspectIdx
                  ? 'border-teal-700 bg-teal-700 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-teal-50'
              }`}
            >
              {idx + 1}. {a.key}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
          <div className="text-[14px] font-bold uppercase tracking-wide text-teal-700">
            {profile.name} · Phương diện {activeAspectIdx + 1}/7
          </div>
          <h4 className="mt-1 text-xl font-bold text-[#0F2942]">{aspect.key}</h4>
          <p className="mt-2 text-[16px] leading-relaxed text-slate-800">{aspect.detail}</p>
        </div>
      </div>
    );
  }

  // 38. PHÂN TÍCH HÌNH TƯỢNG THƠ
  if (scene2DType === 'skill-poetic-imagery') {
    const sample = IMAGERY_SAMPLES[imageryIdx];
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-purple-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F2942]">Giải mã Hình tượng Thơ theo 4 Lớp nghĩa</h3>
            <p className="text-[15px] text-slate-600">Bấm mở từng lớp từ bề mặt ngôn từ đến chiều sâu biểu tượng:</p>
          </div>
          <div className="flex gap-2">
            {IMAGERY_SAMPLES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setImageryIdx(idx);
                  setRevealedLayer(1);
                }}
                className={`rounded-xl px-3.5 py-2 text-[14px] font-bold ${
                  idx === imageryIdx ? 'bg-purple-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                Mẫu {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-purple-900 p-4 text-center text-[17px] font-bold text-white shadow-sm">
          {sample.title}
        </div>

        <div className="space-y-3">
          {sample.layers.map((layer, idx) => {
            const isOpen = idx < revealedLayer;
            return (
              <button
                key={layer.title}
                type="button"
                onClick={() => setRevealedLayer(Math.max(revealedLayer, idx + 1))}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  isOpen
                    ? 'border-purple-300 bg-white shadow-xs'
                    : 'border-dashed border-purple-300 bg-purple-50/60 hover:bg-purple-100/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-purple-950">{layer.title}</span>
                  <span className="text-[14px] font-semibold text-purple-700">
                    {isOpen ? 'Đã mở' : 'Nhấp để giải mã'}
                  </span>
                </div>
                {isOpen && <p className="mt-2 text-[15px] leading-relaxed text-slate-800">{layer.body}</p>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 39. VIẾT ĐOẠN VĂN 200 CHỮ
  if (scene2DType === 'skill-paragraph-200') {
    const words = countVietnameseWords(paraDraft);
    const hasLineBreak = paraDraft.trim().includes('\n');
    const inRange = words >= 170 && words <= 260;
    const rubric = [
      'Trình bày đúng hình thức 1 đoạn văn duy nhất (không xuống dòng tách đoạn).',
      'Dung lượng khoảng 200 chữ (170–260 chữ).',
      paraType === 'nlxh'
        ? 'Nêu trúng vấn đề xã hội, giải thích gọn, có lí lẽ sâu và 1 bằng chứng xác thực.'
        : 'Bám sát ngữ liệu văn học, chỉ rõ tín hiệu nghệ thuật và nội dung trọng tâm.',
      'Có ý mở rộng/phản biện ngắn hoặc bài học nhận thức – hành động sâu sắc.',
      'Diễn đạt mạch lạc, chuẩn chính tả, không sáo mòn.',
    ];

    return (
      <div className="flex h-full flex-col gap-3.5 overflow-y-auto bg-gradient-to-br from-slate-50 to-teal-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F2942]">Xưởng Viết đoạn văn nghị luận 200 chữ</h3>
            <p className="text-[15px] text-slate-600">
              Thực hành viết liền 1 đoạn văn, theo dõi bộ đếm từ tức thời và tự chấm theo Rubric:
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setParaType('nlxh')}
              className={`rounded-xl px-3.5 py-2 text-[14px] font-bold ${
                paraType === 'nlxh' ? 'bg-teal-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              NLXH 200 chữ
            </button>
            <button
              type="button"
              onClick={() => setParaType('nlvh')}
              className={`rounded-xl px-3.5 py-2 text-[14px] font-bold ${
                paraType === 'nlvh' ? 'bg-teal-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              NLVH 200 chữ
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-[15px] text-teal-950">
          <strong>Đề luyện nhanh:</strong>{' '}
          {paraType === 'nlxh'
            ? 'Viết đoạn văn nghị luận (khoảng 200 chữ) trình bày suy nghĩ của anh/chị về vai trò của lòng kiên trì đối với người trẻ.'
            : 'Viết đoạn văn nghị luận (khoảng 200 chữ) phân tích nghệ thuật tương phản ánh sáng – bóng tối trong cảnh cho chữ (Chữ người tử tù – Nguyễn Tuân).'}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5 border border-slate-200">
          <div className="flex items-center gap-3 text-[15px]">
            <span className="font-bold text-slate-800">
              Số chữ hiện tại:{' '}
              <span className={inRange ? 'text-emerald-700' : 'text-amber-700'}>{words} / 200 chữ</span>
            </span>
            {hasLineBreak && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2.5 py-0.5 text-[14px] font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4" /> Phát hiện xuống dòng (nên gộp thành 1 đoạn!)
              </span>
            )}
          </div>
          <span className="text-[14px] font-semibold text-slate-500">Mục tiêu chuẩn: 180–240 chữ</span>
        </div>

        <textarea
          value={paraDraft}
          onChange={(e) => setParaDraft(e.target.value)}
          rows={5}
          placeholder="Nhập đoạn văn khoảng 200 chữ tại đây (không xuống dòng)..."
          className="w-full rounded-xl border border-slate-300 bg-white p-4 text-[16px] leading-relaxed text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[15px] font-bold text-[#0F2942]">
            <Sparkles className="h-4 w-4 text-teal-600" /> Bảng tự kiểm 5 tiêu chí chuẩn thi THPT
          </div>
          <div className="space-y-2">
            {rubric.map((item, idx) => (
              <label key={idx} className="flex cursor-pointer items-start gap-2.5 text-[15px] text-slate-800">
                <input
                  type="checkbox"
                  checked={!!paraChecklist[idx]}
                  onChange={() => setParaChecklist((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                  className="mt-1 h-4 w-4 rounded accent-teal-600"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 40. VIẾT BÀI VĂN 600 CHỮ
  const introW = countVietnameseWords(essaySections.intro);
  const bodyW =
    countVietnameseWords(essaySections.body1) +
    countVietnameseWords(essaySections.body2) +
    countVietnameseWords(essaySections.counter);
  const concW = countVietnameseWords(essaySections.conclusion);
  const totalW = introW + bodyW + concW;

  return (
    <div className="flex h-full flex-col gap-3.5 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-[#0F2942]">Xưởng Viết bài văn nghị luận 600 chữ (4,0 điểm)</h3>
          <p className="text-[15px] text-slate-600">
            Lập ý & viết theo từng phần có kiểm soát tỉ lệ Mở (12%) – Thân (75%) – Kết (13%):
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEssayType('nlxh')}
            className={`rounded-xl px-3.5 py-2 text-[14px] font-bold ${
              essayType === 'nlxh' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
            }`}
          >
            NLXH 600 chữ
          </button>
          <button
            type="button"
            onClick={() => setEssayType('nlvh')}
            className={`rounded-xl px-3.5 py-2 text-[14px] font-bold ${
              essayType === 'nlvh' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
            }`}
          >
            NLVH 600 chữ
          </button>
        </div>
      </div>

      {/* Balance Bar */}
      <div className="rounded-xl border border-blue-200 bg-white p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[15px] font-bold text-[#0F2942]">
          <span>
            Tổng dung lượng: <strong className="text-blue-700">{totalW} / 600 chữ</strong>
          </span>
          <span className="text-[14px] font-semibold text-slate-600">
            Mở: {introW} chữ · Thân: {bodyW} chữ · Kết: {concW} chữ
          </span>
        </div>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
          <div style={{ width: `${Math.min(100, (introW / Math.max(1, totalW)) * 100)}%` }} className="bg-blue-600" />
          <div style={{ width: `${Math.min(100, (bodyW / Math.max(1, totalW)) * 100)}%` }} className="bg-teal-600" />
          <div style={{ width: `${Math.min(100, (concW / Math.max(1, totalW)) * 100)}%` }} className="bg-amber-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {(
          [
            ['intro', '1. Mở bài (Mục tiêu ~80 chữ) — Dẫn dắt & Nêu luận đề'],
            ['body1', '2. Thân bài · Đoạn Luận điểm 1 (~170 chữ) — Lí lẽ + Bằng chứng 1'],
            ['body2', '3. Thân bài · Đoạn Luận điểm 2 (~170 chữ) — Lí lẽ + Bằng chứng 2'],
            [
              'counter',
              essayType === 'nlxh'
                ? '4. Thân bài · Phản biện & Bài học hành động (~100 chữ)'
                : '4. Thân bài · Đánh giá đặc sắc nghệ thuật & Thông điệp (~100 chữ)',
            ],
            ['conclusion', '5. Kết bài (Mục tiêu ~80 chữ) — Khái quát & Dư âm'],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-1.5 flex items-center justify-between text-[14px] font-bold text-slate-800">
              <span>{label}</span>
              <span className="text-blue-700">{countVietnameseWords(essaySections[field])} chữ</span>
            </div>
            <textarea
              rows={2}
              value={essaySections[field]}
              onChange={(e) => setEssaySections((prev) => ({ ...prev, [field]: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-[15px] leading-relaxed text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-[14px] font-semibold text-emerald-900 border border-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        Thang chấm 4,0 điểm chuẩn GDPT 2018: Bố cục (0,25) · Xác định vấn đề (0,5) · Triển khai hệ thống luận điểm (2,5) · Chính tả & ngữ pháp (0,25) · Sáng tạo (0,5).
      </div>
    </div>
  );
};
