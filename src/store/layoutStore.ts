import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  theme: 'light' | 'dark';
  setLeftSidebarOpen: (isOpen: boolean) => void;
  setRightSidebarOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      isLeftSidebarOpen: true,
      isRightSidebarOpen: false,
      theme: 'dark',
      setLeftSidebarOpen: (isOpen) => set({ isLeftSidebarOpen: isOpen }),
      setRightSidebarOpen: (isOpen) => set({ isRightSidebarOpen: isOpen }),
      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },
    }),
    { name: 'layout-storage' }
  )
);
