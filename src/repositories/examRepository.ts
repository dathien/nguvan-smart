import { db, ensureDatabaseSeeded } from '../database/db';
import {
  ExamDocument,
  ExamQuestion,
  ExamVersionSnapshot,
  ReadingPassage,
} from '../types';
import { generateId } from '../utils/formatters';

export async function listExams(): Promise<ExamDocument[]> {
  await ensureDatabaseSeeded();
  return db.exams.orderBy('updatedAt').reverse().toArray();
}

export async function getExamById(id: string): Promise<ExamDocument | undefined> {
  await ensureDatabaseSeeded();
  return db.exams.get(id);
}

export async function saveExam(exam: ExamDocument): Promise<ExamDocument> {
  await ensureDatabaseSeeded();
  const updated: ExamDocument = {
    ...exam,
    updatedAt: new Date().toISOString(),
  };
  await db.exams.put(updated);

  // Sync passage to passage bank if non-empty
  if (updated.passage.content.trim()) {
    await db.passages.put({
      ...updated.passage,
      updatedAt: updated.updatedAt,
    });
  }

  // Sync reading questions to question bank
  if (updated.readingQuestions.length > 0) {
    await db.questions.bulkPut(
      updated.readingQuestions.map((q) => ({
        ...q,
        passageId: updated.passage.id,
        grade: updated.adminInfo.grade,
        genre: updated.passage.genre,
        ownerId: updated.ownerId,
        updatedAt: updated.updatedAt,
      }))
    );
  }

  return updated;
}

export async function deleteExam(id: string): Promise<void> {
  await db.exams.delete(id);
  await db.examVersions.where('examId').equals(id).delete();
}

export async function duplicateExam(exam: ExamDocument): Promise<ExamDocument> {
  const now = new Date().toISOString();
  const copy: ExamDocument = {
    ...JSON.parse(JSON.stringify(exam)),
    id: generateId('exam'),
    adminInfo: {
      ...exam.adminInfo,
      title: `${exam.adminInfo.title} (Bản sao)`,
      examCode: `${exam.adminInfo.examCode}-COPY`,
    },
    approved: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.exams.put(copy);
  return copy;
}

export async function saveExamVersion(
  exam: ExamDocument,
  label: string
): Promise<ExamVersionSnapshot> {
  const snap: ExamVersionSnapshot = {
    id: generateId('ver'),
    examId: exam.id,
    label,
    snapshot: JSON.parse(JSON.stringify(exam)) as ExamDocument,
    createdAt: new Date().toISOString(),
  };
  await db.examVersions.put(snap);
  return snap;
}

export async function listExamVersions(examId: string): Promise<ExamVersionSnapshot[]> {
  return db.examVersions
    .where('examId')
    .equals(examId)
    .reverse()
    .sortBy('createdAt');
}

export async function listPassages(): Promise<ReadingPassage[]> {
  await ensureDatabaseSeeded();
  return db.passages.orderBy('updatedAt').reverse().toArray();
}

export async function savePassage(p: ReadingPassage): Promise<ReadingPassage> {
  const updated = { ...p, updatedAt: new Date().toISOString() };
  await db.passages.put(updated);
  return updated;
}

export async function deletePassage(id: string): Promise<void> {
  await db.passages.delete(id);
}

export async function listQuestions(): Promise<ExamQuestion[]> {
  await ensureDatabaseSeeded();
  return db.questions.toArray();
}

export async function saveQuestion(q: ExamQuestion): Promise<ExamQuestion> {
  const updated = { ...q, updatedAt: new Date().toISOString() };
  await db.questions.put(updated);
  return updated;
}

export async function deleteQuestion(id: string): Promise<void> {
  await db.questions.delete(id);
}

/** Independent editable copies; preserve the full question/answer relationship. */
export async function createNumberedExams(exam: ExamDocument, count: number, start: number): Promise<ExamDocument[]> {
  if (!Number.isInteger(count) || count < 1 || count > 50 || !Number.isSafeInteger(start) || start < 1 || start + count > 1000000) throw new Error('Nhập số lượng 1–50 và mã bắt đầu hợp lệ.');
  await ensureDatabaseSeeded();
  return db.transaction('rw', db.exams, async () => {
    const existing = new Set((await db.exams.toArray()).map(e => e.adminInfo.examCode.trim()));
    const now = new Date().toISOString();
    const copies: ExamDocument[] = [];
    for (let i = 0; i < count; i++) {
      const code = String(start + i);
      if (existing.has(code) || code === exam.adminInfo.examCode) throw new Error(`Mã đề ${code} đã tồn tại. Chọn mã bắt đầu khác.`);
      const copy: ExamDocument = JSON.parse(JSON.stringify(exam));
      copy.id = generateId('exam');
      copy.adminInfo.examCode = code;
      copy.passage.id = generateId('pass');
      copy.readingQuestions.forEach(q => { q.id = generateId('q'); q.passageId = copy.passage.id; });
      copy.writingPrompts.forEach(w => { w.id = generateId('w'); });
      // Manual matrix rows can reference old question IDs; rebuild from the copied questions.
      copy.matrixOverride = undefined;
      copy.approved = false;
      copy.createdAt = copy.updatedAt = now;
      copies.push(copy);
    }
    await db.exams.bulkAdd(copies);
    return copies;
  });
}
