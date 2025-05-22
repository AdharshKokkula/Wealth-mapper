
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { User, UserRole, Session } from '@/types';
import { supabase, signIn as supabaseSignIn, signOut as supabaseSignOut, signUp as supabaseSignUp } from '@/lib/supabase';

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
      (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        setSession(newSession);
        
        // Don't perform Supabase calls directly in the callback to avoid deadlocks
        if (newSession?.user) {
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', newSession.user.id)
                .single();
                
              if (error) {
                console.error('Error fetching user data:', error);
                return;
              }
              
              setUser(data as User);
            } catch (err) {
              console.error('Error in timeout callback:', err);
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
          setSession(data.session);
          
          // Get the user profile
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user data:', error);
            setIsLoading(false);
            return;
          }
          
          setUser(userData as User);
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
      const response = await supabaseSignIn(email, password);
      
      if (response.error) {
        throw response.error;
      }
      
      // Get user data
      if (response.data.user) {
        setSession(response.data.session);
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', response.data.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user data after signin:', error);
          throw error;
        }
        
        setUser(userData as User);
        toast({
          title: "Success!",
          description: "Successfully logged in",
        });
        
        // Navigate based on user role
        navigate(userData.role === 'admin' ? '/admin/dashboard' : '/properties/map');
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
      const response = await supabaseSignUp(email, password, {
        full_name: fullName,
      });
      
      if (response.error) throw response.error;

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
      await supabaseSignOut();
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
