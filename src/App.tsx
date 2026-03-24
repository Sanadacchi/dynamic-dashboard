import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import OneSignal from 'react-onesignal';
import { useWorkspaceStore } from './store/workspaceStore';
import { useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Overview } from './pages/Overview';
import { WarRoom } from './pages/WarRoom';
import { Documents } from './pages/Documents';
import { Analytics } from './pages/Analytics';
import { NorthStar } from './pages/NorthStar';
import { Profile } from './pages/Profile';
import { Social } from './pages/Social';
import { Projects } from './pages/Projects';
import { Integrations } from './pages/Integrations';
import { ProjectBoard } from './components/ProjectBoard';

import { useParams } from 'react-router-dom';

function SpaceFallback() {
  const { tenantId } = useParams();
  return <Navigate to={`/space/${tenantId}/overview`} replace />;
}

function AppContent() {
  const { currentTenantId, setCurrentUser } = useWorkspaceStore();
  const navigate = useNavigate();

  useEffect(() => {
    // OneSignal App ID from user
    OneSignal.init({ 
      appId: "50c74a64-05b8-469e-8776-52449c5239fe",
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: 'sw.js' // Use the PWA's worker instead
    }).then(() => {
      console.log('OneSignal Initialized');
    });
  }, []);

  const handleLogin = (tenantId: number, userId: number, name: string) => {
    // Set the user object with the actual name provided
    setCurrentUser({ id: userId, name: name, role: 'ADMIN' });
    // Use navigate instead of window.location.href to preserve Zustand store state
    navigate(`/space/${tenantId}/overview`);
  };

  return (
    <Routes>
      {/* Auth Route */}
      <Route path="/" element={
        currentTenantId ? <Navigate to={`/space/${currentTenantId}/overview`} replace /> : <LoginScreen onLogin={handleLogin} />
      } />

      {/* Space Protected Routes */}
      <Route path="/space/:tenantId" element={<DashboardLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectBoard />} />
        <Route path="war-room" element={<WarRoom />} />
        <Route path="documents" element={<Documents />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="north-star" element={<NorthStar />} />
        <Route path="profile" element={<Profile />} />
        <Route path="social" element={<Social />} />
        <Route path="integrations" element={<Integrations />} />
        
        {/* Fallback for sub-routes */}
        <Route path="*" element={<SpaceFallback />} />
      </Route>

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

