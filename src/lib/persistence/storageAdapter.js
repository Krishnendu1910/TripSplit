/**
 * TripSplit Storage Adapter Abstraction
 *
 * Provides a clean boundary for offline-first persistence so components
 * and stores never make scattered direct localStorage/IndexedDB calls.
 */

class MemoryStorageBackend {
  constructor() {
    this.store = new Map()
  }

  getItem(key) {
    return this.store.get(key) || null
  }

  setItem(key, value) {
    this.store.set(key, String(value))
  }

  removeItem(key) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

class StorageAdapter {
  constructor() {
    this.backend = this._selectBackend()
    this.prefix = 'tripsplit_'
  }

  _selectBackend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const testKey = '__storage_test__'
        window.localStorage.setItem(testKey, testKey)
        window.localStorage.removeItem(testKey)
        return window.localStorage
      }
    } catch {
      // Fallback for restricted environments/iframes/SSR
    }
    return new MemoryStorageBackend()
  }

  get(key, defaultValue = null) {
    try {
      const serialized = this.backend.getItem(this.prefix + key)
      if (serialized === null) return defaultValue
      return JSON.parse(serialized)
    } catch {
      return defaultValue
    }
  }

  set(key, value) {
    try {
      const serialized = JSON.stringify(value)
      this.backend.setItem(this.prefix + key, serialized)
      return true
    } catch {
      return false
    }
  }

  remove(key) {
    try {
      this.backend.removeItem(this.prefix + key)
      return true
    } catch {
      return false
    }
  }

  clear() {
    try {
      if (typeof window !== 'undefined' && this.backend === window.localStorage) {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith(this.prefix))
          .forEach((k) => window.localStorage.removeItem(k))
      } else {
        this.backend.clear()
      }
      return true
    } catch {
      return false
    }
  }
}

export const storageAdapter = new StorageAdapter()

