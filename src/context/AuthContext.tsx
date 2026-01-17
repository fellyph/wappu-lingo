/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { GravatarProfile } from '../types';

interface AuthContextType {
  user: GravatarProfile | null;
  token: string | null;
  isLoading: boolean;
  clientId: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const REDIRECT_URI = window.location.origin + '/';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<GravatarProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('gravatar_token');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  // Fetch config (client ID) from server
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json() as Promise<{ gravatarClientId: string }>)
      .then((data) => {
        setClientId(data.gravatarClientId);
      })
      .catch((err) => {
        console.error('Failed to fetch config:', err);
      });
  }, []);

  // Fetch user profile when token exists but user is not loaded
  // Use derived boolean to avoid re-runs when user object fields change
  const hasUser = !!user;
  useEffect(() => {
    if (token && !hasUser) {
      setIsLoading(true);
      fetch('https://api.gravatar.com/v3/me/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json() as Promise<GravatarProfile>)
        .then((data) => {
          if (data.error) {
            try {
              localStorage.removeItem('gravatar_token');
            } catch {
              // Ignore storage errors
            }
            setToken(null);
          } else {
            setUser(data);
          }
        })
        .catch(() => setToken(null))
        .finally(() => setIsLoading(false));
    }
  }, [token, hasUser]);

  const login = useCallback(() => {
    if (!clientId) return;
    const scopes = ['auth', 'gravatar-profile:read']
      .map((s, i) => `scope[${i}]=${s}`)
      .join('&');
    const authUrl = `https://public-api.wordpress.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&${scopes}`;
    window.location.href = authUrl;
  }, [clientId]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('gravatar_token');
    } catch {
      // Ignore storage errors
    }
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, clientId, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
