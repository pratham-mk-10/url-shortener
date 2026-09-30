import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Registering only the pieces we actually use — a Line chart needs scales +
// point/line elements; a Doughnut needs ArcElement. Skipping registration
// for a chart type you use throws a runtime error, not a silent failure.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function ClickChart({ analytics }) {
  if (!analytics) return null;

  const lineData = {
    labels: analytics.clicksOverTime.map((d) => d._id),
    datasets: [
      {
        label: 'Clicks',
        data: analytics.clicksOverTime.map((d) => d.count),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const deviceData = {
    labels: analytics.deviceBreakdown.map((d) => d._id || 'unknown'),
    datasets: [
      {
        data: analytics.deviceBreakdown.map((d) => d.count),
        backgroundColor: ['rgb(37, 99, 235)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)'],
      },
    ],
  };

  return (
    <div className="mt-6 rounded border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-900">
        Analytics for /{analytics.shortCode} — {analytics.totalClicks} total clicks
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Clicks over time</p>
          <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Device breakdown</p>
          <Doughnut data={deviceData} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
}
