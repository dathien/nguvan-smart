import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  RefreshCw,
  Upload,
} from 'lucide-react';
import {
  buildBackupPayload,
  exportFullBackupZip,
  FullBackupPayload,
  parseBackupFile,
  restoreBackupPayload,
} from '../services/zipBundleService';
import { triggerBlobDownload } from '../services/wordExportService';

export const BackupRestorePage: React.FC = () => {
  const [summary, setSummary] = useState({
    exams: 0,
    passages: 0,
    questions: 0,
    lessonPlans: 0,
    presentations: 0,
    mindMaps: 0,
    worksheets: 0,
  });
  const [pendingPayload, setPendingPayload] = useState<FullBackupPayload | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refreshSummary = async () => {
    const p = await buildBackupPayload();
    setSummary({
      exams: p.data.exams.length,
      passages: p.data.passages.length,
      questions: p.data.questions.length,
      lessonPlans: p.data.lessonPlans.length,
      presentations: p.data.presentations.length,
      mindMaps: p.data.mindMaps.length,
      worksheets: p.data.worksheets.length,
    });
  };

  useEffect(() => {
    refreshSummary();
  }, []);

  const handleSelectRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setMessage('');
    try {
      const parsed = await parseBackupFile(file);
      setPendingPayload(parsed);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Tệp sao lưu không hợp lệ.'
      );
      setPendingPayload(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingPayload) return;
    const stats = await restoreBackupPayload(pendingPayload, restoreMode);
    setPendingPayload(null);
    await refreshSummary();
    setMessage(
      `Đã phục hồi thành công (${stats.exams} đề kiểm tra, ${stats.passages} ngữ liệu, ${stats.questions} câu hỏi).`
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-[#E5E0D8] pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
          Sao lưu và Phục hồi dữ liệu đổi máy
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Đóng gói toàn bộ đề thi, ngữ liệu, câu hỏi, bài giảng kèm tệp tra cứu MUC-LUC-KHO-DE.html (không chứa mật khẩu hoặc khóa bí mật)
        </p>
      </div>

      {/* Current Local Storage Overview */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] p-5">
        <h2 className="text-sm font-bold text-[#0F2942] mb-3">
          Dữ liệu hiện đang lưu trữ trên máy này
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#FAF8F5] border border-slate-200">
            <div className="text-xl font-bold font-mono tabular-nums text-[#0F2942]">
              {summary.exams}
            </div>
            <div className="text-slate-600 mt-0.5">Đề kiểm tra</div>
          </div>
          <div className="p-3 rounded-lg bg-[#FAF8F5] border border-slate-200">
            <div className="text-xl font-bold font-mono tabular-nums text-[#0F2942]">
              {summary.passages}
            </div>
            <div className="text-slate-600 mt-0.5">Ngữ liệu</div>
          </div>
          <div className="p-3 rounded-lg bg-[#FAF8F5] border border-slate-200">
            <div className="text-xl font-bold font-mono tabular-nums text-[#0F2942]">
              {summary.questions}
            </div>
            <div className="text-slate-600 mt-0.5">Câu hỏi</div>
          </div>
          <div className="p-3 rounded-lg bg-[#FAF8F5] border border-slate-200">
            <div className="text-xl font-bold font-mono tabular-nums text-[#0F2942]">
              {summary.lessonPlans + summary.presentations + summary.worksheets}
            </div>
            <div className="text-slate-600 mt-0.5">KHBD, Slide & Phiếu</div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-base text-[#0F2942]">
              <Archive className="w-5 h-5 text-[#0D7A6F]" />
              Xuất gói sao lưu đổi máy (.ZIP)
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Bao gồm tệp dữ liệu JSON có kiểm soát phiên bản, thư mục đề thi, thư mục ngữ liệu và trang web tra cứu offline <strong>MUC-LUC-KHO-DE.html</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportFullBackupZip}
              className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold hover:bg-[#173B5E] inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Tải gói sao lưu ZIP
            </button>
            <button
              type="button"
              onClick={async () => {
                const payload = await buildBackupPayload();
                const blob = new Blob([JSON.stringify(payload, null, 2)], {
                  type: 'application/json',
                });
                triggerBlobDownload(
                  blob,
                  `Sao_luu_VanHocThongMinh_${new Date().toISOString().slice(0, 10)}.json`
                );
              }}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50"
            >
              Tải JSON thuần
            </button>
          </div>
        </div>

        {/* Restore Box */}
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-base text-[#0F2942]">
              <RefreshCw className="w-5 h-5 text-[#0F2942]" />
              Phục hồi dữ liệu từ tệp ZIP / JSON
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Hệ thống sẽ kiểm tra tính hợp lệ của dữ liệu và cho phép chọn chế độ hợp nhất (giữ dữ liệu hiện có) hoặc thay thế có xác nhận.
            </p>
          </div>
          <label className="w-fit px-4 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D] cursor-pointer inline-flex items-center gap-1.5">
            <Upload className="w-4 h-4" /> Chọn tệp sao lưu (.zip / .json)
            <input
              type="file"
              accept=".zip,.json"
              onChange={handleSelectRestoreFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}

      {pendingPayload && (
        <div className="bg-white rounded-xl border border-[#0F2942] p-5 space-y-4">
          <div className="text-sm font-bold text-[#0F2942]">
            Xác nhận phục hồi gói dữ liệu
          </div>
          <div className="text-xs text-slate-600">
            Tệp chứa: <strong>{pendingPayload.data.exams.length}</strong> đề kiểm tra,{' '}
            <strong>{pendingPayload.data.passages.length}</strong> ngữ liệu,{' '}
            <strong>{pendingPayload.data.questions.length}</strong> câu hỏi.
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="restoreMode"
                checked={restoreMode === 'merge'}
                onChange={() => setRestoreMode('merge')}
              />
              <span>Hợp nhất với dữ liệu hiện tại (An toàn)</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-red-700">
              <input
                type="radio"
                name="restoreMode"
                checked={restoreMode === 'replace'}
                onChange={() => setRestoreMode('replace')}
              />
              <span>Thay thế toàn bộ dữ liệu cũ trên máy này</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmRestore}
              className="px-4 py-2 rounded-lg bg-[#0F2942] text-white text-xs font-semibold"
            >
              Thực hiện phục hồi
            </button>
            <button
              type="button"
              onClick={() => setPendingPayload(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
