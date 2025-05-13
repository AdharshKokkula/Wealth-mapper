
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session?.user || null;
};

// Database helper functions

// Companies
export const getCompanyById = async (id: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
};

export const updateCompany = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Users
export const getUsersByCompany = async (companyId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', companyId);
    
  if (error) throw error;
  return data;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

// Properties
export const getProperties = async (filters?: any) => {
  let query = supabase.from('properties').select(`
    *,
    owner:owners(*)
  `);
  
  // Apply filters if provided
  if (filters) {
    if (filters.searchQuery) {
      query = query.ilike('address', `%${filters.searchQuery}%`);
    }
    
    if (filters.propertyType) {
      query = query.eq('type', filters.propertyType);
    }
    
    if (filters.propertyValue && filters.propertyValue.length === 2) {
      query = query
        .gte('value', filters.propertyValue[0])
        .lte('value', filters.propertyValue[1]);
    }
    
    if (filters.propertySize && filters.propertySize.length === 2) {
      query = query
        .gte('size', filters.propertySize[0])
        .lte('size', filters.propertySize[1]);
    }
    
    if (filters.ownerNetWorth && filters.ownerNetWorth.length === 2) {
      // This would typically be a join query, but for simplicity:
      query = query.in('owner_id', 
        supabase
          .from('owners')
          .select('id')
          .gte('net_worth', filters.ownerNetWorth[0])
          .lte('net_worth', filters.ownerNetWorth[1])
      );
    }
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// Saved Views
export const getSavedViews = async (userId: string) => {
  const { data, error } = await supabase
    .from('saved_views')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

export const createSavedView = async (userId: string, viewData: any) => {
  const { data, error } = await supabase
    .from('saved_views')
    .insert({ user_id: userId, view_data: viewData })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Saved Filters
export const getSavedFilters = async (userId: string) => {
  const { data, error } = await supabase
    .from('filters')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

export const createSavedFilter = async (userId: string, filterData: any) => {
  const { data, error } = await supabase
    .from('filters')
    .insert({ user_id: userId, filter_data: filterData })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Reports
export const getReports = async (userId: string) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const createReport = async (userId: string, reportData: any) => {
  const { data, error } = await supabase
    .from('reports')
    .insert({ user_id: userId, report_data: reportData, created_at: new Date().toISOString() })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Logs
export const getLogs = async (companyId: string) => {
  const { data, error } = await supabase
    .from('logs')
    .select('*, users!inner(*)')
    .eq('users.company_id', companyId)
    .order('timestamp', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const createLog = async (userId: string, action: string) => {
  const { data, error } = await supabase
    .from('logs')
    .insert({ user_id: userId, action, timestamp: new Date().toISOString() })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
