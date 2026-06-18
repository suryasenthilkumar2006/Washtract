import { create } from 'zustand';
import { io } from 'socket.io-client';
import { MACHINE_STATUS, REPORT_THRESHOLD } from '../utils/constants';
import api from '../utils/api';

/**
 * ARCHITECTURAL DESIGN NOTE: Persistent Socket Connection Outside the Store
 */
export const socket = io('http://localhost:5000');

/**
 * WashTrack Global Store
 * Manages states across users, machines, loaders, and real-time network streams.
 */
const useStore = create((set, get) => ({
  // --- STATE ---
  currentUser: null,
  machines: [],
  powerCutActive: false,
  isLoading: false,
  error: null,

  // --- ACTIONS ---

  setCurrentUser: (user) => set({ currentUser: user }),
  setMachines: (machines) => set({ machines }),

  tickTimer: () => {
    const { powerCutActive } = get();
    if (powerCutActive) return;

    set((state) => ({
      machines: state.machines.map((m) => {
        if (m.status === MACHINE_STATUS.INUSE && m.remainingTime > 0) {
          const newTime = m.remainingTime - 1;
          return {
            ...m,
            remainingTime: newTime,
            status: newTime === 0 ? MACHINE_STATUS.DELAYED : MACHINE_STATUS.INUSE,
          };
        }
        return m;
      }),
    }));
  },

  logout: () => {
    localStorage.removeItem('washtrack_token');
    set({ currentUser: null, error: null });
  },

  // --- NEW WORKFLOW ACTION: PERSISTENT SESSION RESTORATION ---

  /**
   * restoreSession
   * Automatically attempts to log a returning user back into the app.
   */
  restoreSession: async () => {
    const token = localStorage.getItem('washtrack_token');
    if (!token) return;
    
    try {
      /**
       * JWT Client-Side Decoding & Validation Strategy:
       * * 1. What token.split('.')[1] does:
       * A JSON Web Token consists of three pieces separated by periods (Header.Payload.Signature). 
       * Splitting and extracting index 1 isolates the Payload, which houses embedded user claims.
       * * 2. What atob() does:
       * The payload is Base64Url encoded. `atob()` translates this back into a standard stringified JSON format, 
       * which we parse into an object using `JSON.parse()`.
       * * 3. Why we check expiration client-side BEFORE calling the API:
       * This avoids making dead API requests. If a student leaves the app open or returns weeks later 
       * and their token is expired, sending it to the backend would cause unnecessary server overhead 
       * just to receive a predictable "401 Unauthorized" response. Checking `payload.exp * 1000 < Date.now()` 
       * lets the UI instantly wipe the stale string and render the Login screen without a redundant network lag window.
       */
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        localStorage.removeItem('washtrack_token');
        return;
      }
      
      // Token structure checks out locally; fetch the authoritative fresh user model data from the backend
      const response = await api.get('/auth/me');
      set({ currentUser: response.data });
    } catch (err) {
      // Clear out the state if anything goes wrong (corrupted payload or invalid backend signature response)
      localStorage.removeItem('washtrack_token');
      set({ currentUser: null });
    }
  },

  // --- REAL-TIME SOCKET EVENT LISTENERS ---

  initSocketListeners: () => {
    socket.off('machineUpdated');
    socket.off('powerCutToggled');

    socket.on('machineUpdated', (updatedMachine) => {
      const normalizedMachine = { ...updatedMachine, id: updatedMachine._id };
      
      set((state) => {
        const exists = state.machines.some((m) => m._id === updatedMachine._id);
        
        if (exists) {
          return {
            machines: state.machines.map((m) => 
              m._id === updatedMachine._id ? normalizedMachine : m
            ),
          };
        } else {
          return {
            machines: [...state.machines, normalizedMachine],
          };
        }
      });
    });

    socket.on('powerCutToggled', (data) => {
      const targetPowerStatus = data.powerCutActive;
      
      set((state) => ({
        powerCutActive: targetPowerStatus,
        machines: state.machines.map((m) => {
          if (targetPowerStatus && m.status === MACHINE_STATUS.INUSE) {
            return { ...m, status: 'paused' };
          }
          if (!targetPowerStatus && m.status === 'paused') {
            return { ...m, status: MACHINE_STATUS.INUSE };
          }
          return m;
        }),
      }));
    });
  },

  // --- ASYNC API ACTIONS ---

  fetchMachines: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/machines');
      const normalizedMachines = response.data.map((m) => ({
        ...m,
        id: m._id, 
      }));
      set({ machines: normalizedMachines });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch machines.' });
    } finally {
      set({ isLoading: false });
    }
  },

  loginUser: async ({ room, pin }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { room, pin });
      localStorage.setItem('washtrack_token', response.data.token);
      set({ currentUser: response.data.user });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Authentication failed.' });
    } finally {
      set({ isLoading: false });
    }
  },

  registerUser: async ({ name, room, pin }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, room, pin });
      localStorage.setItem('washtrack_token', response.data.token);
      set({ currentUser: response.data.user });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed.' });
    } finally {
      set({ isLoading: false });
    }
  },

  startMachineAPI: async ({ machineId, durationMinutes }) => {
    set({ error: null });
    try {
      const response = await api.post(`/machines/${machineId}/start`, { durationMinutes });
      const updatedNode = { ...response.data, id: response.data._id };
      set((state) => ({
        machines: state.machines.map((m) => m.id === machineId ? updatedNode : m),
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Could not lock machine.' });
    }
  },

  collectLaundryAPI: async (machineId) => {
    set({ error: null });
    try {
      const response = await api.post(`/machines/${machineId}/collect`);
      const updatedNode = { ...response.data, id: response.data._id };
      set((state) => ({
        machines: state.machines.map((m) => m.id === machineId ? updatedNode : m),
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Could not complete collection.' });
    }
  },

  reportIssueAPI: async (machineId) => {
    set({ error: null });
    try {
      const response = await api.post(`/machines/${machineId}/report`);
      const updatedNode = { ...response.data, id: response.data._id };
      set((state) => ({
        machines: state.machines.map((m) => m.id === machineId ? updatedNode : m),
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to file report.' });
    }
  },

  markFixedAPI: async (machineId) => {
    set({ error: null });
    try {
      const response = await api.post(`/machines/${machineId}/fixed`);
      const updatedNode = { ...response.data, id: response.data._id };
      set((state) => ({
        machines: state.machines.map((m) => m.id === machineId ? updatedNode : m),
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update system state.' });
    }
  },

  togglePowerCutAPI: async (powerCutActiveState) => {
    set({ error: null });
    try {
      const response = await api.post('/machines/power-cut', { powerCutActive: powerCutActiveState });
      
      set((state) => {
        const targetPowerStatus = response.data.powerCutActive;
        return {
          powerCutActive: targetPowerStatus,
          machines: state.machines.map((m) => {
            if (targetPowerStatus && m.status === MACHINE_STATUS.INUSE) {
              return { ...m, status: 'paused' };
            }
            if (!targetPowerStatus && m.status === 'paused') {
              return { ...m, status: MACHINE_STATUS.INUSE };
            }
            return m;
          }),
        };
      });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to push power utility update.' });
    }
  },
}));

export default useStore;