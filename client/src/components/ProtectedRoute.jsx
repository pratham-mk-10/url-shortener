// ============================================================
// PROTECTED ROUTE
// Wraps a page that requires login. Redirects to /login if not
// authenticated; shows nothing (briefly) while we're still checking
// ============================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Still checking the session (the refresh-on-load call in AuthContext
  // hasn't resolved yet) — render nothing rather than prematurely redirecting
  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
