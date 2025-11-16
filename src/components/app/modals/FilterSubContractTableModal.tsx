import { Button } from "@/components/ui/button";
import { IModalProps } from "@/lib/types";
import { X } from "lucide-react";
import React, { useRef } from "react";
import type { Table } from "@tanstack/react-table";
import SelectFilter, { OptionType } from "../SelectFilter";
import { SubContractTableData } from "../tables/production/SubContractTable";

interface Props extends IModalProps {
  table: Table<SubContractTableData>;
}
const FilterSubContractTableModal: React.FC<Props> = ({
  isOpen,
  onClose,
  table,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  if (!isOpen) return null;

  const processStage: OptionType[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "Pending" },
    { label: "WIP", value: "WIP" },
    { label: "Completed", value: "Completed" },
  ];

  const status: OptionType[] = [
    { label: "All", value: "all" },
    { label: "Approved", value: "Approved" },
    { label: "Approved Pending", value: "Approved Pending" },
    { label: "Cancelled", value: "Cancelled" },
  ];
  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex justify-end z-50">
      <div
        className="bg-white flex flex-col justify-between w-full max-w-md animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div className="">
          <div className="px-6 border-b py-4 flex items-center justify-between gap-3">
            <div className="flex  items-center justify-between gap-2">
              <h3 className="sm:text-lg font-semibold">Filter</h3>
            </div>
            <X className="w-5 cursor-pointer" onClick={onClose} />
          </div>
          <div className="px-6 py-4 space-y-5">
            <div className="flex gap-5 items-center">
              <div className="text-sm text-nowrap ml-0.5">Stage</div>
              <div className="w-full flex justify-end">
                <div className="w-full max-w-56">
                  <SelectFilter
                    items={processStage}
                    onValueChange={(value) => {
                      table.getColumn("itemStatus")?.setFilterValue(value);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-5 items-center">
              <div className="text-sm text-nowrap ml-0.5">Status</div>
              <div className="w-full flex justify-end">
                <div className="w-full max-w-56">
                  <SelectFilter
                    items={status}
                    onValueChange={(value) => {
                      table.getColumn("itemStatus")?.setFilterValue(value);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6  flex justify-between items-center border-t py-4">
          <Button variant="outline" className="shadow-none text-sm">
            Reset All
          </Button>
          <Button
            onClick={onClose}
            className="shadow-none bg-[#7047EB] font-light text-sm hover:bg-[#7047EB]"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterSubContractTableModal;
