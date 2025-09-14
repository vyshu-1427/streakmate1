import { useState, useEffect, useRef } from 'react';
import { format, isSameDay, differenceInDays, subDays } from 'date-fns';
import { toast } from 'react-hot-toast';

const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scheduledTimeouts = useRef([]);

  const fetchHabits = async () => {
    console.log('useHabits: Starting fetchHabits');
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('useHabits: Token retrieved:', token ? 'Present' : 'Missing');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('useHabits: Fetching habits from /api/habits');
      const response = await fetch('http://localhost:5003/api/habits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('useHabits: Response status:', response.status);
      if (!response.ok) {
        // try to extract a useful message from the response body
        let serverMsg = `HTTP error! Status: ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody && errBody.message) serverMsg = errBody.message;
        } catch (e) {
          // ignore json parse errors
        }
        throw new Error(serverMsg);
      }

      const data = await response.json();
      console.log('useHabits: Habits data received:', data);
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch habits');
      }

      setHabits(data.habits);
  calculateStats(data.habits);
      setLoading(false);
      console.log('useHabits: Habits fetched successfully, loading set to false');
    } catch (err) {
      console.error('useHabits: Error in fetchHabits:', err.message);
      // Only set a global error for auth issues; otherwise keep it local to the hook
      if (/(token|auth|unauthorize|unauthorized|please log in)/i.test(err.message)) {
        setError(err.message);
      } else {
        // non-fatal fetch error: keep habits empty but don't trigger global modal
        console.warn('Non-fatal fetchHabits error:', err.message);
      }
      setLoading(false);
      setHabits([]);
    }
  };

  // Notification helpers
  const clearScheduled = () => {
    scheduledTimeouts.current.forEach(id => clearTimeout(id));
    scheduledTimeouts.current = [];
  };

  const ensurePermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const p = await Notification.requestPermission();
      return p === 'granted';
    }
    return false;
  };

  const showNotification = (title, body) => {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch (err) {
      console.error('Notification failed:', err);
    }
  };

  const scheduleForHabit = (habit) => {
    if (!habit) return;
    // prefer timeFrom (range) then fallback to single time
    const timeToUse = habit.timeFrom || habit.time;
    if (!timeToUse) return;
    // timeToUse assumed 'HH:mm'
    const [hh, mm] = timeToUse.split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return;
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
    // if target already passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const delay = target.getTime() - now.getTime();
    const id = setTimeout(async () => {
      const title = `Time for: ${habit.name}`;
      const body = habit.description || `It's time to do ${habit.name}`;

      // prepare notification detail
      const detail = {
        habitId: habit._id || habit.id || null,
        habitName: habit.name,
        body,
        // include both the raw fields and the computed time used
        timeFrom: habit.timeFrom || '',
        timeTo: habit.timeTo || '',
        time: timeToUse,
        date: new Date().toISOString(),
      };

      // dedupe: allow only one notification per habit/time per day
      let alreadyShown = false;
      try {
        const dayKey = format(new Date(), 'yyyy-MM-dd');
        const dedupeKey = `sm_notif_dedupe::${detail.habitId || detail.habitName}::${dayKey}::${timeToUse}`;
        alreadyShown = !!localStorage.getItem(dedupeKey);
        if (!alreadyShown) {
          try { localStorage.setItem(dedupeKey, new Date().toISOString()); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        console.warn('Notif dedupe check failed', e);
      }

      if (!alreadyShown) {
        // show native notification if permission
        try {
          const ok = await ensurePermission();
          if (ok) {
            showNotification(title, body);
          }
        } catch (e) {
          console.warn('Permission check failed', e);
        }

        // dispatch in-app event so UI can record/store the notification
        try {
          window.dispatchEvent(new CustomEvent('habitNotification', { detail }));
          // persist to server (non-blocking)
          try {
            const token = localStorage.getItem('token');
            if (token) {
              fetch('http://localhost:5003/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(detail),
              }).catch(e => console.warn('Failed to persist notification to server', e));
            }
          } catch (e) {
            console.warn('Notification persist skipped', e);
          }

          // show an in-app toast so user sees an immediate popup
          try { toast.success(`Reminder: ${habit.name}`); } catch (e) { /* ignore */ }
        } catch (err) {
          console.error('Failed to dispatch habitNotification', err);
        }
      } else {
        // already shown today; skip native dispatch but still log
        console.log('Notification deduped for', detail.habitId || detail.habitName, timeToUse);
      }

      // schedule next occurrence in 24h by scheduling again
      const nextId = setTimeout(() => scheduleForHabit(habit), 24 * 60 * 60 * 1000);
      scheduledTimeouts.current.push(nextId);
    }, delay);
    scheduledTimeouts.current.push(id);
  };

  const scheduleNotifications = async (habitsList) => {
    clearScheduled();
    if (!habitsList || habitsList.length === 0) return;
    // Request permission proactively if possible
    try { await ensurePermission(); } catch (e) { /* ignore */ }
    habitsList.forEach(h => scheduleForHabit(h));
  };

  const completeHabit = async (id, date) => {
    console.log(`useHabits: Attempting to complete habit with id: ${id} for date: ${date}`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5003/api/habits/${id}/complete`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: format(new Date(date), 'yyyy-MM-dd'), completed: true }),
      });
      const data = await response.json();
      console.log('useHabits: Complete response:', data);
      if (!data.success) {
        throw new Error(data.message || 'Failed to complete habit');
      }
      // Refetch habits after completion
      await fetchHabits();
    } catch (err) {
      console.error('Error completing habit:', err);
      setError(err.message);
    }
  };

  const deleteHabit = async (id) => {
    // console.log(`useHabits: Attempting to delete habit with id: ${id}`);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5003/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('useHabits: Delete response:', data);
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete habit');
      }
      // Refetch habits after deletion
      fetchHabits();
    } catch (err) {
      console.error('Error deleting habit:', err);
      // don't set global error here (prevents replacing the dashboard with the error modal)
      // return false so callers can handle failure appropriately
      return false;
    }
    return true;
  };

  const calculateStats = (habits) => {
    console.log('useHabits: Calculating stats for habits:', habits);
    const today = format(new Date(), 'yyyy-MM-dd');
    let todayCount = 0;
    let currentStreak = 0;
    let maxStreak = 0;

  const updatedHabits = [];
  habits.forEach((habit) => {
      console.log(`useHabits: Processing habit: ${habit.name}, frequency: ${habit.frequency}`);
      // Normalize completed dates into a set of yyyy-MM-dd strings for reliable checks
      const completedSet = new Set((habit.completedDates || []).map(d => format(new Date(d), 'yyyy-MM-dd')));
      // Count habits completed today
      if (completedSet.has(today)) {
        todayCount++;
      }

      // Calculate streaks
      let streak = 0;

      if (habit.frequency === 'daily') {
        // Start checking from today; if today not completed, start from yesterday
        let checkDate = new Date();
        let checkStr = format(checkDate, 'yyyy-MM-dd');
        if (!completedSet.has(checkStr)) {
          checkDate = subDays(checkDate, 1);
          checkStr = format(checkDate, 'yyyy-MM-dd');
        }
        // Count consecutive days backwards while dates exist in the set
        while (completedSet.has(checkStr)) {
          streak++;
          checkDate = subDays(checkDate, 1);
          checkStr = format(checkDate, 'yyyy-MM-dd');
        }
      } else if (habit.frequency === 'weekly') {
        // weekly logic unchanged but use completedSet-derived dates array
        const dates = [...(habit.completedDates || [])].map(d => format(new Date(d), 'yyyy-MM-dd')).sort((a, b) => new Date(b) - new Date(a));
        const weeks = {};
        dates.forEach((date) => {
          const weekStart = format(new Date(date), 'yyyy-WW');
          weeks[weekStart] = (weeks[weekStart] || 0) + 1;
        });
        console.log(`useHabits: Weekly completions for ${habit.name}:`, weeks);

        let currentWeek = format(new Date(), 'yyyy-WW');
        while (weeks[currentWeek] && weeks[currentWeek] >= (habit.target || 1)) {
          streak++;
          currentWeek = format(subDays(new Date(currentWeek), 7), 'yyyy-WW');
        }
      }

      console.log(`useHabits: Streak for ${habit.name}: ${streak}`);
      // attach per-habit streak so UI cards can display it
      updatedHabits.push({ ...habit, streak });
      if (streak > maxStreak) maxStreak = streak;
      if (completedSet.has(today)) {
        currentStreak = Math.max(currentStreak, streak);
      }
    });

  // update state with enriched habits array
  setHabits(updatedHabits);
    setCompletedToday(todayCount);
    setStreakCount(currentStreak);
    setLongestStreak(maxStreak);
    console.log('useHabits: Stats updated - completedToday:', todayCount, 'streakCount:', currentStreak, 'longestStreak:', maxStreak);
  // schedule notifications for habits with times
  try { scheduleNotifications(updatedHabits); } catch (err) { console.error('Failed to schedule notifications', err); }
  };

  useEffect(() => {
    console.log('useHabits: useEffect triggered, calling fetchHabits');
    fetchHabits();
  }, []);

  useEffect(() => {
    return () => {
      clearScheduled();
    };
  }, []);

  return { habits, completedToday, streakCount, longestStreak, loading, error, refetch: fetchHabits, deleteHabit, completeHabit };
};

export default useHabits;
