
import { useState, useEffect, ReactNode, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '@/types';
import { Session, AuthContextType } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthProvider as BaseAuthProvider } from '@/contexts/AuthContext';
import { 
  fetchUserProfile, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  getCurrentSession,
  createDefaultUser,
  handleAuthSuccess,
  handleAuthError
} from '@/services/authService';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        // Cast the Supabase session to our Session type if needed
        setSession(newSession as unknown as Session | null);
        
        // Don't perform Supabase calls directly in the callback
        if (newSession?.user) {
          setTimeout(() => {
            // Set a default user object temporarily
            if (!user) {
              setUser(createDefaultUser(newSession.user.id, newSession.user.email || ''));
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );
    
    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // Cast the Supabase session to our Session type if needed
          setSession(data.session as unknown as Session);
          
          // Set a default user object temporarily (will be completed later)
          setUser(createDefaultUser(data.session.user.id, data.session.user.email || ''));
          
          // Try to get the actual user data from the database
          const userData = await fetchUserProfile(data.session.user.id);
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      // Sign in with Supabase
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        throw error;
      }
      
      // Get user data
      if (data.user) {
        // Cast the Supabase session to our Session type if needed
        setSession(data.session as unknown as Session);
        
        // Try to get user data from the database
        const userData = await fetchUserProfile(data.user.id);
        
        if (userData) {
          setUser(userData);
          handleAuthSuccess("Successfully logged in");
          navigate(userData.role === 'admin' ? '/admin/dashboard' : '/properties/map');
          return;
        }
        
        // Fallback: Use metadata from auth if database fetch fails
        const role = ((data.user.user_metadata?.role || 'employee') as UserRole);
        const defaultUser = {
          id: data.user.id,
          email: data.user.email || '',
          role: role,
          company_id: '',
          created_at: ''
        };
        
        setUser(defaultUser);
        handleAuthSuccess("Successfully logged in");
        navigate(role === 'admin' ? '/admin/dashboard' : '/properties/map');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password');
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    setIsLoading(true);
    try {
      // Sign up with Supabase
      const { data, error } = await signUpWithEmail(email, password, fullName);
      
      if (error) throw error;

      handleAuthSuccess("Registration successful! Please check your email to verify your account.");
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed.');
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setSession(null);
      navigate('/login');
      handleAuthSuccess("Successfully logged out");
    } catch (error) {
      console.error('Logout error:', error);
      handleAuthError(error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
    isAdmin: user?.role === 'admin',
    error,
    setError,
  };

  return <BaseAuthProvider value={value}>{children}</BaseAuthProvider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
