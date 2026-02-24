import { IModalProps } from "@/lib/types";
import React, { useRef, useEffect, useState } from "react";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { get } from "../../../lib/apiService";

interface ISelectSupplierModalProps extends IModalProps {
  onContinue: (supplierId: string) => void;
}

const SelectSupplierModal: React.FC<ISelectSupplierModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      alert("Please select a supplier");
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id == selectedSupplierId);
    if (selectedSupplier) {
      localStorage.setItem(
        "selectedSupplier",
        JSON.stringify(selectedSupplier),
      );
      console.log("Stored supplier:", selectedSupplier);

      onContinue(selectedSupplierId);
      onClose();
    }
  };

  // Fetch suppliers from backend
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const response = await get("/client");
        console.log("Full API response:", response); // Debug log
        
        // Handle different response structures
        let clients = [];
        
        if (response && response.data) {
          // If response.data has a 'list' property (new structure)
          if (response.data.list && Array.isArray(response.data.list)) {
            clients = response.data.list;
          } 
          // If response.data is directly an array (old structure)
          else if (Array.isArray(response.data)) {
            clients = response.data;
          }
          // If response.data is the array itself (another possible structure)
          else if (Array.isArray(response)) {
            clients = response;
          }
        }
        
        console.log("Clients extracted:", clients); // Debug log
        
        // Filter suppliers (Supplier or Both)
        const filteredSuppliers = clients.filter(
          (client: any) =>
            client.clientType === "Supplier" || client.clientType === "Both",
        );
        
        console.log("Filtered suppliers:", filteredSuppliers); // Debug log
        setSuppliers(filteredSuppliers);
        
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setSuppliers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-xl animate-in fade-in duration-200"
        ref={modalRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between">
            <h4 className="font-semibold md:text-lg lg:text-xl">
              Please Add/Select Supplier
            </h4>
            <X
              className="text-[#8A8AA3] cursor-pointer w-5"
              onClick={onClose}
            />
          </div>

          <div className="p-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-3">
                <Label className={labelClasses} htmlFor="selectSupplier">
                  Select Supplier{" "}
                  <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Link
                  to="/add-company"
                  className="flex text-[#7047EB] underline underline-offset-3 text-xs items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4" />
                  Add New Company
                </Link>
              </div>

              {isLoading ? (
                <div className="py-3 text-center text-gray-500">
                  Loading suppliers...
                </div>
              ) : suppliers.length === 0 ? (
                <div className="py-3 text-center text-gray-500">
                  No suppliers found. Please add a supplier first.
                </div>
              ) : (
                <Select
                  value={selectedSupplierId}
                  onValueChange={(value) => setSelectedSupplierId(value)}
                >
                  <SelectTrigger className={`${inputClasses} w-full`}>
                    <SelectValue placeholder="Select a Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={String(supplier.id)}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="mt-6 text-right">
              <button
                type="submit"
                className="bg-[#7047EB] text-white px-4 py-2 rounded hover:bg-[#5c3cc2] disabled:bg-gray-400"
                disabled={!selectedSupplierId || isLoading}
              >
                {isLoading ? "Loading..." : "Continue"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectSupplierModal;