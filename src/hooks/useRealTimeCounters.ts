import { useState, useEffect, useCallback } from 'react';
import { supabase, Counter } from './useSupabase';
import { sanitizeInput } from '../utils/securityUtils';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useRealTimeCounters = (groupId: string | null) => {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Load initial counters
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const loadCounters = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('counters')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setCounters(data || []);
      } catch (err) {
        console.error('Error loading counters:', err);
        setError(err instanceof Error ? err.message : 'Failed to load counters');
      } finally {
        setLoading(false);
      }
    };

    loadCounters();
  }, [groupId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!groupId) return;

    // Clean up existing subscription
    if (channel) {
      console.log('Cleaning up existing channel');
      supabase.removeChannel(channel);
    }

    console.log('Setting up real-time subscription for group:', groupId);
    
    const newChannel = supabase
      .channel(`counters-${groupId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'counters',
          filter: `group_id=eq.${groupId}`
        },
        (payload: RealtimePostgresChangesPayload<Counter>) => {
          console.log('Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setCounters(prev => {
              const exists = prev.find(c => c.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new as Counter];
            });
          } else if (payload.eventType === 'UPDATE') {
            setCounters(prev =>
              prev.map(counter =>
                counter.id === payload.new?.id
                  ? { ...counter, ...payload.new }
                  : counter
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCounters(prev =>
              prev.filter(counter => counter.id !== payload.old?.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    setChannel(newChannel);

    return () => {
      console.log('Unsubscribing from real-time updates');
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [groupId]);

  const createCounter = useCallback(async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from('counters')
        .insert({
          group_id: groupId,
          name: 'New Counter',
          description: '',
          value: 0,
          increment_step: 1,
          decrement_step: 1
        })
        .select()
        .single();

      if (error) throw error;
      console.log('Counter created:', data);
      return data;
    } catch (err) {
      console.error('Error creating counter:', err);
      setError(err instanceof Error ? err.message : 'Failed to create counter');
      throw err;
    }
  }, [groupId]);

  const updateCounter = useCallback(async (
    counterId: string,
    updates: Partial<Counter>
  ) => {
    try {
      console.log('Updating counter:', counterId, updates);
      
      // Sanitize text inputs only (not URL fields)
      const sanitizedUpdates = { ...updates };
      if (updates.name) {
        sanitizedUpdates.name = sanitizeInput(updates.name);
      }
      if (updates.description) {
        sanitizedUpdates.description = sanitizeInput(updates.description);
      }
      
      // Handle thumbnail_url - ensure it's a string or null, don't sanitize URLs
      if (updates.thumbnail_url !== undefined) {
        sanitizedUpdates.thumbnail_url = updates.thumbnail_url || null;
      }

      const { data, error } = await supabase
        .from('counters')
        .update(sanitizedUpdates)
        .eq('id', counterId)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Counter updated successfully:', data);
    } catch (err) {
      console.error('Error updating counter:', err);
      setError(err instanceof Error ? err.message : 'Failed to update counter');
      throw err;
    }
  }, []);

  const deleteCounter = useCallback(async (counterId: string) => {
    try {
      console.log('Deleting counter:', counterId);
      const { error } = await supabase
        .from('counters')
        .delete()
        .eq('id', counterId);

      if (error) throw error;
      console.log('Counter deleted successfully');
      
      // Optimistic update: remove from state immediately
      setCounters(prev => prev.filter(counter => counter.id !== counterId));
    } catch (err) {
      console.error('Error deleting counter:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete counter');
      throw err;
    }
  }, []);

  const incrementCounter = useCallback(async (counter: Counter) => {
    console.log('Incrementing counter:', counter.id);
    return updateCounter(counter.id, {
      value: counter.value + counter.increment_step
    });
  }, [updateCounter]);

  const decrementCounter = useCallback(async (counter: Counter) => {
    console.log('Decrementing counter:', counter.id);
    return updateCounter(counter.id, {
      value: counter.value - counter.decrement_step
    });
  }, [updateCounter]);

  return {
    counters,
    loading,
    error,
    createCounter,
    updateCounter,
    deleteCounter,
    incrementCounter,
    decrementCounter,
    clearError: () => setError(null)
  };
};