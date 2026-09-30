import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { getUrls, getAnalytics } from '../api/urls';
import UrlForm from '../components/UrlForm';
import UrlList from '../components/UrlList';
import ClickChart from '../components/ClickChart';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [urls, setUrls] = useState([]);
  const [selectedShortCode, setSelectedShortCode] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const socket = useSocket(!!user);

  // Fetch the user's URLs once, on mount
  useEffect(() => {
    (async () => {
      const { data } = await getUrls();
      setUrls(data);
    })();
  }, []);

  const loadAnalytics = async (shortCode) => {
    setSelectedShortCode(shortCode);
    const { data } = await getAnalytics(shortCode);
    setAnalytics(data);
  };

  const handleCreated = (newUrl) => {
    setUrls((prev) => [newUrl, ...prev]);
  };

  // ============================================================
  // LIVE UPDATES — a real useEffect pitfall, deliberately handled correctly:
  //
  // This effect depends on `selectedShortCode`, so it re-runs (removing the
  // OLD listener, attaching a NEW one) every time the selected URL changes.
  // Without `selectedShortCode` in the dependency array, the handler below
  // would close over whatever `selectedShortCode` was AT THE TIME the effect
  // first ran — a "stale closure." It would keep comparing against that
  // frozen original value forever, even after the user selects a different
  // URL, silently breaking live chart updates for anything selected later.
  //
  // Note `setUrls` uses the FUNCTIONAL update form (prev => ...) instead of
  // reading the `urls` variable directly — this sidesteps the same stale-
  // closure problem for the URL list update without needing `urls` itself
  // in the dependency array (which would re-subscribe on every click count
  // change, causing unnecessary socket listener churn).
  // ============================================================
  useEffect(() => {
    if (!socket) return;

    const handleClick = (data) => {
      setUrls((prev) =>
        prev.map((u) => (u.shortCode === data.shortCode ? { ...u, clickCount: u.clickCount + 1 } : u))
      );

      if (data.shortCode === selectedShortCode) {
        loadAnalytics(selectedShortCode);
      }
    };

    socket.on('urlClicked', handleClick);

    // Cleanup: remove THIS specific listener before the effect re-runs or
    // the component unmounts — otherwise old listeners pile up every time
    // selectedShortCode changes, and a single click would fire multiple
    // stale handlers at once.
    return () => {
      socket.off('urlClicked', handleClick);
    };
  }, [socket, selectedShortCode]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={logout}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">Logged in as {user?.email}</p>

        <div className="relative mt-6">
          <UrlForm onCreated={handleCreated} />
        </div>

        <div className="mt-6">
          <UrlList urls={urls} selectedShortCode={selectedShortCode} onSelect={loadAnalytics} />
        </div>

        <ClickChart analytics={analytics} />
      </div>
    </div>
  );
}
