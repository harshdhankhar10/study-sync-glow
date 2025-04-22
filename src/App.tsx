import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HelpCenter from "./pages/dashboard/HelpCenter";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/dashboard/Dashboard";
import Schedule from "./pages/dashboard/Schedule";
import Availability from "./pages/dashboard/Availability";
import Goals from "./pages/dashboard/Goals";
import Skills from "./pages/dashboard/Skills";
import Notes from "./pages/dashboard/Notes";
import Tasks from "./pages/dashboard/Tasks";
import Progress from "./pages/dashboard/Progress";
import StudyGroups from "./pages/dashboard/StudyGroups";
import AIInsights from "./pages/dashboard/AIInsights";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import GroupMatch from "./pages/dashboard/GroupMatch";
import Streaks from "./pages/dashboard/Streaks";
import StudyBuddy from "./pages/dashboard/StudyBuddy";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import MotivationCenter from "./pages/dashboard/MotivationCenter";
import SkillMatchGrid from "./pages/dashboard/SkillMatchGrid";
import AILearningHub from "./pages/dashboard/AILearningHub";
import FlashcardsQuizzes from "./pages/dashboard/FlashcardsQuizzes";
import Documentation from "./pages/Documentation";
import StudyGroupDetail from "./pages/dashboard/StudyGroupDetail";
import StudyStatisticsPage from "./pages/dashboard/StudyStatistics";
import StudyPromptGenerator from "./pages/dashboard/StudyPromptGenerator";
import Gamification from "./pages/dashboard/Gamification";
import JournalPage from "./pages/dashboard/JournalPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/schedule" element={<ProtectedRoute><DashboardLayout><Schedule /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/availability" element={<ProtectedRoute><DashboardLayout><Availability /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/goals" element={<ProtectedRoute><DashboardLayout><Goals /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/skills" element={<ProtectedRoute><DashboardLayout><Skills /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/notes" element={<ProtectedRoute><DashboardLayout><Notes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/tasks" element={<ProtectedRoute><DashboardLayout><Tasks /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/progress" element={<ProtectedRoute><DashboardLayout><Progress /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/study-groups" element={<ProtectedRoute><DashboardLayout><StudyGroups /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/study-groups/:groupId" element={<ProtectedRoute><DashboardLayout><StudyGroupDetail /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/ai-insights" element={<ProtectedRoute><DashboardLayout><AIInsights /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/ai-learning-hub" element={<ProtectedRoute><DashboardLayout><AILearningHub /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/group-match" element={<ProtectedRoute><DashboardLayout><GroupMatch /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/help" element={<ProtectedRoute><DashboardLayout><HelpCenter /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/streaks" element={<ProtectedRoute><DashboardLayout><Streaks /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/study-buddy" element={<ProtectedRoute><DashboardLayout><StudyBuddy /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/motivation" element={<ProtectedRoute><DashboardLayout><MotivationCenter /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/skillmatch-grid" element={<ProtectedRoute><DashboardLayout><SkillMatchGrid /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/flashcards-quizzes" element={<ProtectedRoute><DashboardLayout><FlashcardsQuizzes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/dashboard/study-statistics" element={
          <ProtectedRoute>
            <DashboardLayout>
              <StudyStatisticsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/study-prompt-generator" element={
          <ProtectedRoute>
            <DashboardLayout>
              <StudyPromptGenerator />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/gamification" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Gamification />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/journal" element={
          <ProtectedRoute>
            <DashboardLayout>
              <JournalPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
