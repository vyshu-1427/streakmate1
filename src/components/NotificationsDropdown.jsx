import React, { useState, useEffect, useMemo } from 'react';

const NotificationsDropdown = ({ notifications, onClear }) => {
  const [open, setOpen] = useState(false);
  const deduped = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    const seen = new Set();
    const list = [];
    for (const n of notifications) {
      try {
        const dateObj = new Date(n.date || n.createdAt || Date.now());
        const day = dateObj.toISOString().slice(0, 10);
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const mm = String(dateObj.getMinutes()).padStart(2, '0');
        const time = n.time || `${hh}:${mm}`;
        const body = (n.body || '').trim();
        const key = `${n.habitId || n.habitName}::${day}::${time}::${body}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(n);
        }
      } catch (e) {
        const key = JSON.stringify(n);
        if (!seen.has(key)) { seen.add(key); list.push(n); }
      }
    }
    return list;
  }, [notifications]);

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-neutral-100"
      >
        🔔
        {notifications.length > 0 && (
          <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1">{notifications.length}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 p-2">
          <div className="flex justify-between items-center mb-2">
            <strong>Notifications</strong>
            <button className="text-sm text-red-500" onClick={onClear}>Clear</button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-neutral-500">No notifications</p>
          ) : (
            <ul className="max-h-64 overflow-auto space-y-2">
              {deduped.map((n, idx) => (
                <li key={n._id || `${idx}-${n.habitName}-${n.date}`} className="p-2 border rounded">
                  <div className="text-sm font-medium">{n.habitName}</div>
                  <div className="text-xs text-neutral-600">{new Date(n.date).toLocaleString()}</div>
                  <div className="text-sm">{n.body}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
