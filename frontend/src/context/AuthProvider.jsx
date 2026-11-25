import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import api from '../api/axios';

const SESSION_KEY = 'auctionverse_session';

// Read JWT expiration time
function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1];

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = JSON.parse(atob(base64));

    return Number(decoded.exp) * 1000 || 0;
  } catch {
    return 0;
  }
}

// Remove stored authentication
function clearStoredSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// Restore saved authentication
function restoreSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);

    if (!stored) return null;

    const saved = JSON.parse(stored);

    if (
      !saved?.token ||
      getTokenExpiry(saved.token) <= Date.now()
    ) {
      clearStoredSession();
      return null;
    }

    return saved;
  } catch {
    clearStoredSession();
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(restoreSession);

  const [initializing, setInitializing] = useState(
    () => Boolean(restoreSession())
  );

  const [restoreError, setRestoreError] = useState('');
  const [retry, setRetry] = useState(0);

  // Validate restored session with backend
  useEffect(() => {
    const saved = restoreSession();

    if (!saved) return;

    const controller = new AbortController();

    api
      .get('/auth/me', {
        headers: {
          Authorization: `Bearer ${saved.token}`,
        },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;

        const user = response.data?.data?.user;

        if (
          !user ||
          user.is_active === false ||
          !['user', 'admin'].includes(user.role)
        ) {
          clearStoredSession();
          setSession(null);
          setInitializing(false);
          return;
        }

        const verifiedSession = {
          user,
          token: saved.token,
        };

        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify(verifiedSession)
        );

        setSession(verifiedSession);
        setRestoreError('');
        setInitializing(false);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        if (
          [401, 403].includes(error.response?.status) ||
          getTokenExpiry(saved.token) <= Date.now()
        ) {
          clearStoredSession();
          setSession(null);
          setInitializing(false);
        } else {
          setRestoreError(
            'Unable to verify your session. Please retry.'
          );
        }
      });

    return () => controller.abort();
  }, [retry]);

  // Automatically logout when JWT expires
  useEffect(() => {
    if (!session?.token) return;

    const expiry = getTokenExpiry(session.token);

    const remaining = Math.max(
      0,
      Math.min(2147483647, expiry - Date.now())
    );

    const timer = setTimeout(() => {
      clearStoredSession();
      setSession(null);
      setInitializing(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [session]);

  // Login and save session
  const login = (user, token) => {
    const newSession = { user, token };

    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(newSession)
    );

    setSession(newSession);
    setInitializing(false);
    setRestoreError('');
  };

  // Update profile and stored user details
  const updateUser = (user, token) => {
    const current = restoreSession();

    if (current?.token !== token) return;

    const updatedSession = {
      ...current,
      user,
    };

    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(updatedSession)
    );

    setSession(updatedSession);
  };

  // Logout and remove session
  const logout = () => {
    clearStoredSession();
    setSession(null);
    setInitializing(false);
    setRestoreError('');
  };

  // Wait before rendering protected routes
  if (initializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAFC',
          fontFamily: 'Poppins, sans-serif',
          gap: '12px',
        }}
      >
        <h1 style={{ color: '#171433', margin: 0 }}>
          Auction
          <span style={{ color: '#7C3AED' }}>
            Verse
          </span>
        </h1>

        <p style={{ color: '#6B7280' }}>
          {restoreError || 'Restoring your session...'}
        </p>

        {restoreError && (
          <>
            <button
              onClick={() => {
                setRestoreError('');
                setRetry((previous) => previous + 1);
              }}
              style={{
                padding: '10px 24px',
                background: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>

            <button onClick={logout}>
              Return to Login
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}