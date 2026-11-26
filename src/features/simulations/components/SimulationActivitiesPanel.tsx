import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Compass,
  Eye,
  EyeOff,
  GraduationCap,
  HelpCircle,
  Layers,
  PenLine,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  SimulationDefinition,
  SimulationHotspot,
  SimulationProgressRecord,
} from '../types';

export type InspectorTab = 'explore' | 'tasks' | 'quiz' | 'apply' | 'teacher';

interface SimulationActivitiesPanelProps {
  simulation: SimulationDefinition;
  activeTab: InspectorTab;
  onChangeTab: (tab: InspectorTab) => void;
  selectedHotspot: SimulationHotspot | null;
  onSelectHotspot: (hotspot: SimulationHotspot) => void;
  progress: SimulationProgressRecord;
  onUpdateAnswer: (questionId: string, value: string) => void;
  onCompleteTask: (taskId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateCustomTeacherText: (text: string) => void;
  params: Record<string, number>;
  onChangeParam: (paramId: string, value: number) => void;
  hideAnswersForClass: boolean;
  presentationMode: boolean;
  onSpeak?: (text: string) => void;
}

export const SimulationActivitiesPanel: React.FC<SimulationActivitiesPanelProps> = ({
  simulation,
  activeTab,
  onChangeTab,
  selectedHotspot,
  onSelectHotspot,
  progress,
  onUpdateAnswer,
  onCompleteTask,
  onUpdateNotes,
  onUpdateCustomTeacherText,
  params,
  onChangeParam,
  hideAnswersForClass,
  presentationMode,
  onSpeak,
}) => {
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [taskSelections, setTaskSelections] = useState<Record<string, Record<string, string>>>({});
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  const visitedSet = useMemo(() => new Set(progress.visitedHotspots), [progress.visitedHotspots]);
  const completedTaskSet = useMemo(() => new Set(progress.completedTasks), [progress.completedTasks]);

  const toggleReveal = (qId: string) => {
    setRevealedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleTaskPick = (taskId: string, itemId: string, value: string) => {
    setTaskSelections((prev) => ({
      ...prev,
      [taskId]: { ...(prev[taskId] ?? {}), [itemId]: value },
    }));
  };

  const handleCheckTask = (taskId: string) => {
    setCheckedTasks((prev) => ({ ...prev, [taskId]: true }));
    onCompleteTask(taskId);
  };

  const textSizeClass = presentationMode ? 'text-[17px]' : 'text-[15px]';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Compact Multi-tab Navigation */}
      <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 p-1.5 gap-1">
        {[
          { id: 'explore' as const, label: 'Khám phá', icon: Compass },
          { id: 'tasks' as const, label: 'Thực hành', icon: Layers },
          { id: 'quiz' as const, label: 'Câu hỏi', icon: HelpCircle },
          { id: 'apply' as const, label: 'Vận dụng', icon: PenLine },
          { id: 'teacher' as const, label: 'Giáo viên', icon: GraduationCap },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2 text-[13px] font-bold transition ${
                active
                  ? 'bg-[#1D63ED] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white hover:text-[#1D63ED]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: KHÁM PHÁ HOTSPOTS & PARAMETERS */}
        {activeTab === 'explore' && (
          <>
            {selectedHotspot ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-lg bg-[#1D63ED] px-2.5 py-0.5 text-[12px] font-bold text-white">
                      {selectedHotspot.category}
                    </span>
                    <h3 className="mt-1.5 text-[18px] font-bold text-[#0F2942]">
                      {selectedHotspot.label}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onSpeak?.(
                        `${selectedHotspot.label}. ${selectedHotspot.summary}. ${selectedHotspot.pedagogicalNote}`
                      )
                    }
                    className="shrink-0 rounded-xl border border-blue-200 bg-white p-2 text-[#1D63ED] hover:bg-blue-100"
                    title="Nghe thuyết minh điểm khám phá này"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                <p className={`${textSizeClass} leading-relaxed text-slate-800`}>
                  {selectedHotspot.summary}
                </p>

                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-amber-900">
                    <BookOpen className="h-4 w-4" />
                    <span>Điểm neo văn bản</span>
                  </div>
                  <p className="mt-1 text-[14px] italic leading-relaxed text-amber-950">
                    {selectedHotspot.textualDetail}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#0F2942]">
                    <Sparkles className="h-4 w-4 text-[#1D63ED]" />
                    <span>Giá trị nghệ thuật & Trọng tâm đọc hiểu</span>
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-slate-700">
                    {selectedHotspot.pedagogicalNote}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                <p className="text-[15px] font-semibold text-slate-700">
                  Nhấp vào một nhãn hoặc đối tượng trên mô phỏng để xem phân tích chi tiết.
                </p>
              </div>
            )}

            {/* Hotspot directory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-bold text-[#0F2942]">
                  Danh sách điểm khám phá ({visitedSet.size}/{simulation.hotspots.length})
                </h4>
              </div>
              <div className="space-y-1.5">
                {simulation.hotspots.map((hs) => {
                  const isSelected = selectedHotspot?.id === hs.id;
                  const isVisited = visitedSet.has(hs.id);
                  return (
                    <button
                      key={hs.id}
                      type="button"
                      onClick={() => onSelectHotspot(hs)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-[#1D63ED] bg-[#1D63ED] text-white shadow-sm'
                          : 'border-slate-200 bg-white text-[#0F2942] hover:border-blue-300 hover:bg-blue-50/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold">{hs.label}</p>
                        <p
                          className={`truncate text-[13px] ${
                            isSelected ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {hs.category}
                        </p>
                      </div>
                      {isVisited && (
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${
                            isSelected ? 'text-white' : 'text-emerald-600'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Scene Parameters */}
            {simulation.parameters.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-[15px] font-bold text-[#0F2942]">
                  <SlidersHorizontal className="h-4 w-4 text-[#1D63ED]" />
                  <span>Điều chỉnh bối cảnh minh họa</span>
                </div>
                {simulation.parameters.map((p) => {
                  const currentVal = params[p.id] ?? p.defaultValue;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[14px]">
                        <label htmlFor={`param-${p.id}`} className="font-semibold text-slate-800">
                          {p.label}
                        </label>
                        <span className="font-mono font-bold text-[#1D63ED]">
                          {currentVal}
                          {p.unit ? ` ${p.unit}` : ''}
                        </span>
                      </div>
                      <input
                        id={`param-${p.id}`}
                        type="range"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={currentVal}
                        onChange={(e) => onChangeParam(p.id, Number(e.target.value))}
                        className="w-full accent-[#1D63ED]"
                      />
                      <p className="text-[12px] text-slate-500">{p.illustrativeNote}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: THỰC HÀNH TƯƠNG TÁC (GHÉP NỐI / PHÂN LOẠI / SẮP XẾP) */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-[14px] text-[#0F2942]">
              Hoàn thành nhiệm vụ ghép nối / sắp xếp chi tiết dưới đây để khắc sâu cấu trúc tác phẩm.
            </div>
            {simulation.interactiveTasks.map((task) => {
              const targetOptions = Array.from(new Set(task.items.map((it) => it.target)));
              const picked = taskSelections[task.id] ?? {};
              const isChecked = !!checkedTasks[task.id];
              const isDone = completedTaskSet.has(task.id);

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-[16px] font-bold text-[#0F2942]">{task.title}</h4>
                      <p className="mt-0.5 text-[14px] text-slate-600">{task.instruction}</p>
                    </div>
                    {isDone && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[12px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã làm
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {task.items.map((item) => {
                      const val = picked[item.id] ?? '';
                      const isCorrect = val === item.target;
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2"
                        >
                          <p className="text-[14px] font-semibold text-[#0F2942]">{item.prompt}</p>
                          <select
                            value={val}
                            onChange={(e) => handleTaskPick(task.id, item.id, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-800 focus:border-[#1D63ED] focus:outline-none"
                          >
                            <option value="">— Chọn đáp án tương ứng —</option>
                            {targetOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          {isChecked && (
                            <div
                              className={`flex items-start gap-2 rounded-lg p-2 text-[13px] ${
                                isCorrect
                                  ? 'bg-emerald-50 text-emerald-900'
                                  : 'bg-amber-50 text-amber-950'
                              }`}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              )}
                              <div>
                                {!isCorrect && !hideAnswersForClass && (
                                  <p className="font-bold">Đáp án chuẩn: {item.target}</p>
                                )}
                                <p>{item.feedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCheckTask(task.id)}
                    className="w-full rounded-xl bg-[#1D63ED] px-4 py-2.5 text-[15px] font-bold text-white hover:bg-blue-700"
                  >
                    Kiểm tra kết quả nhiệm vụ
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: HỆ THỐNG CÂU HỎI ĐỌC HIỂU (5 CÂU THEO MỨC ĐỘ NHẬN THỨC) */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            {hideAnswersForClass && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[14px] font-semibold text-amber-900">
                Chế độ trình chiếu đang ẩn đáp án mẫu để học sinh tự thảo luận trên lớp.
              </div>
            )}

            {simulation.questions.map((q, idx) => {
              const userVal = progress.answers[q.id] ?? '';
              const showGuide = !hideAnswersForClass && !!revealedQuestions[q.id];
              const isMcqOrTf = (q.format === 'mcq' || q.format === 'true-false') && q.options?.length;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-[13px] font-bold text-[#0F2942]">
                      Câu {idx + 1} · {q.level}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSpeak?.(q.prompt)}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-[#1D63ED]"
                      title="Đọc câu hỏi"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className={`${textSizeClass} font-semibold leading-relaxed text-[#0F2942]`}>
                    {q.prompt}
                  </p>

                  {isMcqOrTf ? (
                    <div className="space-y-2">
                      {q.options!.map((opt, optIdx) => {
                        const selected = userVal === String(optIdx);
                        const isRight =
                          String(q.correctAnswer) === String(optIdx) ||
                          String(q.correctAnswer) === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => onUpdateAnswer(q.id, String(optIdx))}
                            className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[14px] transition ${
                              showGuide && isRight
                                ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-950'
                                : selected
                                ? 'border-[#1D63ED] bg-blue-50 font-semibold text-[#0F2942]'
                                : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-blue-300'
                            }`}
                          >
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[12px] font-bold">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      value={userVal}
                      onChange={(e) => onUpdateAnswer(q.id, e.target.value)}
                      placeholder="Nhập câu trả lời của em (tự động lưu offline)..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-[15px] text-slate-800 focus:border-[#1D63ED] focus:bg-white focus:outline-none"
                    />
                  )}

                  {!hideAnswersForClass && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleReveal(q.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-bold text-[#0F2942] hover:bg-blue-50 hover:text-[#1D63ED]"
                      >
                        {showGuide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span>{showGuide ? 'Ẩn gợi ý chấm' : 'Xem gợi ý & giải thích'}</span>
                      </button>

                      {showGuide && (
                        <div className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-1.5 text-[14px] text-emerald-950">
                          <p>
                            <strong>Gợi ý chuẩn:</strong> {q.suggestedGuide}
                          </p>
                          <p className="text-slate-700">
                            <strong>Giải thích:</strong> {q.explanation}
                          </p>
                          {q.rubricCriteria && q.rubricCriteria.length > 0 && (
                            <ul className="list-disc pl-5 text-[13px] text-slate-700">
                              {q.rubricCriteria.map((c, ci) => (
                                <li key={ci}>{c}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: VẬN DỤNG & TỔNG KẾT */}
        {activeTab === 'apply' && (
          <div className="space-y-4">
            {/* Key Takeaways */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[16px] font-bold text-[#0F2942]">Tổng kết cốt lõi</h4>
                <button
                  type="button"
                  onClick={() => onSpeak?.(simulation.summaryNarration)}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[13px] font-bold text-[#1D63ED] border border-blue-200"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Nghe tổng kết</span>
                </button>
              </div>
              <p className="text-[14px] leading-relaxed text-slate-700">
                {simulation.summaryNarration}
              </p>
              <ul className="space-y-1.5 pt-1">
                {simulation.keyTakeaways.map((k, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-[#0F2942]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1D63ED]" />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Application Task */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#1D63ED]" />
                <h4 className="text-[16px] font-bold text-[#0F2942]">
                  {simulation.applicationTask.title}
                </h4>
              </div>
              <p className={`${textSizeClass} leading-relaxed text-slate-800`}>
                {simulation.applicationTask.prompt}
              </p>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[13px] font-bold text-slate-700">Tiêu chí tự đánh giá:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-[14px] text-slate-700">
                  {simulation.applicationTask.criteria.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <label
                  htmlFor="sim-student-notes"
                  className="mb-1.5 block text-[14px] font-bold text-[#0F2942]"
                >
                  Ghi chép / Bài viết vận dụng của em (tự động lưu vào máy)
                </label>
                <textarea
                  id="sim-student-notes"
                  rows={5}
                  value={progress.notes}
                  onChange={(e) => onUpdateNotes(e.target.value)}
                  placeholder="Viết đoạn văn cảm nhận hoặc ghi chú thảo luận nhóm tại đây..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-[15px] leading-relaxed text-slate-800 focus:border-[#1D63ED] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HƯỚNG DẪN GIÁO VIÊN & NGỮ LIỆU TÙY BIẾN */}
        {activeTab === 'teacher' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <span className="inline-block rounded-lg bg-[#0F2942] px-2.5 py-0.5 text-[12px] font-bold text-white">
                {simulation.teacherGuide.durationSuggestion}
              </span>
              <h4 className="text-[16px] font-bold text-[#0F2942]">
                Tiến trình tổ chức dạy học gợi ý
              </h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-slate-700">
                {simulation.teacherGuide.classroomFlow.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
              <h4 className="text-[15px] font-bold text-[#0F2942]">Câu hỏi gợi mở thảo luận lớp</h4>
              <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-slate-800">
                {simulation.teacherGuide.discussionPrompts.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 space-y-1.5 text-[14px] text-amber-950">
              <p className="font-bold">Lưu ý sư phạm & tính minh bạch học liệu</p>
              <p>{simulation.teacherGuide.cautionNote}</p>
              <p className="text-[13px] opacity-90">{simulation.reconstructionNotice}</p>
              <p className="text-[13px] font-semibold">
                Trạng thái nguồn: {simulation.sourceVerificationStatus} — {simulation.sourceCitation}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <label
                htmlFor="teacher-custom-excerpt"
                className="block text-[15px] font-bold text-[#0F2942]"
              >
                Trích đoạn SGK / Ghi chú giảng dạy riêng của giáo viên
              </label>
              <p className="text-[13px] text-slate-500">
                Dán đoạn văn bản đối chiếu từ bản in SGK của lớp hoặc câu hỏi mở rộng (lưu cục bộ trên trình duyệt).
              </p>
              <textarea
                id="teacher-custom-excerpt"
                rows={4}
                value={progress.customTeacherText ?? ''}
                onChange={(e) => onUpdateCustomTeacherText(e.target.value)}
                placeholder="Nhập trích đoạn SGK hoặc dặn dò riêng cho lớp học..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/60 p-3 text-[14px] text-slate-800 focus:border-[#1D63ED] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
