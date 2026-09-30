import { useState } from 'react';
import { createUrl } from '../api/urls';

// onCreated: callback so the parent (Dashboard) can prepend the new URL
// to its list, without UrlForm needing to know HOW the list is stored
export default function UrlForm({ onCreated }) {
  const [longUrl, setLongUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await createUrl(longUrl);
      onCreated(data);
      setLongUrl('');
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to create URL');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="https://example.com/very/long/url"
        value={longUrl}
        onChange={(e) => setLongUrl(e.target.value)}
        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? 'Shortening...' : 'Shorten'}
      </button>
      {error && <p className="absolute mt-10 text-sm text-red-600">{error}</p>}
    </form>
  );
}
