import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import UniversalTable from "@/components/app/tables";
import { userService, UserResponse } from "../../services/userService";
import AddUserModal from "@/components/app/AddUserModal";
import EditUserModal from "@/components/app/EditUserModal";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import { Edit, Trash2, Users } from "lucide-react";

interface UsersApiResponse {
  records: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = async (page: number = 1, limit: number = 10) => {
    setIsLoading(true);
    try {
      const res = await userService.getAllUsers(page, limit);
      if (res.status && res.data) {
        const apiData = res.data as unknown as UsersApiResponse;
        
        setUsers(apiData.records);
        setTotalItems(apiData.pagination.total);
        setPageIndex(apiData.pagination.page - 1); // Convert to zero-based
        setPageSize(apiData.pagination.limit);
        setPagination({
          page: apiData.pagination.page,
          limit: apiData.pagination.limit,
          total: apiData.pagination.total,
          totalPages: apiData.pagination.totalPages,
        });
      }
    } catch (error) {
      ErrorToast({ title: "Error", description: "Failed to load users" });
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserResponse) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userService.deleteUser(id);
        fetchUsers(pageIndex + 1, pageSize); // pageIndex is zero-based
        // Show success message
        // SuccessToast({ title: "Success", description: "User deleted successfully" });
      } catch {
        ErrorToast({ title: "Error", description: "Failed to delete user" });
      }
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page + 1, pageSize); // Convert to one-based for API
  };

  const columns: ColumnDef<UserResponse>[] = [
    { 
      header: "Name", 
      accessorKey: "name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name") || "N/A"}</span>
    },
    { 
      header: "Email", 
      accessorKey: "email",
      cell: ({ row }) => <span className="text-gray-600">{row.getValue("email") || "N/A"}</span>
    },
    { 
      header: "Phone", 
      accessorKey: "phone",
      cell: ({ row }) => <span>{row.getValue("phone") || "N/A"}</span>
    },
    { 
      header: "User Type", 
      accessorKey: "userType",
      cell: ({ row }) => {
        const userType = row.getValue("userType") as string;
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${
            userType === "Admin" 
              ? "bg-purple-100 text-purple-800" 
              : userType === "User"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}>
            {userType || "N/A"}
          </span>
        );
      }
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return date ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : "N/A";
      },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditUser(row.original)}
            className="p-1 text-blue-600 rounded hover:bg-blue-50"
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(row.original.id)}
            className="p-1 text-red-600 rounded hover:bg-red-50"
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <span className="px-3 py-1 text-sm bg-gray-100 rounded-full">
            {totalItems} users
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 text-white py-2 bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] rounded-lg transition-colors"
        >
          Add User
        </button>
      </div>

      <UniversalTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        enableFiltering={true}
        enablePagination={true}
        enableCreate={true}
        createButtonText="Add User"
        onCreateClick={() => setShowAddModal(true)}
        searchColumn="name"
      />

      {/* Custom pagination */}
      {users.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white border-t">
          <div className="text-sm text-gray-600">
            Showing {(pageIndex * pageSize) + 1} to{" "}
            {Math.min((pageIndex + 1) * pageSize, totalItems)} of{" "}
            {totalItems} users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {pageIndex + 1} of {Math.ceil(totalItems / pageSize)}
            </span>
            <button
              onClick={() => handlePageChange(pageIndex + 1)}
              disabled={pageIndex >= Math.ceil(totalItems / pageSize) - 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onUserAdded={() => fetchUsers(pageIndex + 1, pageSize)}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUserUpdated={() => fetchUsers(pageIndex + 1, pageSize)}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UserManagement;