import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import UniversalTable from "@/components/app/tables";
import { userService, UserResponse } from "../../services/userService";
import AddUserModal from "@/components/app/AddUserModal";
import EditUserModal from "@/components/app/EditUserModal";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import { Edit, Trash2, Users, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  
  // Get current user from auth context
  const { user: currentUser, loading: authLoading } = useAuth();

  const fetchUsers = async (page: number = 1, limit: number = 10) => {
    setIsLoading(true);
    try {
      const res = await userService.getAllUsers(page, limit);
      if (res.status && res.data) {
        const apiData = res.data as unknown as UsersApiResponse;
        
        setUsers(apiData.records);
        setTotalItems(apiData.pagination.total);
        setPageIndex(apiData.pagination.page - 1);
        setPageSize(apiData.pagination.limit);
      }
    } catch (error) {
      ErrorToast({ title: "Error", description: "Failed to load users" });
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch users when auth is loaded
    if (!authLoading) {
      fetchUsers();
    }
  }, [authLoading]);

  const handleEditUser = (user: UserResponse) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const confirmDeleteUser = (user: UserResponse) => {
    // Check if user is trying to delete themselves
    if (currentUser && currentUser.id === user.id) {
      ErrorToast({ 
        title: "Cannot Delete", 
        description: "You cannot delete your own account." 
      });
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await userService.deleteUser(userToDelete.id);
      
      if (response.status) {
        SuccessToast({ 
          title: "Success", 
          description: `User "${userToDelete.name}" deleted successfully` 
        });
        fetchUsers(pageIndex + 1, pageSize);
      } else {
        ErrorToast({ 
          title: "Error", 
          description: response.message || "Failed to delete user" 
        });
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      ErrorToast({ 
        title: "Error", 
        description: error.message || "Failed to delete user" 
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page + 1, pageSize);
  };

  // Add a helper function to check if user is current user
  const isCurrentUser = (userId: number): boolean => {
    return currentUser ? currentUser.id === userId : false;
  };

  const columns: ColumnDef<UserResponse>[] = [
    { 
      header: "Name", 
      accessorKey: "name",
      cell: ({ row }) => {
        const user = row.original;
        const isOwnAccount = isCurrentUser(user.id);
        
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name || "N/A"}</span>
            {isOwnAccount && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                You
              </span>
            )}
          </div>
        );
      }
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
      cell: ({ row }) => {
        const user = row.original;
        const isOwnAccount = isCurrentUser(user.id);
        
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleEditUser(user)}
              className={`p-1 rounded hover:bg-blue-50 ${
                isOwnAccount ? "text-gray-400 cursor-not-allowed" : "text-blue-600"
              }`}
              title={isOwnAccount ? "Cannot edit your own account" : "Edit user"}
              disabled={isOwnAccount}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => !isOwnAccount && confirmDeleteUser(user)}
              className={`p-1 rounded hover:bg-red-50 ${
                isOwnAccount ? "text-gray-400 cursor-not-allowed" : "text-red-600"
              }`}
              title={isOwnAccount ? "Cannot delete your own account" : "Delete user"}
              disabled={isOwnAccount}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Delete User
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete the user{" "}
              <span className="font-semibold text-gray-900">
                "{userToDelete?.name}"
              </span>
              ? This will permanently remove the user account and all associated data.
            </p>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;