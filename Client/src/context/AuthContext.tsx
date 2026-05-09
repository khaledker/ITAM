import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type Employee } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────
interface AuthState {
  user: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user_name: string, password: string) => Promise<void>;
  logout: () => void;
}

// ── Context ───────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // true on mount while we check localStorage
  });

  // On mount — restore session from localStorage if token exists
  useEffect(() => {
    const token = localStorage.getItem('itam_token');
    const userRaw = localStorage.getItem('itam_user');

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as Employee;
        setState({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        // Corrupt data — clear it
        localStorage.removeItem('itam_token');
        localStorage.removeItem('itam_user');
        setState(s => ({ ...s, isLoading: false }));
      }
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = async (user_name: string, password: string) => {
    const { token, employee } = await authApi.login(user_name, password);

    localStorage.setItem('itam_token', token);
    localStorage.setItem('itam_user', JSON.stringify(employee));

    setState({ user: employee, token, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('itam_token');
    localStorage.removeItem('itam_user');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
