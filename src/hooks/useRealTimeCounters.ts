import { useState, useEffect, useCallback, useRef } from "react";
import { Counter, apiFetch } from "./useSupabase";
import { sanitizeInput } from "../utils/securityUtils";

export const useRealTimeCounters = (
  groupId: string | null,
  accessKey: string | null,
) => {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingUpdates = useRef<Record<string, boolean>>({});

  // Load initial counters
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const loadCounters = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/counters?groupId=${groupId}`);
        setCounters(data || []);
      } catch (err) {
        console.error("Error loading counters:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load counters",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCounters();
  }, [groupId]);

  // Set up real-time subscription using SSE
  useEffect(() => {
    if (!groupId) return;

    console.log("Setting up SSE for group:", groupId);
    const eventSource = new EventSource(`/api/events?groupId=${groupId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.counters) {
        setCounters((prev) => {
          const serverCounters = data.counters as Counter[];
          const serverIds = new Set(serverCounters.map((c) => c.id));

          // 1. Process server counters (merge updates, ignore if locally pending)
          const processed = serverCounters.map((incomingCounter: Counter) => {
            if (pendingUpdates.current[incomingCounter.id]) {
              return (
                prev.find((c) => c.id === incomingCounter.id) || incomingCounter
              );
            }
            return incomingCounter;
          });

          // 2. Filter out items that are not on the server, BUT only if they are not being deleted locally
          return processed.filter(
            (c) => serverIds.has(c.id) || pendingUpdates.current[c.id],
          );
        });
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
    };

    return () => {
      console.log("Closing SSE connection");
      eventSource.close();
    };
  }, [groupId]);

  const createCounter = useCallback(async () => {
    if (!groupId || !accessKey) return;

    const tempId = Math.random().toString(36).substring(7);
    const newCounter = {
      id: tempId,
      group_id: groupId,
      name: "New Counter",
      description: "",
      value: 0,
      increment_step: 1,
      decrement_step: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setCounters((prev) => [...prev, newCounter as Counter]);

    try {
      const data = await apiFetch("/api/counters", {
        method: "POST",
        body: JSON.stringify({
          groupId,
          accessKey,
          name: "New Counter",
          description: "",
          value: 0,
          increment_step: 1,
          decrement_step: 1,
        }),
      });
      // Replace temp with real
      setCounters((prev) => prev.map((c) => (c.id === tempId ? data : c)));
      return data;
    } catch (err) {
      setCounters((prev) => prev.filter((c) => c.id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to create counter");
      throw err;
    }
  }, [groupId, accessKey]);

  const updateCounter = useCallback(
    async (counterId: string, updates: Partial<Counter>) => {
      if (!groupId || !accessKey) return;

      const previousState = [...counters];
      pendingUpdates.current[counterId] = true;

      // Optimistic update
      setCounters((prev) =>
        prev.map((c) => (c.id === counterId ? { ...c, ...updates } : c)),
      );

      try {
        await apiFetch("/api/counters", {
          method: "PATCH",
          body: JSON.stringify({
            id: counterId,
            groupId,
            accessKey,
            ...updates,
          }),
        });
      } catch (err) {
        // Rollback
        setCounters(previousState);
        setError("Failed to update counter");
        throw err;
      } finally {
        setTimeout(() => {
          delete pendingUpdates.current[counterId];
        }, 500);
      }
    },
    [groupId, accessKey, counters],
  );

  const deleteCounter = useCallback(
    async (counterId: string) => {
      if (!groupId || !accessKey) return;

      const previousState = [...counters];
      pendingUpdates.current[counterId] = true;
      setCounters((prev) => prev.filter((c) => c.id !== counterId));

      try {
        await apiFetch("/api/counters", {
          method: "DELETE",
          body: JSON.stringify({
            id: counterId,
            groupId,
            accessKey,
          }),
        });
      } catch (err) {
        setCounters(previousState);
        setError("Failed to delete counter");
        throw err;
      } finally {
        setTimeout(() => {
          delete pendingUpdates.current[counterId];
        }, 500);
      }
    },
    [groupId, accessKey, counters],
  );

  const incrementCounter = useCallback(
    async (counter: Counter) => {
      return updateCounter(counter.id, {
        value: counter.value + (counter.increment_step || 1),
      });
    },
    [updateCounter],
  );

  const decrementCounter = useCallback(
    async (counter: Counter) => {
      return updateCounter(counter.id, {
        value: counter.value - (counter.decrement_step || 1),
      });
    },
    [updateCounter],
  );

  return {
    counters,
    loading,
    error,
    createCounter,
    updateCounter,
    deleteCounter,
    incrementCounter,
    decrementCounter,
    clearError: () => setError(null),
  };
};
