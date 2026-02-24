import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IModalProps } from "@/lib/types";
import { X } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import type { Table } from "@tanstack/react-table";
import { AllProductionTableDataType } from "../tables/production/AllProductionTable";

interface Props extends IModalProps {
  table: Table<AllProductionTableDataType>;
  onStatusFilterChange: (status: string) => void;
  currentStatusFilter: string;
}

const FilterProductionTableModal: React.FC<Props> = ({
  isOpen,
  onClose,
  table,
  onStatusFilterChange,
  currentStatusFilter,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatusFilter);
  
  // Update local state when prop changes
  useEffect(() => {
    setSelectedStatus(currentStatusFilter);
  }, [currentStatusFilter]);

  if (!isOpen) return null;

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Planned", value: "planned" },
    { label: "In Progress", value: "publish" },
    { label: "Complete", value: "complete" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const handleResetAll = () => {
    setSelectedStatus("all");
    onStatusFilterChange("all");
    table.resetColumnFilters();
  };

  const handleApply = () => {
    onStatusFilterChange(selectedStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex justify-end z-50">
      <div
        className="bg-white flex flex-col justify-between w-full max-w-md animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div className="">
          <div className="px-6 border-b py-4 flex items-center justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="sm:text-lg font-semibold">Filter Production Orders</h3>
            </div>
            <X className="w-5 h-5 cursor-pointer text-gray-500" onClick={onClose} />
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Status</div>
                <div className="w-full max-w-56">
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-xs text-gray-500 mb-2">Current Filter:</div>
                {selectedStatus !== "all" ? (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium capitalize">
                      {statusOptions.find(opt => opt.value === selectedStatus)?.label || selectedStatus}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStatus("all")}
                      className="h-6 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">No filters applied</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 flex justify-between items-center border-t py-4">
          <Button 
            variant="outline" 
            className="shadow-none text-sm"
            onClick={handleResetAll}
            disabled={selectedStatus === "all"}
          >
            Reset All
          </Button>
          <Button
            onClick={handleApply}
            className="shadow-none bg-[#7047EB] font-light text-sm hover:bg-[#7047EB]"
          >
            Apply Filter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterProductionTableModal;