// ============================================================
// useSocket — connects to our Socket.io server as the logged-in user,
// and cleans up the connection when the component unmounts
// ============================================================

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/axios';

export function useSocket(enabled) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token: getAccessToken() },
    });
    setSocket(newSocket);

    // CLEANUP FUNCTION — runs when the component unmounts, OR before this
    // effect re-runs. Without this, every re-run of this effect (including
    // React StrictMode's intentional double-mount in dev) would open a
    // SECOND socket connection on top of the first, leaking connections
    // and eventually double-firing every event handler we attach.
    return () => {
      newSocket.disconnect();
    };
  }, [enabled]);

  return socket;
}
