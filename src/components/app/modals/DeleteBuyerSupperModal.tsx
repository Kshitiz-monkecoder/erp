import React, { useRef } from "react";
import { IModalProps } from "@/lib/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { del } from "@/lib/apiService"; 
import ErrorToast from "@/components/app/toasts/ErrorToast";
import SuccessToast from "@/components/app/toasts/SuccessToast";

interface DeleteBuyerSupplierModalProps extends IModalProps {
  clientId: string | number; // ID of the buyer/supplier to delete
  onSuccess?: () => void; // Optional callback after successful deletion (e.g., refresh list)
}

const DeleteBuyerSupplierModal: React.FC<DeleteBuyerSupplierModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!clientId) {
      ErrorToast({
        title: "Error",
        description: "Invalid client ID",
      });
      return;
    }

    try {
      setDeleting(true);

      // API: DELETE http://82.29.161.4:8005/api/v1/client
      // Assuming your del function handles the full URL or base URL is configured
      const response = await del<{ status: boolean; message: string }>(
        `/client/${clientId}`
      );

      if (response.status) {
        SuccessToast({
          title: "Success",
          description: response.message || "Buyer/Supplier deleted successfully",
        });

        // Close modal and trigger refresh
        onClose();
        onSuccess?.(); // e.g., refresh the list in parent component
      } else {
        ErrorToast({
          title: "Error",
          description: response.message || "Failed to delete buyer/supplier",
        });
      }
    } catch (error : any) {
      // console.error("Delete error:", error);
      const errorMessage =
      error?.message ||
      "Something went wrong. Please try again.";
      ErrorToast({
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-md animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between sticky top-0">
          <h4 className="font-semibold md:text-lg lg:text-xl">
            Delete Buyer/Supplier
          </h4>
          <X
            className="text-[#8A8AA3] cursor-pointer w-5 hover:text-gray-800"
            onClick={onClose}
          />
        </div>

        <div className="p-5">
          <p className="text-md text-[#6B6B7E]">
            Are you sure you want to delete this Buyer/Supplier?
            <br />
            <strong>This action cannot be undone.</strong>
          </p>
        </div>

        <div className="p-5 pt-0">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="min-w-24"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBuyerSupplierModal;