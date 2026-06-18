import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

/**
 * Login & Registration Page Component
 * Connects directly to the backend API via the Zustand store and handles
 * asynchronous navigation redirections upon successful token collection.
 */
const Login = () => {
  const navigate = useNavigate();

  // Pull backend actions and global UI indicators from your Zustand store
  const { loginUser, registerUser, isLoading, error } = useStore();

  // --- LOCAL FORM STATE ---
  // Tracks whether the user is viewing the Login or Registration form layout
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [pin, setPin] = useState('');

  /**
   * Helper to switch between forms safely.
   * Clears out any lingering validation error strings inside the store 
   * so the target form renders cleanly.
   */
  const handleModeToggle = () => {
    setIsRegisterMode(!isRegisterMode);
    // Explicitly wipe global errors when jumping contexts
    useStore.setState({ error: null });
  };

  /**
   * Asynchronous Submission Handler
   * Fires the correct backend API process based on the layout state.
   * Navigates to the protected dashboard zone only after the promise fully resolves.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isRegisterMode) {
        // API call to create user account
        await registerUser({ name, room, pin });
      } else {
        // API call to verify existing credentials
        await loginUser({ room, pin });
      }

      /**
       * Crucial Navigation Check:
       * If an error occurred inside the store action, it will populate the 'error' state.
       * We only navigate forward if no error message exists in the store after the call.
       */
      if (!useStore.getState().error) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Authentication submission interception failed:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-6 py-12 items-center">
      
      {/* Header Section: Branding (Unchanged) */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🫧</div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">WashTrack</h1>
        <p className="text-gray-500 mt-2">Manage your PG laundry hassle-free</p>
      </div>

      {/* Main Authentication Card */}
      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-[400px] flex flex-col gap-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
      >
        {/* Conditional Full Name Input Field: Only displayed in Register Mode */}
        {isRegisterMode && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>
        )}

        {/* Room Number Input Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Room Number</label>
          <input
            type="text"
            placeholder="e.g. 204"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            required
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-60"
          />
        </div>

        {/* Room PIN Password Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Room PIN</label>
          <input
            type="password"
            placeholder="••••"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            disabled={isLoading}
            inputMode="numeric" // Displays standard hardware number overlays on mobile devices
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-60"
          />
        </div>

        {/* Global Error Container Box */}
        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-2.5">
            <span className="text-red-500 text-sm mt-0.5">⚠️</span>
            <p className="text-red-600 text-sm font-medium leading-tight">{error}</p>
          </div>
        )}

        {/* Action Form Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-[0.98] mt-2 disabled:bg-gray-300 disabled:shadow-none disabled:pointer-events-none"
        >
          {isLoading ? 'Please wait...' : isRegisterMode ? 'Create Account' : 'Enter Dashboard'}
        </button>

        {/* Bottom Mode Toggle Link Action */}
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={handleModeToggle}
            disabled={isLoading}
            className="text-sm font-semibold text-purple-600 hover:text-purple-700 underline focus:outline-none disabled:text-gray-300 disabled:no-underline"
          >
            {isRegisterMode 
              ? 'Already have an account? Log In' 
              : "Don't have an account? Register"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;