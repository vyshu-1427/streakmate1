import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Users, Search, Lock, Globe, X } from 'lucide-react';

function HabitCircles() {
  const [activeTab, setActiveTab] = useState('myCircles');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [circleData, setCircleData] = useState({
    name: '',
    description: '',
    privacy: 'public',
  });

  const initialMyCircles = [
    {
      id: 1,
      name: 'Morning Routine Masters',
      members: 8,
      habits: ['Morning Meditation', 'Workout', 'Journaling'],
      privacy: 'private',
      image: 'https://images.unsplash.com/photo-1506126279646-a697353d3166?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      name: 'Fitness Buddies',
      members: 12,
      habits: ['Daily Exercise', 'Protein Intake', 'Step Count'],
      privacy: 'public',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    },
  ];
  const [myCirclesState, setMyCirclesState] = useState(initialMyCircles);
  const [editingCircleId, setEditingCircleId] = useState(null);

  const discoverCircles = [
    {
      id: 3,
      name: 'Coding Daily',
      members: 24,
      habits: ['Code for 1 hour', 'Read tech article', 'Solve algorithm'],
      privacy: 'public',
      image: 'https://images.unsplash.com/photo-1516321310762-479437144403?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 4,
      name: 'Mindfulness Group',
      members: 18,
      habits: ['Meditation', 'Gratitude Journal', 'Digital Detox'],
      privacy: 'public',
      image: 'https://images.unsplash.com/photo-1508672019048-805c376b7191?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 5,
      name: 'Book Worms',
      members: 32,
      habits: ['Read 30 min', 'Book Summary', 'New Vocabulary'],
      privacy: 'public',
      image: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCircleData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCircle = (e) => {
    e.preventDefault();
    // local create/edit behaviour
    if (editingCircleId) {
      setMyCirclesState(prev => prev.map(c => c.id === editingCircleId ? { ...c, ...circleData } : c));
      setEditingCircleId(null);
    } else {
      const newCircle = {
        id: Date.now(),
        name: circleData.name,
        description: circleData.description,
        privacy: circleData.privacy,
        members: 1,
        habits: [],
        image: '',
      };
      setMyCirclesState(prev => [newCircle, ...prev]);
    }
    setCircleData({ name: '', description: '', privacy: 'public' });
    setShowCreateModal(false);
  };

  const handleEditCircle = (circle) => {
    setCircleData({ name: circle.name, description: circle.description || '', privacy: circle.privacy || 'public' });
    setEditingCircleId(circle.id);
    setShowCreateModal(true);
  };

  const handleDeleteCircle = (id) => {
    if (!window.confirm('Delete this circle?')) return;
    setMyCirclesState(prev => prev.filter(c => c.id !== id));
  };

  const CircleCard = ({ circle, onEdit, onDelete }) => (
    <motion.div
      className="bg-white rounded-xl shadow-soft overflow-hidden flex flex-col"
      whileHover={{ y: -4, boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-32 overflow-hidden">
        <img
          src={circle.image}
          alt={circle.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
  <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold text-base truncate">{circle.name}</h3>
          {circle.privacy === 'private' ? (
            <Lock size={14} className="text-neutral-500" aria-label="Private circle" />
          ) : (
            <Globe size={14} className="text-neutral-500" aria-label="Public circle" />
          )}
        </div>
        <div className="flex items-center text-neutral-600 mb-3">
          <Users size={14} className="mr-1" />
          <span className="text-xs">{circle.members} members</span>
        </div>
        <p className="text-xs text-neutral-500 mb-4 line-clamp-2">
          {circle.habits.join(', ')}
        </p>
        <div className="flex gap-2 mt-auto">
          {activeTab === 'myCircles' ? (
            <>
              <button onClick={onEdit} className="py-2 px-3 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm">Edit</button>
              <button onClick={onDelete} className="py-2 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm">Delete</button>
            </>
          ) : (
            <button className="py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm">Join Circle</button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900">
                Habit Circles
              </h1>
              <p className="text-neutral-600 text-sm">Connect and grow with accountability groups</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
              aria-label="Create new circle"
            >
              <PlusCircle size={18} />
              <span>Create Circle</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search circles..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                aria-label="Search habit circles"
              />
            </div>
            <select
              className="px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
              aria-label="Filter by category"
            >
              <option>All Categories</option>
              <option>Fitness</option>
              <option>Mindfulness</option>
              <option>Learning</option>
              <option>Productivity</option>
            </select>
          </div>
        </motion.div>

        <div className="mb-6 border-b border-neutral-200">
          <div className="flex gap-6">
            {['myCircles', 'discover'].map((tab) => (
              <button
                key={tab}
                className={`pb-3 px-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                onClick={() => setActiveTab(tab)}
                aria-current={activeTab === tab ? 'page' : undefined}
              >
                {tab === 'myCircles' ? 'My Circles' : 'Discover'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'myCircles' && myCircles.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Users size={40} className="mx-auto text-neutral-400 mb-3" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No circles yet</h3>
            <p className="text-neutral-600 mb-4 text-sm">Join or create your first habit circle</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
                aria-label="Create a new circle"
              >
                <PlusCircle size={18} />
                <span>Create Circle</span>
              </button>
              <button
                onClick={() => setActiveTab('discover')}
                className="border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-100 flex items-center gap-2"
                aria-label="Discover circles"
              >
                <Search size={18} />
                <span>Discover Circles</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {(activeTab === 'myCircles' ? myCirclesState : discoverCircles).map((circle) => (
              <CircleCard key={circle.id} circle={circle} onEdit={() => handleEditCircle(circle)} onDelete={() => handleDeleteCircle(circle.id)} />
            ))}
          </motion.div>
        )}

        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-elevated max-w-md w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-display font-semibold text-neutral-900">Create New Circle</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateCircle}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="circle-name">
                      Circle Name
                    </label>
                    <input
                      id="circle-name"
                      type="text"
                      name="name"
                      value={circleData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                      placeholder="e.g., Morning Routine Masters"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="circle-description">
                      Description
                    </label>
                    <textarea
                      id="circle-description"
                      name="description"
                      value={circleData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm resize-none h-20"
                      placeholder="What is this circle about?"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="circle-privacy">
                      Privacy
                    </label>
                    <select
                      id="circle-privacy"
                      name="privacy"
                      value={circleData.privacy}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm"
                    >
                      <option value="public">Public - Anyone can join</option>
                      <option value="private">Private - Invitation only</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
                    >
                      Create Circle
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default HabitCircles;