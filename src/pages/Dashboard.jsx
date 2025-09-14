import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, ListChecks, Flame, Trophy, Clock, LogOut, MessageCircle, RotateCcw } from 'lucide-react';
import NotificationsDropdown from '../components/NotificationsDropdown';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import useHabits from '../hooks/useHabits.jsx';
import MissedStreakModal from '../components/MissedStreakModal';
import HabitGraph from '../components/HabitGraph';


const StatsCard = ({ title, value, icon, color }) => (
  <motion.div
    className={`rounded-xl p-4 bg-white border shadow-soft ${color} flex items-center gap-3 hover:bg-neutral-50 transition-colors`}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <div className="rounded-lg p-2 bg-neutral-50">{icon}</div>
    <div>
      <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">{title}</p>
      <p className="text-xl font-bold text-neutral-900">{value}</p>
    </div>
  </motion.div>
);

const DateButton = ({ date, isToday, isSelected, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[3.5rem] transition-all font-semibold border ${
      isSelected
        ? 'bg-primary-600 text-white border-primary-600'
        : isToday
        ? 'bg-primary-100 text-primary-700 border-primary-200'
        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
    }`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    aria-label={`Select ${format(date, 'EEEE, MMMM d')}`}
  >
    <span className="text-xs uppercase tracking-wide">{format(date, 'EEE')}</span>
    <span className="text-base font-bold">{format(date, 'd')}</span>
  </motion.button>
);

function Dashboard() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_notifications') || '[]'); } catch { return []; }
  });
  const [error, setError] = useState(null);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [selectedHabitName, setSelectedHabitName] = useState('');
  const [latestMotivation, setLatestMotivation] = useState(null);
  const [motivation, setMotivation] = useState('');
  const [submittedMissedIds, setSubmittedMissedIds] = useState([]);
  const [restoreChances, setRestoreChances] = useState(0);
  const navigate = useNavigate();
  const { habits, completedToday, streakCount, longestStreak, loading, error: habitsError, refetch } = useHabits();

  // Fetch user info
  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to access the dashboard');
      }
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me` ,{
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch user data');
      }
      setUser(data.user);
    } catch (err) {
      setError(err.message);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);


  

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for scheduled notifications dispatched by the habit scheduler
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail;
      setNotifications(prev => {
        const next = [detail, ...prev].slice(0, 100);
        localStorage.setItem('sm_notifications', JSON.stringify(next));
        return next;
      });
      // also show a small in-app alert briefly
      // eslint-disable-next-line no-alert
      // alert(`${detail.habitName}: ${detail.body}`);
    };
    window.addEventListener('habitNotification', handler);
    return () => window.removeEventListener('habitNotification', handler);
  }, []);

  // Fetch already-submitted missed reasons so we don't show buttons again
  const fetchSubmittedMissed = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/motivation/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        const ids = data.history.map(h => (h.habitId ? String(h.habitId) : null)).filter(Boolean);
        setSubmittedMissedIds(prev => Array.from(new Set([...prev, ...ids])));
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Fetch restore chances
  const fetchRestoreChances = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/streak-restore/chances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRestoreChances(data.restoreChances);
      }
    } catch (err) {
      console.error('Error fetching restore chances:', err);
    }
  }, []);

  useEffect(() => {
    // after user info is loaded, fetch submitted missed entries and restore chances
    if (user) {
      fetchSubmittedMissed();
      fetchRestoreChances();
    }
  }, [user, fetchSubmittedMissed, fetchRestoreChances]);


  // Handler for missed streak modal open
  const handleMissedStreak = (habitId) => {
    const habit = habits.find(h => h._id === habitId);
    setSelectedHabitId(habitId);
    setSelectedHabitName(habit ? habit.name : '');
    setShowMissedModal(true);
    setMotivation('');
  };


  // Handler for AI motivation response
  const handleMotivation = async (habitId, habitName, reason) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/motivation/missed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ habitId, userExplanation: reason }),
    });
    const data = await res.json();
    if (data.success) {
      // Backend returns aiReply separately and saves only the user's reason in history
      setLatestMotivation({
        habitId,
        habitName: data.entry ? data.entry.habitName || habitName : habitName,
        userExplanation: data.entry ? data.entry.userExplanation : reason,
        aiReply: data.aiReply || (data.entry && data.entry.aiReply) || '',
        date: data.entry ? data.entry.date : new Date().toISOString()
      });
  // Hide the missed button for this habit after submission
  setSubmittedMissedIds(prev => Array.from(new Set([...prev, String(habitId)])));
    }
    setShowMissedModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getDates = useCallback(() => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const handleAddHabit = useCallback(
    async (habitData) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5003/api/habits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(habitData),
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to add habit');
        }
        setShowAddModal(false);
        refetch();
      } catch (err) {
        setError(err.message);
      }
    },
    [refetch]
  );

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-t-primary-600 border-neutral-200 rounded-full"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (error || habitsError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center p-6 bg-white rounded-xl shadow-soft max-w-sm">
          <p className="text-base font-semibold text-red-600 mb-4">{error || habitsError}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 mx-auto"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* NOTE: Latest motivation is now displayed near the Missed Streak / Habits section */}
        {/* Header */}
        <motion.div
          className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900">
              Welcome, {user.name}!
            </h1>
            <p className="text-neutral-600 text-sm">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · Keep your streaks alive
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsDropdown notifications={notifications} onClear={() => { setNotifications([]); localStorage.removeItem('sm_notifications'); }} />
            <button
              onClick={handleLogout}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
              aria-label="Logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatsCard
            title="Today's Progress"
            value={habits.length > 0 ? `${completedToday}/${habits.length}` : '0/0'}
            icon={<ListChecks size={20} className="text-primary-500" />}
            color="border-primary-100"
          />
          <StatsCard
            title="Current Streak"
            value={`${streakCount} days`}
            icon={<Flame size={20} className="text-secondary-500" />}
            color="border-secondary-100"
          />
          <StatsCard
            title="Longest Streak"
            value={`${longestStreak} days`}
            icon={<Trophy size={20} className="text-cyan-500" />}
            color="border-cyan-100"
          />
          <StatsCard
            title="Restore Chances"
            value={`${restoreChances}/5`}
            icon={<RotateCcw size={20} className="text-amber-500" />}
            color="border-amber-100"
          />
          <StatsCard
            title="Active Habits"
            value={habits.length}
            icon={<Clock size={20} className="text-emerald-500" />}
            color="border-emerald-100"
          />
        </motion.div>

        {/* Date Selector */}
        <motion.div
          className="mb-6 flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex gap-2 px-2">
            {getDates().map((date, index) => (
              <DateButton
                key={index}
                date={date}
                isToday={date.toDateString() === new Date().toDateString()}
                isSelected={date.toDateString() === selectedDate.toDateString()}
                onClick={() => setSelectedDate(date)}
              />
            ))}
          </div>
        </motion.div>

        {/* Habits Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-bold text-neutral-900">Your Habits</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
            aria-label="Add new habit"
          >
            <PlusCircle size={18} />
            <span>Add Habit</span>
          </button>
        </div>

        {/* Missed Streak Motivation Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <MessageCircle size={20} className="text-primary-600" />
            Missed Streak Motivation
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {habits.map(habit => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yestStr = format(yesterday, 'yyyy-MM-dd');
              const createdAt = new Date(habit.createdAt);
              const eligible = createdAt < new Date(yesterday.setHours(0,0,0,0));
              const missedYesterday = !habit.completedDates.includes(yestStr);
              // hide button if user already submitted a reason for this habit
              const alreadySubmitted = submittedMissedIds.includes(String(habit._id));
              return (missedYesterday && eligible && !alreadySubmitted) ? (
                <button
                  key={habit._id}
                  className="px-3 py-1 rounded bg-primary-100 text-primary-700 hover:bg-primary-200 text-sm font-medium"
                  onClick={() => handleMissedStreak(habit._id)}
                >
                  {habit.name} (Missed Yesterday)
                </button>
              ) : null;
            })}
            {habits.every(habit => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yestStr = format(yesterday, 'yyyy-MM-dd');
              const createdAt = new Date(habit.createdAt);
              const eligible = createdAt < new Date(yesterday.setHours(0,0,0,0));
              return !eligible || habit.completedDates.includes(yestStr);
            }) && (
              <span className="text-neutral-500 text-sm">No missed streaks for yesterday! 🎉</span>
            )}
          </div>
          {/* Latest motivation displayed next to the missed streak buttons */}
          {latestMotivation && latestMotivation.habitId === selectedHabitId && (
            <div className="bg-white border border-primary-100 rounded-lg p-3 mt-3 shadow-soft max-w-md">
              <div className="text-sm text-neutral-600 mb-1"><strong>Habit:</strong> {latestMotivation.habitName}</div>
              <div className="text-sm text-neutral-700 mb-1"><strong>Your Reason:</strong> {latestMotivation.userExplanation}</div>
              <div className="text-sm text-primary-700"><strong>AI Reply:</strong> {latestMotivation.aiReply}</div>
            </div>
          )}
        </div>

        <MissedStreakModal
          open={showMissedModal}
          onClose={() => setShowMissedModal(false)}
          habitId={selectedHabitId}
          habitName={selectedHabitName}
          onMotivation={handleMotivation}
        />
  {/* Motivation History button removed per request; history is accessible near each habit's missed-streak actions */}

        {habits.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No habits yet</h3>
            <p className="text-neutral-600 mb-4 text-sm">Start building your first habit today!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 mx-auto"
              aria-label="Add your first habit"
            >
              <PlusCircle size={18} />
              <span>Add Your First Habit</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {habits.map((habit) => (
              <HabitCard key={habit._id} habit={habit} selectedDate={selectedDate} refetch={refetch} />
            ))}
          </motion.div>
        )}

        <AddHabitModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddHabit}
        />

        {/* Habit Graph Section */}
        <HabitGraph habits={habits} />
      </div>
    </div>
  );
}

export default Dashboard;