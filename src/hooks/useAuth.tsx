
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { User, UserRole, Session } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        // Cast the Supabase session to our Session type if needed
        setSession(newSession as unknown as Session | null);
        
        // Don't perform Supabase calls directly in the callback
        if (newSession?.user) {
          setTimeout(() => {
            // Set a default user object temporarily
            if (!user) {
              setUser({
                id: newSession.user.id,
                email: newSession.user.email || '',
                role: 'employee' as UserRole,
                company_id: '',
                created_at: ''
              });
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
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            role: 'employee' as UserRole, // Default role, will be updated after successful login
            company_id: '',
            created_at: ''
          });
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Get user data
      if (data.user) {
        // Cast the Supabase session to our Session type if needed
        setSession(data.session as unknown as Session);
        
        // Set a default user object based on auth data
        const defaultUser = {
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.role || 'employee' as UserRole,
          company_id: '',
          created_at: ''
        };
        
        setUser(defaultUser);
        toast({
          title: "Success!",
          description: "Successfully logged in",
        });
        
        // Navigate based on default role (will be updated after checking user profile)
        navigate(defaultUser.role === 'admin' ? '/admin/dashboard' : '/properties/map');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password');
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    setIsLoading(true);
    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed.');
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Couldn't create your account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/login');
      toast({
        title: "Success!",
        description: "Successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error logging out",
      });
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
