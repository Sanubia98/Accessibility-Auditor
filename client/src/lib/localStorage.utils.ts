

export function saveToLocalStorage(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      console.log(`Saving ${key} to localStorage:`, value);
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`✅ Saved ${key} to localStorage:`, value);
    }
  } catch (err) {
    console.warn(`🚫 Failed to save ${key} to localStorage:`, err);
  }
}

export function getFromLocalStorage(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const value = localStorage.getItem(key);
      console.log(`✅ Fetched ${key} from localStorage:`, value);
      return value;
    }
  } catch (err) {
    console.warn(`🚫 Failed to read ${key} from localStorage:`, err);
  }
  return null;
}

export function removeFromLocalStorage(key: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed ${key} from localStorage`);
    }
  } catch (err) {
    console.warn(`🚫 Failed to remove ${key} from localStorage:`, err);
  }
}
