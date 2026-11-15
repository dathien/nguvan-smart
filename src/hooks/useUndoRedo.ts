import { useCallback, useState } from 'react';

export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<{ past: T[]; present: T; future: T[] }>({
    past: [],
    present: initialState,
    future: [],
  });

  const set = useCallback((next: T | ((prev: T) => T), recordHistory = true) => {
    setHistory((curr) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(curr.present) : next;
      if (!recordHistory) {
        return { ...curr, present: resolved };
      }
      return {
        past: [...curr.past.slice(-29), curr.present],
        present: resolved,
        future: [],
      };
    });
  }, []);

  const reset = useCallback((state: T) => {
    setHistory({ past: [], present: state, future: [] });
  }, []);

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      return {
        past: curr.past.slice(0, -1),
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: curr.future.slice(1),
      };
    });
  }, []);

  return {
    state: history.present,
    set,
    reset,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
