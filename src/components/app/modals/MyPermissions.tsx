// pages/MyPermissionsPage.tsx
import React, { useState, useEffect } from "react";
import { Shield, Check, X, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import { Button } from "@/components/ui/button";
import { get } from "@/lib/apiService";

interface Permission {
  title?: string;
  description?: string;
  basic?: boolean;
  moderate?: boolean;
  full?: boolean;
  critical?: boolean;
  submodule?: Record<string, any>;
}

interface ProfileResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    email: string;
    name: string;
    phone: string;
    userType: string;
    teamId: number;
    company: {
      id: number;
      name: string;
      type: string;
      createdAt: string;
      updatedAt: string;
    };
    team: {
      id: number;
      name: string;
      description: string;
      permissions: Record<string, Permission>;
      companyId: number;
      createdAt: string;
      updatedAt: string;
    };
  };
}

const MyPermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfilePermissions();
  }, []);

  const fetchProfilePermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get<ProfileResponse>("/profile");
      
      if (response?.status && response.data) {
        const userData = response.data;
        
        // Get permissions from team object
        if (userData.team?.permissions) {
          setPermissions(userData.team.permissions);
        } else {
          setPermissions({});
          setError("No permissions found for your team");
        }
      } else {
        setError(response?.message || "Failed to fetch profile data");
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "An error occurred while fetching your permissions");
      ErrorToast({
        title: "Error",
        description: "Failed to fetch your permissions",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get all permission keys (modules)
  const permissionModules = Object.keys(permissions);

  // Sort modules in a specific order (optional)
  const sortedModules = permissionModules.sort((a, b) => {
    const order = [
      "Dashboard",
      "Sales & Purchase",
      "Inventory",
      "Production",
      "Buyers and Suppliers",
      "Settings",
      "User Management",
      "Teams Management"
    ];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Calculate statistics
  const totalGrantedPermissions = Object.values(permissions).reduce((acc, module) => {
    return acc + (Object.values(module).filter(value => value === true).length);
  }, 0);

  const fullAccessModules = Object.values(permissions).filter(module => 
    module.full === true
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#7047EB] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && permissionModules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 text-red-500 mx-auto">⚠️</div>
              <p className="mt-4 text-red-600">{error}</p>
              <Button 
                onClick={fetchProfilePermissions}
                className="mt-4 bg-[#7047EB] hover:bg-[#7047EB]/90"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/settings">
              <Button variant="ghost" className="p-2 hover:bg-gray-200">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">My Permissions</h1>
              <p className="text-gray-600">View your assigned permissions across different modules</p>
            </div>
            <Button 
              onClick={fetchProfilePermissions}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Info Banner */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Permission Information</p>
              <p className="text-xs text-blue-700">
                These permissions are assigned to your team. Contact your team administrator if you need additional access.
              </p>
            </div>
          </div>
        </div>

        {/* Permissions Table */}
        {permissionModules.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-4 font-semibold text-gray-700 min-w-[200px]">
                        Permission Module
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700 min-w-[120px]">
                        Basic
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700 min-w-[120px]">
                        Moderate
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700 min-w-[120px]">
                        Full
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700 min-w-[120px]">
                        Critical
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedModules.map((moduleName, index) => {
                      const modulePermissions = permissions[moduleName];
                      
                      return (
                        <tr 
                          key={moduleName} 
                          className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="p-4">
                            <div className="font-medium text-gray-900">
                              {moduleName}
                            </div>
                            {modulePermissions.title && (
                              <div className="text-sm text-gray-500 mt-1">
                                {modulePermissions.description}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <PermissionCell hasPermission={modulePermissions.basic} />
                          </td>
                          <td className="p-4 text-center">
                            <PermissionCell 
                              hasPermission={modulePermissions.moderate} 
                              showDash={modulePermissions.moderate === undefined}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <PermissionCell 
                              hasPermission={modulePermissions.full} 
                              showDash={modulePermissions.full === undefined}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <PermissionCell 
                              hasPermission={modulePermissions.critical} 
                              showDash={modulePermissions.critical === undefined}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Permission Levels</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Granted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-100 border border-red-300 flex items-center justify-center">
                    <X className="w-3 h-3 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-600">Not Granted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 text-gray-400">-</div>
                  <span className="text-sm text-gray-600">Not Applicable</span>
                </div>
                <div className="text-xs text-gray-500">
                  Permissions are managed by your team administrator
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm text-gray-600">Total Modules</p>
                <p className="text-2xl font-bold">{sortedModules.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm text-gray-600">Granted Permissions</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalGrantedPermissions}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm text-gray-600">Full Access Modules</p>
                <p className="text-2xl font-bold text-blue-600">
                  {fullAccessModules}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">Just now</p>
                <p className="text-xs text-gray-500">Auto-refreshed</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Assigned</h3>
            <p className="text-gray-600 mb-4">
              You don't have any permissions assigned to your team yet.
            </p>
            <Button 
              onClick={fetchProfilePermissions}
              className="bg-[#7047EB] hover:bg-[#7047EB]/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Permission Cell Component
const PermissionCell: React.FC<{ hasPermission?: boolean; showDash?: boolean }> = ({ 
  hasPermission, 
  showDash = false 
}) => {
  if (showDash || hasPermission === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div className="flex items-center justify-center">
      {hasPermission ? (
        <div className="w-6 h-6 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
          <Check className="w-4 h-4 text-green-600" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-red-100 border border-red-300 flex items-center justify-center">
          <X className="w-4 h-4 text-red-600" />
        </div>
      )}
    </div>
  );
};

export default MyPermissionsPage;