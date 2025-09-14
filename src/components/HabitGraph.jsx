import { useState } from 'react';
import {
  Bar,
  Line,
  Pie,
} from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const chartTypes = [
  { label: 'Bar Graph', value: 'bar' },
  { label: 'Line Graph', value: 'line' },
  { label: 'Pie Chart', value: 'pie' },
];

function HabitGraph({ habits }) {
  const [type, setType] = useState('bar');

  // Example: show completions for the last 7 days for each habit
  const today = new Date();
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toLocaleDateString();
  });

  // For each habit, count completions for each day
  const datasets = habits.map((habit, idx) => {
    const data = labels.map(labelDate => {
      const [month, day, year] = labelDate.split('/');
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return habit.completedDates.includes(dateStr) ? 1 : 0;
    });
    return {
      label: habit.name,
      data,
      backgroundColor: `hsl(${idx * 60}, 70%, 60%)`,
      borderColor: `hsl(${idx * 60}, 70%, 40%)`,
      fill: false,
    };
  });

  const barLineData = {
    labels,
    datasets,
  };

  // For pie chart, show total completions per habit
  const pieData = {
    labels: habits.map(h => h.name),
    datasets: [
      {
        data: habits.map(h => h.completedDates.length),
        backgroundColor: habits.map((_, idx) => `hsl(${idx * 60}, 70%, 60%)`),
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-neutral-200 p-6 mt-8">
      <div className="flex items-center gap-4 mb-4">
        <label className="font-semibold text-neutral-700">Graph Type:</label>
        <select
          className="border rounded px-3 py-1"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          {chartTypes.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="w-full max-w-2xl mx-auto">
        {type === 'bar' && <Bar data={barLineData} />}
        {type === 'line' && <Line data={barLineData} />}
        {type === 'pie' && <Pie data={pieData} />}
      </div>
      <div className="mt-4 text-xs text-neutral-500">
        <span>Tree graph is not supported in Chart.js. For advanced visualizations, consider using D3.js or a specialized library.</span>
      </div>
    </div>
  );
}

export default HabitGraph;
