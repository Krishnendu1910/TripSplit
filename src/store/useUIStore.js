import { create } from 'zustand'

export const useUIStore = create((set) => ({
  isCreateTripModalOpen: false,
  isMobileNavOpen: false,
  toast: null,

  openCreateTripModal: () => set({ isCreateTripModalOpen: true }),
  closeCreateTripModal: () => set({ isCreateTripModalOpen: false }),
  setMobileNavOpen: (isOpen) => set({ isMobileNavOpen: isOpen }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type, id: Date.now() } })
    setTimeout(() => {
      set({ toast: null })
    }, 3500)
  },
  clearToast: () => set({ toast: null }),
}))
