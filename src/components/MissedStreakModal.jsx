import { useState } from 'react';
import { motion } from 'framer-motion';

function MissedStreakModal({ open, onClose, habitId, habitName, onMotivation }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  try {
  await onMotivation(habitId, habitName, explanation);
      setExplanation('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="text-xl font-bold mb-4">Missed Streak Explanation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
            rows={4}
            placeholder="Explain why you missed your streak..."
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default MissedStreakModal;
