
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { User, UserRole } from '@/types';
import { supabase, signIn as supabaseSignIn, signOut as supabaseSignOut } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session with Supabase
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // Get the user profile
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (error) throw error;
          setUser(userData as User);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) throw error;
          setUser(userData as User);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabaseSignIn(email, password);
      
      if (signInError) {
        throw signInError;
      }
      
      // Get user data
      if (data.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (error) throw error;
        
        setUser(userData as User);
        toast({
          title: "Success!",
          description: "Successfully logged in",
        });
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (signUpError) throw signUpError;

      if (data.user) {
        // Insert the new user into our custom users table
        const newUser = {
          id: data.user.id,
          email: data.user.email,
          role: 'employee', // Default role for new users
          company_id: "648813f5-3e95-4a15-9169-31d4af71ca4b", // Default company ID
        };
        
        const { error: insertError } = await supabase
          .from('users')
          .insert([newUser]);
          
        if (insertError) throw insertError;
        
        toast({
          title: "Registration successful!",
          description: "Please check your email to verify your account.",
        });
        navigate('/login');
      }
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
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
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
