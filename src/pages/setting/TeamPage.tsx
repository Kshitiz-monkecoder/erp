import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import UniversalTable from "@/components/app/tables";
import { userService, TeamResponse } from "../../services/userService";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import { Edit, Trash2, Shield, Radio, Plus } from "lucide-react";
import AddTeamModal from "@/components/app/AddTeamModal";
import PermissionsModal from "@/components/app/modals/PermissionModal";

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamResponse | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedTeamForPermissions, setSelectedTeamForPermissions] = useState<{
    id: number;
    name: string;
  } | null>(null);

  console.log("TeamsPage rendered", teams);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAllTeams();
      if (res?.status) {
        setTeams(res.data || []);
      }
    } catch (err) {
      ErrorToast({
        title: "Error",
        description: "Unable to fetch teams",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const columns: ColumnDef<TeamResponse>[] = [
    {
      header: "Team",
      accessorKey: "name",
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Permissions",
      accessorKey: "permissions",
      cell: ({ row }) => {
        const permissions = row.original.permissions;
        if (!permissions || Object.keys(permissions).length === 0) {
          return <span className="text-gray-400">No permissions</span>;
        }
        
        const moduleCount = Object.keys(permissions).length;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {moduleCount} module{moduleCount !== 1 ? 's' : ''}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        );
      },
    },
    {
      header: "Users",
      accessorKey: "userCount", 
      cell: ({ row }) => {
        const userCount = row.original.userCount;
        return userCount !== undefined ? userCount : "-";
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {/* Edit Team */}
          <Edit
            className="w-4 h-4 text-blue-600 cursor-pointer"
            onClick={() => {
              setEditTeam(row.original);
              setShowAddModal(true);
            }}
          />

          {/* Permissions */}
          <Shield 
            className="w-4 h-4 text-blue-600 cursor-pointer" 
            onClick={() => {
              setSelectedTeamForPermissions({
                id: row.original.id,
                name: row.original.name,
              });
              setShowPermissionsModal(true);
            }}
          />

          {/* Broadcast / Webhooks */}
          <Radio className="w-4 h-4 text-blue-600 cursor-pointer" />

          {/* Delete */}
          <Trash2 
            className="w-4 h-4 text-red-600 cursor-pointer" 
            onClick={async () => {
              if (window.confirm(`Are you sure you want to delete team "${row.original.name}"?`)) {
                try {
                  await userService.deleteTeam(row.original.id);
                  fetchTeams();
                } catch (error) {
                  ErrorToast({
                    title: "Error",
                    description: "Failed to delete team",
                  });
                }
              }
            }}
          />
        </div>
      ),
    },
  ];

  const customFilterSection = (table: any) => (
    <>
      {/* Team Search */}
      <div className="flex items-end">
        <input
          placeholder="Search teams..."
          className="h-8 w-[200px] px-3 rounded-md border border-gray-300 text-sm"
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("name")?.setFilterValue(e.target.value)
          }
        />
      </div>

      {/* Description Search */}
      <div className="flex items-end">
        <input
          placeholder="Search descriptions..."
          className="h-8 w-[250px] px-3 rounded-md border border-gray-300 text-sm"
          value={
            (table.getColumn("description")?.getFilterValue() as string) ?? ""
          }
          onChange={(e) =>
            table.getColumn("description")?.setFilterValue(e.target.value)
          }
        />
      </div>
    </>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">Manage teams of your company</p>
        </div>

        <button
          className="flex items-center gap-2 bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] text-white px-4 py-2 rounded-md transition-colors"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      {/* Universal Table */}
      <UniversalTable
        data={teams}
        columns={columns}
        isLoading={isLoading}
        enableFiltering={true}
        enablePagination={true}
        searchColumn="name"
        customFilterSection={customFilterSection}
        className="bg-white rounded-lg shadow-sm"
      />

      {/* Add/Edit Team Modal */}
      {showAddModal && (
        <AddTeamModal
          isOpen={showAddModal}
          team={editTeam}
          onClose={() => {
            setShowAddModal(false);
            setEditTeam(null);
          }}
          onTeamAdded={fetchTeams}
        />
      )}

      {/* Permissions Management Modal */}
      {showPermissionsModal && selectedTeamForPermissions && (
        <PermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedTeamForPermissions(null);
          }}
          teamId={selectedTeamForPermissions.id}
          teamName={selectedTeamForPermissions.name}
          onPermissionsUpdated={fetchTeams}
        />
      )}
    </div>
  );
};

export default TeamsPage;