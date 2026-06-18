import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import { DURATION_OPTIONS, MACHINE_STATUS } from '../utils/constants';

/**
 * MachineDetail Page Component (Phase 2 - Live API Actions)
 * Displays specific device analytics and forwards user actions directly to the backend.
 */
const MachineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Local UI states for modal toggle tracking
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]);
  // Local operational indicator to handle separate button spinner feedback
  const [actionLoading, setActionLoading] = useState(false);

  // Destructure state, metadata flags, and network actions from the Zustand global instance
  const { 
    machines, 
    currentUser, 
    isLoading: storeLoading, // Checking if a global sync hydration is happening
    startMachineAPI, 
    collectLaundryAPI, 
    reportIssueAPI, 
    markFixedAPI
  } = useStore();

  /**
   * Database Id Resolution:
   * Looks up the targeted document entity, safely checking against both 
   * normalized layout properties ('id') and raw MongoDB database primary key keys ('_id').
   */
  const machine = machines.find((m) => m.id === id || m._id === id || m.id === parseInt(id));

  if (!machine) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">Machine not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-purple-600 font-bold underline">
          Go Back
        </button>
      </div>
    );
  }

  const { status, name, floor, remainingTime, totalTime, reports } = machine;

  // Global loading blocker combines both background actions and local button interactions
  const isInteractionDisabled = storeLoading || actionLoading;

  /**
   * Helper: Format seconds to MM:SS
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * SVG Progress Ring Geometry
   */
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const percentage = totalTime > 0 ? remainingTime / totalTime : 0;
  const strokeDashoffset = circumference * (1 - percentage);

  const ringColors = {
    [MACHINE_STATUS.FREE]: 'text-green-500',
    [MACHINE_STATUS.INUSE]: 'text-purple-600',
    [MACHINE_STATUS.DELAYED]: 'text-amber-500',
    [MACHINE_STATUS.FAULT]: 'text-red-500',
    paused: 'text-blue-500',
  };

  /**
   * 1. Action Handler: startMachineAPI
   * * Why: Communicates allocation choices with the cloud rather than mutating client states.
   * * Prevention Strategy: Wrapping execution threads in local state toggles prevents the client 
   * from spawning parallel execution requests if they tap the action button repeatedly on laggy networks.
   */
  const handleStartWash = async () => {
    setActionLoading(true);
    try {
      await startMachineAPI({ 
        machineId: machine.id || machine._id, 
        durationMinutes: selectedDuration.value 
      });
      setShowStartModal(false);
    } catch (err) {
      console.error("Failed to start cycle", err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 2. Action Handler: collectLaundryAPI
   */
  const handleCollectLaundry = async () => {
    setActionLoading(true);
    try {
      await collectLaundryAPI(machine.id || machine._id);
    } catch (err) {
      console.error("Failed to collect laundry", err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 3. Action Handler: reportIssueAPI
   */
  const handleReportIssue = async () => {
    setActionLoading(true);
    try {
      await reportIssueAPI(machine.id || machine._id);
    } catch (err) {
      console.error("Failed to report machine status", err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 4. Action Handler: markFixedAPI
   */
  const handleMarkFixed = async () => {
    setActionLoading(true);
    try {
      await markFixedAPI(machine.id || machine._id);
    } catch (err) {
      console.error("Failed to override service state", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-[430px] mx-auto pb-10">
      
      {/* Header View Framework */}
      <header className="px-5 py-4 flex justify-between items-center border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600" disabled={isInteractionDisabled}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{name}</h1>
        <StatusBadge status={status} />
      </header>

      {/* Timer Ring Progress Display Graphics */}
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative flex items-center justify-center">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96" cy="96" r={radius}
              stroke="currentColor" strokeWidth="8"
              fill="transparent" className="text-gray-100"
            />
            <circle
              cx="96" cy="96" r={radius}
              stroke="currentColor" strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
              strokeLinecap="round"
              className={`${ringColors[status] || 'text-gray-300'}`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {status === MACHINE_STATUS.FREE ? (
              <span className="text-xl font-bold text-green-600">Available</span>
            ) : (
              <>
                <span className="text-3xl font-black text-gray-800 tracking-tighter">
                  {formatTime(remainingTime)}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase mt-1">
                  {status === 'paused' ? 'Paused (Power Cut)' : 'Remaining'}
                </span>
              </>
            )}
          </div>
        </div>
        <p className="mt-4 text-gray-400 text-sm font-medium">{floor}</p>
      </div>

      {/* Operational Metadata Cards */}
      <div className="px-6 space-y-6">
        {machine.currentUser && (
          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {machine.currentUser.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Currently using</p>
              <h4 className="text-lg font-bold text-gray-800">{machine.currentUser.name}</h4>
              <p className="text-sm text-gray-500">Room {machine.currentUser.room}</p>
            </div>
          </div>
        )}

        {/* 5. Conditional Functional Operations Action Layout */}
        <div className="flex flex-col gap-3">
          {status === MACHINE_STATUS.FREE && (
            <button 
              onClick={() => setShowStartModal(true)}
              disabled={isInteractionDisabled}
              className="w-full bg-purple-600 disabled:bg-gray-200 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-100 active:scale-[0.98] transition-all"
            >
              Start New Wash
            </button>
          )}

          {status === MACHINE_STATUS.INUSE && machine.currentUser?.name === currentUser?.name && (
             <button 
                onClick={handleCollectLaundry}
                disabled={isInteractionDisabled}
                className="w-full bg-green-600 disabled:bg-gray-200 text-white py-4 rounded-2xl font-bold active:scale-[0.98] transition-all"
             >
               {actionLoading ? 'Please wait...' : "I've Collected My Laundry"}
             </button>
          )}

          {status === MACHINE_STATUS.DELAYED && (
            <button 
              onClick={handleCollectLaundry}
              disabled={isInteractionDisabled}
              className="w-full bg-amber-500 disabled:bg-gray-200 text-white py-4 rounded-2xl font-bold active:scale-[0.98] transition-all"
            >
              {actionLoading ? 'Please wait...' : 'Free This Machine'}
            </button>
          )}

          {status === MACHINE_STATUS.FAULT && (
            <button 
              onClick={handleMarkFixed}
              disabled={isInteractionDisabled}
              className="w-full bg-green-600 disabled:bg-gray-200 text-white py-4 rounded-2xl font-bold active:scale-[0.98] transition-all"
            >
              {actionLoading ? 'Please wait...' : 'Mark as Fixed (Admin)'}
            </button>
          )}

          {status !== MACHINE_STATUS.FAULT && (
            <button 
              onClick={handleReportIssue}
              disabled={isInteractionDisabled}
              className="w-full border-2 border-red-100 disabled:border-gray-100 text-red-500 disabled:text-gray-300 py-4 rounded-2xl font-bold active:bg-red-50 transition-all"
            >
              {actionLoading ? 'Submitting report...' : `Report an Issue (${reports})`}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Selection sheet drawer modal markup layout */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isInteractionDisabled && setShowStartModal(false)} />
          
          <div className="relative bg-white rounded-t-3xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Select Duration</h3>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={isInteractionDisabled}
                  onClick={() => setSelectedDuration(opt)}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                    selectedDuration.value === opt.value 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-gray-100'
                  }`}
                >
                  <span className="font-bold text-gray-800">{opt.label}</span>
                  <span className="text-xs text-gray-500">{opt.subLabel}</span>
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleStartWash}
                disabled={isInteractionDisabled}
                className="w-full bg-purple-600 disabled:bg-gray-200 text-white py-4 rounded-2xl font-bold transition-all"
              >
                {actionLoading ? 'Please wait...' : 'Start Wash'}
              </button>
              <button 
                onClick={() => setShowStartModal(false)}
                disabled={isInteractionDisabled}
                className="w-full text-gray-400 py-2 font-bold disabled:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineDetail;