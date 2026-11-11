export const MAX_HISTORY_ITEMS = 10;
export const MAX_VISIBLE_ITEMS = 8;
export const MIN_TERM_LENGTH = 2;
export const MAX_TERM_LENGTH = 100;

export const GUEST_HISTORY_KEY = 'marvel_search_history_guest';
export const USER_HISTORY_KEY_PREFIX = 'marvel_search_history_user_';
export const SEARCH_HISTORY_EVENT = 'marvel:search-history-changed';

/**
 * Safely returns browser localStorage when available, or null otherwise.
 */
export function getDefaultStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Builds the storage key scoped to the signed-in user or guest session.
 */
export function getSearchHistoryKey(userId) {
  if (userId !== undefined && userId !== null && String(userId).trim() !== '') {
    return `${USER_HISTORY_KEY_PREFIX}${String(userId).trim()}`;
  }
  return GUEST_HISTORY_KEY;
}

/**
 * Normalizes a search keyword: trims, collapses internal spaces, caps length,
 * and rejects strings shorter than MIN_TERM_LENGTH.
 */
export function normalizeSearchTerm(rawTerm) {
  if (typeof rawTerm !== 'string') return '';
  const collapsed = rawTerm.trim().replace(/\s+/g, ' ');
  if (collapsed.length < MIN_TERM_LENGTH) return '';
  const capped = collapsed.slice(0, MAX_TERM_LENGTH).trim();
  return capped.length < MIN_TERM_LENGTH ? '' : capped;
}

function toCompareKey(term) {
  return term.toLocaleLowerCase('vi-VN');
}

function notifyHistoryChanged(key) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(SEARCH_HISTORY_EVENT, { detail: { key } }));
    }
  } catch {
    // Ignore event dispatch errors in restricted environments
  }
}

function sanitizeHistoryList(rawList) {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set();
  const result = [];

  for (const entry of rawList) {
    const normalized = normalizeSearchTerm(entry);
    if (!normalized) continue;
    const compareKey = toCompareKey(normalized);
    if (seen.has(compareKey)) continue;
    seen.add(compareKey);
    result.push(normalized);
    if (result.length >= MAX_HISTORY_ITEMS) break;
  }

  return result;
}

/**
 * Loads search history from storage safely. Never throws on missing or corrupted data.
 */
export function loadSearchHistory(key, storage = getDefaultStorage()) {
  if (!key || !storage || typeof storage.getItem !== 'function') {
    return [];
  }
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return sanitizeHistoryList(parsed);
  } catch {
    return [];
  }
}

/**
 * Persists a sanitized history array to storage safely and notifies listeners.
 */
export function saveSearchHistory(key, items, storage = getDefaultStorage()) {
  const sanitized = sanitizeHistoryList(items);
  if (!key || !storage || typeof storage.setItem !== 'function') {
    return sanitized;
  }
  try {
    storage.setItem(key, JSON.stringify(sanitized));
    notifyHistoryChanged(key);
  } catch {
    // Ignore storage quota / security errors without breaking search
  }
  return sanitized;
}

/**
 * Adds a valid search term to the top of history, deduplicating case-insensitively
 * while preserving Vietnamese accents and capping at MAX_HISTORY_ITEMS.
 */
export function addSearchTerm(key, rawTerm, storage = getDefaultStorage()) {
  const normalized = normalizeSearchTerm(rawTerm);
  const current = loadSearchHistory(key, storage);
  if (!normalized) {
    return current;
  }

  const targetKey = toCompareKey(normalized);
  const deduplicated = current.filter((item) => toCompareKey(item) !== targetKey);
  const updated = [normalized, ...deduplicated].slice(0, MAX_HISTORY_ITEMS);
  return saveSearchHistory(key, updated, storage);
}

/**
 * Removes a single term from search history.
 */
export function removeSearchTerm(key, termToRemove, storage = getDefaultStorage()) {
  const current = loadSearchHistory(key, storage);
  if (typeof termToRemove !== 'string' || !termToRemove.trim()) {
    return current;
  }
  const targetKey = toCompareKey(termToRemove.trim().replace(/\s+/g, ' '));
  const updated = current.filter(
    (item) => item !== termToRemove && toCompareKey(item) !== targetKey
  );
  return saveSearchHistory(key, updated, storage);
}

/**
 * Clears all search history entries for the given account key.
 */
export function clearSearchHistory(key, storage = getDefaultStorage()) {
  if (!key || !storage) {
    return [];
  }
  try {
    if (typeof storage.removeItem === 'function') {
      storage.removeItem(key);
    } else if (typeof storage.setItem === 'function') {
      storage.setItem(key, JSON.stringify([]));
    }
    notifyHistoryChanged(key);
  } catch {
    // Ignore storage errors without breaking search
  }
  return [];
}

/**
 * Filters search history by the current input (case-insensitive, preserving accents)
 * and caps displayed suggestions at maxItems.
 */
export function filterSearchHistory(history, currentInput, maxItems = MAX_VISIBLE_ITEMS) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }
  const normalizedInput =
    typeof currentInput === 'string'
      ? currentInput.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN')
      : '';

  const filtered = normalizedInput
    ? history.filter((item) => toCompareKey(item).includes(normalizedInput))
    : history;

  return filtered.slice(0, maxItems);
}

