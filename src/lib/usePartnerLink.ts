import { useState } from 'react';
import { api } from '@/lib/api';
import { supabase } from './supabase';

export function usePartnerLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkPartner = async (partnerEmail: string) => {
    setLoading(true);
    setError(null);

    try {
      // First, find the partner's profile
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', partnerEmail)
        .single();

      if (error) throw error;
      if (!profiles) throw new Error('Partner not found');

      // Link the profiles
      await api.profiles.linkPartner(profiles.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { linkPartner, loading, error };
}