
import { toast } from '@/components/ui/use-toast';
import { User, UserRole } from '@/types';
import { Session } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

export async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (!userError && userData) {
      // Cast the role to UserRole to ensure type safety
      const role = userData.role as UserRole;
      return {
        ...userData,
        role
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'employee' // Default role for new users
      },
    },
  });
}

export async function signOutUser() {
  return await supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session as unknown as Session | null;
}

export function createDefaultUser(userId: string, email: string): User {
  return {
    id: userId,
    email: email || '',
    role: 'employee' as UserRole,
    company_id: '',
    created_at: ''
  };
}

export function handleAuthSuccess(message: string) {
  toast({
    title: "Success!",
    description: message,
  });
}

export function handleAuthError(error: any) {
  const errorMessage = error.message || 'Authentication error';
  toast({
    variant: "destructive",
    title: "Error",
    description: errorMessage,
  });
}
