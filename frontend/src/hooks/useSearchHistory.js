import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  SEARCH_HISTORY_EVENT,
  getSearchHistoryKey,
  loadSearchHistory,
  addSearchTerm,
  removeSearchTerm,
  clearSearchHistory,
  filterSearchHistory,
  MAX_VISIBLE_ITEMS,
} from '../utils/searchHistory';

function areHistoriesEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Shared React hook for per-account browser search history, synchronized across
 * all mounted search boxes and browser tabs.
 */
export function useSearchHistory() {
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated ? user?.id : null;
  const historyKey = getSearchHistoryKey(userId);

  const [history, setHistory] = useState(() => loadSearchHistory(historyKey));

  useEffect(() => {
    const syncHistory = () => {
      const latest = loadSearchHistory(historyKey);
      setHistory((prev) => (areHistoriesEqual(prev, latest) ? prev : latest));
    };

    syncHistory();

    if (typeof window === 'undefined') return undefined;

    const handleCustomEvent = (event) => {
      if (!event?.detail?.key || event.detail.key === historyKey) {
        syncHistory();
      }
    };

    const handleStorageEvent = (event) => {
      if (event.key === null || event.key === historyKey) {
        syncHistory();
      }
    };

    window.addEventListener(SEARCH_HISTORY_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(SEARCH_HISTORY_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [historyKey]);

  const addTerm = useCallback(
    (term) => {
      const updated = addSearchTerm(historyKey, term);
      setHistory((prev) => (areHistoriesEqual(prev, updated) ? prev : updated));
      return updated;
    },
    [historyKey]
  );

  const removeTerm = useCallback(
    (term) => {
      const updated = removeSearchTerm(historyKey, term);
      setHistory((prev) => (areHistoriesEqual(prev, updated) ? prev : updated));
      return updated;
    },
    [historyKey]
  );

  const clearAll = useCallback(() => {
    const updated = clearSearchHistory(historyKey);
    setHistory((prev) => (areHistoriesEqual(prev, updated) ? prev : updated));
    return updated;
  }, [historyKey]);

  const getSuggestions = useCallback(
    (currentInput, maxItems = MAX_VISIBLE_ITEMS) =>
      filterSearchHistory(history, currentInput, maxItems),
    [history]
  );

  return {
    history,
    addTerm,
    removeTerm,
    clearAll,
    getSuggestions,
  };
}

export default useSearchHistory;

