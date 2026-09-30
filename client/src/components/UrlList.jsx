export default function UrlList({ urls, selectedShortCode, onSelect }) {
  if (urls.length === 0) {
    return <p className="text-sm text-gray-500">No URLs yet — create one above.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
      {urls.map((url) => (
        <li
          key={url.shortCode}
          className={`flex items-center justify-between p-3 text-sm ${
            selectedShortCode === url.shortCode ? 'bg-gray-50' : ''
          }`}
        >
          <div className="min-w-0 flex-1">
            <a
              href={`${import.meta.env.VITE_API_URL}/${url.shortCode}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-gray-900 hover:underline"
            >
              /{url.shortCode}
            </a>
            <p className="truncate text-gray-500">{url.longUrl}</p>
          </div>
          <div className="ml-4 flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {url.clickCount} clicks
            </span>
            <button
              onClick={() => onSelect(url.shortCode)}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View analytics
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
