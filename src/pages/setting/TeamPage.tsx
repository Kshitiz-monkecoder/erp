import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import UniversalTable from "@/components/app/tables";
import { userService, TeamResponse } from "../../services/userService"; // Updated import
import ErrorToast from "@/components/app/toasts/ErrorToast";
import { Edit, Trash2, Shield, Radio, Plus } from "lucide-react";
import AddTeamModal from "@/components/app/AddTeamModal";

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamResponse[]>([]); // Use TeamResponse type
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAllTeams(); // Use userService instead of direct get
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
      header: "Users",
      accessorKey: "usersCount",
      cell: ({ row }) => row.getValue("usersCount") || "-",
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {/* Edit Team */}
          <Edit className="w-4 h-4 text-blue-600 cursor-pointer" />

          {/* Permissions */}
          <Shield className="w-4 h-4 text-blue-600 cursor-pointer" />

          {/* PRO Badge - only show if needed */}
          {/* <span className="border border-yellow-500 text-yellow-600 text-[10px] px-2 py-[1px] rounded">
            PRO
          </span> */}

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
          placeholder="Search"
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
          placeholder="Search"
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
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
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

      {/* Add Team Modal */}
      {showAddModal && (
        <AddTeamModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onTeamAdded={fetchTeams}
        />
      )}
    </div>
  );
};

export default TeamsPage;