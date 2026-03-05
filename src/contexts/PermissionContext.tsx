// src/contexts/PermissionContext.tsx (or your file path)

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Permission {
  full: boolean;
  basic: boolean;
  critical: boolean;
  moderate: boolean;
  title?: string;
  description?: string;
  submodule?: any;
}

interface TeamPermissions {
  Settings: Permission;
  Dashboard: Permission;
  Inventory: Permission;
  Production: Permission;
  "User Management": Permission;
  "Sales & Purchase": Permission;
  "Teams Management": Permission;
  "Buyers and Suppliers": Permission;
  "Reports": Permission;
}

interface PermissionContextType {
  permissions: TeamPermissions | null;
  hasPermission: (module: keyof TeamPermissions, level?: keyof Permission) => boolean;
  isModuleAccessible: (module: keyof TeamPermissions) => boolean;
  setPermissions: (perms: TeamPermissions) => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<TeamPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const savedPermissions = localStorage.getItem('userPermissions');
        
        if (savedPermissions) {
          const parsedPerms = JSON.parse(savedPermissions);
          
          if (parsedPerms && typeof parsedPerms === 'object') {
            setPermissions(parsedPerms);
            setLoading(false);
            return;
          }
        }

        // Fallback: load from user profile
        await loadFromProfile();
      } catch (error) {
        console.error('Error loading permissions:', error);
        await loadFromProfile();
      } finally {
        setLoading(false);
      }
    };

    const loadFromProfile = async () => {
      try {
        const savedUser = localStorage.getItem('User');
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          let teamPermissions = null;

          if (userData?.team?.permissions) {
            teamPermissions = userData.team.permissions;
          } else if (userData?.data?.team?.permissions) {
            teamPermissions = userData.data.team.permissions;
          }

          if (teamPermissions) {
            setPermissions(teamPermissions);
            localStorage.setItem('userPermissions', JSON.stringify(teamPermissions));
          }
        }
      } catch (error) {
        console.error('Error loading from profile:', error);
      }
    };

    loadPermissions();
  }, []);

  const hasPermission = (module: keyof TeamPermissions, level: keyof Permission = 'basic'): boolean => {
    if (!permissions) return false;
    
    const modulePerms = permissions[module];
    if (!modulePerms) return false;
    
    if (modulePerms.full) return true;
    
    return modulePerms[level] || false;
  };

  const isModuleAccessible = (module: keyof TeamPermissions): boolean => {
    if (!permissions) return false;
    
    const modulePerms = permissions[module];
    if (!modulePerms) return false;
    
    return modulePerms.full || modulePerms.basic || modulePerms.critical || modulePerms.moderate;
  };

  // Full-screen loading while permissions load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#7047EB] mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 font-medium">Loading your workspace...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up permissions</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionContext.Provider value={{ 
      permissions, 
      hasPermission, 
      isModuleAccessible, 
      setPermissions 
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};