import React, { useRef } from "react";
import { IModalProps } from "@/lib/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DeleteCategoryModal: React.FC<IModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-md animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between sticky top-0">
          <h4 className="font-semibold md:text-lg lg:text-xl">
            Delete Category
          </h4>
          <X className="text-[#8A8AA3] cursor-pointer w-5" onClick={onClose} />
        </div>

        <div className="p-5">
          <p className="text-md text-[#6B6B7E]">
            Are you sure you want to delete this category?
            <br />
            This action cannot be undone.
          </p>
        </div>
        <div className="p-5">
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <Button className="" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button className="" variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DeleteCategoryModal;
