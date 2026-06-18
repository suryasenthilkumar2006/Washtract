/**
 * WashTrack Constants
 * * This file centralizes all configuration and static data.
 * Using an object for statuses prevents typos throughout the app:
 * e.g., using STATUS.FREE instead of the string "free".
 */

/**
 * 1. MACHINE_STATUS
 * Defines the four possible states of a washing machine.
 */
export const MACHINE_STATUS = {
  FREE: 'free',
  INUSE: 'inuse',
  DELAYED: 'delayed',
  FAULT: 'fault',
  PAUSED: 'paused',
};

/**
 * 2. DURATION_OPTIONS
 * Used in the "Start Wash" modal/screen to allow users 
 * to select their cycle duration.
 */
export const DURATION_OPTIONS = [
  { label: "30 mins", subLabel: "Quick wash", value: 30 },
  { label: "60 mins", subLabel: "Regular cycle", value: 60 },
  { label: "120 mins", subLabel: "Heavy / Bedding", value: 120 },
];

/**
 * 3. REPORT_THRESHOLD
 * The number of unique reports required to automatically 
 * trigger the 'fault' status for a machine.
 */
export const REPORT_THRESHOLD = 3;

/**
 * 4. FLOORS
 * List of available floors in the PG where machines are located.
 */
export const FLOORS = ["Ground Floor", "2nd Floor", "3rd Floor"];

/**
 * 5. DEMO_MACHINES
 * Mock data for development and initial state.
 * Status values are pulled from the MACHINE_STATUS object for consistency.
 */
export const DEMO_MACHINES = [
  {
    id: 1,
    name: "Machine A",
    floor: FLOORS[0],
    status: MACHINE_STATUS.FREE,
    currentUser: null,
    remainingTime: 0,
    totalTime: 0,
    reports: 0,
  },
  {
    id: 2,
    name: "Machine B",
    floor: FLOORS[1],
    status: MACHINE_STATUS.INUSE,
    currentUser: { name: "Rahul", room: "204" },
    remainingTime: 900, // 15 minutes in seconds
    totalTime: 3600,    // 60 minutes in seconds
    reports: 0,
  },
  {
    id: 3,
    name: "Machine C",
    floor: FLOORS[2],
    status: MACHINE_STATUS.DELAYED,
    currentUser: { name: "Suman", room: "102" },
    remainingTime: 300,  // 5 minutes in seconds
    totalTime: 1800,     // 30 minutes in seconds
    reports: 1,
  },
  {
    id: 4,
    name: "Machine D",
    floor: FLOORS[0],
    status: MACHINE_STATUS.FAULT,
    currentUser: null,
    remainingTime: 0,
    totalTime: 0,
    reports: 3,
  },
];