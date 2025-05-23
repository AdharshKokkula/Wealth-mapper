
import { User, UserRole } from './index';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

// Session type to match Supabase's session structure
export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;  // Optional to match Supabase's structure
  expires_in: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
};
