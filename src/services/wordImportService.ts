import mammoth from 'mammoth';
import { DEFAULT_ADMIN_INFO } from '../config/curriculum';
import { ExamDocument, ExamQuestion, WritingPrompt } from '../types';
import { generateId } from '../utils/formatters';

export interface SmartImportSegment {
  id: string;
  kind: 'header' | 'passage' | 'reading-question' | 'writing-prompt' | 'answer' | 'unrecognized';
  rawText: string;
  recognized: boolean;
  note?: string;
}

export interface SmartImportResult {
  rawText: string;
  examDraft: ExamDocument;
  segments: SmartImportSegment[];
  warnings: string[];
}

export async function extractRawTextFromDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.replace(/\r\n/g, '\n');
}

export function parseImportedExamText(rawText: string): SmartImportResult {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  const warnings: string[] = [];
  const segments: SmartImportSegment[] = [];

  // Check if JSON compatible
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as Partial<ExamDocument>;
      if (parsed.adminInfo && (parsed.readingQuestions || parsed.writingPrompts)) {
        const now = new Date().toISOString();
        const examDraft: ExamDocument = {
          id: generateId('exam'),
          ownerId: 'teacher-dathien',
          adminInfo: { ...DEFAULT_ADMIN_INFO, ...parsed.adminInfo },
          passage: parsed.passage ?? {
            id: generateId('pass'),
            title: 'Ngữ liệu nhập từ JSON',
            author: 'Chưa xác định',
            genre: 'Thơ',
            grade: '12',
            textbookSeries: 'Kết nối tri thức với cuộc sống',
            topic: '',
            literaryPeriod: '',
            textType: '',
            content: '',
            formatStyle: 'prose',
            origin: 'Nhập từ JSON',
            citationSource: '',
            publisher: '',
            publishYear: '',
            verificationStatus: 'Giáo viên cung cấp',
            learningOutcomes: [],
            tags: ['Nhập JSON'],
            isFavorite: false,
            ownerId: 'teacher-dathien',
            createdAt: now,
            updatedAt: now,
          },
          readingQuestions: parsed.readingQuestions ?? [],
          writingPrompts: parsed.writingPrompts ?? [],
          includeHighApplication: Boolean(parsed.includeHighApplication),
          approved: false,
          createdAt: now,
          updatedAt: now,
        };
        segments.push({
          id: generateId('seg'),
          kind: 'header',
          rawText: 'Nhận diện cấu trúc JSON hợp lệ của Văn Học Thông Minh.',
          recognized: true,
        });
        return { rawText: text, examDraft, segments, warnings };
      }
    } catch {
      // Fall through to text parser
    }
  }

  const lines = text.split('\n');
  let title = 'ĐỀ NHẬP TỪ TÀI LIỆU (CHỜ RÀ SOÁT)';
  let durationMinutes = 120;
  let schoolName = DEFAULT_ADMIN_INFO.schoolName;

  // Detect header metadata
  const headerLines: string[] = [];
  let i = 0;
  while (i < lines.length && i < 12) {
    const l = lines[i].trim();
    if (/^(PHẦN\s*I|I\.\s*ĐỌC\s*HIỂU)/i.test(l)) break;
    if (l) {
      headerLines.push(l);
      if (/TRƯỜNG|SỞ\s*GD/i.test(l)) schoolName = l;
      if (/ĐỀ\s*(KIỂM\s*TRA|THI|ÔN)/i.test(l)) title = l;
      const durMatch = l.match(/(\d{2,3})\s*phút/i);
      if (durMatch) durationMinutes = Number(durMatch[1]);
    }
    i++;
  }

  if (headerLines.length > 0) {
    segments.push({
      id: generateId('seg'),
      kind: 'header',
      rawText: headerLines.join('\n'),
      recognized: true,
    });
  } else {
    warnings.push('Không nhận diện rõ phần thông tin đầu đề; giữ nguyên để giáo viên bổ sung.');
  }

  // Split sections: Reading, Writing, Answer Guide
  const readingIdx = lines.findIndex((l) => /^(PHẦN\s*I|I\.\s*ĐỌC\s*HIỂU|ĐỌC\s*HIỂU)/i.test(l.trim()));
  const writingIdx = lines.findIndex((l) => /^(PHẦN\s*II|II\.\s*VIẾT|LÀM\s*VĂN|VIẾT)/i.test(l.trim()));
  const answerIdx = lines.findIndex((l) => /^(HƯỚNG\s*DẪN\s*CHẤM|ĐÁP\s*ÁN)/i.test(l.trim()));

  const readingEnd =
    writingIdx !== -1 ? writingIdx : answerIdx !== -1 ? answerIdx : lines.length;
  const writingEnd = answerIdx !== -1 ? answerIdx : lines.length;

  // Parse Reading block preserving poem line breaks / paragraphs
  let passageContent = '';
  let passageAuthor = '';
  let passageSource = '';
  const readingQuestions: ExamQuestion[] = [];

  if (readingIdx !== -1) {
    const rBlock = lines.slice(readingIdx + 1, readingEnd);
    const firstQRelIdx = rBlock.findIndex((l) => /^Câu\s*\d+/i.test(l.trim()));
    const passageLines = firstQRelIdx !== -1 ? rBlock.slice(0, firstQRelIdx) : rBlock;
    // Preserve exact line breaks and stanzas!
    const cleanedPassageLines = passageLines.filter(
      (l) => !/^Đọc\s*(văn\s*bản|đoạn\s*trích|bài\s*thơ)/i.test(l.trim())
    );

    // Check trailing source line like "(Trích ...)" or "(Theo ...)"
    const lastNonEmptyIdx = [...cleanedPassageLines]
      .reverse()
      .findIndex((l) => l.trim() !== '');
    if (lastNonEmptyIdx !== -1) {
      const actualIdx = cleanedPassageLines.length - 1 - lastNonEmptyIdx;
      const lastLine = cleanedPassageLines[actualIdx].trim();
      if (/^\(.*\)$/.test(lastLine) || /^(Nguồn|Trích|Theo)\b/i.test(lastLine)) {
        passageSource = lastLine.replace(/^\(|\)$/g, '');
        cleanedPassageLines.splice(actualIdx, 1);
      }
    }
    passageContent = cleanedPassageLines.join('\n').trim();
    if (passageContent) {
      segments.push({
        id: generateId('seg'),
        kind: 'passage',
        rawText: passageContent + (passageSource ? `\n(${passageSource})` : ''),
        recognized: true,
        note: 'Giữ nguyên xuống dòng và khổ thơ/đoạn văn gốc.',
      });
    } else {
      warnings.push('Không trích xuất được nội dung ngữ liệu Đọc hiểu.');
    }

    if (firstQRelIdx !== -1) {
      const qLines = rBlock.slice(firstQRelIdx);
      let currentQText = '';
      const pushQuestion = (rawQ: string) => {
        const cleaned = rawQ.trim();
        if (!cleaned) return;
        const ptsMatch = cleaned.match(/\(?(\d+(?:[.,]\d+)?)\s*(?:điểm|đ)\)?/i);
        const pts = ptsMatch ? Number(ptsMatch[1].replace(',', '.')) : 1.0;
        const contentOnly = cleaned
          .replace(/^Câu\s*\d+\s*[:.)-]?\s*/i, '')
          .replace(/\(\s*\d+(?:[.,]\d+)?\s*(?:điểm|đ)\s*\)\s*[:.]?\s*/i, '')
          .trim();

        readingQuestions.push({
          id: generateId('q'),
          order: readingQuestions.length + 1,
          part: 'doc-hieu',
          content: contentOnly || cleaned,
          skill: 'Kỹ năng đọc hiểu (chờ giáo viên xác nhận)',
          learningOutcome: '',
          cognitiveLevel: readingQuestions.length < 2 ? 'Nhận biết' : 'Thông hiểu',
          points: pts,
          answer: '',
          equivalentAnswers: '',
          partialCreditSteps: [],
          nonQualifyingNotes: '',
        });
        segments.push({
          id: generateId('seg'),
          kind: 'reading-question',
          rawText: cleaned,
          recognized: true,
        });
      };

      for (const line of qLines) {
        if (/^Câu\s*\d+/i.test(line.trim())) {
          if (currentQText) pushQuestion(currentQText);
          currentQText = line;
        } else {
          currentQText += '\n' + line;
        }
      }
      if (currentQText) pushQuestion(currentQText);
    }
  } else {
    warnings.push('Không tìm thấy tiêu đề phần Đọc hiểu chuẩn ("PHẦN I" hoặc "I. ĐỌC HIỂU").');
    segments.push({
      id: generateId('seg'),
      kind: 'unrecognized',
      rawText: lines.slice(i, writingIdx !== -1 ? writingIdx : lines.length).join('\n'),
      recognized: false,
      note: 'Chưa nhận diện được cấu trúc phần Đọc hiểu — cần giáo viên kiểm tra.',
    });
  }

  // Parse Writing prompts
  const writingPrompts: WritingPrompt[] = [];
  if (writingIdx !== -1) {
    const wLines = lines.slice(writingIdx + 1, writingEnd);
    let currentW = '';
    const pushWriting = (rawW: string) => {
      const cleaned = rawW.trim();
      if (!cleaned) return;
      const ptsMatch = cleaned.match(/\(?(\d+(?:[.,]\d+)?)\s*(?:điểm|đ)\)?/i);
      const pts = ptsMatch ? Number(ptsMatch[1].replace(',', '.')) : 4.0;
      const isShort = /đoạn\s*văn|200\s*chữ/i.test(cleaned);
      const wordMatch = cleaned.match(/(\d{3,4})\s*chữ/i);
      const targetWords = wordMatch ? Number(wordMatch[1]) : isShort ? 200 : 600;
      const contentOnly = cleaned
        .replace(/^Câu\s*\d+\s*[:.)-]?\s*/i, '')
        .replace(/\(\s*\d+(?:[.,]\d+)?\s*(?:điểm|đ)\s*\)\s*[:.]?\s*/i, '')
        .trim();

      writingPrompts.push({
        id: generateId('w'),
        order: writingPrompts.length + 1,
        category: /văn\s*học|tác\s*phẩm|bài\s*thơ|nhân\s*vật/i.test(cleaned)
          ? 'Nghị luận văn học'
          : 'Nghị luận xã hội',
        formatType: isShort ? 'Đoạn văn' : 'Bài văn',
        wordCountTarget: targetWords,
        promptText: contentOnly || cleaned,
        points: pts,
        cognitiveLevel: 'Vận dụng',
        learningOutcome: '',
        suggestedOutline: [],
        keyArguments: [],
        rubric: [
          {
            id: generateId('rub'),
            group: 'Triển khai vấn đề',
            title: 'Biểu điểm chuẩn (chờ rà soát)',
            description: 'Giáo viên phân bổ chi tiết các tiêu chí theo barem.',
            points: pts,
          },
        ],
        teacherReferenceEssay: '',
      });
      segments.push({
        id: generateId('seg'),
        kind: 'writing-prompt',
        rawText: cleaned,
        recognized: true,
      });
    };

    for (const line of wLines) {
      if (/^Câu\s*\d+/i.test(line.trim())) {
        if (currentW) pushWriting(currentW);
        currentW = line;
      } else {
        currentW += '\n' + line;
      }
    }
    if (currentW) pushWriting(currentW);
    if (writingPrompts.length === 0 && wLines.join('').trim()) {
      pushWriting(wLines.join('\n'));
    }
  }

  if (answerIdx !== -1) {
    const ansBlock = lines.slice(answerIdx).join('\n').trim();
    segments.push({
      id: generateId('seg'),
      kind: 'answer',
      rawText: ansBlock,
      recognized: true,
      note: 'Phần Hướng dẫn chấm đã được giữ nguyên để giáo viên đối chiếu vào từng câu.',
    });
  }

  const now = new Date().toISOString();
  const isPoem =
    passageContent.split('\n').filter((l) => l.trim()).length >= 4 &&
    passageContent
      .split('\n')
      .filter((l) => l.trim())
      .every((l) => l.trim().length < 75);

  const examDraft: ExamDocument = {
    id: generateId('exam'),
    ownerId: 'teacher-dathien',
    adminInfo: {
      ...DEFAULT_ADMIN_INFO,
      schoolName,
      title,
      durationMinutes,
      templateId: 'custom',
    },
    passage: {
      id: generateId('pass'),
      title: 'Ngữ liệu nhập từ văn bản (chờ đặt nhan đề)',
      author: passageAuthor || 'Giáo viên kiểm tra và bổ sung',
      genre: isPoem ? 'Thơ' : 'Truyện',
      grade: DEFAULT_ADMIN_INFO.grade,
      textbookSeries: DEFAULT_ADMIN_INFO.textbookSeries,
      topic: '',
      literaryPeriod: '',
      textType: isPoem ? 'Thơ' : 'Văn xuôi',
      content: passageContent,
      formatStyle: isPoem ? 'poem' : 'prose',
      origin: 'Nhập từ Smart Import',
      citationSource: passageSource || 'Giáo viên xác minh và điền nguồn trích dẫn',
      publisher: '',
      publishYear: '',
      verificationStatus: passageSource ? 'Giáo viên cung cấp' : 'Chưa xác minh',
      learningOutcomes: [],
      tags: ['Nhập từ Word'],
      isFavorite: false,
      ownerId: 'teacher-dathien',
      createdAt: now,
      updatedAt: now,
    },
    readingQuestions,
    writingPrompts,
    includeHighApplication: false,
    approved: false,
    createdAt: now,
    updatedAt: now,
  };

  return { rawText: text, examDraft, segments, warnings };
}
