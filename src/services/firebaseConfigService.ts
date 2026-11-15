import { db } from '../database/db';
import { UserProfile, UserRole } from '../types';

export interface CloudConnectionStatus {
  firebaseConfigured: boolean;
  mode: 'local-indexeddb' | 'firebase-connected';
  note: string;
}

export function getCloudConnectionStatus(): CloudConnectionStatus {
  // We never claim Firebase is connected unless firebase-applet-config.json is provisioned
  return {
    firebaseConfigured: false,
    mode: 'local-indexeddb',
    note: 'Ứng dụng đang vận hành ở chế độ lưu trữ cục bộ IndexedDB (Dexie.js). Đồng bộ đám mây Firebase Authentication & Firestore chưa được cấp cấu hình dự án.',
  };
}

export async function getActiveUser(): Promise<UserProfile> {
  const storedId = sessionStorage.getItem('smartlit_active_user_id') || 'teacher-dathien';
  const user = await db.users.get(storedId);
  if (user) return user;
  const fallback = await db.users.toCollection().first();
  if (fallback) return fallback;
  const created: UserProfile = {
    id: 'teacher-dathien',
    fullName: 'Thầy Hồ Nguyễn Đa Thiện',
    email: 'dathien2412@gmail.com',
    roles: ['admin', 'teacher'],
    activeRole: 'teacher',
    schoolName: 'Trường THPT Thực hành Smart Literature',
    department: 'Tổ Ngữ văn',
    gradeFocus: '12',
    status: 'active',
    authProvider: 'local',
    updatedAt: new Date().toISOString(),
  };
  await db.users.put(created);
  return created;
}

export async function switchWorkspaceRole(
  userId: string,
  nextRole: UserRole
): Promise<UserProfile | undefined> {
  const user = await db.users.get(userId);
  if (!user || !user.roles.includes(nextRole)) return user;
  const updated: UserProfile = {
    ...user,
    activeRole: nextRole,
    updatedAt: new Date().toISOString(),
  };
  await db.users.put(updated);
  return updated;
}

export async function signInAsPortalUser(userId: string): Promise<UserProfile | undefined> {
  sessionStorage.setItem('smartlit_active_user_id', userId);
  return db.users.get(userId);
}
