import { db } from '../../../database/db';
import {
  SimulationDefinition,
  SimulationGroup,
  SimulationOfflinePack,
  SimulationProgressRecord,
} from '../types';
import { loadSimulationById, loadSimulationsByGroup } from '../data/registry';

const PACK_VERSION = '2026.2-diorama';

export function createEmptyProgress(simId: string): SimulationProgressRecord {
  const now = new Date().toISOString();
  return {
    simId,
    visitedHotspots: [],
    completedStages: [],
    completedTasks: [],
    answers: {},
    progressPercent: 0,
    favorite: false,
    lastStageIndex: 0,
    notes: '',
    customTeacherText: '',
    lastViewedAt: now,
    updatedAt: now,
  };
}

export function computeProgressPercent(
  record: SimulationProgressRecord,
  sim: SimulationDefinition
): number {
  const hsWeight = 35;
  const stageWeight = 35;
  const quizWeight = 30;

  const hsRatio =
    sim.hotspots.length > 0
      ? Math.min(1, record.visitedHotspots.length / sim.hotspots.length)
      : 1;
  const stRatio =
    sim.stages.length > 0
      ? Math.min(1, record.completedStages.length / sim.stages.length)
      : 1;
  const answeredCount = Object.keys(record.answers).filter(
    (k) => record.answers[k]?.trim().length > 0
  ).length;
  const qRatio =
    sim.questions.length > 0
      ? Math.min(1, answeredCount / sim.questions.length)
      : 1;

  return Math.round(hsRatio * hsWeight + stRatio * stageWeight + qRatio * quizWeight);
}

export async function getSimulationProgress(
  simId: string
): Promise<SimulationProgressRecord> {
  const found = await db.simulationProgress.get(simId);
  return found ?? createEmptyProgress(simId);
}

export async function getAllSimulationProgress(): Promise<
  Record<string, SimulationProgressRecord>
> {
  const rows = await db.simulationProgress.toArray();
  const map: Record<string, SimulationProgressRecord> = {};
  for (const row of rows) {
    map[row.simId] = row;
  }
  return map;
}

export async function saveSimulationProgress(
  record: SimulationProgressRecord
): Promise<void> {
  const now = new Date().toISOString();
  await db.simulationProgress.put({
    ...record,
    updatedAt: now,
    lastViewedAt: now,
  });
}

export async function toggleSimulationFavorite(simId: string): Promise<boolean> {
  const existing = await getSimulationProgress(simId);
  const nextFav = !existing.favorite;
  await saveSimulationProgress({ ...existing, favorite: nextFav });
  return nextFav;
}

export async function resetSimulationProgress(simId: string): Promise<SimulationProgressRecord> {
  const existing = await getSimulationProgress(simId);
  const clean: SimulationProgressRecord = {
    ...createEmptyProgress(simId),
    favorite: existing.favorite,
    customTeacherText: existing.customTeacherText,
  };
  await saveSimulationProgress(clean);
  return clean;
}

/* ==================== OFFLINE PACKS (INDEXEDDB) ==================== */

export async function getOfflinePack(
  simId: string
): Promise<SimulationOfflinePack | undefined> {
  return db.simulationOfflinePacks.get(simId);
}

export async function getAllOfflinePacks(): Promise<Record<string, SimulationOfflinePack>> {
  const rows = await db.simulationOfflinePacks.toArray();
  const map: Record<string, SimulationOfflinePack> = {};
  for (const row of rows) {
    map[row.simId] = row;
  }
  return map;
}

export async function downloadSingleOfflinePack(
  simId: string
): Promise<SimulationOfflinePack | null> {
  const sim = await loadSimulationById(simId);
  if (!sim) return null;
  const serialized = JSON.stringify(sim);
  const sizeBytes = new Blob([serialized]).size;
  const pack: SimulationOfflinePack = {
    simId: sim.id,
    group: sim.group,
    sizeBytes,
    downloadedAt: new Date().toISOString(),
    version: PACK_VERSION,
    payload: sim,
  };
  await db.simulationOfflinePacks.put(pack);
  return pack;
}

export async function downloadGroupOfflinePacks(
  group: SimulationGroup,
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  const sims = await loadSimulationsByGroup(group);
  let done = 0;
  for (const sim of sims) {
    const serialized = JSON.stringify(sim);
    const sizeBytes = new Blob([serialized]).size;
    await db.simulationOfflinePacks.put({
      simId: sim.id,
      group: sim.group,
      sizeBytes,
      downloadedAt: new Date().toISOString(),
      version: PACK_VERSION,
      payload: sim,
    });
    done += 1;
    onProgress?.(done, sims.length);
  }
  return done;
}

export async function removeOfflinePack(simId: string): Promise<void> {
  await db.simulationOfflinePacks.delete(simId);
}

export async function loadSimulationOfflineFirst(
  simId: string
): Promise<SimulationDefinition | null> {
  const pack = await db.simulationOfflinePacks.get(simId);
  if (pack?.payload) return pack.payload;
  const loaded = await loadSimulationById(simId);
  return loaded ?? null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
