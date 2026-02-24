import React, { useRef, useEffect, useState } from "react";
import { inputClasses, labelClasses } from "@/lib/constants";
import { X, Plus } from "lucide-react";
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

interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuyer?: (buyer: any) => void; // for ShowBuyers
  onSelectSupplier?: (supplier: any) => void; // for ShowSuppliers
}

const ShowSuppliers: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  onSelectSupplier,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const response = await get("/client");
        
        // Access response.data.list instead of response.data
        const clients = response?.data?.list || [];
        
        const filteredSuppliers = clients.filter(
          (client: any) =>
            client.clientType === "Supplier" || client.clientType === "Both",
        );
        
        setSuppliers(filteredSuppliers);

        // Set initial selected supplier after suppliers are loaded
        const savedSupplier = localStorage.getItem("selectedSupplier");
        if (savedSupplier && filteredSuppliers.length > 0) {
          try {
            const parsedSupplier = JSON.parse(savedSupplier);

            // Check if this supplier exists in the fetched suppliers list
            const supplierExists = filteredSuppliers.find(
              (supplier: any) => supplier.id == parsedSupplier.id,
            );
            if (supplierExists) {
              setSelectedSupplierId(String(parsedSupplier.id));
            }
          } catch (error) {
            console.error("Error parsing saved supplier:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setSuppliers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [isOpen]);

  useEffect(() => {
    const selectedSupplier = suppliers.find((s) => s.id == selectedSupplierId);
    if (selectedSupplier) {
      localStorage.setItem(
        "selectedSupplier",
        JSON.stringify(selectedSupplier),
      );
      onSelectSupplier?.(selectedSupplier);
    }
  }, [selectedSupplierId, suppliers, onSelectSupplier]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-xl pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between">
          <h4 className="font-semibold md:text-lg lg:text-xl">
            Please Add/Select Supplier
          </h4>
          <X className="text-[#8A8AA3] cursor-pointer w-5" onClick={onClose} />
        </div>

        <div className="p-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-3">
              <Label className={labelClasses} htmlFor="selectSupplier">
                Select Supplier <span className="text-[#F53D6B] -mr-2">*</span>
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
                onValueChange={(value) => {
                  setSelectedSupplierId(value);
                }}
              >
                <SelectTrigger className={`${inputClasses} w-full`}>
                  <SelectValue placeholder="Select a Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {/* Show only supplier name, not company name */}
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowSuppliers;