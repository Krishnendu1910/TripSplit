import { describe, it, expect, beforeEach } from 'vitest'
import { storageAdapter } from '../lib/persistence/storageAdapter'

describe('StorageAdapter persistence abstraction', () => {
  beforeEach(() => {
    storageAdapter.clear()
  })

  it('stores and retrieves JSON data safely', () => {
    const payload = { id: 'test-1', name: 'Manali Trip', budget: 12000 }
    storageAdapter.set('test_trip', payload)

    const retrieved = storageAdapter.get('test_trip')
    expect(retrieved).toEqual(payload)
  })

  it('returns default value when key does not exist', () => {
    const retrieved = storageAdapter.get('non_existent_key', { fallback: true })
    expect(retrieved).toEqual({ fallback: true })
  })

  it('removes item correctly', () => {
    storageAdapter.set('temp', 42)
    expect(storageAdapter.get('temp')).toBe(42)

    storageAdapter.remove('temp')
    expect(storageAdapter.get('temp')).toBeNull()
  })
})
