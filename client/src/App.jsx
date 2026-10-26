import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FlatsResidentsPage from './pages/FlatsResidentsPage';
import VisitorRegisterPage from './pages/VisitorRegisterPage';
import VisitorHistoryPage from './pages/VisitorHistoryPage';
import MaintenanceBillsPage from './pages/MaintenanceBillsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Role Guard Component
function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected layout routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Admin only */}
            <Route
              path="flats-residents"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <FlatsResidentsPage />
                </RoleRoute>
              }
            />

            {/* Admin & Security */}
            <Route
              path="visitor-register"
              element={
                <RoleRoute allowedRoles={['admin', 'security']}>
                  <VisitorRegisterPage />
                </RoleRoute>
              }
            />

            {/* All roles */}
            <Route path="visitor-history" element={<VisitorHistoryPage />} />

            {/* Admin & Resident */}
            <Route
              path="maintenance"
              element={
                <RoleRoute allowedRoles={['admin', 'resident']}>
                  <MaintenanceBillsPage />
                </RoleRoute>
              }
            />

            {/* Admin & Resident */}
            <Route
              path="complaints"
              element={
                <RoleRoute allowedRoles={['admin', 'resident']}>
                  <ComplaintsPage />
                </RoleRoute>
              }
            />

            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
