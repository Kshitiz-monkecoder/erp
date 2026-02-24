// components/app/PermissionsModal.tsx
import React, { useState, useEffect } from "react";
import { X, Save, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { userService, Permission as PermissionType, Permissions } from "@/services/userService";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import SuccessToast from "@/components/app/toasts/SuccessToast";

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
  onPermissionsUpdated?: () => void;
}

// Define permission levels
const PERMISSION_LEVELS = [
  { key: "basic", label: "Basic", description: "View only access" },
  { key: "moderate", label: "Moderate", description: "Create and edit access" },
  { key: "full", label: "Full", description: "Full administrative access" },
  { key: "critical", label: "Critical", description: "Critical system access" },
];

// Helper function to normalize module names for comparison
const normalizeModuleName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  onPermissionsUpdated,
}) => {
  const [availablePermissions, setAvailablePermissions] = useState<Permissions>({});
  const [selectedPermissions, setSelectedPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen, teamId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // Load available permissions (all modules)
      const allPermsRes = await userService.getAllPermissions();
      if (allPermsRes.status && allPermsRes.data) {
        setAvailablePermissions(allPermsRes.data);
        
        // Initialize with all false based on available permissions
        const initialPermissions: Permissions = {};
        Object.keys(allPermsRes.data).forEach(module => {
          initialPermissions[module] = {
            basic: false,
            moderate: false,
            full: false,
            critical: false,
          };
        });

        // Load team's existing permissions
        const teamPermsRes = await userService.getTeamPermissions(teamId);
        if (teamPermsRes.status && teamPermsRes.data?.permissions) {
          const teamPermissions = teamPermsRes.data.permissions;
          
          // Merge team permissions with initial permissions
          Object.keys(teamPermissions).forEach(moduleKey => {
            // Try to match the module key with available modules
            const matchedModule = Object.keys(initialPermissions).find(
              availableModule => normalizeModuleName(availableModule) === normalizeModuleName(moduleKey)
            );
            
            if (matchedModule) {
              // Update the permissions for the matched module
              const teamPerms = teamPermissions[moduleKey];
              initialPermissions[matchedModule] = {
                basic: teamPerms.basic || false,
                moderate: teamPerms.moderate || false,
                full: teamPerms.full || false,
                critical: teamPerms.critical || false,
              };
            }
          });
        }
        
        setSelectedPermissions(initialPermissions);
      }
    } catch (error) {
      ErrorToast({
        title: "Error",
        description: "Failed to load permissions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (
    module: string,
    level: keyof PermissionType,
    checked: boolean
  ) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [level]: checked,
      },
    }));
  };

  const handleModuleToggle = (module: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [module]: {
        basic: checked,
        moderate: checked,
        full: checked,
        critical: checked,
      },
    }));
  };

  const handlePermissionLevelToggle = (level: keyof PermissionType, checked: boolean) => {
    const updatedPermissions = { ...selectedPermissions };
    Object.keys(updatedPermissions).forEach(module => {
      updatedPermissions[module] = {
        ...updatedPermissions[module],
        [level]: checked,
      };
    });
    setSelectedPermissions(updatedPermissions);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Send the teamId along with permissions in the request
      const res = await userService.updateTeamPermissions({
        teamId: teamId, 
        permissions: selectedPermissions,
      });

      if (res.status) {
        SuccessToast({
          title: "Success",
          description: "Permissions updated successfully",
        });
        onPermissionsUpdated?.();
        onClose();
      }
    } catch (error) {
      ErrorToast({
        title: "Error",
        description: "Failed to update permissions",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const modules = Object.keys(availablePermissions);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Permissions</h2>
              <p className="text-sm text-gray-600">Team: {teamName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#7047EB] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading permissions...</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Bulk Actions */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Toggle All Modules:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const allChecked = modules.every(module => 
                          selectedPermissions[module]?.basic && 
                          selectedPermissions[module]?.moderate && 
                          selectedPermissions[module]?.full && 
                          selectedPermissions[module]?.critical
                        );
                        modules.forEach(module => 
                          handleModuleToggle(module, !allChecked)
                        );
                      }}
                    >
                      {modules.every(module => 
                        selectedPermissions[module]?.basic && 
                        selectedPermissions[module]?.moderate && 
                        selectedPermissions[module]?.full && 
                        selectedPermissions[module]?.critical
                      ) ? "Unselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    {PERMISSION_LEVELS.map(level => (
                      <div key={level.key} className="flex items-center gap-1">
                        <Checkbox
                          id={`bulk-${level.key}`}
                          checked={modules.every(module => 
                            selectedPermissions[module]?.[level.key as keyof PermissionType]
                          )}
                          onCheckedChange={(checked) => 
                            handlePermissionLevelToggle(
                              level.key as keyof PermissionType, 
                              checked as boolean
                            )
                          }
                        />
                        <label htmlFor={`bulk-${level.key}`} className="text-sm">
                          All {level.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permissions Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700 min-w-[250px] border-r">
                        Module
                      </th>
                      {PERMISSION_LEVELS.map(level => (
                        <th
                          key={level.key}
                          className="text-center p-4 font-semibold text-gray-700 border-r last:border-r-0"
                          title={level.description}
                        >
                          <div className="flex flex-col items-center">
                            <span>{level.label}</span>
                            <span className="text-xs text-gray-500 font-normal">
                              {level.description}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module, index) => {
                      const modulePerms = selectedPermissions[module] || {};
                      const isModuleFullySelected = 
                        modulePerms.basic && 
                        modulePerms.moderate && 
                        modulePerms.full && 
                        modulePerms.critical;

                      return (
                        <tr 
                          key={module} 
                          className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                        >
                          <td className="p-4 border-r">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`module-${module}`}
                                checked={isModuleFullySelected}
                                onCheckedChange={(checked) => 
                                  handleModuleToggle(module, checked as boolean)
                                }
                              />
                              <div>
                                <label 
                                  htmlFor={`module-${module}`}
                                  className="font-medium text-gray-900 cursor-pointer"
                                >
                                  {module}
                                </label>
                              </div>
                            </div>
                          </td>
                          
                          {PERMISSION_LEVELS.map(level => (
                            <td key={`${module}-${level.key}`} className="p-4 border-r text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  id={`${module}-${level.key}`}
                                  checked={modulePerms[level.key as keyof PermissionType] || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(
                                      module, 
                                      level.key as keyof PermissionType, 
                                      checked as boolean
                                    )
                                  }
                                  className="scale-125"
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Modules</p>
                  <p className="text-2xl font-bold">{modules.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Selected Modules</p>
                  <p className="text-2xl font-bold text-green-600">
                    {modules.filter(module => 
                      selectedPermissions[module]?.basic || 
                      selectedPermissions[module]?.moderate || 
                      selectedPermissions[module]?.full || 
                      selectedPermissions[module]?.critical
                    ).length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Full Access Modules</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {modules.filter(module => 
                      selectedPermissions[module]?.full
                    ).length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Critical Access</p>
                  <p className="text-2xl font-bold text-red-600">
                    {modules.filter(module => 
                      selectedPermissions[module]?.critical
                    ).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {modules.filter(module => 
              selectedPermissions[module]?.basic || 
              selectedPermissions[module]?.moderate || 
              selectedPermissions[module]?.full || 
              selectedPermissions[module]?.critical
            ).length} of {modules.length} modules selected
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Permissions
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;