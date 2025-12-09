import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import UniversalTable from "@/components/app/tables";
import { userService, UserResponse } from "../../services/userService"; // Updated import
import AddUserModal from "@/components/app/AddUserModal";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import { Edit, Trash2, Users } from "lucide-react";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAllUsers();
      if (res.status) setUsers(res.data);
    } catch {
      ErrorToast({ title: "Error", description: "Failed to load users" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userService.deleteUser(id);
        fetchUsers();
        // Optional: Show success toast
      } catch {
        ErrorToast({ title: "Error", description: "Failed to delete user" });
      }
    }
  };

  const columns: ColumnDef<UserResponse>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Email", accessorKey: "email" },
    { header: "Phone", accessorKey: "phone" },
    { header: "Team", accessorKey: "team" },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Edit className="w-4 h-4 text-blue-600 cursor-pointer" />
          <Trash2
            className="w-4 h-4 text-red-600 cursor-pointer"
            onClick={() => handleDeleteUser(row.original.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>

      <UniversalTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        enableFiltering
        enablePagination
        enableCreate
        createButtonText="Add User"
        onCreateClick={() => setShowAddModal(true)}
        searchColumn="name"
      />

      {showAddModal && (
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onUserAdded={fetchUsers}
        />
      )}
    </div>
  );
};

export default UserManagement;