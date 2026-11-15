import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  FileText,
  Smartphone,
} from 'lucide-react';
import { db, ensureDatabaseSeeded } from '../database/db';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getCloudConnectionStatus } from '../services/firebaseConfigService';
import { AppSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const cloudStatus = getCloudConnectionStatus();

  const [settings, setSettings] = useState<AppSettings>({
    id: 'default',
    defaultSchoolName: 'TRƯỜNG THPT',
    defaultDepartmentName: 'TỔ NGỮ VĂN',
    defaultAcademicYear: '2025 - 2026',
    wordFontFamily: 'Times New Roman',
    wordFontSizePt: 13,
    wordLineSpacing: 1.35,
    wordMarginsMm: { top: 20, bottom: 20, left: 25, right: 15 },
  });
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    (async () => {
      await ensureDatabaseSeeded();
      const s = await db.settings.get('default');
      if (s) setSettings(s);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.put(settings);
    setSavedNotice('Đã lưu thông tin đơn vị cho đề mới và định dạng tài liệu.');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="border-b border-[#E5E0D8] pb-5">
        <h1 className="font-serif text-2xl font-bold text-[#0F2942]">
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Thiết lập thông số hành chính mặc định, khổ chữ xuất Word / PDF và quản lý trạng thái ứng dụng ngoại tuyến PWA.
        </p>
      </div>

      {savedNotice && (
        <div className="bg-[#0D7A6F]/10 border border-[#0D7A6F]/30 text-[#0F2942] rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0D7A6F]" />
            {savedNotice}
          </span>
          <button
            type="button"
            onClick={() => setSavedNotice('')}
            className="text-xs font-semibold text-[#0D7A6F] hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl border border-[#E5E0D8] p-6 space-y-6"
      >
        <div className="flex items-center gap-2 text-base font-bold text-[#0F2942]">
          <FileText className="w-4 h-4 text-[#0D7A6F]" />
          Thông tin hành chính & Định dạng xuất Word / In A4
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên trường mặc định
            </label>
            <input
              type="text"
              placeholder="Nhập tên trường thực tế"
              value={settings.defaultSchoolName}
              onChange={(e) =>
                setSettings({ ...settings, defaultSchoolName: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tổ chuyên môn mặc định
            </label>
            <input
              type="text"
              value={settings.defaultDepartmentName}
              onChange={(e) =>
                setSettings({ ...settings, defaultDepartmentName: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Năm học mặc định
            </label>
            <input
              type="text"
              value={settings.defaultAcademicYear}
              onChange={(e) =>
                setSettings({ ...settings, defaultAcademicYear: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phông chữ xuất Word
            </label>
            <select
              value={settings.wordFontFamily}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  wordFontFamily: e.target.value as 'Times New Roman' | 'Be Vietnam Pro',
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="Times New Roman">Times New Roman (Chuẩn hành chính)</option>
              <option value="Be Vietnam Pro">Be Vietnam Pro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cỡ chữ (pt)
            </label>
            <input
              type="number"
              min={11}
              max={16}
              value={settings.wordFontSizePt}
              onChange={(e) =>
                setSettings({ ...settings, wordFontSizePt: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giãn dòng
            </label>
            <input
              type="number"
              step="0.05"
              min={1.0}
              max={2.0}
              value={settings.wordLineSpacing}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  wordLineSpacing: Number(e.target.value),
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Lề trang A4 (mm) theo Nghị định 30/2020/NĐ-CP
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
              <div key={side}>
                <label className="block text-[11px] text-slate-500 mb-1">
                  {side === 'top'
                    ? 'Lề trên (mm)'
                    : side === 'bottom'
                    ? 'Lề dưới (mm)'
                    : side === 'left'
                    ? 'Lề trái (mm)'
                    : 'Lề phải (mm)'}
                </label>
                <input
                  type="number"
                  min={10}
                  max={40}
                  value={settings.wordMarginsMm[side]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      wordMarginsMm: {
                        ...settings.wordMarginsMm,
                        [side]: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#0F2942] text-white text-sm font-semibold hover:bg-[#173B5E]"
          >
            Lưu cấu hình mặc định
          </button>
        </div>
      </form>

      {/* PWA & Storage Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F2942]">
            <Smartphone className="w-4 h-4 text-[#0D7A6F]" />
            Ứng dụng Ngoại tuyến (PWA)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Trạng thái mạng hiện tại:{' '}
            <strong>{isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}</strong>.
            Service Worker giúp bạn tiếp tục soạn đề, xem kho dữ liệu, trình chiếu và xuất tài liệu ngay cả khi mất Internet.
          </p>
          {isInstalled ? (
            <div className="text-xs font-semibold text-[#0D7A6F]">
              Ứng dụng đã được cài đặt trên thiết bị này.
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D7A6F] text-white text-xs font-semibold hover:bg-[#0B665D]"
            >
              <Download className="w-4 h-4" />
              Cài đặt ứng dụng về màn hình chính
            </button>
          ) : isIOS ? (
            <p className="text-xs text-slate-600">
              Trên iPhone/iPad: mở bằng Safari → nhấn nút <strong>Chia sẻ</strong> → chọn{' '}
              <strong>Thêm vào Màn hình chính</strong>.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Bạn có thể cài đặt ứng dụng từ biểu tượng cài đặt trên thanh địa chỉ trình duyệt Chrome hoặc Edge.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E5E0D8] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F2942]">
            <Database className="w-4 h-4 text-[#0D7A6F]" />
            Lưu trữ dữ liệu & Đồng bộ
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {cloudStatus.note}
          </p>
          <p className="text-xs text-slate-500">
            Khuyên dùng tính năng <strong>Sao lưu và phục hồi (.zip)</strong> định kỳ để bảo toàn dữ liệu khi đổi trình duyệt hoặc thiết bị.
          </p>
        </div>
      </div>
    </div>
  );
};
