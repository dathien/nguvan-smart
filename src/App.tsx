/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ensureDatabaseSeeded } from './database/db';
import { MainLayout } from './layouts/MainLayout';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AccountPage } from './pages/AccountPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { BackupRestorePage } from './pages/BackupRestorePage';
import { ClassroomPage } from './pages/ClassroomPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExamBankPage } from './pages/ExamBankPage';
import { ExamEditorPage } from './pages/ExamEditorPage';
import { ExamPracticePage } from './pages/ExamPracticePage';
import { GamesPage } from './pages/GamesPage';
import { GradingPage } from './pages/GradingPage';
import { HelpPage } from './pages/HelpPage';
import { HomePage } from './pages/HomePage';
import { LessonPlanPage } from './pages/LessonPlanPage';
import { MatrixSpecPage } from './pages/MatrixSpecPage';
import { MindMapPage } from './pages/MindMapPage';
import { PassageBankPage } from './pages/PassageBankPage';
import { PracticeLabPage } from './pages/PracticeLabPage';
import { PresentationPage } from './pages/PresentationPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { RubricGuidePage } from './pages/RubricGuidePage';
import { SettingsPage } from './pages/SettingsPage';
import { WorksheetPage } from './pages/WorksheetPage';
import { WritingStudioPage } from './pages/WritingStudioPage';
import {
  getActiveUser,
  signInAsPortalUser,
  switchWorkspaceRole,
} from './services/firebaseConfigService';
import { UserProfile, UserRole } from './types';

const DEFAULT_FALLBACK_USER: UserProfile = {
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

export default function App() {
  const [activeUser, setActiveUser] = useState<UserProfile>(DEFAULT_FALLBACK_USER);

  useEffect(() => {
    (async () => {
      await ensureDatabaseSeeded();
      const loaded = await getActiveUser();
      setActiveUser(loaded);
    })();
  }, []);

  const handleSwitchRole = async (nextRole: UserRole) => {
    const updated = await switchWorkspaceRole(activeUser.id, nextRole);
    if (updated) {
      setActiveUser(updated);
    }
  };

  const handleSelectPortal = async (portal: 'teacher' | 'student') => {
    if (portal === 'student') {
      const stu = await signInAsPortalUser('student-demo-12a1');
      if (stu) setActiveUser(stu);
    } else {
      const teacher = await signInAsPortalUser('teacher-dathien');
      if (teacher) setActiveUser(teacher);
    }
  };

  const handleSwitchPortalUser = async (userId: string) => {
    const user = await signInAsPortalUser(userId);
    if (user) setActiveUser(user);
  };

  return (
    <BrowserRouter>
      <MainLayout activeUser={activeUser} onSwitchRole={handleSwitchRole}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                activeUser={activeUser}
                onSelectPortal={handleSelectPortal}
              />
            }
          />
          <Route
            path="/tong-quan"
            element={<DashboardPage activeUser={activeUser} />}
          />
          <Route path="/soan-de" element={<ExamEditorPage />} />
          <Route path="/ma-tran-dac-ta" element={<MatrixSpecPage />} />
          <Route path="/huong-dan-cham" element={<RubricGuidePage />} />
          <Route path="/ngan-hang-cau-hoi" element={<QuestionBankPage />} />
          <Route path="/kho-de" element={<ExamBankPage />} />
          <Route path="/ngan-hang-ngu-lieu" element={<PassageBankPage />} />
          <Route path="/ke-hoach-bai-day" element={<LessonPlanPage />} />
          <Route path="/bai-giang" element={<PresentationPage />} />
          <Route path="/so-do-tu-duy" element={<MindMapPage />} />
          <Route path="/phieu-hoc-tap" element={<WorksheetPage />} />
          <Route
            path="/kham-pha-tho"
            element={<PracticeLabPage initialMode="tho" />}
          />
          <Route
            path="/kham-pha-truyen"
            element={<PracticeLabPage initialMode="truyen" />}
          />
          <Route path="/luyen-viet" element={<WritingStudioPage />} />
          <Route path="/luyen-thi-thpt" element={<ExamPracticePage />} />
          <Route path="/tro-choi" element={<GamesPage />} />
          <Route
            path="/lop-hoc"
            element={<ClassroomPage activeUser={activeUser} />}
          />
          <Route
            path="/giao-bai"
            element={<AssignmentsPage activeUser={activeUser} />}
          />
          <Route path="/cham-bai" element={<GradingPage />} />
          <Route path="/thong-ke" element={<AnalyticsPage />} />
          <Route path="/tro-ly-ai" element={<AIAssistantPage />} />
          <Route path="/sao-luu" element={<BackupRestorePage />} />
          <Route
            path="/tai-khoan"
            element={
              <AccountPage
                activeUser={activeUser}
                onSwitchRole={handleSwitchRole}
                onSwitchPortalUser={handleSwitchPortalUser}
                onUserUpdated={setActiveUser}
              />
            }
          />
          <Route path="/huong-dan-su-dung" element={<HelpPage />} />
          <Route path="/cai-dat" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
