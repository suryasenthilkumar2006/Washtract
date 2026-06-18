import React from 'react';

/**
 * StatusBadge Component
 * * A reusable UI element that displays a color-coded pill based on machine status.
 * * Usage:
 * <StatusBadge status="inuse" />
 * * Props:
 * @param {string} status - One of: 'free', 'inuse', 'delayed', 'fault', 'paused'
 */
const StatusBadge = ({ status }) => {
  
  // Mapping status keys to specific Tailwind v4 utility classes and display labels.
  // This approach avoids long if/else chains in the JSX.
  const statusConfig = {
    free: {
      label: 'Free',
      classes: 'bg-green-100 text-green-700',
    },
    inuse: {
      label: 'In Use',
      classes: 'bg-orange-100 text-orange-700',
    },
    delayed: {
      label: 'Delayed',
      classes: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    fault: {
      label: 'Not Working',
      classes: 'bg-red-100 text-red-700',
    },
    paused: {
      label: 'Paused',
      classes: 'bg-blue-100 text-blue-700',
    },
  };

  // Fallback configuration in case an unexpected status is passed.
  const currentStatus = statusConfig[status] || {
    label: 'Unknown',
    classes: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`
        px-3 py-1 
        rounded-full 
        text-xs 
        font-semibold 
        uppercase 
        tracking-wider 
        inline-flex 
        items-center 
        justify-center
        ${currentStatus.classes}
      `}
    >
      {currentStatus.label}
    </span>
  );
};

export default StatusBadge;