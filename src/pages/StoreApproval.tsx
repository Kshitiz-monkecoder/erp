import StoreApprovalTable from "@/components/app/tables/StoreApprovalTable";
import { Printer, Share2 } from "lucide-react";
import React from "react";

const StoreApproval: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="p-7 lg:px-16 py-8">
        <div className="shadow-sm space-y-4 px-3 py-5">
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-semibold text-2xl">
              Store Entry/Issue Approval
            </h3>
            <div className="flex items-center gap-2">
              <div className="rounded-md border px-2 flex items-center gap-1 border-gray-300 text-sm">
                <Printer className="w-3 text-[#3F3F50]" />
                Print
              </div>
              <div className="rounded-md border px-2 flex items-center gap-1 border-gray-300 text-sm">
                <Share2 className="w-3 text-[#3F3F50]" />
                Share
              </div>
            </div>
          </div>
          <div className="border px-5 py-6 text-sm">
            <h5 className="text-gray-400">Manual Adjustment Details</h5>
            <div className="grid mt-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1">
                <div>Document Type</div>
                <div className="text-xs">Manual Adjustment</div>
              </div>
              <div className="space-y-1">
                <div>Document Number</div>
                <div className="text-xs">MAJ00004</div>
              </div>
              <div className="space-y-1">
                <div>Document Action</div>
                <div className="text-xs">Document Created</div>
              </div>
              <div className="space-y-1">
                <div>No of Items</div>
                <div className="text-xs">1</div>
              </div>
              <div className="space-y-1">
                <div>Created By</div>
                <div className="text-xs">Soham Singh</div>
              </div>
              <div className="space-y-1">
                <div>Creation Date</div>
                <div className="text-xs">11/04/2025 - 23:11</div>
              </div>
              <div className="space-y-1">
                <div>Approved By</div>
                <div className="text-xs">Rahul</div>
              </div>
              <div className="space-y-1">
                <div>Approved Time</div>
                <div className="text-xs">11/04/2025 - 23:11</div>
              </div>
              <div className="space-y-1">
                <div>Comments</div>
                <div className="text-xs">--</div>
              </div>
            </div>
          </div>
          <StoreApprovalTable />
          {/* Signature Card  */}
          <div>
            <div className="p-3 space-y-8 text-sm bg-gray-100 w-fit">
              <div>For Ramesh PVT. LTD.</div>
              <div className="text-gray-400">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreApproval;
