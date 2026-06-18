import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MachineDetail from './pages/MachineDetail';

/**
 * App Root Component
 * Coordinates routing, enforces global layout styles, and pulls 
 * live backend data immediately on launch.
 */
function App() {
  // Pull states and fetch actions from your Zustand global configuration
  const { fetchMachines, currentUser, initSocketListeners, restoreSession } = useStore();

  /**
   * Application Bootstrapper
   * Runs exactly once when the web app mounts. It forces a network fetch
   * to populate live machines from the DB, ensuring users don't see or interact
   * with old/stale mock data on slower network connections.
   */
 useEffect(() => {
  const bootstrapSession = async () => {
    // 1. Fire socket listener attachments once
    initSocketListeners();
    // 2. Hydrate user session from local token cache safely
    await restoreSession();
    // 3. Hydrate live active equipment configurations from DB
    await fetchMachines();
  };

  bootstrapSession();
}, [initSocketListeners, restoreSession, fetchMachines]);

  return (
    <BrowserRouter>
      {/* Global Mobile-First Constraint Container:
        Centers the workspace horizontally on desktop viewports and wraps it
        in a modern shadow card layer, keeping styling minimal and cohesive.
      */}
      <div className="min-h-screen w-full bg-gray-100 flex justify-center items-start">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl flex flex-col relative overflow-x-hidden">
          
          <Routes>
            {/* 1. The Root Gateway Route Guard
              If a user session is active, navigating to "/" automatically bounces them to 
              the dashboard. If unauthenticated, it presents the Login/Register form safely.
            */}
            <Route 
              path="/" 
              element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            
            {/* 2. Protected Dashboard Route
              Prevents manual URL-hacking entry. If a logged-out guest types /dashboard, 
              they are gracefully bounced backward to the log-in page.
            */}
            <Route 
              path="/dashboard" 
              element={currentUser ? <Dashboard /> : <Navigate to="/" replace />} 
            />
            
            {/* 3. Protected Machine Detail Route
              Ensures the deep-link route is protected under an active session identity check.
            */}
            <Route 
              path="/machine/:id" 
              element={currentUser ? <MachineDetail /> : <Navigate to="/" replace />} 
            />
            
            {/* 4. Global Catch-All Wildcard Route
              Handles mistyped URLs cleanly by redirecting back to the root entry point.
            */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;