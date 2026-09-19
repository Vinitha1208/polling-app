import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreatePollPage } from './pages/CreatePollPage';
import { VotePage } from './pages/VotePage';
import { ResultsPage } from './pages/ResultsPage';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Creator Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-poll"
                element={
                  <ProtectedRoute>
                    <CreatePollPage />
                  </ProtectedRoute>
                }
              />

              {/* Public Audience & Results Routes */}
              <Route path="/poll/:shareCode" element={<VotePage />} />
              <Route path="/poll/:id/results" element={<ResultsPage />} />

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ToastContainer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
