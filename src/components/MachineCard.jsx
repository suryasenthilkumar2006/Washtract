import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'

const MachineCard = ({ machine }) => {
  const navigate = useNavigate()
  const { id, name, floor, status, currentUser, remainingTime } = machine

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const borderColors = {
    free: 'border-l-green-500',
    inuse: 'border-l-orange-500',
    paused: 'border-l-blue-500',
    delayed: 'border-l-amber-500',
    fault: 'border-l-red-500',
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/machine/${id}`)}
      className={`w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md ${borderColors[status] || 'border-l-gray-300'}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
          <p className="mt-1 text-sm text-slate-500">{floor}</p>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-4 text-sm text-slate-700">
        {(status === 'inuse' || status === 'paused') && (
          <p>
            {formatTime(remainingTime)} remaining{status === 'paused' ? ' (paused)' : ''}
          </p>
        )}

        {status === 'delayed' && (
          <p className="text-amber-700">Done: {currentUser?.name} ({currentUser?.room})</p>
        )}

        {status === 'fault' && <p className="text-red-600">Reported broken</p>}

        {status === 'free' && <p className="text-green-600">Ready to use</p>}
      </div>
    </button>
  )
}

export default MachineCard
