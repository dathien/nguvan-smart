import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  HardDrive,
  Heart,
  Layers,
  PlayCircle,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { SIMULATION_CATALOG } from '../features/simulations/data/registry';
import {
  SimulationGroup,
  SimulationOfflinePack,
  SimulationProgressRecord,
} from '../features/simulations/types';
import { matchesVietnameseQuery } from '../features/simulations/utils/labelLayout';
import {
  downloadGroupOfflinePacks,
  downloadSingleOfflinePack,
  formatBytes,
  getAllOfflinePacks,
  getAllSimulationProgress,
  removeOfflinePack,
  toggleSimulationFavorite,
} from '../features/simulations/services/simulationStorage';
import { LessonThumbnail } from '../features/simulations/components/LessonThumbnails';

type CatalogTab = 'all' | 'grade10' | 'grade11' | 'grade12' | 'skills' | 'recent' | 'favorites';

export default function SimulationsCatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('all');
  const [query, setQuery] = useState('');
  const [textbookFilter, setTextbookFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [showOfflineManager, setShowOfflineManager] = useState(false);

  const [progressMap, setProgressMap] = useState<Record<string, SimulationProgressRecord>>({});
  const [offlineMap, setOfflineMap] = useState<Record<string, SimulationOfflinePack>>({});
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [downloadNote, setDownloadNote] = useState<string>('');

  const refreshLocalState = async () => {
    const [prog, packs] = await Promise.all([
      getAllSimulationProgress(),
      getAllOfflinePacks(),
    ]);
    setProgressMap(prog);
    setOfflineMap(packs);
  };

  useEffect(() => {
    refreshLocalState();
  }, []);

  const genres = useMemo(
    () => Array.from(new Set(SIMULATION_CATALOG.map((c) => c.genre))).sort(),
    []
  );

  const filteredItems = useMemo(() => {
    return SIMULATION_CATALOG.filter((item) => {
      if (activeTab === 'grade10' && item.group !== 'grade10') return false;
      if (activeTab === 'grade11' && item.group !== 'grade11') return false;
      if (activeTab === 'grade12' && item.group !== 'grade12') return false;
      if (activeTab === 'skills' && item.group !== 'skills') return false;
      if (activeTab === 'recent' && !progressMap[item.id]?.lastViewedAt) return false;
      if (activeTab === 'favorites' && !progressMap[item.id]?.favorite) return false;

      if (textbookFilter !== 'all') {
        const hasSeries =
          item.textbooks.includes(textbookFilter as never) ||
          item.textbooks.includes('Học liệu dùng chung 3 bộ sách');
        if (!hasSeries) return false;
      }
      if (genreFilter !== 'all' && item.genre !== genreFilter) return false;
      if (modeFilter === '3d' && item.mode !== 'both' && item.mode !== '3d') return false;
      if (modeFilter === '2d' && item.mode !== '2d') return false;
      if (domainFilter !== 'all' && item.skillDomain !== domainFilter) return false;

      if (query.trim()) {
        const haystack = `${item.number} ${item.title} ${item.workTitle} ${item.author} ${item.genre} ${item.shortSummary} ${item.textbooks.join(' ')}`;
        if (!matchesVietnameseQuery(haystack, query)) return false;
      }
      return true;
    });
  }, [
    activeTab,
    textbookFilter,
    genreFilter,
    modeFilter,
    domainFilter,
    query,
    progressMap,
  ]);

  const stats = useMemo(() => {
    const cachedCount = Object.keys(offlineMap).length;
    const totalBytes = Object.values(offlineMap).reduce((sum, p) => sum + p.sizeBytes, 0);
    const favCount = Object.values(progressMap).filter((p) => p.favorite).length;
    const viewedCount = Object.values(progressMap).filter((p) => p.lastViewedAt).length;
    return { cachedCount, totalBytes, favCount, viewedCount };
  }, [offlineMap, progressMap]);

  const handleToggleFavorite = async (e: React.MouseEvent, simId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleSimulationFavorite(simId);
    await refreshLocalState();
  };

  const handleDownloadSingle = async (e: React.MouseEvent, simId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloadingKey(simId);
    try {
      await downloadSingleOfflinePack(simId);
      await refreshLocalState();
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleRemoveSingle = async (e: React.MouseEvent, simId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await removeOfflinePack(simId);
    await refreshLocalState();
  };

  const handleDownloadGroup = async (group: SimulationGroup, label: string) => {
    setDownloadingKey(group);
    setDownloadNote(`Đang lưu gói offline ${label}...`);
    try {
      const count = await downloadGroupOfflinePacks(group, (done, total) => {
        setDownloadNote(`Đang lưu ${label}: ${done}/${total} bài...`);
      });
      await refreshLocalState();
      setDownloadNote(`Đã lưu xong ${count} bài thuộc ${label} vào bộ nhớ offline.`);
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      {/* Hero Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0F2942] via-[#153B62] to-[#1D63ED] p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1 text-[13px] font-bold tracking-wide text-blue-100">
              <Sparkles className="h-4 w-4" />
              <span>CHƯƠNG TRÌNH GDPT 2018 · NGỮ VĂN THPT 10–11–12 & GDTX</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Khám phá Ngữ văn 2D/3D
            </h1>
            <p className="text-[16px] sm:text-[17px] font-medium text-blue-100">
              “Trải nghiệm tác phẩm – Thấu hiểu nhân vật – Phát triển năng lực đọc hiểu”
            </p>
            <p className="text-[15px] leading-relaxed text-slate-200">
              Đủ trọn bộ 40 bài mô phỏng tương tác 3D trực quan và sơ đồ phân tích 2D cho Ngữ văn 10, 11, 12
              cùng 10 chuyên đề Kiến thức &amp; Kĩ năng. Hoạt động miễn phí, không cần API Key, hỗ trợ lưu dùng offline.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
            <button
              type="button"
              onClick={() => setShowOfflineManager((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-[15px] font-bold text-[#0F2942] shadow-md transition hover:bg-blue-50"
            >
              <HardDrive className="h-5 w-5 text-[#1D63ED]" />
              <span>Gói học offline ({stats.cachedCount}/40 bài)</span>
            </button>
            <div className="flex flex-wrap gap-2 text-[13px] font-semibold text-blue-100">
              <span className="rounded-xl bg-white/10 px-3 py-1.5">26 cảnh 3D + 2D</span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5">14 mô phỏng &amp; phòng thực hành 2D</span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5">
                Đã lưu: {formatBytes(stats.totalBytes)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Collapsible Offline Pack Manager */}
      {showOfflineManager && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[17px] font-bold text-[#0F2942]">
                Quản lí gói học liệu Khám phá 2D/3D ngoại tuyến (Offline)
              </h2>
              <p className="text-[14px] text-slate-700">
                Tải trước dữ liệu mô phỏng vào bộ nhớ IndexedDB của thiết bị để giảng dạy và học tập ổn định khi phòng học không có Internet.
              </p>
            </div>
            {downloadNote && (
              <span className="rounded-xl bg-white px-3 py-1.5 text-[14px] font-bold text-[#1D63ED] border border-blue-200">
                {downloadNote}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { group: 'grade10', label: 'Ngữ văn 10 (10 bài)' },
                { group: 'grade11', label: 'Ngữ văn 11 (10 bài)' },
                { group: 'grade12', label: 'Ngữ văn 12 (10 bài)' },
                { group: 'skills', label: 'Kiến thức & Kĩ năng (10 bài)' },
              ] as { group: SimulationGroup; label: string }[]
            ).map((g) => {
              const cachedInGroup = SIMULATION_CATALOG.filter(
                (c) => c.group === g.group && offlineMap[c.id]
              ).length;
              const isBusy = downloadingKey === g.group;
              return (
                <div
                  key={g.group}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div>
                    <p className="text-[15px] font-bold text-[#0F2942]">{g.label}</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Đã lưu offline: <strong>{cachedInGroup}/10</strong> bài
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDownloadGroup(g.group, g.label)}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1D63ED] px-3 py-2 text-[14px] font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    <span>{isBusy ? 'Đang tải...' : cachedInGroup === 10 ? 'Cập nhật gói' : 'Tải cả khối'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {(
          [
            { id: 'all', label: 'Tất cả (40)' },
            { id: 'grade10', label: 'Ngữ văn 10 (10)' },
            { id: 'grade11', label: 'Ngữ văn 11 (10)' },
            { id: 'grade12', label: 'Ngữ văn 12 (10)' },
            { id: 'skills', label: 'Kiến thức & Kĩ năng (10)' },
            { id: 'recent', label: `Đã xem (${stats.viewedCount})` },
            { id: 'favorites', label: `Yêu thích (${stats.favCount})` },
          ] as { id: CatalogTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-[15px] font-bold transition ${
              activeTab === tab.id
                ? 'bg-[#1D63ED] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-[#0F2942] hover:bg-blue-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Multi-Facet Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tác phẩm, tác giả, kĩ năng (có hoặc không dấu)..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-[15px] text-slate-800 focus:border-[#1D63ED] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          aria-label="Lọc theo bộ sách"
          value={textbookFilter}
          onChange={(e) => setTextbookFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[14px] font-medium text-slate-800 focus:border-[#1D63ED] focus:outline-none"
        >
          <option value="all">Tất cả 3 bộ sách</option>
          <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức</option>
          <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
          <option value="Cánh Diều">Cánh Diều</option>
        </select>

        <select
          aria-label="Lọc theo thể loại"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[14px] font-medium text-slate-800 focus:border-[#1D63ED] focus:outline-none"
        >
          <option value="all">Mọi thể loại</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          aria-label="Lọc theo chế độ 2D/3D"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[14px] font-medium text-slate-800 focus:border-[#1D63ED] focus:outline-none"
        >
          <option value="all">Cả 2D và 3D</option>
          <option value="3d">Có không gian 3D</option>
          <option value="2d">Chuyên sâu 2D</option>
        </select>

        <select
          aria-label="Lọc theo nhóm kĩ năng"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[14px] font-medium text-slate-800 focus:border-[#1D63ED] focus:outline-none"
        >
          <option value="all">Mọi nhóm nội dung</option>
          <option value="Tác phẩm văn học">Tác phẩm văn học</option>
          <option value="Kiến thức tiếng Việt">Kiến thức tiếng Việt</option>
          <option value="Kĩ năng đọc">Kĩ năng đọc</option>
          <option value="Kĩ năng viết">Kĩ năng viết</option>
        </select>
      </div>

      {/* Result Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[14px] text-slate-600">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#1D63ED]" />
          <span>
            Đang hiển thị <strong className="text-[#0F2942]">{filteredItems.length}</strong> / 40 mô phỏng
          </span>
        </div>
        {(query || textbookFilter !== 'all' || genreFilter !== 'all' || modeFilter !== 'all' || domainFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setTextbookFilter('all');
              setGenreFilter('all');
              setModeFilter('all');
              setDomainFilter('all');
            }}
            className="font-bold text-[#1D63ED] hover:underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 40-Lesson Responsive Card Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-2">
          <p className="text-[17px] font-bold text-[#0F2942]">
            Chưa tìm thấy mô phỏng phù hợp với bộ lọc hiện tại
          </p>
          <p className="text-[15px] text-slate-600">
            Thầy/cô hoặc các em hãy thử xóa từ khóa tìm kiếm hoặc chọn mục “Tất cả (40)”.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const prog = progressMap[item.id];
            const pct = prog?.progressPercent ?? 0;
            const isFav = !!prog?.favorite;
            const offlinePack = offlineMap[item.id];
            const isOffline = !!offlinePack;
            const isBusy = downloadingKey === item.id;
            const modeLabel = item.mode === 'both' ? '3D + 2D' : item.mode === '3d' ? '3D' : '2D';

            return (
              <Link
                key={item.id}
                to={`/kham-pha-2d-3d/${item.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#1D63ED] hover:shadow-md"
              >
                {/* 16:9 Unique Thumbnail — ZERO text baked inside artwork, ONE single mode badge */}
                <div className="relative overflow-hidden border-b border-slate-100">
                  <LessonThumbnail
                    id={item.id}
                    title={item.title}
                    scene3DPreset={item.scene3DPreset}
                    palette={item.palette}
                  />

                  {/* Lesson Number discreet corner tag */}
                  <span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-[#0F2942]/88 px-2.5 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm">
                    #{String(item.number).padStart(2, '0')}
                  </span>

                  {/* Single Mode Badge + Favorite Button (zero duplicate/overlapping labels) */}
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-bold shadow-sm ${
                        item.mode === 'both' || item.mode === '3d'
                          ? 'bg-[#1D63ED] text-white'
                          : 'border border-slate-200 bg-white/95 text-[#0F2942]'
                      }`}
                    >
                      {item.mode === 'both' || item.mode === '3d' ? (
                        <Box className="h-3.5 w-3.5" />
                      ) : (
                        <Layers className="h-3.5 w-3.5" />
                      )}
                      <span>{modeLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, item.id)}
                      aria-label={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                      className={`rounded-lg p-1.5 shadow-sm transition ${
                        isFav
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/95 text-slate-600 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4 space-y-2.5">
                  {/* Clean unboxed editorial metadata line */}
                  <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-slate-600">
                    <span className="truncate">
                      <span className="font-bold text-[#0F2942]">Lớp {item.grades.join(', ')}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="text-[#1D63ED]">{item.genre}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {item.estimatedMinutes} phút
                    </span>
                  </div>

                  <div>
                    <h3 className="text-[18px] font-bold leading-snug text-[#0F2942] group-hover:text-[#1D63ED]">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-[14px] font-medium text-slate-500">{item.author}</p>
                  </div>

                  <p className="line-clamp-2 flex-1 text-[15px] leading-relaxed text-slate-700">
                    {item.shortSummary}
                  </p>

                  {/* Uniformly Aligned Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[13px] font-semibold text-slate-600">
                      <span>Tiến độ khám phá</span>
                      <span className="text-[#0F2942]">{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#1D63ED] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Uniformly Aligned Card Footer: Explore CTA + Real Offline Pack */}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-[#1D63ED]">
                      <PlayCircle className="h-4 w-4" />
                      <span>{pct > 0 ? 'Tiếp tục khám phá' : 'Bắt đầu khám phá'}</span>
                    </span>

                    {isOffline ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{formatBytes(offlinePack.sizeBytes)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSingle(e, item.id)}
                          title="Xóa bản lưu offline của bài này"
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={(e) => handleDownloadSingle(e, item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[13px] font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-[#1D63ED]"
                        title="Lưu bài mô phỏng để dùng offline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isBusy ? 'Đang lưu...' : 'Lưu offline'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
