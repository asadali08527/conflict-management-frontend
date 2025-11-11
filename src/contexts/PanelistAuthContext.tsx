import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PanelistUser, PanelistInfo } from '@/types/panelist/auth.types';
import { authService } from '@/services/panelist/authService';

interface PanelistAuthContextType {
  panelistUser: PanelistUser | null;
  panelistInfo: PanelistInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: PanelistUser, panelist: PanelistInfo) => void;
  logout: () => Promise<void>;
  updatePanelistInfo: (panelist: PanelistInfo) => void;
}

const PanelistAuthContext = createContext<PanelistAuthContextType | undefined>(undefined);

export const PanelistAuthProvider = ({ children }: { children: ReactNode }) => {
  const [panelistUser, setPanelistUser] = useState<PanelistUser | null>(null);
  const [panelistInfo, setPanelistInfo] = useState<PanelistInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount (non-sensitive data only)
    // Session is validated by HttpOnly cookie on each API request
    const storedUser = sessionStorage.getItem('panelistUser');
    const storedPanelist = sessionStorage.getItem('panelistInfo');

    if (storedUser && storedPanelist) {
      try {
        setPanelistUser(JSON.parse(storedUser));
        setPanelistInfo(JSON.parse(storedPanelist));
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        sessionStorage.removeItem('panelistUser');
        sessionStorage.removeItem('panelistInfo');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (user: PanelistUser, panelist: PanelistInfo) => {
    setPanelistUser(user);
    setPanelistInfo(panelist);
    // Store non-sensitive user info in sessionStorage
    sessionStorage.setItem('panelistUser', JSON.stringify(user));
    sessionStorage.setItem('panelistInfo', JSON.stringify(panelist));
  };

  const logout = async () => {
    try {
      // Call backend to clear HttpOnly cookies
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      setPanelistUser(null);
      setPanelistInfo(null);
      sessionStorage.removeItem('panelistUser');
      sessionStorage.removeItem('panelistInfo');
    }
  };

  const updatePanelistInfo = (panelist: PanelistInfo) => {
    setPanelistInfo(panelist);
    sessionStorage.setItem('panelistInfo', JSON.stringify(panelist));
  };

  const value = {
    panelistUser,
    panelistInfo,
    isAuthenticated: !!panelistUser,
    isLoading,
    login,
    logout,
    updatePanelistInfo,
  };

  return (
    <PanelistAuthContext.Provider value={value}>
      {children}
    </PanelistAuthContext.Provider>
  );
};

export const usePanelistAuth = () => {
  const context = useContext(PanelistAuthContext);
  if (context === undefined) {
    throw new Error('usePanelistAuth must be used within a PanelistAuthProvider');
  }
  return context;
};
