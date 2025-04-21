
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import Documentation from './pages/Documentation';
import Index from './pages/Index';

// Dashboard Pages
import DashboardRoutes from './pages/dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Community Forum Pages
import CommunityForum from './pages/dashboard/CommunityForum';
import CreateForumPost from './pages/dashboard/CreateForumPost';
import ForumPostDetail from './pages/dashboard/ForumPostDetail';

import './App.css';
import { Toaster } from './components/ui/toaster';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/documentation" element={<Documentation />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }>
          <Route path="" element={<DashboardRoutes />}>
            {/* Community Forum Routes */}
            <Route path="community-forum" element={<CommunityForum />} />
            <Route path="community-forum/create-post" element={<CreateForumPost />} />
            <Route path="community-forum/post/:postId" element={<ForumPostDetail />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
