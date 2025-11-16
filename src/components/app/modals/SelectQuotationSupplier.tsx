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
// import { useNavigate } from "react-router-dom";
import {get} from "../../../lib/apiService"

interface ISelectSupplierModalProps extends IModalProps {
  /** Called with the selected supplier ID when the user hits Continue */
  onContinue: (supplierId: string) => void;
}

const SelectQuotationSupplier: React.FC<ISelectSupplierModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  // const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      try {
        // const token = localStorage.getItem("token");
     

        const data = await get("/client");
        const filteredSuppliers = (data.data || []).filter(
          (client: any) =>
            client.clientType === "Supplier" || client.clientType === "Both",
        );
        setSuppliers(filteredSuppliers);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    if (isOpen) fetchSuppliers();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-xl pb-10 animate-in fade-in duration-200"
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

              <Select
                value={selectedSupplierId}
                onValueChange={(value) => setSelectedSupplierId(value)}
              >
                <SelectTrigger className={`${inputClasses} w-full`}>
                  <SelectValue placeholder="Select a Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(suppliers || []).map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 text-right">
              <button
                type="submit"
                className="bg-[#7047EB] text-white px-4 py-2 rounded hover:bg-[#5c3cc2]"
              >
                Continue
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectQuotationSupplier;
