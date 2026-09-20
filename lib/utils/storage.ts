/**
 * Safe LocalStorage and SessionStorage wrappers.
 * Protects against QuotaExceededError, SecurityError in private/incognito mode,
 * or environments where localStorage is blocked or throws.
 */

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Could not read key "${key}":`, e);
    }
    return null;
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Could not write key "${key}":`, e);
    }
    return false;
  },

  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Could not remove key "${key}":`, e);
    }
    return false;
  },

  clear: (): boolean => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
        return true;
      }
    } catch (e) {
      console.warn("[SafeStorage] Could not clear storage:", e);
    }
    return false;
  },
};
