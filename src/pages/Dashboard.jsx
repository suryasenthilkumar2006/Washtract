import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import MachineCard from '../components/MachineCard';

/**
 * Dashboard Page Component (Phase 2 - Live API Connected)
 * Displays real-time machine statuses synced directly from the MongoDB backend.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  
  // Destructure reactive states, flags, and async methods from the unified store
  const { 
    currentUser, 
    machines, 
    isLoading,
    powerCutActive, 
    fetchMachines,
    tickTimer, 
    togglePowerCutAPI,
    logout 
  } = useStore();

  /**
   * EFFECT 1: Authentication Session Gate
   * * Purpose: Runs immediately to confirm valid user credentials exist.
   * * Why it's a separate effect: Separation of Concerns. This evaluation operates 
   * independently of data fetching. If a session token is missing, we drop the connection
   * and redirect instantly before wasting overhead execution cycles hitting endpoint resources.
   */
  useEffect(() => {
    const token = localStorage.getItem('washtrack_token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  /**
   * EFFECT 2: MongoDB Live Sync Hydration
   * * Purpose: Pulls the latest system snapshot from the server when the user opens the page.
   * * Why it's a separate effect: This manages systemic payload fetching. It should only fire 
   * on mounting the component shell, regardless of whether routing states change later.
   */
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  /**
   * EFFECT 3: UI-Layer Fluid Heartbeat Timer
   * * Purpose: Manages a steady 1-second local decrementation clock on active units.
   * * Cleanup Importance: The return block acts as a mandatory memory buffer. If the interval 
   * isn't manually cleared on component unmount (e.g., when transitioning to a sub-detail page),
   * the browser context holds an orphan runner thread. This wastes memory and forces state corruption bugs.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [tickTimer]);

  /**
   * Session Evacuation Handler
   */
  const handleLogout = () => {
    logout(); // Resets store identity and destroys localStorage token key
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-[430px] mx-auto pb-20">
      
      {/* Fixed Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-purple-600">WashTrack</h1>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            PG Live Sync
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Power Cut Grid Toggle Control Switch */}
          <button 
            onClick={() => togglePowerCutAPI(!powerCutActive)}
            className={`p-2 rounded-lg transition-colors ${
              powerCutActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}
            title="Toggle PG Grid Status"
          >
            {powerCutActive ? '⚡️' : '🔌'}
          </button>
          
          {/* Avatar User Component -> Clicking fires logout workflow */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center text-purple-700 font-bold active:scale-95 transition-transform"
            title="Log Out"
          >
            {currentUser?.name?.charAt(0) || 'U'}
          </button>
        </div>
      </header>

      {/* Power Cut Alert Banner Notification */}
      {powerCutActive && (
        <div className="bg-blue-600 text-white px-5 py-3 flex justify-between items-center animate-pulse">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>⚡️ Power cut active — all timers paused</span>
          </div>
          <button 
            onClick={() => togglePowerCutAPI(false)}
            className="text-xs bg-white text-blue-600 px-2 py-1 rounded font-bold uppercase active:scale-95 transition-all"
          >
            Restore
          </button>
        </div>
      )}

      {/* Main Content Render Layout */}
      <main className="p-5 flex flex-col gap-4">
        {/* Welcome Block Context */}
        <section className="mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Hello, {currentUser?.name || 'Resident'}!</h2>
          <p className="text-gray-500 text-sm">Room {currentUser?.room || 'N/A'} • Live Activity</p>
        </section>

        {/* Dynamic List Processing Core */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            // Network Fetching Placeholder Layer
            <div className="text-center py-20 text-gray-500 font-medium flex flex-col items-center gap-3">
              <span className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading machines...</p>
            </div>
          ) : machines.length > 0 ? (
            // Success State Render Loop
            machines.map((machine) => (
              <MachineCard key={machine.id || machine._id} machine={machine} />
            ))
          ) : (
            // Empty State Return Payload
            <div className="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white">
              <p className="text-sm">No machines found in this PG.</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Layout Nav Utilities */}
      <nav className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-gray-100 px-10 py-3 flex justify-between items-center">
        <button className="flex flex-col items-center gap-1 text-purple-600">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 opacity-50 cursor-not-allowed">
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-bold uppercase">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;