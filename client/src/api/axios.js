// ============================================================
// AXIOS INSTANCE — a single configured HTTP client for the whole app
// Handles: attaching the access token, and silently refreshing it
// when it expires (instead of forcing the user to log in again)
// ============================================================

import axios from 'axios';

// The access token lives in a plain JS variable, NOT localStorage.
// WHY: localStorage is readable by any injected script (XSS risk).
// This variable resets on page refresh — that's intentional; see
// AuthContext's mount-time restore flow for how we recover from that.
let accessToken = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => {
  accessToken = token;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send the httpOnly refresh-token cookie with every request
});

// Request interceptor: runs before EVERY outgoing request made with `api`
// Attaches the current access token, if we have one
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: runs after EVERY response
// If a request fails with 401 (access token expired), try refreshing
// ONCE, then retry the original request. This is what makes token
// expiry invisible to the user — no forced re-login every 15 minutes.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // `_retry` guards against an infinite loop: if the refresh itself
    // triggers another 401, we must NOT try to refresh again forever.
    // We ALSO explicitly exclude the refresh endpoint itself here — a 401
    // from /api/auth/refresh means "no valid session," full stop. Without
    // this check, that expected 401 would trigger a pointless second call
    // to the same endpoint, which would just 401 again identically.
    const isRefreshCall = originalRequest.url?.includes('/api/auth/refresh');

    // CRITICAL: only attempt a silent refresh if this request was actually
    // authenticated (carried an access token) in the first place. Login and
    // Register NEVER carry a token — a 401 from them means "wrong password"
    // or "no such account," never "token expired." Without this check, a
    // failed login attempt would trigger a refresh call, and the REFRESH
    // call's error ("No refresh token provided") would silently replace the
    // real login error ("Invalid credentials") in the UI — exactly the bug
    // we hit: attempting to log in with a nonexistent account showed the
    // wrong message.
    const wasAuthenticated = Boolean(originalRequest.headers?.Authorization);

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall && wasAuthenticated) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true } // sends the refresh cookie
        );
        setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest); // retry the original failed request
      } catch (refreshError) {
        // Refresh token is ALSO invalid/expired — truly logged out now
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
