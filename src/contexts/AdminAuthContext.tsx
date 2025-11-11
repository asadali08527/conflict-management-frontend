import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthService } from '@/services/admin/adminAuth';
import { AdminUser } from '@/types/admin.types';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  setAdminUser: (user: AdminUser | null) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin user is logged in on mount
    const storedUser = adminAuthService.getStoredUser();
    const isAuthenticated = adminAuthService.isAuthenticated();

    if (isAuthenticated && storedUser) {
      setAdminUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  const logout = async () => {
    await adminAuthService.logout();
    setAdminUser(null);
  };

  const value = {
    adminUser,
    isAuthenticated: !!adminUser,
    isLoading,
    logout,
    setAdminUser,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
